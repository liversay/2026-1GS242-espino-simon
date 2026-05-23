// Fórmulas de stats de batalla, IVs y modificadores temporales (stages).
// Nivel fijo del proyecto = 50.

import type { BattleIvs, BattleStats, BaseStats, StatStages } from '@pokept/shared'

export const BATTLE_LEVEL = 50

export function randomIvs(): BattleIvs {
  const r = () => Math.floor(Math.random() * 32)
  return { hp: r(), atk: r(), def: r(), spa: r(), spd: r(), spe: r() }
}

export function emptyStages(): StatStages {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
}

export function buildBattleStats(base: BaseStats, ivs: BattleIvs, level = BATTLE_LEVEL): BattleStats {
  const stat = (b: number, iv: number) => Math.floor(((2 * b + iv) * level) / 100) + 5
  const maxHp = Math.floor(((2 * base.hp + ivs.hp) * level) / 100) + level + 10
  return {
    maxHp,
    atk: stat(base.atk, ivs.atk),
    def: stat(base.def, ivs.def),
    spa: stat(base.spa, ivs.spa),
    spd: stat(base.spd, ivs.spd),
    spe: stat(base.spe, ivs.spe),
  }
}

export function stageMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage))
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s)
}

export function effectiveStat(base: number, stage: number): number {
  return Math.floor(base * stageMultiplier(stage))
}
