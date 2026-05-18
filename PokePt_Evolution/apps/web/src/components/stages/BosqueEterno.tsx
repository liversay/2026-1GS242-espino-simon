import s from './stages.module.css'

const SUNBEAMS = [
  { left: 15, height: 70, delay: 0 },
  { left: 55, height: 80, delay: 1 },
  { left: 80, height: 60, delay: 0.5 },
]
const LEAVES = [
  { left: 20, delay: 0 },
  { left: 35, delay: 1.4 },
  { left: 50, delay: 2.8 },
  { left: 65, delay: 0.7 },
  { left: 80, delay: 2 },
  { left: 90, delay: 3.5 },
]

export function BosqueEterno() {
  return (
    <div className={`${s.stage} ${s.bosque}`} aria-hidden>
      <div className={s.bosqueCanopy} />
      {SUNBEAMS.map((b, i) => (
        <div
          key={i}
          className={s.sunbeam}
          style={{ left: `${b.left}%`, height: `${b.height}%`, opacity: 0.7 - i * 0.15 }}
        />
      ))}
      {LEAVES.map((l, i) => (
        <div
          key={i}
          className={s.leaf}
          style={{ left: `${l.left}%`, animationDelay: `${l.delay}s` }}
        />
      ))}
    </div>
  )
}
