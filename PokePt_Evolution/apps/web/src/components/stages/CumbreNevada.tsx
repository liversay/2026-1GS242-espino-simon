import s from './stages.module.css'

const SNOW = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.31) % 5,
  duration: 4 + ((i * 0.7) % 4),
  drift: -20 + ((i * 13) % 40),
}))

export function CumbreNevada() {
  return (
    <div className={`${s.stage} ${s.nevada}`} aria-hidden>
      <div className={s.aurora} />
      {SNOW.map((f, i) => (
        <div
          key={i}
          className={s.snow}
          style={{
            left: `${f.left}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            ['--drift' as string]: `${f.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
