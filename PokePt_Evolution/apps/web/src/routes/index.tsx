import { createFileRoute, Link } from '@tanstack/react-router'
import styles from './index.module.css'

export const Route = createFileRoute('/')({
  component: SplashPage,
})

const TITLE = 'POKEPT EVOLUTION'

function SplashPage() {
  return (
    <main className={styles.splash}>
      <div className={styles.pokeball} aria-hidden />
      <header className={styles.headerBlock}>
        <span className="kicker anim-title-drop" style={{ animationDelay: '50ms' }}>
          Pokémon Battle Rooms · DSIX 2026
        </span>
        <h1 className={styles.title}>
          {TITLE.split('').map((c, i) => (
            <span
              key={i}
              className="anim-title-drop"
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              {c === ' ' ? ' ' : c}
            </span>
          ))}
          <span className={styles.glowOverlay + ' anim-title-glow'} aria-hidden>
            {TITLE}
          </span>
        </h1>
        <p className={styles.tagline}>
          Una batalla está a punto de comenzar.
          <br />
          Elige tu sala. Elige tu campo. Elige a tu campeón.
        </p>
      </header>

      <nav className={styles.ctas}>
        <Link to="/create" className="btn btn--hot">
          → Crear sala
        </Link>
        <Link to="/join" className="btn">
          Unirse con código
        </Link>
      </nav>

      <footer className={styles.footer}>
        <div className={styles.indexNum}>
          <span className="kicker">Nº</span>
          <span>0231 / PP-EVO</span>
        </div>
        <p>Por Simon Espino · Universidad · DSIX</p>
      </footer>
    </main>
  )
}
