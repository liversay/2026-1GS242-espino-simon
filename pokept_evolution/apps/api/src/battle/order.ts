// Decide qué jugador actúa primero. MVP estricto: switch > move y coin flip.
// No usa velocidad ni prioridad de movimiento (excepto switch que tiene
// prioridad 6 implícita).

import type { BattleAction } from '@pokept/shared'

export function decideOrder(
  actionA: BattleAction,
  actionB: BattleAction,
): 'A' | 'B' {
  const isSwitchA = actionA.type === 'switch'
  const isSwitchB = actionB.type === 'switch'
  if (isSwitchA && !isSwitchB) return 'A'
  if (isSwitchB && !isSwitchA) return 'B'
  return Math.random() < 0.5 ? 'A' : 'B'
}
