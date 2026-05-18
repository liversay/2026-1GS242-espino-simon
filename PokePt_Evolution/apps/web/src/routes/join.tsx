import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { api, ApiError } from '../lib/api'
import { savePlayer, getLastName } from '../lib/storage'
import styles from './form.module.css'

export const Route = createFileRoute('/join')({
  component: JoinRoomPage,
})

function JoinRoomPage() {
  const navigate = useNavigate()
  const [name, setName] = useState(getLastName())
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanName) return setError('Ingresá tu nombre.')
    if (!cleanCode || cleanCode.length < 4) return setError('Ingresá el código completo.')
    setLoading(true)
    setError(null)
    try {
      const r = await api.joinRoom(cleanCode, cleanName)
      savePlayer(cleanCode, r.playerId, cleanName)
      navigate({ to: '/lobby/$code', params: { code: cleanCode } })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) setError('No encontramos esa sala.')
        else if (err.status === 409) setError('La sala ya está llena o empezó.')
        else setError(err.message)
      } else setError('No se pudo unir.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.shell}>
      <a href="/" className={styles.back}>← Volver</a>
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <span className="kicker">Ficha · Retador</span>
          <h1 className={styles.title}>Unirse</h1>
          <p className={styles.body}>
            Pegá el <strong>código de sala</strong> que te compartieron. Si la
            sala existe y tiene cupo, entrás directo al lobby.
          </p>
        </aside>
        <form className={styles.formPanel + ' panel'} onSubmit={onSubmit}>
          <span className="panel__chip">PP-EVO / JOIN</span>
          <label className={styles.label}>
            <span>Nombre del entrenador</span>
            <input
              className="input"
              autoFocus
              maxLength={24}
              placeholder="Blue"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            <span>Código de sala</span>
            <input
              className="input"
              maxLength={6}
              placeholder="A1B2C3"
              style={{ letterSpacing: '0.3em', fontSize: 32, textTransform: 'uppercase' }}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button className="btn btn--hot" type="submit" disabled={loading}>
            {loading ? 'Uniendo...' : '→ Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
