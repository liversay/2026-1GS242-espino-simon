import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { PremiumModal } from '../components/PremiumModal'
import { PixelCursor } from '../components/PixelCursor'
import styles from './index.module.css'

export const Route = createFileRoute('/')({
  component: SplashPage,
})

const LINE1 = 'POKEPT'
const LINE2 = 'EVOLUTION'

interface MenuItem {
  label: string
  onSelect: () => void
  primary?: boolean
}

function SplashPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const [isPremium, setIsPremium] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [hover, setHover] = useState<number | null>(0)

  useEffect(() => {
    if (isSignedIn) {
      api.getMe().then((u) => setIsPremium(u.subscriptionStatus === 'premium')).catch(() => {})
    }
  }, [isSignedIn])

  const items: MenuItem[] = isSignedIn
    ? [
        { label: 'NEW BATTLE', onSelect: () => navigate({ to: '/create' }), primary: true },
        { label: 'JOIN WITH CODE', onSelect: () => navigate({ to: '/join' }) },
        isPremium
          ? {
              label: 'MANAGE SUBSCRIPTION',
              onSelect: async () => {
                try {
                  const { url } = await api.getBillingPortal()
                  window.location.href = url
                } catch {}
              },
            }
          : { label: 'GO PREMIUM', onSelect: () => setShowPremiumModal(true) },
      ]
    : [
        { label: 'SIGN IN TO PLAY', onSelect: () => navigate({ to: '/sign-in' }), primary: true },
        { label: 'CREATE ACCOUNT', onSelect: () => navigate({ to: '/sign-up' }) },
      ]

  return (
    <main className={styles.splash}>
      <div className={styles.pokeball} aria-hidden />
      <header className={styles.headerBlock}>
        <div className={styles.titleRow}>
          <span className="kicker anim-title-drop" style={{ animationDelay: '50ms' }}>
            Pokémon Battle Rooms
          </span>
          <span className={`${styles.versionChip} anim-title-drop`} style={{ animationDelay: '80ms' }}>
            v1.0 · DS Edition
          </span>
        </div>
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

      {isLoaded && (
        <nav className={styles.menu} aria-label="Main menu">
          <div className={styles.pressStart}>▶ PRESS START</div>
          <ul className={styles.menuList}>
            {items.map((it, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  className={`${styles.menuItem} ${it.primary ? styles.primary : ''}`}
                  onClick={it.onSelect}
                  onMouseEnter={() => setHover(idx)}
                  onFocus={() => setHover(idx)}
                >
                  <PixelCursor visible={hover === idx} className={styles.cursor} />
                  <span>{it.label}</span>
                </button>
              </li>
            ))}
          </ul>
          {!isSignedIn && (
            <div className={styles.subhint}>
              You need an account to host or join a battle.
            </div>
          )}
        </nav>
      )}
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}

      <footer className={styles.footer}>
        <span className={styles.indexChip}>Nº 0231 · PP-EVO</span>
        <p className={styles.footerNote}>Pokémon Battle Rooms · DS Edition</p>
      </footer>
    </main>
  )
}

