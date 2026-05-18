// playerId persistido por sala en localStorage.

const KEY = 'pp-player'

interface Stored {
  code: string
  playerId: string
  name: string
}

export function savePlayer(code: string, playerId: string, name: string): void {
  const all = readAll()
  all[code] = { code, playerId, name }
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function getPlayer(code: string): Stored | null {
  return readAll()[code] ?? null
}

export function getLastName(): string {
  const all = readAll()
  const entries = Object.values(all)
  return entries[entries.length - 1]?.name ?? ''
}

function readAll(): Record<string, Stored> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, Stored>
  } catch {
    return {}
  }
}
