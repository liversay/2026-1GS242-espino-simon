import { useEffect, useState } from 'react'
import type { Battle, CoinFace } from '@pokept/shared'
import { api, ApiError } from '../lib/api'
import styles from './CoinFlip.module.css'

interface Props {
  battle: Battle
  myPlayerId: string
  onContinue: () => void
}

export function isCoinFlipPhase(battle: Battle): boolean {
  if (battle.status === 'coin-flip') return true
  // Show result until the guest acknowledges (dismisses for both players)
  if (battle.coinFlip.completedAt && !battle.coinFlip.acknowledgedAt) return true
  return false
}

export function CoinFlip({ battle, myPlayerId, onContinue }: Props) {
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
      setError(e instanceof ApiError ? e.message : 'Error choosing.')
      setSending(false)
    }
  }

  // Phase 1: waiting for guest's choice
  if (!choice) {
    return (
      <div className={styles.shell}>
        <span className="kicker">Battle Start</span>
        <h2 className={styles.title}>Heads or Tails</h2>
        {isGuest ? (
          <>
            <p className={styles.body}>
              You choose. If you win the coin flip, you attack first.
            </p>
            <div className={styles.choices}>
              <button
                type="button"
                className={`${styles.choiceBtn} ${styles.heads}`}
                onClick={() => send('heads')}
                disabled={sending}
              >
                <span className={styles.bigLabel}>HEADS</span>
                <span className={styles.subLabel}>★</span>
              </button>
              <button
                type="button"
                className={`${styles.choiceBtn} ${styles.tails}`}
                onClick={() => send('tails')}
                disabled={sending}
              >
                <span className={styles.bigLabel}>TAILS</span>
                <span className={styles.subLabel}>✕</span>
              </button>
            </div>
            {error && <p className={styles.error}>⚠ {error}</p>}
          </>
        ) : (
          <p className={styles.body}>The challenger is choosing heads or tails…</p>
        )}
      </div>
    )
  }

  // Phase 2: result known, show spin + banner
  const choiceLabel = choice === 'heads' ? 'HEADS' : 'TAILS'
  return (
    <div className={styles.shell}>
      <span className="kicker">
        {isGuest
          ? `You chose ${choiceLabel}`
          : `Challenger chose ${choiceLabel}`}
      </span>
      <h2 className={styles.title}>Flipping the coin</h2>
      <CoinSpin key={result} result={result!} />
      <ResultBanner
        result={result!}
        winnerName={winnerName ?? '???'}
        isGuest={isGuest}
        onContinue={onContinue}
      />
    </div>
  )
}

function CoinSpin({ result }: { result: CoinFace }) {
  return (
    <div className={styles.coinWrap}>
      <div className={styles.coin} data-result={result}>
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

function ResultBanner({
  result,
  winnerName,
  isGuest,
  onContinue,
}: {
  result: CoinFace
  winnerName: string
  isGuest: boolean
  onContinue: () => void
}) {
  const [showBanner, setShowBanner] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowBanner(true), 2500)
    return () => clearTimeout(t)
  }, [])
  if (!showBanner) return <div className={styles.bannerPlaceholder} />
  return (
    <div className={`${styles.banner} bounce-in`}>
      <span className={styles.bannerHead}>
        The coin landed on <strong>{result.toUpperCase()}</strong>
      </span>
      <span className={`${styles.bannerWinner} anim-shimmer`}>
        {winnerName} attacks first!
      </span>
      {isGuest ? (
        <button type="button" className={`btn btn--hot ${styles.continueBtn}`} onClick={onContinue}>
          Start battle →
        </button>
      ) : (
        <p className={styles.waitMsg}>Waiting for challenger to start…</p>
      )}
    </div>
  )
}
