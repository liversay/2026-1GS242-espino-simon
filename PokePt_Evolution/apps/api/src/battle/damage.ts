// Fórmula de daño (Pokémon style). Devuelve daño final + flags para el log.

import type { Db } from 'mongodb'
import type { BattleMove, BattlePokemon, LogEffectiveness } from '@pokept/shared'
import { effectiveStat } from './stats'
import { getTypeMultiplier } from './types'

export interface DamageResult {
  damage: number
  isCrit: boolean
  effectiveness: LogEffectiveness
  missed: boolean
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function calculateDamage(
  db: Db,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
): Promise<DamageResult> {
  // Status moves: sin daño directo.
  if (move.damageClass === 'status' || move.power <= 0) {
    return { damage: 0, isCrit: false, effectiveness: 'normal', missed: false }
  }

  // Accuracy roll
  const hit = randInt(1, 100) <= move.accuracy
  if (!hit) {
    return { damage: 0, isCrit: false, effectiveness: 'normal', missed: true }
  }

  const isPhysical = move.damageClass === 'physical'
  const baseAtk = isPhysical ? attacker.stats.atk : attacker.stats.spa
  const baseDef = isPhysical ? defender.stats.def : defender.stats.spd
  const atkStage = isPhysical ? attacker.statStages.atk : attacker.statStages.spa
  const defStage = isPhysical ? defender.statStages.def : defender.statStages.spd
  const attackStat = effectiveStat(baseAtk, atkStage)
  const defenseStat = Math.max(1, effectiveStat(baseDef, defStage))

  const level = attacker.level
  const baseDamage = Math.floor(
    Math.floor(
      Math.floor((2 * level) / 5 + 2) * move.power * attackStat / defenseStat,
    ) / 50,
  ) + 2

  const { multiplier: typeMult, effectiveness } = await getTypeMultiplier(db, move.type, defender.types)
  if (typeMult === 0) {
    return { damage: 0, isCrit: false, effectiveness: 'none', missed: false }
  }

  const randomFactor = randInt(85, 100) / 100
  const stab = attacker.types.includes(move.type) ? 1.5 : 1
  const isCrit = Math.random() < 1 / 24
  const critMod = isCrit ? 1.5 : 1
  const burnMod = attacker.status?.kind === 'burn' && move.damageClass === 'physical' ? 0.5 : 1

  const modifier = randomFactor * stab * typeMult * critMod * burnMod
  const finalDamage = Math.max(1, Math.floor(baseDamage * modifier))
  return { damage: finalDamage, isCrit, effectiveness, missed: false }
}
