import styles from './TrainerCard.module.css'

interface Props {
  name: string
  trainerId?: string | number
  isPremium?: boolean
  isReady?: boolean
  status?: string
  side?: 'left' | 'right'
  avatarUrl?: string | null
}

function shortId(value: string | number | undefined): string {
  if (value === undefined) return '?????'
  const raw = String(value)
  let hash = 0
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
  return String(hash % 100000).padStart(5, '0')
}

export function TrainerCard({
  name,
  trainerId,
  isPremium = false,
  isReady = false,
  status,
  side = 'left',
  avatarUrl,
}: Props) {
  const id = shortId(trainerId ?? name)
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <article
      className={`${styles.card} ${styles[side]} ${isPremium ? styles.premium : ''}`}
      aria-label={`Trainer card ${name}`}
    >
      <div className={styles.chip}>TRAINER</div>
      <div className={styles.pattern} aria-hidden="true" />
      <div className={styles.body}>
        <div className={styles.avatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" loading="lazy" />
          ) : (
            <span className={styles.avatarLetter}>{initial}</span>
          )}
        </div>
        <div className={styles.info}>
          <div className={styles.idRow}>
            <span className={styles.idLabel}>ID No.</span>
            <span className={styles.idNum}>{id}</span>
          </div>
          <div className={styles.name}>{name}</div>
          <div className={styles.statusRow}>
            <span
              className={styles.statusDot}
              data-state={isReady ? 'on' : 'off'}
              aria-hidden="true"
            />
            <span className={styles.statusText}>
              {status ?? (isReady ? 'Ready!' : 'Waiting…')}
            </span>
          </div>
        </div>
      </div>
      {isPremium && <span className={styles.badge} aria-label="Premium">★</span>}
    </article>
  )
}
