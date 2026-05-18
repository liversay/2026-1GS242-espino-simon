// Construye el estado inicial de batalla a partir de la Room + DB.

import type { Db } from 'mongodb'
import type {
  Battle,
  BattleMove,
  BattlePlayer,
  BattlePokemon,
  Pokemon,
  Room,
} from '@pokept/shared'
import { getPokemonByDexIds } from '../db/repo/pokemonRepo'
import { getMovesByIds } from '../db/repo/moveRepo'
import { BATTLE_LEVEL, buildBattleStats, emptyStages, randomIvs } from './stats'

export async function buildInitialBattle(db: Db, room: Room): Promise<Battle> {
  const allMoveIds = new Set<number>()
  const allPokeIds = new Set<number>()
  for (const p of room.players) {
    for (const id of p.teamPokemonIds) allPokeIds.add(id)
  }
  const pokemons = await getPokemonByDexIds(db, [...allPokeIds])
  const pokemonByDex = new Map<number, Pokemon>(pokemons.map((p) => [p.pokedexId, p]))
  for (const pkmn of pokemons) for (const m of pkmn.moveIds) allMoveIds.add(m)
  const moves = await getMovesByIds(db, [...allMoveIds])
  const moveById = new Map(moves.map((m) => [m.moveId, m]))

  const players: BattlePlayer[] = room.players.map((rp) => {
    const team: BattlePokemon[] = rp.teamPokemonIds.map((dexId) => {
      const species = pokemonByDex.get(dexId)
      if (!species) throw new Error(`pokemon ${dexId} no en DB`)
      const ivs = randomIvs()
      const stats = buildBattleStats(species.baseStats, ivs)
      const battleMoves: BattleMove[] = species.moveIds
        .map((mid) => moveById.get(mid))
        .filter((m): m is NonNullable<typeof m> => m !== undefined)
        .map((m) => ({
          moveId: m.moveId,
          name: m.name,
          type: m.type,
          power: m.power,
          accuracy: m.accuracy,
          priority: m.priority,
          damageClass: m.damageClass,
          effect: m.effect,
        }))
      return {
        speciesId: species.pokedexId,
        name: species.name,
        types: species.types,
        level: BATTLE_LEVEL,
        ivs,
        currentHp: stats.maxHp,
        stats,
        moves: battleMoves,
        statStages: emptyStages(),
        spriteUrl: species.spriteUrl,
        fainted: false,
      }
    })
    return { id: rp.id, name: rp.name, team, activeIndex: 0 }
  })

  const now = new Date().toISOString()
  return {
    roomCode: room.code,
    turn: 0,
    status: 'coin-flip',
    stageId: room.stageId,
    hostPlayerId: room.hostPlayerId,
    players,
    currentTurnPlayerId: null,
    mustSwitchPlayerId: null,
    coinFlip: { guestChoice: null, result: null, winnerId: null, completedAt: null, acknowledgedAt: null },
    log: [{ kind: 'announce', text: 'Battle begins! The challenger picks heads or tails.' }],
    createdAt: now,
    updatedAt: now,
  }
}
