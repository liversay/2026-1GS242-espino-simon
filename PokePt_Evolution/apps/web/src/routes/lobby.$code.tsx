import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { StageId } from '@pokept/shared'
import { api, ApiError } from '../lib/api'
import { getPlayer } from '../lib/storage'
import { usePolling } from '../hooks/usePolling'
import { TeamPicker } from '../components/TeamPicker'
import { StagePicker } from '../components/StagePicker'
import styles from './lobby.module.css'

const TEAM_SIZE = 6

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
  const [draftTeam, setDraftTeam] = useState<number[]>([])
  const [confirming, setConfirming] = useState(false)

  const { data: room } = usePolling(
    () => api.getRoom(code),
    1500,
    [code],
  )

  useEffect(() => {
    if (room?.status === 'playing') {
      navigate({ to: '/battle/$code', params: { code } })
    }
  }, [room?.status, code, navigate])

  const myPlayer = useMemo(
    () => room?.players.find((p) => p.id === playerId),
    [room, playerId],
  )
  const myServerTeam = myPlayer?.teamPokemonIds ?? []
  const myReady = !!myPlayer?.ready

  // Sincronizar draft con servidor cuando llega/cambia
  useEffect(() => {
    if (myReady && myServerTeam.length === TEAM_SIZE) {
      setDraftTeam(myServerTeam)
    }
  }, [myReady, myServerTeam.join(',')])

  const isHost = !!room && !!playerId && room.hostPlayerId === playerId
  const bothPresent = (room?.players.length ?? 0) === 2
  const bothReady = !!room && room.players.length === 2 && room.players.every((p) => p.ready && p.teamPokemonIds.length === TEAM_SIZE)

  const onTeamChange = useCallback((ids: number[]) => {
    setDraftTeam(ids)
  }, [])

  const onConfirmTeam = useCallback(async () => {
    if (!playerId || draftTeam.length !== TEAM_SIZE) return
    setConfirming(true)
    setError(null)
    try {
      await api.setTeam(code, playerId, draftTeam)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar el equipo.')
    } finally {
      setConfirming(false)
    }
  }, [code, playerId, draftTeam])

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
        <span className="kicker">Lobby · {isHost ? 'Host' : 'Retador'}</span>
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
                    {p.ready ? `● LISTO (6/6)` : '○ Eligiendo equipo…'}
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
            <span className="panel__chip">PP-EVO / TEAM · {draftTeam.length}/6</span>
            <TeamPicker
              selected={draftTeam}
              disabled={myReady}
              onChange={onTeamChange}
            />
            {!myReady && (
              <div className={styles.teamActions}>
                <span className={styles.teamCounter}>
                  {draftTeam.length === TEAM_SIZE
                    ? '✓ Equipo completo'
                    : `Te faltan ${TEAM_SIZE - draftTeam.length} Pokémon`}
                </span>
                <button
                  className="btn btn--hot"
                  onClick={onConfirmTeam}
                  disabled={confirming || draftTeam.length !== TEAM_SIZE}
                >
                  {confirming ? 'Guardando…' : 'Confirmar equipo'}
                </button>
              </div>
            )}
            {myReady && (
              <p className={styles.hint}>✓ Equipo confirmado. Esperando a tu rival.</p>
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
