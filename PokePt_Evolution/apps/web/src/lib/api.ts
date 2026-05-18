// Cliente del API. Todas las llamadas pasan por el proxy `/api` configurado en
// vite.config.ts (en dev) o un base url explícito (prod).

import type {
  Battle,
  BattleAction,
  Pokemon,
  Room,
  StageId,
} from '@pokept/shared'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(body.error ?? 'request_failed', res.status)
  }
  return (await res.json()) as T
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const api = {
  createRoom: (playerName: string) =>
    req<{ code: string; playerId: string; room: Room }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    }),

  getRoom: (code: string) => req<Room>(`/rooms/${code}`),

  joinRoom: (code: string, playerName: string) =>
    req<{ playerId: string; room: Room }>(`/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    }),

  setTeam: (code: string, playerId: string, pokedexIds: number[]) =>
    req<{ room: Room }>(`/rooms/${code}/team`, {
      method: 'POST',
      body: JSON.stringify({ playerId, pokedexIds }),
    }),

  setStage: (code: string, playerId: string, stageId: StageId) =>
    req<{ room: Room }>(`/rooms/${code}/stage`, {
      method: 'POST',
      body: JSON.stringify({ playerId, stageId }),
    }),

  startBattle: (code: string, playerId: string) =>
    req<{ battle: Battle }>(`/rooms/${code}/start`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  getBattle: (code: string) => req<Battle>(`/battles/${code}`),

  sendAction: (code: string, playerId: string, action: BattleAction) =>
    req<Battle>(`/battles/${code}/action`, {
      method: 'POST',
      body: JSON.stringify({ playerId, action }),
    }),

  listPokemon: (params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.pageSize) q.set('pageSize', String(params.pageSize))
    if (params.search) q.set('search', params.search)
    return req<{ items: Pokemon[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/pokemon?${q.toString()}`,
    )
  },
}
