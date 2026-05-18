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
import styles from './battle.module.css'

export const Route = createFileRoute('/battle/$code')({
  component: BattlePage,
})

type Effectiveness = 'super' | 'normal' | 'low' | 'none'

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

  const { data: battle, refetch } = usePolling(
    () => api.getBattle(code),
    1500,
    [code],
  )

  const me = useMemo(() => battle?.players.find((p) => p.id === playerId), [battle, playerId])
  const foe = useMemo(() => battle?.players.find((p) => p.id !== playerId), [battle, playerId])
  const myActive = me ? me.team[me.activeIndex] : null
  const foeActive = foe ? foe.team[foe.activeIndex] : null

  // ─── Cola de animaciones con ref + lock ──────────────────────────────────
  // Mantenemos un ref siempre actualizado al último log y un lock booleano
  // para evitar reentries. Cuando llegan nuevos logs vía polling durante una
  // animación en curso, el loop while sigue procesándolos sin duplicar.
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
    void (async () => {
      try {
        while (seenRef.current < logRef.current.length) {
          const entry = logRef.current[seenRef.current]!
          await playEntry(entry, meIdRef.current, foeIdRef.current, setAnim)
          seenRef.current += 1
        }
      } finally {
        animatingRef.current = false
      }
    })()
  }, [battle?.log.length])

  // ─── Switch forzado: abrir menú automáticamente ──────────────────────────
  const mustSwitch = !!battle && battle.mustSwitchPlayerId === playerId
  useEffect(() => {
    if (mustSwitch) setShowSwitchMenu(true)
  }, [mustSwitch])

  // ─── Permisos de input ──────────────────────────────────────────────────
  const isMyTurn = !!battle && battle.status === 'in-progress' && battle.currentTurnPlayerId === playerId
  const coinFlipping = !!battle && isCoinFlipPhase(battle)
  const finished = !!battle && battle.status === 'finished'
  // Si debo switchar, solo puedo hacer switch (no atacar).
  const canAttack = !!battle && battle.status === 'in-progress' && isMyTurn && !mustSwitch && !coinFlipping && !actionPending
  const canSwitch = canAttack || mustSwitch

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
      refetch()
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message)
      else setErrorMsg('No se pudo enviar la acción.')
    } finally {
      setActionPending(false)
    }
  }

  if (!playerId) {
    return <main className={styles.shell}><p>Sin sesión. <a href="/">Volver</a></p></main>
  }
  if (!battle) {
    return <main className={styles.shell}><p>Cargando batalla…</p></main>
  }
  if (!me || !foe || !myActive || !foeActive) {
    return <main className={styles.shell}><p>Esta batalla no corresponde a tu sesión.</p></main>
  }

  const turnPlayerName = battle.currentTurnPlayerId
    ? battle.players.find((p) => p.id === battle.currentTurnPlayerId)?.name
    : null
  const foeMustSwitch = battle.mustSwitchPlayerId === foe.id

  const turnInfo = (() => {
    if (finished) return 'Batalla finalizada.'
    if (coinFlipping) return 'Coin flip en curso…'
    if (mustSwitch) return '¡Tu Pokémon fue debilitado! Elegí el siguiente.'
    if (foeMustSwitch) return `${foe.name} está eligiendo su próximo Pokémon…`
    if (isMyTurn) return 'Tu turno · elegí movimiento o cambio.'
    return `Turno de ${turnPlayerName ?? foe.name}…`
  })()

  return (
    <main className={`${styles.shell} ${anim.shake ? 'anim-shake' : ''}`}>
      <header className={styles.topbar}>
        <span className="kicker">Turno {Math.max(1, battle.turn)}</span>
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
          pokemon={foeActive}
          side="foe"
          animation={anim.foeAnim ?? undefined}
          damageNumber={anim.foeDmg}
        />
        <div className={styles.foeBox}>
          <HpBox pokemon={foeActive} side="foe" />
        </div>

        <PokemonStage
          pokemon={myActive}
          side="ally"
          animation={anim.allyAnim ?? undefined}
          damageNumber={anim.allyDmg}
        />
        <div className={styles.allyBox}>
          <HpBox pokemon={myActive} side="ally" />
        </div>

        {coinFlipping && <CoinFlip battle={battle} myPlayerId={playerId} />}
      </section>

      <section className={styles.controls}>
        <div className={styles.moves}>
          {myActive.moves.map((m) => (
            <MoveButton
              key={m.moveId}
              move={m}
              disabled={!canAttack || myActive.fainted}
              onUse={() => sendMove(m.moveId)}
            />
          ))}
        </div>
        <div className={styles.side}>
          <button
            className="btn"
            type="button"
            onClick={() => setShowSwitchMenu(true)}
            disabled={!canSwitch || me.team.filter((p, i) => i !== me.activeIndex && !p.fainted).length === 0}
          >
            ⇄ Cambiar Pokémon
          </button>
          <p className={`${styles.turnInfo} ${isMyTurn || mustSwitch ? styles.turnInfoMine : ''}`}>
            {turnInfo}
          </p>
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
    </main>
  )
}

// ─── Reproducir UNA entrada del log ──────────────────────────────────────
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
    // target = el activo del jugador opuesto al atacante.
    // e.playerId es el ATACANTE; el daño lo recibe el otro lado.
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
    await sleep(350)
  } else {
    await sleep(180)
  }
}
