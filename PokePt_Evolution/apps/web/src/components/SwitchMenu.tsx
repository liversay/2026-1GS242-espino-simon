import type { BattlePlayer } from '@pokept/shared'
import styles from './SwitchMenu.module.css'

interface Props {
  player: BattlePlayer
  onSwitch: (targetIndex: number) => void
  onClose: () => void
  disabled?: boolean
  /** Si true, no se puede cerrar — el jugador DEBE elegir. */
  forced?: boolean
}

export function SwitchMenu({ player, onSwitch, onClose, disabled, forced }: Props) {
  const stopProp = (e: React.MouseEvent) => e.stopPropagation()
  const handleBackdrop = () => { if (!forced) onClose() }

  return (
    <div className={styles.backdrop} onClick={handleBackdrop}>
      <div className={styles.panel} onClick={stopProp}>
        <span className={styles.chip}>{forced ? 'FORCED SWITCH' : 'SWITCH'}</span>
        <header className={styles.head}>
          <h3>{forced ? 'Your Pokémon fainted!' : 'Switch Pokémon'}</h3>
          {!forced && (
            <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">✕</button>
          )}
        </header>
        {forced && (
          <p className={styles.forcedMsg}>
            You must choose the next Pokémon to fight.
          </p>
        )}
        <ul className={styles.list}>
          {player.team.map((pkmn, idx) => {
            const isActive = idx === player.activeIndex
            const isFainted = pkmn.fainted
            const can = !isActive && !isFainted && !disabled
            const hpPct = Math.max(0, Math.min(100, (pkmn.currentHp / pkmn.stats.maxHp) * 100))
            const hpColor = hpPct > 50 ? 'var(--pp-hp-green)' : hpPct > 20 ? 'var(--pp-hp-yellow)' : 'var(--pp-hp-red)'
            return (
              <li key={idx}>
                <button
                  type="button"
                  className={`${styles.row} ${isFainted ? styles.fainted : ''} ${isActive ? styles.active : ''}`}
                  onClick={() => can && onSwitch(idx)}
                  disabled={!can}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span className={styles.ball} aria-hidden="true" data-state={isFainted ? 'fainted' : isActive ? 'active' : 'ok'} />
                  <img src={pkmn.spriteUrl} alt={pkmn.name} className={styles.sprite} />
                  <span className={styles.info}>
                    <span className={styles.nameRow}>
                      <span className={styles.name}>{pkmn.name}</span>
                      <span className={styles.lvl}>Lv.{pkmn.level}</span>
                    </span>
                    <span className={styles.hpRow}>
                      <span className={styles.hpLabel}>HP</span>
                      <span className={styles.hpTrack}>
                        <span className={styles.hpFill} style={{ width: `${hpPct}%`, background: hpColor }} />
                      </span>
                      <span className={styles.hpNum}>{pkmn.currentHp}/{pkmn.stats.maxHp}</span>
                    </span>
                    {isActive && <span className={styles.tag}>ACTIVE</span>}
                    {isFainted && <span className={`${styles.tag} ${styles.tagFainted}`}>FAINTED</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
