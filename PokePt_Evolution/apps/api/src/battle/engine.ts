// Resolución de un turno completo. Toma la batalla actual + acciones de
// ambos jugadores y devuelve el nuevo estado.

import type { Db } from 'mongodb'
import type {
  Battle,
  BattleAction,
  BattlePlayer,
  BattlePokemon,
  LogEntry,
} from '@pokept/shared'
import { calculateDamage } from './damage'
import { applyStatus, clearOnSwitch, tickStatus } from './status'
import { decideOrder } from './order'

function getActive(player: BattlePlayer): BattlePokemon {
  return player.team[player.activeIndex]!
}

function opponent(battle: Battle, playerId: string): BattlePlayer {
  return battle.players.find((p) => p.id !== playerId)!
}

function me(battle: Battle, playerId: string): BattlePlayer {
  return battle.players.find((p) => p.id === playerId)!
}

function teamAlive(player: BattlePlayer): boolean {
  return player.team.some((p) => !p.fainted)
}

async function applyAction(
  db: Db,
  battle: Battle,
  playerId: string,
  action: BattleAction,
  log: LogEntry[],
): Promise<void> {
  const player = me(battle, playerId)
  const other = opponent(battle, playerId)
  const active = getActive(player)
  if (active.fainted) return

  if (action.type === 'switch') {
    const target = player.team[action.targetIndex]
    if (!target || target.fainted || action.targetIndex === player.activeIndex) {
      log.push({ kind: 'announce', text: `${player.name} intentó cambiar inválidamente.` })
      return
    }
    clearOnSwitch(active)
    const fromIndex = player.activeIndex
    player.activeIndex = action.targetIndex
    log.push({
      kind: 'switch',
      playerId,
      fromIndex,
      toIndex: action.targetIndex,
      pokemonName: target.name,
    })
    return
  }

  // action.type === 'move'
  const move = active.moves.find((m) => m.moveId === action.moveId)
  if (!move) {
    log.push({ kind: 'announce', text: `Movimiento inválido.` })
    return
  }

  log.push({ kind: 'move', playerId, pokemonName: active.name, moveName: move.name })

  const defender = getActive(other)
  if (defender.fainted) return

  const result = await calculateDamage(db, active, defender, move)

  if (result.missed) {
    log.push({ kind: 'miss', playerId, pokemonName: active.name })
    return
  }

  if (result.damage > 0) {
    defender.currentHp = Math.max(0, defender.currentHp - result.damage)
    log.push({
      kind: 'damage',
      playerId,
      targetIndex: other.activeIndex,
      amount: result.damage,
      isCrit: result.isCrit,
      effectiveness: result.effectiveness,
    })
    if (result.effectiveness !== 'normal') {
      log.push({ kind: 'effectiveness', effectiveness: result.effectiveness })
    }
    if (defender.currentHp === 0) {
      defender.fainted = true
      log.push({ kind: 'faint', playerId: other.id, pokemonName: defender.name })
    }
  } else if (move.damageClass === 'status') {
    // Movimientos de status: ignoran accuracy roll mediante damage.ts (devuelve missed=false)
    // Pero algunos sí pueden fallar; lo respeta la accuracy roll que ya hicimos.
  }

  // Aplicar efecto (estado o bajada de stat) si el move lo trae y rolea chance.
  if (move.effect && !defender.fainted) {
    const chance = move.effect.chance
    if (Math.random() * 100 < chance) {
      applyStatus(defender, move.effect.kind, log, other.id, other.activeIndex)
    }
  }
}

/** Resuelve el turno entero dadas las dos acciones. Mutates battle in-place. */
export async function resolveTurn(
  db: Db,
  battle: Battle,
  actionA_playerId: string,
  actionA: BattleAction,
  actionB_playerId: string,
  actionB: BattleAction,
): Promise<Battle> {
  const log: LogEntry[] = []
  const first = decideOrder(actionA, actionB) === 'A'
    ? { id: actionA_playerId, action: actionA }
    : { id: actionB_playerId, action: actionB }
  const second = first.id === actionA_playerId
    ? { id: actionB_playerId, action: actionB }
    : { id: actionA_playerId, action: actionA }

  await applyAction(db, battle, first.id, first.action, log)
  // Si el primer movimiento debilitó al activo del segundo, el segundo no puede
  // hacer su move (a menos que sea switch). Mantenemos comportamiento sencillo:
  // si su Pokémon activo se debilitó, se salta su acción de move; switch sí
  // pasa.
  const secondActive = getActive(me(battle, second.id))
  if (!(secondActive.fainted && second.action.type === 'move')) {
    await applyAction(db, battle, second.id, second.action, log)
  }

  // Tick status para ambos activos (no debilitados).
  for (const p of battle.players) {
    const active = getActive(p)
    if (!active.fainted) {
      tickStatus(active, log, p.id, p.activeIndex)
    }
  }

  // Forzar switch automático si el activo quedó debilitado y queda team vivo.
  for (const p of battle.players) {
    if (getActive(p).fainted && teamAlive(p)) {
      const nextIdx = p.team.findIndex((pk) => !pk.fainted)
      if (nextIdx >= 0 && nextIdx !== p.activeIndex) {
        const fromIndex = p.activeIndex
        p.activeIndex = nextIdx
        log.push({
          kind: 'switch',
          playerId: p.id,
          fromIndex,
          toIndex: nextIdx,
          pokemonName: p.team[nextIdx]!.name,
        })
      }
    }
  }

  // Victoria
  const aAlive = teamAlive(battle.players[0]!)
  const bAlive = teamAlive(battle.players[1]!)
  if (!aAlive || !bAlive) {
    const winner = aAlive ? battle.players[0]! : battle.players[1]!
    battle.status = 'finished'
    battle.winnerId = winner.id
    log.push({ kind: 'victory', winnerId: winner.id, winnerName: winner.name })
  }

  battle.log = [...battle.log, ...log]
  battle.turn += 1
  battle.pendingActions = {}
  battle.awaitingPlayers = battle.status === 'finished' ? [] : battle.players.map((p) => p.id)
  battle.updatedAt = new Date().toISOString()
  return battle
}
