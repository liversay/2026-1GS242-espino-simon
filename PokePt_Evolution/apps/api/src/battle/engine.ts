// Motor turno-por-turno. Cada llamada aplica UNA acción del jugador cuyo turno
// es actualmente, luego avanza el turno al rival (o termina la batalla).

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
  }

  if (move.effect && !defender.fainted) {
    if (Math.random() * 100 < move.effect.chance) {
      applyStatus(defender, move.effect.kind, log, other.id, other.activeIndex)
    }
  }
}

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
  }
  battle.status = 'in-progress'
  battle.currentTurnPlayerId = winnerId
  battle.turn = 1
  battle.log.push({
    kind: 'announce',
    text: `La moneda cayó en ${result === 'heads' ? 'cara' : 'cruz'}. ¡${winnerName} ataca primero!`,
  })
  battle.log.push({ kind: 'turn-start', playerId: winnerId, playerName: winnerName })
  battle.updatedAt = new Date().toISOString()
  return battle
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

  // Tick status sobre el activo del que acabó de actuar (burn/poison le pega).
  const myActiveAfter = getActive(actor)
  if (!myActiveAfter.fainted) {
    tickStatus(myActiveAfter, log, actor.id, actor.activeIndex)
  }

  // Auto-switch si el rival quedó debilitado por mi ataque pero tiene equipo vivo.
  const otherActive = getActive(other)
  if (otherActive.fainted && teamAlive(other)) {
    const next = other.team.findIndex((p) => !p.fainted)
    if (next >= 0 && next !== other.activeIndex) {
      const fromIndex = other.activeIndex
      other.activeIndex = next
      log.push({
        kind: 'switch',
        playerId: other.id,
        fromIndex,
        toIndex: next,
        pokemonName: other.team[next]!.name,
      })
    }
  }

  // Auto-switch si yo me KOe por status tick.
  if (myActiveAfter.fainted && teamAlive(actor)) {
    const next = actor.team.findIndex((p) => !p.fainted)
    if (next >= 0 && next !== actor.activeIndex) {
      const fromIndex = actor.activeIndex
      actor.activeIndex = next
      log.push({
        kind: 'switch',
        playerId: actor.id,
        fromIndex,
        toIndex: next,
        pokemonName: actor.team[next]!.name,
      })
    }
  }

  // Victoria
  const actorAlive = teamAlive(actor)
  const otherAlive = teamAlive(other)
  if (!actorAlive || !otherAlive) {
    const winner = actorAlive ? actor : other
    battle.status = 'finished'
    battle.winnerId = winner.id
    battle.currentTurnPlayerId = null
    log.push({ kind: 'victory', winnerId: winner.id, winnerName: winner.name })
  } else {
    battle.currentTurnPlayerId = other.id
    log.push({ kind: 'turn-start', playerId: other.id, playerName: other.name })
  }

  battle.log = [...battle.log, ...log]
  battle.turn += 1
  battle.updatedAt = new Date().toISOString()
  return battle
}
