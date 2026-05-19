import { createFileRoute, Link } from '@tanstack/react-router'
import styles from './index.module.css'

export const Route = createFileRoute('/')({
  component: SplashPage,
})

const LINE1 = 'POKEPT'
const LINE2 = 'EVOLUTION'

function SplashPage() {
  return (
    <main className={styles.splash}>
      <div className={styles.pokeball} aria-hidden />
      <header className={styles.headerBlock}>
        <span className="kicker anim-title-drop" style={{ animationDelay: '50ms' }}>
          Pokémon Battle Rooms
        </span>
        <h1 className={styles.title}>
          <span className={styles.titleLine}>
            {LINE1.split('').map((c, i) => (
              <span
                key={i}
                className="anim-title-drop"
                style={{ animationDelay: `${120 + i * 70}ms` }}
              >
                {c}
              </span>
            ))}
          </span>
          <span className={styles.titleLine}>
            {LINE2.split('').map((c, i) => (
              <span
                key={i}
                className="anim-title-drop"
                style={{ animationDelay: `${120 + (LINE1.length + 1 + i) * 70}ms` }}
              >
                {c}
              </span>
            ))}
          </span>
          <span className={styles.glowOverlay + ' anim-title-glow'} aria-hidden>
            {LINE1}{'\n'}{LINE2}
          </span>
        </h1>
        <p className={styles.tagline}>
          A battle is about to begin.
          <br />
          Choose your room. Choose your field. Choose your champion.
        </p>
      </header>

      <nav className={styles.ctas}>
        <Link to="/create" className="btn btn--hot">
          → Create room
        </Link>
        <Link to="/join" className="btn">
          Join with code
        </Link>
      </nav>

      <footer className={styles.footer}>
        <div className={styles.indexNum}>
          <span className="kicker">Nº</span>
          <span>0231 / PP-EVO</span>
        </div>
        <p>Pokémon Battle Rooms</p>
      </footer>
    </main>
  )
}
