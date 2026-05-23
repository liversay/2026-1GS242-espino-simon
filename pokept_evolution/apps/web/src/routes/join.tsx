import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useUser, RedirectToSignIn } from '@clerk/clerk-react'
import { api, ApiError } from '../lib/api'
import { saveName, getLastName } from '../lib/storage'
import { DialogBox } from '../components/DialogBox'
import styles from './form.module.css'

export const Route = createFileRoute('/join')({
  component: JoinRoomPage,
})

function JoinRoomPage() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()
  const [name, setName] = useState(getLastName())
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded) return null
  if (!isSignedIn) return <RedirectToSignIn />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanName) return setError('Enter your name.')
    if (!cleanCode || cleanCode.length < 4) return setError('Enter the full room code.')
    setLoading(true)
    setError(null)
    try {
      const r = await api.joinRoom(cleanCode, cleanName)
      saveName(cleanName)
      navigate({ to: '/lobby/$code', params: { code: cleanCode } })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) setError('Room not found.')
        else if (err.status === 409) setError('Room is full or already started.')
        else setError(err.message)
      } else setError('Could not join.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.shell}>
      <a href="/" className="topbar-back">Back</a>
      <div className={styles.layout}>
        <aside className={styles.aside}>
          <span className="kicker">Profile · Challenger</span>
          <h1 className={styles.title}>Join Room</h1>
          <DialogBox
            speaker="Prof. Rowan"
            text="Paste the room code your rival sent you. If the room is open, I'll send you straight to the lobby."
            typewriter={false}
            arrow={false}
          />
        </aside>
        <form className={styles.formPanel + ' panel'} onSubmit={onSubmit}>
          <span className="panel__chip">PP-EVO / JOIN</span>
          <label className={styles.label}>
            <span>Trainer name</span>
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
            <span>Room code</span>
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
            {loading ? 'Joining...' : '→ Enter'}
          </button>
        </form>
      </div>
    </main>
  )
}
