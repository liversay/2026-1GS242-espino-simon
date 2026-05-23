// Multiplicador de tipo combinando los tipos del defensor.

import type { Db } from 'mongodb'
import type { LogEffectiveness, PokeType } from '@pokept/shared'
import { getTypeRelationsCache } from '../db/repo/typeRepo'

export async function getTypeMultiplier(
  db: Db,
  moveType: PokeType,
  defenderTypes: PokeType[],
): Promise<{ multiplier: number; effectiveness: LogEffectiveness }> {
  const cache = await getTypeRelationsCache(db)
  let mult = 1
  for (const def of defenderTypes) {
    const rel = cache.get(def)
    if (!rel) continue
    if (rel.noDamageFrom.includes(moveType)) return { multiplier: 0, effectiveness: 'none' }
    if (rel.doubleDamageFrom.includes(moveType)) mult *= 2
    else if (rel.halfDamageFrom.includes(moveType)) mult *= 0.5
  }
  let eff: LogEffectiveness
  if (mult === 0) eff = 'none'
  else if (mult > 1) eff = 'super'
  else if (mult < 1) eff = 'low'
  else eff = 'normal'
  return { multiplier: mult, effectiveness: eff }
}
