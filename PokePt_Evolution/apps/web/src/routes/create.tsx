import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useUser, RedirectToSignIn } from '@clerk/clerk-react'
import { api, ApiError } from '../lib/api'
import { saveName, getLastName } from '../lib/storage'
import { DialogBox } from '../components/DialogBox'
import styles from './form.module.css'

export const Route = createFileRoute('/create')({
  component: CreateRoomPage,
})

function CreateRoomPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()
  const [name, setName] = useState(getLastName())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded) return null
  if (!isSignedIn) return <RedirectToSignIn />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return setError('Enter your name.')
    setLoading(true)
    setError(null)
    try {
      const r = await api.createRoom(clean)
      saveName(clean)
      navigate({ to: '/lobby/$code', params: { code: r.code } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create room.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.shell}>
      <a href="/" className="topbar-back">Back</a>
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <span className="kicker">Profile · Trainer</span>
          <h1 className={styles.title}>Create Room</h1>
          <DialogBox
            speaker="Prof. Rowan"
            text="As the host, you'll choose the battle stage. Tell me your trainer name and I'll hand you a room code."
            typewriter={false}
            arrow={false}
          />
        </aside>
        <form className={styles.formPanel + ' panel'} onSubmit={onSubmit}>
          <span className="panel__chip">PP-EVO / CREATE</span>
          <label className={styles.label}>
            <span>Trainer name</span>
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
            {loading ? 'Creating...' : '→ Generate code'}
          </button>
        </form>
      </div>
    </main>
  )
}
