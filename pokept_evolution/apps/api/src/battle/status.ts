// Aplicación, tick y limpieza de estados (3 turnos de duración).
// MVP: un solo estado simultáneo por Pokémon. Switch limpia status y stages.
// Parálisis NO reduce velocidad ni añade 25% miss (decisión del proyecto).

import type { BattlePokemon, LogEntry, StatusKind } from '@pokept/shared'
import { emptyStages } from './stats'

export function applyStatus(target: BattlePokemon, kind: StatusKind, log: LogEntry[], playerId: string, targetIndex: number): void {
  if (target.status) return // ya tiene status, no se reemplaza
  if (kind === 'atk-' || kind === 'def-' || kind === 'spe-') {
    // Bajadas de stat: se aplican como stage -1 (no como status persistente).
    const statKey = kind === 'atk-' ? 'atk' : kind === 'def-' ? 'def' : 'spe'
    if (target.statStages[statKey] > -6) {
      target.statStages[statKey] -= 1
      log.push({ kind: 'status-apply', playerId, targetIndex, status: kind })
    }
    return
  }
  target.status = { kind, remainingTurns: 3 }
  log.push({ kind: 'status-apply', playerId, targetIndex, status: kind })
}

/** Aplica tick de status al final del turno (daño para burn/poison, decrementa contador). */
export function tickStatus(target: BattlePokemon, log: LogEntry[], playerId: string, targetIndex: number): void {
  if (!target.status || target.fainted) return
  const { kind } = target.status
  if (kind === 'burn' || kind === 'poison') {
    const amount = Math.max(1, Math.floor(target.stats.maxHp * 0.05))
    target.currentHp = Math.max(0, target.currentHp - amount)
    log.push({ kind: 'status-tick', playerId, targetIndex, status: kind, amount })
    if (target.currentHp === 0) {
      target.fainted = true
      log.push({ kind: 'faint', playerId, pokemonName: target.name })
    }
  }
  target.status.remainingTurns -= 1
  if (target.status.remainingTurns <= 0) {
    log.push({ kind: 'status-end', playerId, targetIndex, status: target.status.kind })
    target.status = undefined
  }
}

/** Al cambiar Pokémon: limpia status y stat stages del que sale. */
export function clearOnSwitch(target: BattlePokemon): void {
  target.status = undefined
  target.statStages = emptyStages()
}
