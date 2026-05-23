import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './DialogBox.module.css'

interface Props {
  text: string
  speaker?: string
  typewriter?: boolean
  arrow?: boolean
  onComplete?: () => void
  onAdvance?: () => void
  speed?: number
  className?: string
  children?: ReactNode
}

export function DialogBox({
  text,
  speaker,
  typewriter = true,
  arrow = true,
  onComplete,
  onAdvance,
  speed = 28,
  className,
  children,
}: Props) {
  const [shown, setShown] = useState(typewriter ? 0 : text.length)
  const completedRef = useRef(false)

  useEffect(() => {
    completedRef.current = false
    if (!typewriter) {
      setShown(text.length)
      onComplete?.()
      completedRef.current = true
      return
    }
    setShown(0)
    let i = 0
    const id = window.setInterval(() => {
      i++
      setShown(i)
      if (i >= text.length) {
        window.clearInterval(id)
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      }
    }, speed)
    return () => window.clearInterval(id)
  }, [text, typewriter, speed, onComplete])

  const done = shown >= text.length
  const handleClick = () => {
    if (!done) {
      setShown(text.length)
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.()
      }
      return
    }
    onAdvance?.()
  }

  return (
    <div
      className={`${styles.box} ${className ?? ''}`}
      onClick={onAdvance || !done ? handleClick : undefined}
      role={onAdvance ? 'button' : undefined}
      tabIndex={onAdvance ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {speaker && <div className={styles.speaker}>{speaker}</div>}
      <p className={styles.text} aria-live="polite">
        {text.slice(0, shown)}
        {!done && <span className={styles.caret} aria-hidden="true">_</span>}
      </p>
      {children && <div className={styles.children}>{children}</div>}
      {arrow && done && onAdvance && (
        <span className={styles.arrow} aria-hidden="true" />
      )}
    </div>
  )
}
