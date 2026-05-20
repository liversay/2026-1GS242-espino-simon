// Cliente del API. Todas las llamadas pasan por el proxy `/api` configurado en
// vite.config.ts (en dev) o un base url explícito (prod).

import type {
  Battle,
  BattleAction,
  CoinFace,
  Pokemon,
  Room,
  StageId,
} from '@pokept/shared'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

type TokenProvider = () => Promise<string | null>
let tokenProvider: TokenProvider | null = null

export function setTokenProvider(fn: TokenProvider): void {
  tokenProvider = fn
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await tokenProvider?.()
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers['authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
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
    req<{ code: string; room: Room }>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    }),

  getRoom: (code: string) => req<Room>(`/rooms/${code}`),

  joinRoom: (code: string, playerName: string) =>
    req<{ room: Room }>(`/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    }),

  setTeam: (code: string, slots: { id: number; isShiny: boolean }[]) =>
    req<{ room: Room }>(`/rooms/${code}/team`, {
      method: 'POST',
      body: JSON.stringify({
        pokedexIds: slots.map((s) => s.id),
        shinyIds: slots.filter((s) => s.isShiny).map((s) => s.id),
      }),
    }),

  setStage: (code: string, stageId: StageId) =>
    req<{ room: Room }>(`/rooms/${code}/stage`, {
      method: 'POST',
      body: JSON.stringify({ stageId }),
    }),

  startBattle: (code: string) =>
    req<{ battle: Battle }>(`/rooms/${code}/start`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  getBattle: (code: string) => req<Battle>(`/battles/${code}`),

  coinFlipChoice: (code: string, choice: CoinFace) =>
    req<Battle>(`/battles/${code}/coin-flip-choice`, {
      method: 'POST',
      body: JSON.stringify({ choice }),
    }),

  sendAction: (code: string, action: BattleAction) =>
    req<Battle>(`/battles/${code}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  forfeit: (code: string) =>
    req<Battle>(`/battles/${code}/forfeit`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  acknowledgeFlip: (code: string) =>
    req<Battle>(`/battles/${code}/coinflip-acknowledge`, {
      method: 'POST',
      body: JSON.stringify({}),
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

  getMe: () => req<{ clerkUserId: string; email: string; subscriptionStatus: 'free' | 'premium' }>('/me'),

  createCheckout: () => req<{ url: string }>('/billing/checkout', { method: 'POST', body: '{}' }),
  getBillingPortal: () => req<{ url: string }>('/billing/portal'),
}
