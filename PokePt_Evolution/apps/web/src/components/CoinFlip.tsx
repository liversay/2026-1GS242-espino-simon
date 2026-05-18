import { useEffect, useState } from 'react'
import type { Battle, CoinFace } from '@pokept/shared'
import { api, ApiError } from '../lib/api'
import styles from './CoinFlip.module.css'

interface Props {
  battle: Battle
  myPlayerId: string
}

// Devuelve true mientras la animación post-resultado deba estar visible.
export function isCoinFlipPhase(battle: Battle): boolean {
  if (battle.status === 'coin-flip') return true
  if (battle.coinFlip.completedAt) {
    const age = Date.now() - new Date(battle.coinFlip.completedAt).getTime()
    return age < ANIM_DURATION_MS
  }
  return false
}

const ANIM_DURATION_MS = 3600

export function CoinFlip({ battle, myPlayerId }: Props) {
  const isHost = battle.hostPlayerId === myPlayerId
  const isGuest = !isHost
  const choice = battle.coinFlip.guestChoice
  const result = battle.coinFlip.result
  const winnerId = battle.coinFlip.winnerId
  const winnerName = winnerId ? battle.players.find((p) => p.id === winnerId)?.name : null

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(face: CoinFace) {
    setSending(true)
    setError(null)
    try {
      await api.coinFlipChoice(battle.roomCode, myPlayerId, face)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al elegir.')
      setSending(false)
    }
  }

  // Fase 1: esperando elección del guest
  if (!choice) {
    return (
      <div className={styles.shell}>
        <span className="kicker">Inicio del combate</span>
        <h2 className={styles.title}>Cara o cruz</h2>
        {isGuest ? (
          <>
            <p className={styles.body}>
              Vos elegís. Si ganás el coin flip, atacás primero.
            </p>
            <div className={styles.choices}>
              <button
                type="button"
                className={`${styles.choiceBtn} ${styles.heads}`}
                onClick={() => send('heads')}
                disabled={sending}
              >
                <span className={styles.bigLabel}>CARA</span>
                <span className={styles.subLabel}>HEADS</span>
              </button>
              <button
                type="button"
                className={`${styles.choiceBtn} ${styles.tails}`}
                onClick={() => send('tails')}
                disabled={sending}
              >
                <span className={styles.bigLabel}>CRUZ</span>
                <span className={styles.subLabel}>TAILS</span>
              </button>
            </div>
            {error && <p className={styles.error}>⚠ {error}</p>}
          </>
        ) : (
          <p className={styles.body}>El retador está eligiendo cara o cruz…</p>
        )}
      </div>
    )
  }

  // Fase 2: ya hay resultado, animar y mostrar ganador
  return (
    <div className={styles.shell}>
      <span className="kicker">{isGuest ? `Elegiste ${choice === 'heads' ? 'CARA' : 'CRUZ'}` : `El retador eligió ${choice === 'heads' ? 'CARA' : 'CRUZ'}`}</span>
      <h2 className={styles.title}>Lanzando la moneda</h2>
      <CoinSpin result={result!} />
      <ResultBanner result={result!} winnerName={winnerName ?? '???'} />
    </div>
  )
}

function CoinSpin({ result }: { result: CoinFace }) {
  return (
    <div className={styles.coinWrap}>
      <div
        className={styles.coin}
        data-result={result}
      >
        <div className={`${styles.face} ${styles.faceHeads}`}>
          <span className={styles.faceLabel}>★</span>
          <span className={styles.faceSmall}>HEADS</span>
        </div>
        <div className={`${styles.face} ${styles.faceTails}`}>
          <span className={styles.faceLabel}>✕</span>
          <span className={styles.faceSmall}>TAILS</span>
        </div>
      </div>
      <div className={styles.coinShadow} />
    </div>
  )
}

function ResultBanner({ result, winnerName }: { result: CoinFace; winnerName: string }) {
  const [showBanner, setShowBanner] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowBanner(true), 2500)
    return () => clearTimeout(t)
  }, [])
  if (!showBanner) return <div className={styles.bannerPlaceholder} />
  return (
    <div className={`${styles.banner} bounce-in`}>
      <span className={styles.bannerHead}>La moneda cayó en <strong>{result === 'heads' ? 'CARA' : 'CRUZ'}</strong></span>
      <span className={`${styles.bannerWinner} anim-shimmer`}>¡{winnerName} ataca primero!</span>
    </div>
  )
}
