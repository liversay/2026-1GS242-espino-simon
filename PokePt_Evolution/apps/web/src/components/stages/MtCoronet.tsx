import s from './stages.module.css'

const STALACTITES = [10, 24, 42, 60, 78, 92]
const CRYSTALS = [
  { left: 15, bottom: 8 },
  { left: 35, bottom: 14 },
  { left: 58, bottom: 6 },
  { left: 80, bottom: 12 },
]
const DUST = [
  { left: 20, bottom: 10, delay: 0 },
  { left: 50, bottom: 20, delay: 2 },
  { left: 70, bottom: 14, delay: 4 },
  { left: 88, bottom: 24, delay: 1.5 },
]

export function MtCoronet() {
  return (
    <div className={`${s.stage} ${s.coronet}`} aria-hidden>
      {STALACTITES.map((left, i) => (
        <div key={i} className={s.stalactite} style={{ left: `${left}%` }} />
      ))}
      {CRYSTALS.map((c, i) => (
        <div
          key={i}
          className={s.crystal}
          style={{ left: `${c.left}%`, bottom: `${c.bottom}%`, animationDelay: `${i * 0.4}s` }}
        />
      ))}
      {DUST.map((d, i) => (
        <div
          key={i}
          className={s.dust}
          style={{ left: `${d.left}%`, bottom: `${d.bottom}%`, animationDelay: `${d.delay}s` }}
        />
      ))}
    </div>
  )
}
