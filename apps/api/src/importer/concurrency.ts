// Limita concurrencia y agrega retry exponencial para llamadas a PokéAPI.

export async function mapWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, idx: number) => Promise<R>,
  concurrency = 10,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  async function runOne(): Promise<void> {
    while (true) {
      const idx = cursor++
      if (idx >= items.length) return
      results[idx] = await worker(items[idx]!, idx)
    }
  }
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runOne())
  await Promise.all(runners)
  return results
}

export async function fetchJsonRetry<T = unknown>(url: string, opts: { tries?: number } = {}): Promise<T> {
  const tries = opts.tries ?? 4
  let lastErr: unknown = null
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) {
        if (res.status === 404) throw new Error(`404 ${url}`)
        throw new Error(`${res.status} ${url}`)
      }
      return (await res.json()) as T
    } catch (err) {
      lastErr = err
      const backoff = 250 * Math.pow(2, attempt) + Math.random() * 150
      await new Promise((r) => setTimeout(r, backoff))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}
