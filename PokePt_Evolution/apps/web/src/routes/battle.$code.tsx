import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Battle, BattleAction, LogEntry } from '@pokept/shared'
import { api, ApiError } from '../lib/api'
import { getPlayer } from '../lib/storage'
import { usePolling } from '../hooks/usePolling'
import { Stage } from '../components/stages/Stage'
import { PokemonStage } from '../components/PokemonStage'
import { HpBox } from '../components/HpBox'
import { MoveButton } from '../components/MoveButton'
import { SwitchMenu } from '../components/SwitchMenu'
import { BattleLog } from '../components/BattleLog'
import { VictoryBanner } from '../components/VictoryBanner'
import { CoinFlip, isCoinFlipPhase } from '../components/CoinFlip'
import { TypeChart } from '../components/TypeChart'
import styles from './battle.module.css'

export const Route = createFileRoute('/battle/$code')({
  component: BattlePage,
})

type Effectiveness = 'super' | 'normal' | 'low' | 'none'
type BattleMenuMode = 'main' | 'fight'

interface AnimState {
  allyAnim: string | null
  foeAnim: string | null
  allyDmg: { value: number; isCrit: boolean; effectiveness: Effectiveness } | null
  foeDmg: { value: number; isCrit: boolean; effectiveness: Effectiveness } | null
  effectivenessFlash: 'super' | 'low' | 'none' | null
  shake: boolean
}

