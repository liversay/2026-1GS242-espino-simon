import { useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import styles from './MusicManager.module.css'

type Track = 'menu' | 'battle'

// Module-level singletons — survive StrictMode double-mount and remounts
const audioEl: Partial<Record<Track, HTMLAudioElement>> = {}

function getAudio(track: Track): HTMLAudioElement {
  if (!audioEl[track]) {
    const src = track === 'battle' ? '/sounds/pokemon-battle.mp3' : '/sounds/alder-encounter.mp3'
    const a = new Audio(src)
    a.loop = true
    a.volume = 0.45
    audioEl[track] = a
  }
  return audioEl[track]!
}

const FADE_MS = 500
const FADE_STEPS = 25

function fadeOut(track: Track, onDone?: () => void) {
  const a = audioEl[track]
  if (!a || a.paused) { onDone?.(); return }
  const startVol = a.volume
  const step = startVol / FADE_STEPS
  const iv = setInterval(() => {
    if (a.volume > step) {
      a.volume = Math.max(0, a.volume - step)
    } else {
      a.volume = 0
      a.pause()
      clearInterval(iv)
      onDone?.()
    }
  }, FADE_MS / FADE_STEPS)
}

function fadeIn(track: Track, muted: boolean) {
  if (muted) return
  const a = getAudio(track)
  a.volume = 0
  const tryPlay = () => {
    a.play().then(() => {
      const target = 0.45
      const step = target / FADE_STEPS
      const iv = setInterval(() => {
        if (a.volume < target - step) {
          a.volume = Math.min(target, a.volume + step)
        } else {
          a.volume = target
          clearInterval(iv)
        }
      }, FADE_MS / FADE_STEPS)
    }).catch(() => {
      // Autoplay blocked — retry on first user gesture
      document.addEventListener('click', () => fadeIn(track, muted), { once: true, capture: true })
    })
  }
  tryPlay()
}

function resolveTrack(pathname: string): Track {
  return pathname.startsWith('/battle/') ? 'battle' : 'menu'
}

export function MusicManager() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [muted, setMuted] = useState<boolean>(() => {
    try { return localStorage.getItem('music-muted') === 'true' } catch { return false }
  })
  const currentTrack = useRef<Track | null>(null)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  useEffect(() => {
    const next = resolveTrack(pathname)

    if (muted) {
      // If muted, just pause everything
      ;(['menu', 'battle'] as Track[]).forEach((t) => {
        const a = audioEl[t]
        if (a && !a.paused) { a.volume = 0; a.pause() }
      })
      currentTrack.current = next
      return
    }

    if (currentTrack.current === next) return // same track, do nothing

    const prev = currentTrack.current
    currentTrack.current = next

    if (prev) {
      fadeOut(prev, () => fadeIn(next, mutedRef.current))
    } else {
      fadeIn(next, mutedRef.current)
    }
  }, [pathname, muted])

  // Pause all on unmount (shouldn't happen normally, but for safety)
  useEffect(() => {
    return () => {
      ;(['menu', 'battle'] as Track[]).forEach((t) => {
        const a = audioEl[t]
        if (a && !a.paused) a.pause()
      })
    }
  }, [])

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev
      try { localStorage.setItem('music-muted', String(next)) } catch {}
      if (next) {
        // Mute: fade out current
        const t = currentTrack.current
        if (t) fadeOut(t)
      } else {
        // Unmute: fade in current
        const t = resolveTrack(pathname)
        fadeIn(t, false)
      }
      return next
    })
  }

  return (
    <button
      className={`${styles.muteBtn} ${muted ? styles.muted : ''}`}
      type="button"
      onClick={toggleMute}
      aria-label={muted ? 'Unmute music' : 'Mute music'}
      aria-pressed={muted}
      title={muted ? 'Unmute music' : 'Mute music'}
    >
      <span className={styles.icon} aria-hidden="true" />
    </button>
  )
}
