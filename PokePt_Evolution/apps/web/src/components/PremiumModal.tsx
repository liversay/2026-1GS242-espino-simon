import { useState } from 'react'
import { createPortal } from 'react-dom'
import { api, ApiError } from '../lib/api'

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
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(14,18,48,0.8)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{ maxWidth: 400, textAlign: 'center', padding: '28px 32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="panel__chip">PP-EVO / PREMIUM</span>
        <p style={{ fontSize: 40, marginBottom: 8 }}>✨</p>
        <h2 style={{ fontFamily: 'var(--font-sub)', fontSize: 28, marginBottom: 12 }}>
          Go Premium
        </h2>
        <ul style={{
          fontFamily: 'var(--font-body)', fontSize: 18,
          color: 'var(--pp-steel)', textAlign: 'left',
          marginBottom: 20, paddingLeft: 20, lineHeight: 1.8,
        }}>
          <li>✨ Choose shiny variants for every Pokémon</li>
          <li>More perks coming soon</li>
        </ul>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, marginBottom: 18, color: 'var(--pp-hot)' }}>
          $10 / month · cancel anytime
        </p>
        {error && <p style={{ color: 'var(--pp-hot)', fontFamily: 'var(--font-body)', marginBottom: 10 }}>{error}</p>}
        <button className="btn btn--hot" onClick={handleUpgrade} disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Redirecting…' : '→ Subscribe for $10/mo'}
        </button>
        <button
          style={{
            marginTop: 10, fontFamily: 'var(--font-display)', fontSize: 9,
            color: 'var(--pp-platinum)', background: 'transparent', border: 'none',
            cursor: 'pointer', width: '100%',
          }}
          onClick={onClose}
        >
          Maybe later
        </button>
      </div>
    </div>,
    document.body,
  )
}
