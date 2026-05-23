import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import styles from './form.module.css'

export const Route = createFileRoute('/billing/success')({
  component: BillingSuccessPage,
})

function BillingSuccessPage() {
  const { user } = useUser()

  useEffect(() => {
    // Reload Clerk session so /me reflects the new subscriptionStatus
    user?.reload()
  }, [])

  return (
    <main className={styles.shell}>
      <div className={styles.layout} style={{ justifyContent: 'center' }}>
        <div className="panel" style={{ textAlign: 'center', maxWidth: 480, paddingTop: 36 }}>
          <span className="panel__chip">PP-EVO / PREMIUM</span>
          <p style={{ fontSize: 42, marginBottom: 8, color: 'var(--pp-electric)', filter: 'drop-shadow(0 0 12px var(--pp-electric))' }} aria-hidden="true">★</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 14, color: 'var(--ds-dialog-outer)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Welcome to Premium!
          </h1>
          <p style={{ fontFamily: 'var(--font-game)', fontSize: 20, color: 'var(--ds-dialog-ink)', marginBottom: 20, lineHeight: 1.35 }}>
            You can now choose shiny variants for your Pokémon team.
          </p>
          <Link to="/" className="btn btn--hot" style={{ display: 'inline-block' }}>Start playing</Link>
        </div>
      </div>
    </main>
  )
}
