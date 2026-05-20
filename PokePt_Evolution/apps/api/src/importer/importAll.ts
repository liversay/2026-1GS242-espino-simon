// Importador PokéAPI:
// - 300 Pokémon (id 1..300) con sprite Gen-IV Platinum (cascada de fallbacks).
// - 18 tipos con relaciones de daño.
// - Movimientos referenciados; cada Pokémon recibe exactamente 4 moves usables.
//
// Reglas:
//   - "Move usable" = power > 0 (physical/special), o status con efecto que modelamos.
//   - Para elegir 4 moves por Pokémon: candidatos = level-up moves; orden = level desc.
//   - Si tras filtrar quedan < 4 moves usables -> descartamos el Pokémon (log).
//
// Idempotente: upsert por pokedexId / moveId / type.name.

import { getDb, closeDb } from '../db/mongo'
import { fetchJsonRetry, mapWithConcurrency } from './concurrency'
import { tryMapMove } from './mapMove'
import { upsertPokemon } from '../db/repo/pokemonRepo'
import { upsertMove } from '../db/repo/moveRepo'
import { upsertTypeRelations, invalidateTypeCache } from '../db/repo/typeRepo'
import type { Move, Pokemon, PokeType, TypeRelations } from '@pokept/shared'

const POKEAPI = 'https://pokeapi.co/api/v2'
// Pedimos 340 candidatos para cubrir descartes (Pokémon con <4 movs usables como
// Caterpie, Ditto, Magikarp, Smeargle, etc.) y garantizar ≥300 importados.
const POKEMON_LIMIT = 340
const CONCURRENCY = 10

const SUPPORTED_TYPES: ReadonlyArray<PokeType> = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

interface ApiPokemonListResp {
  results: Array<{ name: string; url: string }>
}

interface ApiPokemon {
  id: number
  name: string
  sprites: {
    front_default: string | null
    front_shiny: string | null
    versions?: {
      'generation-iv'?: {
        platinum?: { front_default: string | null; front_shiny: string | null }
        'heartgold-soulsilver'?: { front_default: string | null; front_shiny: string | null }
        'diamond-pearl'?: { front_default: string | null; front_shiny: string | null }
      }
    }
  }
  types: Array<{ type: { name: string } }>
  stats: Array<{ base_stat: number; stat: { name: string } }>
  moves: Array<{
    move: { name: string; url: string }
    version_group_details: Array<{
      move_learn_method: { name: string }
      level_learned_at: number
    }>
  }>
}

interface ApiType {
  name: string
  damage_relations: {
    double_damage_from: Array<{ name: string }>
    half_damage_from: Array<{ name: string }>
    no_damage_from: Array<{ name: string }>
  }
}

function pickSprite(p: ApiPokemon): string {
  const gen4 = p.sprites.versions?.['generation-iv']
  return (
    gen4?.platinum?.front_default ??
    gen4?.['heartgold-soulsilver']?.front_default ??
    gen4?.['diamond-pearl']?.front_default ??
    p.sprites.front_default ??
    ''
  )
}

function pickShinySprite(p: ApiPokemon): string {
  const gen4 = p.sprites.versions?.['generation-iv']
  return (
    gen4?.platinum?.front_shiny ??
    gen4?.['heartgold-soulsilver']?.front_shiny ??
    gen4?.['diamond-pearl']?.front_shiny ??
    p.sprites.front_shiny ??
    pickSprite(p)  // fallback al sprite normal si no hay shiny
  )
}

function parseBaseStats(stats: ApiPokemon['stats']) {
  const out = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
  const map: Record<string, keyof typeof out> = {
    'hp': 'hp',
    'attack': 'atk',
    'defense': 'def',
    'special-attack': 'spa',
    'special-defense': 'spd',
    'speed': 'spe',
  }
  for (const s of stats) {
    const key = map[s.stat.name]
    if (key) out[key] = s.base_stat
  }
  return out
}

