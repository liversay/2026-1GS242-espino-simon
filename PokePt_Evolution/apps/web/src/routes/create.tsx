import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { api, ApiError } from '../lib/api'
import { savePlayer, getLastName } from '../lib/storage'
import styles from './form.module.css'

export const Route = createFileRoute('/create')({
  component: CreateRoomPage,
})

function CreateRoomPage() {
  const navigate = useNavigate()
  const [name, setName] = useState(getLastName())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return setError('Ingresá tu nombre.')
    setLoading(true)
    setError(null)
    try {
      const r = await api.createRoom(clean)
      savePlayer(r.code, r.playerId, clean)
      navigate({ to: '/lobby/$code', params: { code: r.code } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la sala.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.shell}>
      <a href="/" className={styles.back}>← Volver</a>
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <span className="kicker">Ficha · Entrenador</span>
          <h1 className={styles.title}>Crear sala</h1>
          <p className={styles.body}>
            Vas a ser <strong>el anfitrión</strong>. Te toca elegir el escenario
            de batalla. El código de sala se generará al confirmar.
          </p>
        </aside>
        <form className={styles.formPanel + ' panel'} onSubmit={onSubmit}>
          <span className="panel__chip">PP-EVO / CREATE</span>
          <label className={styles.label}>
            <span>Nombre del entrenador</span>
            <input
              className="input"
              autoFocus
              maxLength={24}
              placeholder="Red"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button className="btn btn--hot" type="submit" disabled={loading}>
            {loading ? 'Creando...' : '→ Generar código'}
          </button>
        </form>
      </div>
    </main>
  )
}
