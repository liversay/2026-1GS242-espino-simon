import { Link } from '@tanstack/react-router'
import styles from './VictoryBanner.module.css'

interface Props {
  winnerName: string
  loserName: string
  isMe: boolean
}

const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 19) % 100,
  delay: (i * 0.13) % 4,
  sway: -40 + ((i * 17) % 80),
  color: ['var(--pp-hot)', 'var(--pp-electric)', 'var(--pp-platinum)', 'var(--pp-paper)'][i % 4],
}))

// Banner inline que se monta sobre el campo de batalla SIN ocultarlo:
// confetti cae detrás, panel de resultado arriba del field, batalla queda visible.
export function VictoryBanner({ winnerName, loserName, isMe }: Props) {
  return (
    <>
      <div className={styles.confettiLayer} aria-hidden>
        {CONFETTI.map((c, i) => (
          <div
            key={i}
            className={`${styles.confetti} anim-confetti`}
            style={{
              left: `${c.left}%`,
              background: c.color,
              ['--delay' as string]: `${c.delay}s`,
              ['--sway' as string]: `${c.sway}px`,
            }}
          />
        ))}
      </div>
      <div className={`${styles.panel} bounce-in`}>
        <div className={styles.left}>
          <span className="kicker">Result</span>
          <h2 className={`${styles.title} anim-shimmer`}>
            {isMe ? 'VICTORY!' : 'DEFEAT…'}
          </h2>
          <p className={styles.body}>
            <strong>{winnerName}</strong> defeated <strong>{loserName}</strong>.
          </p>
        </div>
        <div className={styles.right}>
          <Link to="/" className="btn btn--hot">→ Back to home</Link>
        </div>
      </div>
    </>
  )
}
