// Convierte la respuesta de PokéAPI /move/{id} en nuestro modelo Move.
// Solo aceptamos movimientos que sabemos modelar; el resto se descarta y
// el Pokémon que lo tuviera elegirá otro.

import type { Move, MoveEffect, StatusKind, PokeType, DamageClass } from '@pokept/shared'

interface PokeApiMove {
  id: number
  name: string
  type: { name: string }
  power: number | null
  accuracy: number | null
  priority: number
  damage_class: { name: string } | null
  meta: {
    ailment: { name: string }
    ailment_chance: number
    stat_chance: number
  } | null
  stat_changes: Array<{
    change: number
    stat: { name: string }
  }>
}

const SUPPORTED_TYPES: ReadonlyArray<PokeType> = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

const SUPPORTED_DAMAGE_CLASSES: ReadonlyArray<DamageClass> = ['physical', 'special', 'status']

const AILMENT_MAP: Record<string, StatusKind> = {
  burn: 'burn',
  poison: 'poison',
  'bad-poison': 'poison',
  paralysis: 'paralysis',
}

const STAT_MAP: Record<string, StatusKind> = {
  attack: 'atk-',
  defense: 'def-',
  speed: 'spe-',
}

function pickEffect(api: PokeApiMove): MoveEffect | undefined {
  // Prefiere ailment (paralysis/burn/poison) si está definido.
  if (api.meta?.ailment?.name && api.meta.ailment.name !== 'none') {
    const kind = AILMENT_MAP[api.meta.ailment.name]
    if (kind) {
      return { kind, chance: api.meta.ailment_chance > 0 ? api.meta.ailment_chance : 100 }
    }
  }
  // Caso reducciones de stat: solo bajadas (change < 0) en stats que modelamos.
  for (const sc of api.stat_changes ?? []) {
    if (sc.change < 0) {
      const kind = STAT_MAP[sc.stat.name]
      if (kind) {
        return { kind, chance: api.meta?.stat_chance && api.meta.stat_chance > 0 ? api.meta.stat_chance : 100 }
      }
    }
  }
  return undefined
}

export function tryMapMove(api: PokeApiMove): Move | null {
  if (!SUPPORTED_TYPES.includes(api.type.name as PokeType)) return null
  const damageClass = api.damage_class?.name as DamageClass | undefined
  if (!damageClass || !SUPPORTED_DAMAGE_CLASSES.includes(damageClass)) return null

  const power = api.power ?? 0
  const effect = pickEffect(api)

  if (damageClass === 'status') {
    if (!effect) return null
  }
  if ((damageClass === 'physical' || damageClass === 'special') && power <= 0) {
    return null
  }

  return {
    moveId: api.id,
    name: api.name,
    type: api.type.name as PokeType,
    power,
    accuracy: api.accuracy ?? 100,
    priority: api.priority,
    damageClass,
    effect,
  }
}
