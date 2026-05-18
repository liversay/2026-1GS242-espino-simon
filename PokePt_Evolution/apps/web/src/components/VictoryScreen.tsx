import { Link } from '@tanstack/react-router'
import styles from './VictoryScreen.module.css'

interface Props {
  winnerName: string
  loserName: string
  isMe: boolean
}

const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 19) % 100,
  delay: (i * 0.13) % 4,
  sway: -40 + ((i * 17) % 80),
  color: ['var(--pp-hot)', 'var(--pp-electric)', 'var(--pp-platinum)', 'var(--pp-paper)'][i % 4],
}))

export function VictoryScreen({ winnerName, loserName, isMe }: Props) {
  return (
    <div className={styles.overlay}>
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
      <div className={styles.card}>
        <span className="kicker">Fin del combate</span>
        <h1 className={`${styles.title} anim-shimmer`}>
          {isMe ? '¡VICTORIA!' : 'DERROTA…'}
        </h1>
        <p className={styles.body}>
          <strong>{winnerName}</strong> derrotó a <strong>{loserName}</strong>.
        </p>
        <div className={styles.ctas}>
          <Link to="/" className="btn btn--hot">→ Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
