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
      <div className={`${styles.panel} panel`} onClick={stopProp}>
        <span className="panel__chip">PP-EVO / {forced ? 'FORCED SWITCH' : 'SWITCH'}</span>
        <header className={styles.head}>
          <h3>{forced ? 'Your Pokémon fainted!' : 'Switch Pokémon'}</h3>
          {!forced && (
            <button className="btn" onClick={onClose} type="button">✕</button>
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
            return (
              <li key={idx}>
                <button
                  type="button"
                  className={`${styles.row} ${isFainted ? styles.fainted : ''} ${isActive ? styles.active : ''}`}
                  onClick={() => can && onSwitch(idx)}
                  disabled={!can}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <img src={pkmn.spriteUrl} alt={pkmn.name} className={styles.sprite} />
                  <span className={styles.info}>
                    <span className={styles.name}>{pkmn.name}</span>
                    <span className={styles.hp}>HP {pkmn.currentHp}/{pkmn.stats.maxHp}</span>
                    {isActive && <span className={styles.tag}>ACTIVE</span>}
                    {isFainted && <span className={styles.tag}>FAINTED</span>}
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
