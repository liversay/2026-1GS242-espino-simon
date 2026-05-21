import { useState } from 'react'
import type { BattleMove, DamageClass } from '@pokept/shared'
import { PixelCursor } from './PixelCursor'
import styles from './MoveGrid.module.css'

interface Props {
  moves: BattleMove[]
  onSelect: (move: BattleMove) => void
  onBack: () => void
  disabled?: boolean
}

const CATEGORY_LABEL: Record<DamageClass, string> = {
  physical: 'PHY',
  special: 'SPE',
  status: 'STA',
}

export function MoveGrid({ moves, onSelect, onBack, disabled }: Props) {
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className={styles.wrap}>
      <div className={styles.grid} role="menu" aria-label="Movimientos">
        {Array.from({ length: 4 }).map((_, idx) => {
          const move = moves[idx]
          if (!move) {
            return <div key={`empty-${idx}`} className={`${styles.cell} ${styles.empty}`} aria-hidden="true">—</div>
          }
          return (
            <button
              key={move.moveId}
              type="button"
              role="menuitem"
              className={styles.cell}
              style={{ ['--type-bg' as string]: `var(--type-${move.type})` }}
              onClick={() => onSelect(move)}
              disabled={disabled}
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover((h) => (h === idx ? null : h))}
              onFocus={() => setHover(idx)}
              onBlur={() => setHover((h) => (h === idx ? null : h))}
            >
              <PixelCursor visible={hover === idx} className={styles.cursor} />
              <span className={styles.name}>{move.name}</span>
              <span className={styles.meta}>
                <span className={styles.type}>{move.type}</span>
                <span className={styles.cat}>{CATEGORY_LABEL[move.damageClass]}</span>
                <span className={styles.pwr}>
                  {move.damageClass === 'status' ? '—' : `Pwr ${move.power}`}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <button type="button" className={styles.back} onClick={onBack} aria-label="Volver al menú">
        ◀ BACK
      </button>
    </div>
  )
}
