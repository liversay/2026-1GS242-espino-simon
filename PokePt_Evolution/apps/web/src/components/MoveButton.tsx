import type { BattleMove } from '@pokept/shared'
import styles from './MoveButton.module.css'

interface Props {
  move: BattleMove
  onUse?: () => void
  disabled?: boolean
}

export function MoveButton({ move, onUse, disabled }: Props) {
  return (
    <button
      type="button"
      className={styles.btn}
      onClick={onUse}
      disabled={disabled}
      style={{ ['--type-bg' as string]: `var(--type-${move.type})` }}
    >
      <span className={styles.name}>{move.name}</span>
      <span className={styles.meta}>
        <span className={styles.type}>{move.type}</span>
        <span className={styles.power}>
          {move.damageClass === 'status' ? 'STA' : `Pwr ${move.power}`}
        </span>
      </span>
    </button>
  )
}
