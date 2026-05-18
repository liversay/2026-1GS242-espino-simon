import type { BattlePokemon } from '@pokept/shared'
import styles from './PokemonStage.module.css'

interface Props {
  pokemon: BattlePokemon
  side: 'ally' | 'foe'
  animation?: string  // class name de animations.css (anim-attack-ally, anim-hit-shake, etc.)
  damageNumber?: { value: number; isCrit: boolean; effectiveness: 'super' | 'normal' | 'low' | 'none' } | null
}

export function PokemonStage({ pokemon, side, animation, damageNumber }: Props) {
  const isFaint = pokemon.fainted
  const spriteClass = [
    styles.sprite,
    !isFaint && !animation ? 'anim-idle' : '',
    animation ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div className={`${styles.stage} ${styles[side]}`}>
      <div className={styles.platform} />
      <div className={styles.spriteWrap}>
        {pokemon.spriteUrl ? (
          <img
            src={pokemon.spriteUrl}
            alt={pokemon.name}
            className={spriteClass}
            style={isFaint ? { filter: 'grayscale(1) brightness(0.5)', opacity: 0.35 } : undefined}
          />
        ) : (
          <div className={styles.fallback}>{pokemon.name}</div>
        )}
        {damageNumber && (
          <div className={damageNumber.isCrit ? 'anim-damage-popup-crit' : 'anim-damage-popup'}>
            <span
              className={styles.dmg}
              style={{
                color: damageNumber.isCrit ? 'var(--pp-crit)' : damageNumber.effectiveness === 'low' ? '#cccccc' : 'var(--pp-hp-red)',
              }}
            >
              -{damageNumber.value}
              {damageNumber.isCrit && <span className={styles.critTag}>CRIT!</span>}
            </span>
          </div>
        )}
        {pokemon.status?.kind === 'burn' && !isFaint && (
          <div className={`${styles.statusOverlay} ${styles.burn} anim-burn`} />
        )}
        {pokemon.status?.kind === 'poison' && !isFaint && (
          <div className={`${styles.poisonBubble} anim-poison`} />
        )}
        {pokemon.status?.kind === 'paralysis' && !isFaint && (
          <div className={`${styles.paralysis} anim-paralysis`} />
        )}
      </div>
    </div>
  )
}
