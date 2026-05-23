import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '@pokept/shared'
import styles from './BattleLog.module.css'

interface Props {
  entries?: LogEntry[]
}

function entryText(e: LogEntry): string {
  switch (e.kind) {
    case 'announce':       return e.text
    case 'move':           return `${e.pokemonName} used ${e.moveName}!`
    case 'damage':         return e.isCrit ? `Critical hit! Damage: ${e.amount}.` : `Damage: ${e.amount}.`
    case 'miss':           return `${e.pokemonName} missed!`
    case 'status-apply':   return `${e.status} was applied.`
    case 'status-tick':    return `${e.status} dealt ${e.amount} damage.`
    case 'status-end':     return `${e.status} wore off.`
    case 'switch':         return `Go, ${e.pokemonName}!`
    case 'send_out':       return ''
    case 'faint':          return `${e.pokemonName} fainted!`
    case 'effectiveness':
      if (e.effectiveness === 'super') return "It's super effective!"
      if (e.effectiveness === 'low')   return "It's not very effective…"
      if (e.effectiveness === 'none')  return "It had no effect…"
      return ''
    case 'turn-start':     return ''
    case 'victory':        return `${e.winnerName} is the champion!`
  }
  return ''
}

export function BattleLog({ entries }: Props) {
  const safeEntries: LogEntry[] = entries ?? []
  const ref = useRef<HTMLDivElement | null>(null)
  const [visibleCount, setVisibleCount] = useState(safeEntries.length)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (visibleCount >= safeEntries.length) return
    const t = setTimeout(() => setVisibleCount((v) => v + 1), 350)
    return () => clearTimeout(t)
  }, [visibleCount, safeEntries.length])

  useEffect(() => {
    if (safeEntries.length < visibleCount) setVisibleCount(safeEntries.length)
  }, [safeEntries.length, visibleCount])

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [visibleCount])

  const visibleEntries = safeEntries.slice(0, visibleCount).filter((e) => entryText(e).length > 0)
  const latest = visibleEntries[visibleEntries.length - 1]
  const prev   = visibleEntries[visibleEntries.length - 2]
  const isLatestComplete = visibleCount === safeEntries.length

  return (
    <div className={styles.dialog}>
      <span className={styles.chip}>BATTLE</span>
      {!expanded && (
        <div className={styles.stream} ref={ref}>
          {prev && (
            <p className={`${styles.line} ${styles.fade}`} key={`prev-${visibleCount - 2}`}>
              {entryText(prev)}
            </p>
          )}
          {latest && (
            <p className={`${styles.line} ${styles.active}`} key={`active-${visibleCount - 1}`}>
              <span
                className="anim-typewriter"
                style={{
                  animationDuration: `${Math.max(150, entryText(latest).length * 28)}ms`,
                  display: 'inline-block',
                }}
              >
                {entryText(latest)}
              </span>
            </p>
          )}
          {!latest && (
            <p className={`${styles.line} ${styles.fade}`}>…</p>
          )}
        </div>
      )}
      {expanded && (
        <div className={styles.history} ref={ref}>
          {visibleEntries.slice(-12).map((e, i) => (
            <p key={`hist-${i}`} className={styles.histLine}>
              {entryText(e)}
            </p>
          ))}
        </div>
      )}
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? 'Cerrar historial' : 'Ver historial'}
      >
        {expanded ? '×' : '▤'}
      </button>
      {!expanded && isLatestComplete && latest && (
        <span className={`${styles.arrow} anim-dialog-arrow`} aria-hidden="true" />
      )}
    </div>
  )
}
