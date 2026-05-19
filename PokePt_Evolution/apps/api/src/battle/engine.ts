// Motor turno-por-turno. Cada llamada aplica UNA acción del jugador cuyo turno
// es actualmente, luego avanza el turno al rival (o termina la batalla).
//
// Cuando un Pokémon es debilitado, su dueño debe ELEGIR el siguiente (switch
// forzado). El campo battle.mustSwitchPlayerId señala quién debe actuar; ese
// jugador solo puede enviar acciones de tipo 'switch' hasta resolverlo.

import type { Db } from 'mongodb'
import type {
  Battle,
  BattleAction,
  BattlePlayer,
  BattlePokemon,
  CoinFace,
  LogEntry,
} from '@pokept/shared'
import { calculateDamage } from './damage'
import { applyStatus, clearOnSwitch, tickStatus } from './status'

// ─── Coin flip ────────────────────────────────────────────────────────────
export function applyCoinFlipChoice(battle: Battle, choice: CoinFace): Battle {
  const guest = battle.players.find((p) => p.id !== battle.hostPlayerId)
  const host = battle.players.find((p) => p.id === battle.hostPlayerId)
  if (!guest || !host) throw new Error('battle players invalid')

  const result: CoinFace = Math.random() < 0.5 ? 'heads' : 'tails'
  const winnerId = result === choice ? guest.id : host.id
  const winnerName = battle.players.find((p) => p.id === winnerId)!.name

  battle.coinFlip = {
    guestChoice: choice,
    result,
    winnerId,
    completedAt: new Date().toISOString(),
    acknowledgedAt: null,
  }
  battle.status = 'in-progress'
  battle.currentTurnPlayerId = winnerId
  battle.turn = 1
  battle.log.push({
    kind: 'announce',
    text: `The coin landed on ${result === 'heads' ? 'HEADS' : 'TAILS'}. ${winnerName} attacks first!`,
  })
  battle.log.push({ kind: 'turn-start', playerId: winnerId, playerName: winnerName })
  battle.updatedAt = new Date().toISOString()
  return battle
}

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

  if (action.type === 'switch') {
    const target = player.team[action.targetIndex]
    if (!target || target.fainted || action.targetIndex === player.activeIndex) {
      log.push({ kind: 'announce', text: `${player.name} attempted an invalid switch.` })
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

  if (active.fainted) return  // no debería pasar; la ruta valida

  const move = active.moves.find((m) => m.moveId === action.moveId)
  if (!move) {
    log.push({ kind: 'announce', text: `Invalid move.` })
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
  }

  if (move.effect && !defender.fainted) {
    if (Math.random() * 100 < move.effect.chance) {
      applyStatus(defender, move.effect.kind, log, other.id, other.activeIndex)
    }
  }
}

// ─── Aplicar el turno de UN jugador y pasar al rival ─────────────────────
export async function applyTurn(
  db: Db,
  battle: Battle,
  playerId: string,
  action: BattleAction,
): Promise<Battle> {
  const log: LogEntry[] = []
  const actor = me(battle, playerId)
  const other = opponent(battle, playerId)

  await applyAction(db, battle, playerId, action, log)

  // Tick status al activo del que acabó de actuar (no aplica si la acción fue switch).
  if (action.type === 'move') {
    const myActiveAfter = getActive(actor)
    if (!myActiveAfter.fainted) {
      tickStatus(myActiveAfter, log, actor.id, actor.activeIndex)
    }
  }

  // ─── Detectar victoria ──────────────────────────────────────────────────
  const actorAlive = teamAlive(actor)
  const otherAlive = teamAlive(other)
  if (!actorAlive || !otherAlive) {
    const winner = actorAlive ? actor : other
    battle.status = 'finished'
    battle.winnerId = winner.id
    battle.currentTurnPlayerId = null
    battle.mustSwitchPlayerId = null
    log.push({ kind: 'victory', winnerId: winner.id, winnerName: winner.name })
    battle.log = [...battle.log, ...log]
    battle.turn += 1
    battle.updatedAt = new Date().toISOString()
    return battle
  }

  // ─── Pendientes de switch forzado ───────────────────────────────────────
  // Si mi activo se debilitó por tick de status → yo debo switchar.
  // Si el activo del rival se debilitó por mi ataque → él debe switchar.
  const myActiveAfter = getActive(actor)
  const otherActiveAfter = getActive(other)

  if (myActiveAfter.fainted) {
    // Caso raro: status tick me mató. Yo elijo el siguiente; el turno sigue siendo mío
    // hasta resolverlo.
    battle.mustSwitchPlayerId = actor.id
    battle.currentTurnPlayerId = actor.id
  } else if (otherActiveAfter.fainted) {
    // El rival debe elegir nuevo Pokémon; entonces es su turno (forzado a switch).
    battle.mustSwitchPlayerId = other.id
    battle.currentTurnPlayerId = other.id
    log.push({ kind: 'turn-start', playerId: other.id, playerName: other.name })
  } else {
    // No hay switch forzado pendiente — pasar al rival (switch voluntario o forzado: ambos consumen el turno).
    battle.mustSwitchPlayerId = null
    battle.currentTurnPlayerId = other.id
    log.push({ kind: 'turn-start', playerId: other.id, playerName: other.name })
  }

  battle.log = [...battle.log, ...log]
  battle.turn += 1
  battle.updatedAt = new Date().toISOString()
  return battle
}