function moveIdFromUrl(url: string): number {
  // https://pokeapi.co/api/v2/move/85/
  const m = url.match(/\/move\/(\d+)\//)
  return m ? Number(m[1]) : NaN
}

async function importTypes(): Promise<void> {
  const db = await getDb()
  await mapWithConcurrency(
    SUPPORTED_TYPES as PokeType[],
    async (typeName) => {
      const api = await fetchJsonRetry<ApiType>(`${POKEAPI}/type/${typeName}`)
      const filterToSupported = (arr: Array<{ name: string }>): PokeType[] =>
        arr.map((x) => x.name as PokeType).filter((n) => SUPPORTED_TYPES.includes(n))
      const doc: TypeRelations = {
        name: typeName,
        doubleDamageFrom: filterToSupported(api.damage_relations.double_damage_from),
        halfDamageFrom: filterToSupported(api.damage_relations.half_damage_from),
        noDamageFrom: filterToSupported(api.damage_relations.no_damage_from),
      }
      await upsertTypeRelations(db, doc)
    },
    6,
  )
  invalidateTypeCache()
  console.log(`[importer] tipos: ${SUPPORTED_TYPES.length} importados`)
}

interface PokemonCandidate {
  pokedexId: number
  api: ApiPokemon
  /** moves candidatos ordenados: primero level desc, luego declaración. */
  candidateMoveIds: number[]
}

async function fetchPokemonCandidates(): Promise<PokemonCandidate[]> {
  const list = await fetchJsonRetry<ApiPokemonListResp>(`${POKEAPI}/pokemon?limit=${POKEMON_LIMIT}&offset=0`)
  const urls = list.results.slice(0, POKEMON_LIMIT).map((r) => r.url)

  const candidates = await mapWithConcurrency(
    urls,
    async (url) => {
      const api = await fetchJsonRetry<ApiPokemon>(url)
      const levelUp = api.moves
        .map((m) => {
          const levelLearned = m.version_group_details
            .filter((v) => v.move_learn_method.name === 'level-up' && v.level_learned_at > 0)
            .reduce((max, v) => Math.max(max, v.level_learned_at), 0)
          return levelLearned > 0
            ? { id: moveIdFromUrl(m.move.url), level: levelLearned }
            : null
        })
        .filter((v): v is { id: number; level: number } => v !== null && Number.isFinite(v.id))
      levelUp.sort((a, b) => b.level - a.level)
      // dedup por id
      const seen = new Set<number>()
      const candidateMoveIds: number[] = []
      for (const m of levelUp) {
        if (!seen.has(m.id)) {
          seen.add(m.id)
          candidateMoveIds.push(m.id)
        }
      }
      return { pokedexId: api.id, api, candidateMoveIds }
    },
    CONCURRENCY,
  )
  return candidates
}

async function importPokemonAndMoves(candidates: PokemonCandidate[]): Promise<{ keptCount: number; skipped: string[]; moveCount: number }> {
  const db = await getDb()
  // Set global de moves a fetchear (deduplicado entre todos los Pokémon).
  const allCandidateMoveIds = new Set<number>()
  for (const c of candidates) for (const id of c.candidateMoveIds) allCandidateMoveIds.add(id)
  const moveIdList = [...allCandidateMoveIds]
  console.log(`[importer] fetcheando ${moveIdList.length} movimientos únicos…`)

  // Mapeo moveId -> Move (o null si no es usable)
  const moveMap = new Map<number, Move | null>()
  await mapWithConcurrency(
    moveIdList,
    async (moveId) => {
      try {
        const apiMove = await fetchJsonRetry<Parameters<typeof tryMapMove>[0]>(`${POKEAPI}/move/${moveId}`)
        const mapped = tryMapMove(apiMove)
        moveMap.set(moveId, mapped)
        if (mapped) await upsertMove(db, mapped)
      } catch (err) {
        moveMap.set(moveId, null)
        console.warn(`[importer] move ${moveId} skipped:`, (err as Error).message)
      }
    },
    CONCURRENCY,
  )
  const moveCount = [...moveMap.values()].filter((m) => m !== null).length
  console.log(`[importer] movimientos usables: ${moveCount}/${moveMap.size}`)

  // Para cada Pokémon, elegir 4 moves usables. Si no llega a 4, se descarta.
  const skipped: string[] = []
  let keptCount = 0
  for (const c of candidates) {
    const chosen: number[] = []
    for (const id of c.candidateMoveIds) {
      const m = moveMap.get(id)
      if (m && !chosen.includes(id)) chosen.push(id)
      if (chosen.length === 4) break
    }
    if (chosen.length < 4) {
      skipped.push(c.api.name)
      continue
    }
    const types = c.api.types.map((t) => t.type.name as PokeType).filter((t) => SUPPORTED_TYPES.includes(t))
    if (types.length === 0) {
      skipped.push(c.api.name)
      continue
    }
    const doc: Pokemon = {
      pokedexId: c.pokedexId,
      name: c.api.name,
      types,
      baseStats: parseBaseStats(c.api.stats),
      spriteUrl: pickSprite(c.api),
      shinySpriteUrl: pickShinySprite(c.api),
      moveIds: chosen,
    }
    await upsertPokemon(db, doc)
    keptCount++
  }
  return { keptCount, skipped, moveCount }
}

async function main(): Promise<void> {
  console.log('[importer] iniciando…')
  await importTypes()
  const candidates = await fetchPokemonCandidates()
  console.log(`[importer] candidatos Pokémon: ${candidates.length}`)
  const { keptCount, skipped, moveCount } = await importPokemonAndMoves(candidates)
  console.log(`[importer] OK: ${keptCount} Pokémon importados, ${moveCount} movimientos, 18 tipos`)
  if (skipped.length > 0) {
    console.log(`[importer] descartados por <4 movs usables (${skipped.length}): ${skipped.join(', ')}`)
  }
  await closeDb()
}

main().catch((err) => {
  console.error('[importer] FAILED:', err)
  process.exit(1)
})
