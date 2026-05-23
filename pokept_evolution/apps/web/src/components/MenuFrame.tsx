import type { ReactNode } from 'react'
import styles from './MenuFrame.module.css'

interface Props {
  tone?: 'light' | 'dark' | 'blue'
  chip?: string
  corners?: boolean
  className?: string
  children: ReactNode
}

export function MenuFrame({ tone = 'light', chip, corners = true, className, children }: Props) {
  return (
    <div className={`${styles.frame} ${styles[tone]} ${className ?? ''}`}>
      {chip && <span className={styles.chip}>{chip}</span>}
      {corners && (
        <>
          <span className={`${styles.corner} ${styles.cTL}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.cTR}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.cBL}`} aria-hidden="true" />
          <span className={`${styles.corner} ${styles.cBR}`} aria-hidden="true" />
        </>
      )}
      <div className={styles.inner}>{children}</div>
    </div>
  )
}