const EMPTY_ANIM: AnimState = {
  allyAnim: null,
  foeAnim: null,
  allyDmg: null,
  foeDmg: null,
  effectivenessFlash: null,
  shake: false,
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function BattlePage() {
  const { code } = Route.useParams()
  const stored = getPlayer(code)
  const playerId = stored?.playerId
  const [actionPending, setActionPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [anim, setAnim] = useState<AnimState>(EMPTY_ANIM)
  const [showSwitchMenu, setShowSwitchMenu] = useState(false)
  const [battleMenuMode, setBattleMenuMode] = useState<BattleMenuMode>('main')
  const [showTypeChart, setShowTypeChart] = useState(false)
  const [surrenderConfirm, setSurrenderConfirm] = useState(false)
  /** true when the animation queue has caught up to the latest backend log. */
  const [animationDone, setAnimationDone] = useState(true)

  const { data: battle, refetch } = usePolling(
    () => api.getBattle(code),
    400,
    [code],
  )

  const me = useMemo(() => battle?.players.find((p) => p.id === playerId), [battle, playerId])
  const foe = useMemo(() => battle?.players.find((p) => p.id !== playerId), [battle, playerId])
  const myActive = me ? me.team[me.activeIndex] : null
  const foeActive = foe ? foe.team[foe.activeIndex] : null

  // ─── Animation queue with ref + lock ─────────────────────────────────────
  const logRef = useRef<LogEntry[]>([])
  const seenRef = useRef(0)
  const animatingRef = useRef(false)
  const meIdRef = useRef<string | undefined>(undefined)
  const foeIdRef = useRef<string | undefined>(undefined)
  meIdRef.current = me?.id
  foeIdRef.current = foe?.id

  useEffect(() => {
    if (!battle) return
    logRef.current = battle.log
    if (animatingRef.current) return
    animatingRef.current = true
    setAnimationDone(false)
    void (async () => {
      try {
        while (seenRef.current < logRef.current.length) {
          const entry = logRef.current[seenRef.current]!
          await playEntry(entry, meIdRef.current, foeIdRef.current, setAnim)
          seenRef.current += 1
        }
      } finally {
        animatingRef.current = false
        setAnimationDone(true)
      }
    })()
  }, [battle?.log.length])

  // ─── Forced switch: open menu AFTER faint animation ──────────────────────
  const mustSwitch = !!battle && battle.mustSwitchPlayerId === playerId
  useEffect(() => {
    if (mustSwitch && animationDone) setShowSwitchMenu(true)
  }, [mustSwitch, animationDone])

  // ─── Input permissions ────────────────────────────────────────────────────
  const isMyTurn = !!battle && battle.status === 'in-progress' && battle.currentTurnPlayerId === playerId
  const coinFlipping = !!battle && isCoinFlipPhase(battle)
  const finished = !!battle && battle.status === 'finished'
  const canAttack = !!battle && battle.status === 'in-progress' && isMyTurn && !mustSwitch && !coinFlipping && !actionPending
  const canSwitch = canAttack || mustSwitch

  // Reset action menu when turn ends
  useEffect(() => {
    if (!isMyTurn) {
      setBattleMenuMode('main')
      setSurrenderConfirm(false)
    }
  }, [isMyTurn])

  async function sendMove(moveId: number) {
    if (!playerId || !canAttack) return
    await send({ type: 'move', moveId })
  }
  async function sendSwitch(targetIndex: number) {
    if (!playerId || !canSwitch) return
    await send({ type: 'switch', targetIndex })
  }
  async function send(action: BattleAction) {
    if (!playerId) return
    setActionPending(true)
    setErrorMsg(null)
    try {
      await api.sendAction(code, playerId, action)
      setShowSwitchMenu(false)
      setBattleMenuMode('main')
      refetch()
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message)
      else setErrorMsg('Could not send action.')
    } finally {
      setActionPending(false)
    }
  }
  async function handleAcknowledgeFlip() {
    if (!playerId) return
    try {
      await api.acknowledgeFlip(code, playerId)
      refetch()
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message)
      else setErrorMsg('Could not start battle.')
    }
  }
  async function handleForfeit() {
    if (!playerId) return
    setActionPending(true)
    setErrorMsg(null)
    try {
      await api.forfeit(code, playerId)
      setSurrenderConfirm(false)
      refetch()
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message)
      else setErrorMsg('Could not forfeit.')
    } finally {
      setActionPending(false)
    }
  }

  if (!playerId) {
    return <main className={styles.shell}><p>No session. <a href="/">Go home</a></p></main>
  }
  if (!battle) {
    return <main className={styles.shell}><p>Loading battle…</p></main>
  }
  if (!me || !foe || !myActive || !foeActive) {
    return <main className={styles.shell}><p>This battle does not match your session.</p></main>
  }

  const turnPlayerName = battle.currentTurnPlayerId
    ? battle.players.find((p) => p.id === battle.currentTurnPlayerId)?.name
    : null
  const foeMustSwitch = battle.mustSwitchPlayerId === foe.id

  const turnInfo = (() => {
    if (finished) return 'Battle over.'
    if (coinFlipping) return 'Coin flip in progress…'
    if (mustSwitch) return 'Your Pokémon fainted! Choose the next one.'
    if (foeMustSwitch) return `${foe.name} is choosing their next Pokémon…`
    if (isMyTurn) return 'Your turn · choose a move or switch.'
    return `${turnPlayerName ?? foe.name}'s turn…`
  })()

  const noSwitchable = me.team.filter((p, i) => i !== me.activeIndex && !p.fainted).length === 0

  return (
    <main className={`${styles.shell} ${anim.shake ? 'anim-shake' : ''}`}>
      <header className={styles.topbar}>
        <span className="kicker">Turn {Math.max(1, battle.turn)}</span>
        <span className={styles.vs}>
          <strong className={battle.currentTurnPlayerId === me.id ? styles.activePlayer : ''}>{me.name}</strong>
          <span className={styles.vsLabel}>vs</span>
          <strong className={battle.currentTurnPlayerId === foe.id ? styles.activePlayer : ''}>{foe.name}</strong>
        </span>
      </header>

      {finished && battle.winnerId && (
        <VictoryBanner
          winnerName={battle.players.find((p) => p.id === battle.winnerId)?.name ?? '???'}
          loserName={battle.players.find((p) => p.id !== battle.winnerId)?.name ?? '???'}
          isMe={battle.winnerId === playerId}
        />
      )}

      <section className={styles.field}>
        <Stage id={battle.stageId} />
        {anim.effectivenessFlash && (
          <div className={
            anim.effectivenessFlash === 'super' ? `${styles.flash} ${styles.flashSuper} anim-super-effective` :
            anim.effectivenessFlash === 'low'   ? `${styles.flash} ${styles.flashLow} anim-low-effective` :
                                                  `${styles.flash} ${styles.flashNone} anim-no-effect`
          } />
        )}

        <PokemonStage
          key={`foe-${foe.activeIndex}-${foeActive.speciesId}`}
          pokemon={foeActive}
          side="foe"
          animation={anim.foeAnim ?? undefined}
          damageNumber={anim.foeDmg}
        />
        <div className={styles.foeBox}>
          <HpBox pokemon={foeActive} side="foe" />
        </div>

        <PokemonStage
          key={`ally-${me.activeIndex}-${myActive.speciesId}`}
          pokemon={myActive}
          side="ally"
          animation={anim.allyAnim ?? undefined}
          damageNumber={anim.allyDmg}
        />
        <div className={styles.allyBox}>
          <HpBox pokemon={myActive} side="ally" />
        </div>

      </section>

      {coinFlipping && (
        <CoinFlip
          battle={battle}
          myPlayerId={playerId}
          onContinue={handleAcknowledgeFlip}
        />
      )}

      <div className={styles.separator} />

      <section className={styles.controls}>
        {/* Left panel: action menu or moves */}
        {isMyTurn && !mustSwitch && !coinFlipping && !finished ? (
          battleMenuMode === 'fight' ? (
            <div className={styles.moves}>
              {myActive.moves.map((m) => (
                <MoveButton
                  key={m.moveId}
                  move={m}
                  disabled={actionPending || myActive.fainted}
                  onUse={() => sendMove(m.moveId)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.actionMenu}>
              <button
                className={`${styles.actionBtn} ${styles.actionFight}`}
                type="button"
                onClick={() => setBattleMenuMode('fight')}
              >
                ⚔ FIGHT
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionSwitch}`}
                type="button"
                onClick={() => setShowSwitchMenu(true)}
                disabled={noSwitchable}
              >
                ↺ POKEMON
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionRun}`}
                type="button"
                onClick={() => setSurrenderConfirm(true)}
              >
                🏳 RUN
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionHelp}`}
                type="button"
                onClick={() => setShowTypeChart(true)}
              >
                ? HELP
              </button>
            </div>
          )
        ) : (
          <div className={styles.moves}>
            {myActive.moves.map((m) => (
              <MoveButton key={m.moveId} move={m} disabled={true} />
            ))}
          </div>
        )}

        {/* Right panel: info + back/confirm */}
        <div className={styles.side}>
          {battleMenuMode === 'fight' && isMyTurn && !mustSwitch && (
            <button className="btn" type="button" onClick={() => setBattleMenuMode('main')}>
              ← Back
            </button>
          )}
          {surrenderConfirm ? (
            <div className={styles.confirmBox}>
              <p className={styles.confirmMsg}>Forfeit the battle?</p>
              <div className={styles.confirmBtns}>
                <button className="btn btn--hot" type="button" onClick={handleForfeit} disabled={actionPending}>
                  Yes, forfeit
                </button>
                <button className="btn" type="button" onClick={() => setSurrenderConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className={`${styles.turnInfo} ${isMyTurn || mustSwitch ? styles.turnInfoMine : ''}`}>
              {turnInfo}
            </p>
          )}
          {errorMsg && <p className={styles.error}>⚠ {errorMsg}</p>}
        </div>
      </section>

      <BattleLog entries={battle.log} />

      {showSwitchMenu && (
        <SwitchMenu
          player={me}
          disabled={!canSwitch}
          forced={mustSwitch}
          onSwitch={(idx) => sendSwitch(idx)}
          onClose={() => { if (!mustSwitch) setShowSwitchMenu(false) }}
        />
      )}

      {showTypeChart && <TypeChart onClose={() => setShowTypeChart(false)} />}
    </main>
  )
}

// ─── Play ONE log entry ───────────────────────────────────────────────────
async function playEntry(
  e: LogEntry,
  myId: string | undefined,
  foeId: string | undefined,
  setAnim: React.Dispatch<React.SetStateAction<AnimState>>,
): Promise<void> {
  if (e.kind === 'move') {
    const isAlly = e.playerId === myId
    setAnim((s) => ({
      ...s,
      allyAnim: isAlly ? 'anim-attack-ally' : null,
      foeAnim: !isAlly ? 'anim-attack-foe' : null,
    }))
    await sleep(500)
    setAnim((s) => ({ ...s, allyAnim: null, foeAnim: null }))
  } else if (e.kind === 'damage') {
    const targetIsAlly = e.playerId === foeId
    setAnim((s) => ({
      ...s,
      allyAnim: targetIsAlly ? 'anim-hit-shake' : s.allyAnim,
      foeAnim: !targetIsAlly ? 'anim-hit-shake' : s.foeAnim,
      allyDmg: targetIsAlly ? { value: e.amount, isCrit: e.isCrit, effectiveness: e.effectiveness } : s.allyDmg,
      foeDmg: !targetIsAlly ? { value: e.amount, isCrit: e.isCrit, effectiveness: e.effectiveness } : s.foeDmg,
      shake: e.isCrit,
    }))
    await sleep(800)
    setAnim((s) => ({ ...s, allyAnim: null, foeAnim: null, allyDmg: null, foeDmg: null, shake: false }))
  } else if (e.kind === 'effectiveness') {
    if (e.effectiveness === 'super' || e.effectiveness === 'low' || e.effectiveness === 'none') {
      setAnim((s) => ({ ...s, effectivenessFlash: e.effectiveness as 'super' | 'low' | 'none' }))
      await sleep(600)
      setAnim((s) => ({ ...s, effectivenessFlash: null }))
    }
  } else if (e.kind === 'faint') {
    const isAlly = e.playerId === myId
    setAnim((s) => ({
      ...s,
      allyAnim: isAlly ? 'anim-faint' : s.allyAnim,
      foeAnim: !isAlly ? 'anim-faint' : s.foeAnim,
    }))
    await sleep(700)
  } else if (e.kind === 'switch') {
    const isAlly = e.playerId === myId
    setAnim((s) => ({
      ...s,
      allyAnim: isAlly ? null : s.allyAnim,
      foeAnim: !isAlly ? null : s.foeAnim,
      allyDmg: isAlly ? null : s.allyDmg,
      foeDmg: !isAlly ? null : s.foeDmg,
    }))
    await sleep(350)
  } else {
    await sleep(180)
  }
}
