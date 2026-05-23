import styles from './TypeChart.module.css'
import type { PokeType } from '@pokept/shared'

const TYPES: PokeType[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

const ABBR: Record<PokeType, string> = {
  normal: 'NRM', fire: 'FIR', water: 'WTR', electric: 'ELC',
  grass: 'GRS', ice: 'ICE', fighting: 'FGT', poison: 'PSN',
  ground: 'GND', flying: 'FLY', psychic: 'PSY', bug: 'BUG',
  rock: 'ROK', ghost: 'GHT', dragon: 'DRG', dark: 'DRK',
  steel: 'STL', fairy: 'FAI',
}

// [superEffective, notVeryEffective, immune]
const CHART: Record<PokeType, [PokeType[], PokeType[], PokeType[]]> = {
  normal:   [[], ['rock', 'steel'], ['ghost']],
  fire:     [['grass', 'ice', 'bug', 'steel'], ['fire', 'water', 'rock', 'dragon'], []],
  water:    [['fire', 'ground', 'rock'], ['water', 'grass', 'dragon'], []],
  electric: [['water', 'flying'], ['electric', 'grass', 'dragon'], ['ground']],
  grass:    [['water', 'ground', 'rock'], ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], []],
  ice:      [['grass', 'ground', 'flying', 'dragon'], ['water', 'ice', 'steel'], []],
  fighting: [['normal', 'ice', 'rock', 'dark', 'steel'], ['poison', 'flying', 'psychic', 'bug', 'fairy'], ['ghost']],
  poison:   [['grass', 'fairy'], ['poison', 'ground', 'rock', 'ghost'], ['steel']],
  ground:   [['fire', 'electric', 'poison', 'rock', 'steel'], ['grass', 'bug'], ['flying']],
  flying:   [['grass', 'fighting', 'bug'], ['electric', 'rock', 'steel'], []],
  psychic:  [['fighting', 'poison'], ['psychic', 'steel'], ['dark']],
  bug:      [['grass', 'psychic', 'dark'], ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'], []],
  rock:     [['fire', 'ice', 'flying', 'bug'], ['fighting', 'ground', 'steel'], []],
  ghost:    [['psychic', 'ghost'], ['dark'], ['normal']],
  dragon:   [['dragon'], ['steel'], ['fairy']],
  dark:     [['psychic', 'ghost'], ['fighting', 'dark', 'fairy'], []],
  steel:    [['ice', 'rock', 'fairy'], ['fire', 'water', 'electric', 'steel'], []],
  fairy:    [['fighting', 'dragon', 'dark'], ['fire', 'poison', 'steel'], []],
}

function getEff(atk: PokeType, def: PokeType): '2' | '0.5' | '0' | '1' {
  const [supers, notVery, immune] = CHART[atk]
  if (immune.includes(def)) return '0'
  if (supers.includes(def)) return '2'
  if (notVery.includes(def)) return '0.5'
  return '1'
}

interface Props {
  onClose: () => void
}

export function TypeChart({ onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.title}>TYPE CHART</span>
            <span className={styles.sub}>Attacking type (row) vs Defending type (column)</span>
          </div>
          <button className="btn" onClick={onClose} type="button">✕</button>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.cornerCell}>ATK ↓ DEF →</th>
                {TYPES.map((t) => (
                  <th key={t} className={`${styles.typeHeader} ${styles[t]}`}>
                    {ABBR[t]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPES.map((atk) => (
                <tr key={atk}>
                  <td className={`${styles.typeHeader} ${styles[atk]}`}>{ABBR[atk]}</td>
                  {TYPES.map((def) => {
                    const eff = getEff(atk, def)
                    return (
                      <td
                        key={def}
                        className={`${styles.cell} ${eff === '2' ? styles.super : eff === '0.5' ? styles.notVery : eff === '0' ? styles.immune : styles.normal}`}
                      >
                        {eff === '2' ? '2' : eff === '0.5' ? '½' : eff === '0' ? '✕' : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.legend}>
          <span className={`${styles.legendItem} ${styles.super}`}>2× Super effective</span>
          <span className={`${styles.legendItem} ${styles.notVery}`}>½× Not very effective</span>
          <span className={`${styles.legendItem} ${styles.immune}`}>✕ No effect</span>
        </div>
      </div>
    </div>
  )
}
