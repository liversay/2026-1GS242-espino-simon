import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { StageId } from '@pokept/shared'
import { api, ApiError } from '../lib/api'
import { getPlayer } from '../lib/storage'
import { usePolling } from '../hooks/usePolling'
import { TeamPicker } from '../components/TeamPicker'
import { StagePicker } from '../components/StagePicker'
import styles from './lobby.module.css'

export const Route = createFileRoute('/lobby/$code')({
  component: LobbyPage,
})

function LobbyPage() {
  const { code } = Route.useParams()
  const navigate = useNavigate()
  const stored = getPlayer(code)
  const playerId = stored?.playerId
  const [copyMsg, setCopyMsg] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const { data: room } = usePolling(
    () => api.getRoom(code),
    1500,
    [code],
  )

  // Redirect a /battle si la sala arrancó
  useEffect(() => {
    if (room?.status === 'playing') {
      navigate({ to: '/battle/$code', params: { code } })
    }
  }, [room?.status, code, navigate])

  const isHost = !!room && !!playerId && room.hostPlayerId === playerId
  const myTeam = useMemo<number[]>(
    () => room?.players.find((p) => p.id === playerId)?.teamPokemonIds ?? [],
    [room, playerId],
  )
  const myReady = !!room?.players.find((p) => p.id === playerId)?.ready
  const bothPresent = (room?.players.length ?? 0) === 2
  const bothReady = !!room && room.players.length === 2 && room.players.every((p) => p.ready)

  const onTeamChange = useCallback(async (ids: number[]) => {
    if (!playerId) return
    try {
      await api.setTeam(code, playerId, ids)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar el equipo.')
    }
  }, [code, playerId])

  const onStageChange = useCallback(async (id: StageId) => {
    if (!playerId || !isHost) return
    try {
      await api.setStage(code, playerId, id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar el escenario.')
    }
  }, [code, playerId, isHost])

  const onCopy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {})
    setCopyMsg(true)
    setTimeout(() => setCopyMsg(false), 1500)
  }

  const onStart = async () => {
    if (!playerId) return
    setStarting(true)
    setError(null)
    try {
      await api.startBattle(code, playerId)
      navigate({ to: '/battle/$code', params: { code } })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo iniciar.')
      setStarting(false)
    }
  }

  if (!playerId) {
    return (
      <main className={styles.shell}>
        <p className={styles.muted}>No tenemos tu sesión para esta sala. Volvé al inicio.</p>
        <a href="/" className="btn">← Inicio</a>
      </main>
    )
  }

  if (!room) {
    return <main className={styles.shell}><p className={styles.muted}>Cargando lobby…</p></main>
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <a href="/" className={styles.back}>← Salir</a>
        <span className="kicker">Lobby · {isHost ? 'Host' : 'Guest'}</span>
      </header>

      <section className={styles.codeBlock}>
        <span className="kicker">Código de sala</span>
        <button type="button" onClick={onCopy} className={styles.codeBtn} aria-label="Copiar código">
          <span className="hero-code">{code}</span>
          <span className={styles.copyTip}>
            {copyMsg ? '¡Copiado!' : 'Click para copiar'}
          </span>
        </button>
      </section>

      <section className={styles.players}>
        {[0, 1].map((slot) => {
          const p = room.players[slot]
          const isMe = !!p && p.id === playerId
          return (
            <div
              key={slot}
              className={`${styles.player} ${p?.ready ? styles.playerReady : ''} ${!p ? styles.playerEmpty : ''}`}
            >
              {p ? (
                <>
                  <span className="kicker">{room.hostPlayerId === p.id ? 'Host' : 'Retador'}{isMe && ' · vos'}</span>
                  <span className={styles.pName}>{p.name}</span>
                  <span className={`${styles.status} ${p.ready ? styles.statusReady : ''}`}>
                    {p.ready ? '● LISTO' : '○ Eligiendo…'}
                  </span>
                </>
              ) : (
                <span className={styles.waiting}>Esperando entrenador…</span>
              )}
            </div>
          )
        })}
      </section>

      {!bothPresent && (
        <p className={styles.hint}>
          Compartí el código con tu rival. Esta pantalla se actualiza sola cuando se conecte.
        </p>
      )}

      {bothPresent && (
        <>
          <section className="panel panel--dark">
            <span className="panel__chip">PP-EVO / TEAM</span>
            <TeamPicker
              selected={myTeam}
              disabled={myReady}
              onChange={onTeamChange}
            />
            {myReady && (
              <p className={styles.hint}>
                ✓ Equipo guardado. Esperando a tu rival.
              </p>
            )}
          </section>

          <section className="panel panel--dark">
            <span className="panel__chip">PP-EVO / STAGE</span>
            <StagePicker
              selected={room.stageId}
              isHost={isHost}
              onChange={onStageChange}
            />
          </section>
        </>
      )}

      {error && <p className={styles.error}>⚠ {error}</p>}

      {isHost && bothReady && (
        <button className={`btn btn--hot ${styles.startBtn}`} onClick={onStart} disabled={starting}>
          {starting ? 'Iniciando…' : '⚡ ¡Iniciar batalla!'}
        </button>
      )}
      {!isHost && bothReady && (
        <p className={styles.hint}>Esperando que el host inicie…</p>
      )}
    </main>
  )
}
