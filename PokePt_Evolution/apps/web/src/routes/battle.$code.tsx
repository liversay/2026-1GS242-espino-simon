import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
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
import { VictoryScreen } from '../components/VictoryScreen'
import styles from './battle.module.css'

export const Route = createFileRoute('/battle/$code')({
  component: BattlePage,
})

interface AnimState {
  lastSeenLogLen: number
  allyAnim: string | null
  foeAnim: string | null
  allyDmg: { value: number; isCrit: boolean; effectiveness: 'super' | 'normal' | 'low' | 'none' } | null
  foeDmg: { value: number; isCrit: boolean; effectiveness: 'super' | 'normal' | 'low' | 'none' } | null
  effectivenessFlash: 'super' | 'low' | 'none' | null
  shake: boolean
}

function initialAnimState(initialLogLen: number): AnimState {
  return {
    lastSeenLogLen: initialLogLen,
    allyAnim: null,
    foeAnim: null,
    allyDmg: null,
    foeDmg: null,
    effectivenessFlash: null,
    shake: false,
  }
}

function BattlePage() {
  const { code } = Route.useParams()
  const stored = getPlayer(code)
  const playerId = stored?.playerId
  const [showSwitch, setShowSwitch] = useState(false)
  const [actionPending, setActionPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [anim, setAnim] = useState<AnimState>(initialAnimState(0))

  const { data: battle, refetch } = usePolling(
    () => api.getBattle(code),
    1500,
    [code],
  )

  const me = useMemo(() => battle?.players.find((p) => p.id === playerId), [battle, playerId])
  const foe = useMemo(() => battle?.players.find((p) => p.id !== playerId), [battle, playerId])
  const myActive = me ? me.team[me.activeIndex] : null
  const foeActive = foe ? foe.team[foe.activeIndex] : null
  const iAlreadyActed = !!(playerId && battle?.pendingActions[playerId])
  const inputsBlocked = !!battle && (battle.status === 'finished' || iAlreadyActed || actionPending || (myActive?.fainted ?? false))

  // Procesar log nuevo: dispara animaciones para los eventos recién entrados.
  useEffect(() => {
    if (!battle) return
    if (battle.log.length === anim.lastSeenLogLen) return
    const newEntries = battle.log.slice(anim.lastSeenLogLen)
    runAnimations(newEntries, me?.id, foe?.id, setAnim, battle.log.length)
  }, [battle, anim.lastSeenLogLen, me?.id, foe?.id])

  async function send(action: BattleAction) {
    if (!playerId || inputsBlocked) return
    setActionPending(true)
    setErrorMsg(null)
    try {
      await api.sendAction(code, playerId, action)
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

  return (
    <main className={`${styles.shell} ${anim.shake ? 'anim-shake' : ''}`}>
      <header className={styles.topbar}>
        <span className="kicker">Turno {battle.turn}</span>
        <span className={styles.vs}>
          <strong>{me.name}</strong> · vs · <strong>{foe.name}</strong>
        </span>
      </header>

      <section className={styles.field}>
        <Stage id={battle.stageId} />
        {anim.effectivenessFlash && (
          <div className={
            anim.effectivenessFlash === 'super' ? `${styles.flash} ${styles.flashSuper} anim-super-effective` :
            anim.effectivenessFlash === 'low'   ? `${styles.flash} ${styles.flashLow} anim-low-effective` :
                                                  `${styles.flash} ${styles.flashNone} anim-no-effect`
          } />
        )}

        <div className={styles.foeBox}>
          <HpBox pokemon={foeActive} side="foe" />
        </div>
        <PokemonStage
          pokemon={foeActive}
          side="foe"
          animation={anim.foeAnim ?? undefined}
          damageNumber={anim.foeDmg}
        />

        <PokemonStage
          pokemon={myActive}
          side="ally"
          animation={anim.allyAnim ?? undefined}
          damageNumber={anim.allyDmg}
        />
        <div className={styles.allyBox}>
          <HpBox pokemon={myActive} side="ally" />
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.moves}>
          {myActive.moves.map((m) => (
            <MoveButton
              key={m.moveId}
              move={m}
              disabled={inputsBlocked}
              onUse={() => send({ type: 'move', moveId: m.moveId })}
            />
          ))}
        </div>
        <div className={styles.side}>
          <button
            className="btn"
            type="button"
            onClick={() => setShowSwitch(true)}
            disabled={inputsBlocked || me.team.filter((p, i) => i !== me.activeIndex && !p.fainted).length === 0}
          >
            ⇄ Cambiar Pokémon
          </button>
          <p className={styles.turnInfo}>
            {iAlreadyActed
              ? '✓ Acción enviada. Esperando rival…'
              : myActive.fainted
                ? 'Tu Pokémon está debilitado.'
                : 'Tu turno. Elegí movimiento o cambio.'}
          </p>
          {errorMsg && <p className={styles.error}>⚠ {errorMsg}</p>}
        </div>
      </section>

      <BattleLog entries={battle.log} />

      {showSwitch && (
        <SwitchMenu
          player={me}
          disabled={inputsBlocked}
          onSwitch={(idx) => { setShowSwitch(false); send({ type: 'switch', targetIndex: idx }) }}
          onClose={() => setShowSwitch(false)}
        />
      )}

      {battle.status === 'finished' && battle.winnerId && (
        <VictoryScreen
          winnerName={battle.players.find((p) => p.id === battle.winnerId)?.name ?? '???'}
          loserName={battle.players.find((p) => p.id !== battle.winnerId)?.name ?? '???'}
          isMe={battle.winnerId === playerId}
        />
      )}
    </main>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Coreografía de animaciones a partir de los log entries nuevos.
// Procesa los eventos en orden con pequeños sleeps para que las animaciones
// se reproduzcan secuencialmente (no todas al mismo tiempo).
async function runAnimations(
  entries: LogEntry[],
  myId: string | undefined,
  foeId: string | undefined,
  setAnim: React.Dispatch<React.SetStateAction<AnimState>>,
  totalLogLen: number,
): Promise<void> {
  for (const e of entries) {
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
      const targetIsAlly = e.playerId === foeId  // si el atacante es foe, el target es ally
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
      await sleep(400)
    } else {
      await sleep(200)
    }
  }
  setAnim((s) => ({ ...s, lastSeenLogLen: totalLogLen }))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
