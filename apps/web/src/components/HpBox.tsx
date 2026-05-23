import { useEffect, useRef, useState } from 'react'
import type { BattlePokemon } from '@pokept/shared'
import { StatusBadge } from './StatusBadge'
import styles from './HpBox.module.css'

interface Props {
  pokemon: BattlePokemon
  side: 'ally' | 'foe'
}

export function HpBox({ pokemon, side }: Props) {
  const max = pokemon.stats.maxHp
  const pct = Math.max(0, Math.min(100, (pokemon.currentHp / max) * 100))
  const color = pct > 50 ? 'var(--pp-hp-green)' : pct > 20 ? 'var(--pp-hp-yellow)' : 'var(--pp-hp-red)'
  const low = pct > 0 && pct <= 20

  const displayedHp = useTweenedNumber(pokemon.currentHp, 600)

  return (
    <div className={`${styles.box} ${styles[side]}`}>
      <div className={styles.row}>
        <span className={styles.name}>{pokemon.name}</span>
        {pokemon.status && <StatusBadge status={pokemon.status.kind} />}
        <span className={styles.lvl}>Lv.{pokemon.level}</span>
      </div>
      <div className={styles.bar}>
        <span className={styles.hpLabel}>HP</span>
        <div className={styles.track}>
          <div
            className={`${styles.fill} ${low ? 'anim-hp-low' : ''}`}
            style={{ width: `${pct}%`, background: low ? undefined : color }}
          />
        </div>
      </div>
      {side === 'ally' && (
        <div className={styles.hpNumbers}>
          <span>{displayedHp}</span>
          <span className={styles.slash}>/</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}

function useTweenedNumber(target: number, duration: number): number {
  const [value, setValue] = useState(target)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)
  const fromRef = useRef<number>(target)
  const toRef = useRef<number>(target)

  useEffect(() => {
    if (target === toRef.current) return
    fromRef.current = value
    toRef.current = target
    startRef.current = performance.now()
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const tick = (t: number) => {
      const dt = t - startRef.current
      const k = Math.min(1, dt / duration)
      const eased = 1 - Math.pow(1 - k, 3)
      const next = Math.round(fromRef.current + (toRef.current - fromRef.current) * eased)
      setValue(next)
      if (k < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return value
}
