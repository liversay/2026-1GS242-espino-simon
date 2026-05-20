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
        <div className="panel" style={{ textAlign: 'center', maxWidth: 480 }}>
          <span className="panel__chip">PP-EVO / PREMIUM</span>
          <p style={{ fontSize: 48, marginBottom: 8 }}>✨</p>
          <h1 style={{ fontFamily: 'var(--font-sub)', fontSize: 32, marginBottom: 12 }}>
            Welcome to Premium!
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--pp-steel)', marginBottom: 20 }}>
            You can now choose shiny variants for your Pokémon team.
          </p>
          <Link to="/" className="btn btn--hot">→ Start playing</Link>
        </div>
      </div>
    </main>
  )
}
