import s from './stages.module.css'

export function LagoVeraz() {
  return (
    <div className={`${s.stage} ${s.lago}`} aria-hidden>
      <div className={s.lagoMist} />
    </div>
  )
}
