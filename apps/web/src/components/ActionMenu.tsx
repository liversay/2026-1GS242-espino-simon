import { useState } from 'react'
import { PixelCursor } from './PixelCursor'
import styles from './ActionMenu.module.css'

export type ActionKey = 'fight' | 'bag' | 'pokemon' | 'run'

export interface ActionItem {
  key: ActionKey
  label: string
  onClick: () => void
  disabled?: boolean
}

interface Props {
  items: ActionItem[]
}

export function ActionMenu({ items }: Props) {
  const [hover, setHover] = useState<ActionKey | null>(null)

  return (
    <div className={styles.menu} role="menu" aria-label="Acciones de batalla">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          className={`${styles.btn} ${styles[item.key]}`}
          onClick={item.onClick}
          disabled={item.disabled}
          onMouseEnter={() => setHover(item.key)}
          onMouseLeave={() => setHover((h) => (h === item.key ? null : h))}
          onFocus={() => setHover(item.key)}
          onBlur={() => setHover((h) => (h === item.key ? null : h))}
        >
          <PixelCursor visible={hover === item.key} className={styles.cursor} />
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
