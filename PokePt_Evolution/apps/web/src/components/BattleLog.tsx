import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '@pokept/shared'
import styles from './BattleLog.module.css'

interface Props {
  entries: LogEntry[]
}

function entryText(e: LogEntry): string {
  switch (e.kind) {
    case 'announce':       return e.text
    case 'move':           return `¡${e.pokemonName} usó ${e.moveName}!`
    case 'damage':         return e.isCrit ? `¡Golpe crítico! Daño: ${e.amount}.` : `Daño: ${e.amount}.`
    case 'miss':           return `¡${e.pokemonName} falló!`
    case 'status-apply':   return `Estado aplicado: ${e.status}.`
    case 'status-tick':    return `El estado ${e.status} hizo ${e.amount} de daño.`
    case 'status-end':     return `El estado ${e.status} terminó.`
    case 'switch':         return `¡Adelante, ${e.pokemonName}!`
    case 'faint':          return `¡${e.pokemonName} se debilitó!`
    case 'effectiveness':
      if (e.effectiveness === 'super') return '¡Es súper efectivo!'
      if (e.effectiveness === 'low')   return 'No es muy efectivo…'
      if (e.effectiveness === 'none')  return 'No tuvo efecto…'
      return ''
    case 'victory':        return `¡${e.winnerName} es el campeón!`
  }
}

export function BattleLog({ entries }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visibleCount, setVisibleCount] = useState(entries.length)

  // Cuando entran logs nuevos, los revelamos secuencialmente con typewriter
  useEffect(() => {
    if (visibleCount >= entries.length) return
    const t = setTimeout(() => setVisibleCount((v) => v + 1), 350)
    return () => clearTimeout(t)
  }, [visibleCount, entries.length])

  useEffect(() => {
    if (entries.length < visibleCount) setVisibleCount(entries.length)
  }, [entries.length, visibleCount])

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [visibleCount])

  const shown = entries.slice(Math.max(0, visibleCount - 6), visibleCount)
  return (
    <div className={`${styles.log} panel`} ref={ref}>
      <span className="panel__chip">PP-EVO / LOG</span>
      {shown.map((e, i) => {
        const text = entryText(e)
        if (!text) return null
        const isLatest = i === shown.length - 1 && visibleCount === entries.length
        return (
          <p
            key={Math.max(0, visibleCount - 6) + i}
            className={`${styles.line} ${isLatest ? styles.latest : ''}`}
            style={{
              animationDuration: `${Math.max(150, text.length * 28)}ms`,
            }}
          >
            <span className="anim-typewriter" style={{ animationDuration: `${Math.max(150, text.length * 28)}ms`, display: 'inline-block' }}>
              {text}
            </span>
            {isLatest && <span className={`${styles.arrow} anim-dialog-arrow`}>▼</span>}
          </p>
        )
      })}
      {visibleCount < entries.length && (
        <p className={styles.muted}>…</p>
      )}
    </div>
  )
}
