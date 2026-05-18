import type { BattlePlayer } from '@pokept/shared'
import styles from './SwitchMenu.module.css'

interface Props {
  player: BattlePlayer
  onSwitch: (targetIndex: number) => void
  onClose: () => void
  disabled?: boolean
}

export function SwitchMenu({ player, onSwitch, onClose, disabled }: Props) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={`${styles.panel} panel`} onClick={(e) => e.stopPropagation()}>
        <span className="panel__chip">PP-EVO / SWITCH</span>
        <header className={styles.head}>
          <h3>Cambiar Pokémon</h3>
          <button className="btn" onClick={onClose} type="button">✕</button>
        </header>
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
                    {isActive && <span className={styles.tag}>ACTIVO</span>}
                    {isFainted && <span className={styles.tag}>DEBILITADO</span>}
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
