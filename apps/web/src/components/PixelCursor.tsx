import styles from './PixelCursor.module.css'

interface Props {
  visible?: boolean
  size?: number
  className?: string
  direction?: 'right' | 'down'
}

export function PixelCursor({ visible = true, size = 16, className, direction = 'right' }: Props) {
  if (!visible) return null
  return (
    <span
      aria-hidden="true"
      className={`${styles.cursor} ${styles[direction]} ${className ?? ''}`}
      style={{ width: size, height: size }}
    />
  )
}
