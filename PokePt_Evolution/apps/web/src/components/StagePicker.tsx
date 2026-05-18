import { useEffect } from 'react'
import { ALL_STAGE_IDS, type StageId } from '@pokept/shared'
import { Stage, STAGE_LABELS } from './stages/Stage'
import styles from './StagePicker.module.css'

interface Props {
  selected: StageId
  isHost: boolean
  onChange: (id: StageId) => void
}

export function StagePicker({ selected, isHost, onChange }: Props) {
  // Atajos teclado para el host
  useEffect(() => {
    if (!isHost) return
    function onKey(e: KeyboardEvent) {
      const idx = ALL_STAGE_IDS.indexOf(selected)
      if (e.key === 'ArrowRight') onChange(ALL_STAGE_IDS[(idx + 1) % ALL_STAGE_IDS.length]!)
      else if (e.key === 'ArrowLeft') onChange(ALL_STAGE_IDS[(idx - 1 + ALL_STAGE_IDS.length) % ALL_STAGE_IDS.length]!)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, isHost, onChange])

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <span className="kicker">Escenario · {isHost ? 'Elige uno (host)' : 'Definido por el host'}</span>
        <h3 className={styles.h3}>{STAGE_LABELS[selected]}</h3>
      </header>
      <div className={styles.carousel}>
        {ALL_STAGE_IDS.map((id) => {
          const active = id === selected
          return (
            <button
              key={id}
              type="button"
              className={`${styles.card} ${active ? styles.cardActive : ''}`}
              onClick={() => isHost && onChange(id)}
              disabled={!isHost}
              aria-pressed={active}
              aria-label={`Escenario ${STAGE_LABELS[id]}`}
            >
              <div className={styles.previewWrap}>
                <Stage id={id} />
              </div>
              <div className={styles.cardFoot}>
                <span className={styles.cardName}>{STAGE_LABELS[id]}</span>
                {active && <span className={styles.badge}>ELEGIDO</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
