import s from './stages.module.css'

export function PraderaSinnoh() {
  return (
    <div className={`${s.stage} ${s.pradera}`} aria-hidden>
      <div className={s.cloudWrap}>
        <div className={s.cloud} />
        <div className={s.cloud} />
        <div className={s.cloud} />
        <div className={s.cloud} />
      </div>
      <div className={s.mountain} />
    </div>
  )
}
