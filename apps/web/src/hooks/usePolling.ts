import { useEffect, useRef, useState } from 'react'

// Hook genérico de polling. Pausa cuando la pestaña está oculta y descarta
// respuestas obsoletas mediante una secuencia incremental.
export function usePolling<T>(
  fn: () => Promise<T>,
  intervalMs: number,
  deps: ReadonlyArray<unknown> = [],
): { data: T | null; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const seqRef = useRef(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (document.hidden) {
        timer = setTimeout(tick, intervalMs)
        return
      }
      const mySeq = ++seqRef.current
      try {
        const result = await fnRef.current()
        if (!cancelled && mySeq === seqRef.current) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err as Error)
      } finally {
        if (!cancelled) timer = setTimeout(tick, intervalMs)
      }
    }
    tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const refetch = () => {
    seqRef.current++
    fnRef.current().then((d) => setData(d)).catch((e) => setError(e as Error))
  }
  return { data, error, refetch }
}
