import type { WSContext } from 'hono/ws'

// In-memory channel registry: roomCode → set of connected sockets.
const channels = new Map<string, Set<WSContext>>()

export function wsSubscribe(code: string, ws: WSContext) {
  if (!channels.has(code)) channels.set(code, new Set())
  channels.get(code)!.add(ws)
}

export function wsUnsubscribe(code: string, ws: WSContext) {
  const ch = channels.get(code)
  if (!ch) return
  ch.delete(ws)
  if (ch.size === 0) channels.delete(code)
}

// Sends { type, data } to every socket watching `code`. Silently drops dead sockets.
export function broadcast(code: string, type: 'battle' | 'room', data: unknown) {
  const ch = channels.get(code)
  if (!ch || ch.size === 0) return
  const msg = JSON.stringify({ type, data })
  for (const ws of ch) {
    try {
      ws.send(msg)
    } catch {
      ch.delete(ws)
    }
  }
}
