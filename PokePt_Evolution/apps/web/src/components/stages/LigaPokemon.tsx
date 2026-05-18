import s from './stages.module.css'

export function LigaPokemon() {
  return (
    <div className={`${s.stage} ${s.liga}`} aria-hidden>
      <div className={s.spotlight} />
      <div className={s.crowd} />
      <div className={s.ligaFloor} />
    </div>
  )
}
