import { useState } from 'react'
import { createPortal } from 'react-dom'
import { api, ApiError } from '../lib/api'
import styles from './PremiumModal.module.css'

interface Props {
  onClose: () => void
}

export function PremiumModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const { url } = await api.createCheckout()
      if (url) window.location.href = url
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start checkout.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="premium-title">
        <span className={styles.chip}>PP-EVO / PREMIUM</span>
        <p className={styles.star} aria-hidden="true">★</p>
        <h2 id="premium-title" className={styles.title}>Go Premium</h2>
        <ul className={styles.perks}>
          <li>Choose shiny variants for every Pokémon</li>
          <li>More perks coming soon</li>
        </ul>
        <p className={styles.priceTag}>$10 / month · cancel anytime</p>
        {error && <p className={styles.error}>{error}</p>}
        <button
          className={`btn btn--hot ${styles.subscribeBtn}`}
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? 'Redirecting…' : 'Subscribe for $10/mo'}
        </button>
        <button type="button" className={styles.laterBtn} onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>,
    document.body,
  )
}
