import { Hono } from 'hono'
import { z } from 'zod'
import { customAlphabet } from 'nanoid'
import { getDb } from '../db/mongo'
import { insertRoom, getRoom, updateRoom } from '../db/repo/roomRepo'
import { getPokemonByDexIds } from '../db/repo/pokemonRepo'
import { insertBattle } from '../db/repo/battleRepo'
import { buildInitialBattle } from '../battle/init'
import { ALL_STAGE_IDS, LEGENDARY_IDS, type Room, type RoomPlayer, type StageId } from '@pokept/shared'
import { requireAuth, getUserId } from '../middleware/auth'

const codeNano = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

export const roomRoutes = new Hono()

const nameSchema = z.string().trim().min(1).max(24)
const TEAM_SIZE = 6

// ─── POST /rooms { playerName } ───────────────────────────────────────────
roomRoutes.post('/', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = z.object({ playerName: nameSchema }).safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_name' }, 400)

  const playerId = getUserId(c)
  const db = await getDb()
  const code = codeNano()
  const room: Room = {
    code,
    status: 'waiting',
    hostPlayerId: playerId,
    stageId: 'beach',
    players: [{ id: playerId, name: parsed.data.playerName, ready: false, teamPokemonIds: [] }],
    createdAt: new Date().toISOString(),
  }
  await insertRoom(db, room)
  return c.json({ code, room })
})

// ─── GET /rooms/:code ─────────────────────────────────────────────────────
roomRoutes.get('/:code', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const db = await getDb()
  const room = await getRoom(db, code)
  if (!room) return c.json({ error: 'not_found' }, 404)
  return c.json(room)
})

// ─── POST /rooms/:code/join { playerName } ───────────────────────────────
roomRoutes.post('/:code/join', requireAuth, async (c) => {
  const code = c.req.param('code').toUpperCase()
  const body = await c.req.json().catch(() => ({}))
  const parsed = z.object({ playerName: nameSchema }).safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_name' }, 400)

  const playerId = getUserId(c)
  const db = await getDb()
  const room = await getRoom(db, code)
  if (!room) return c.json({ error: 'not_found' }, 404)
  if (room.status !== 'waiting') return c.json({ error: 'room_already_started' }, 409)
  if (room.players.length >= 2) return c.json({ error: 'room_full' }, 409)
  if (room.players.some((p) => p.id === playerId)) {
    return c.json({ room }) // ya está en la sala, devolvemos el estado actual
  }

  const newPlayer: RoomPlayer = { id: playerId, name: parsed.data.playerName, ready: false, teamPokemonIds: [] }
  const updated = await updateRoom(db, code, { players: [...room.players, newPlayer] })
  return c.json({ room: updated })
})

// ─── POST /rooms/:code/team { pokedexIds } ───────────────────────────────
roomRoutes.post('/:code/team', requireAuth, async (c) => {
  const code = c.req.param('code').toUpperCase()
  const body = await c.req.json().catch(() => ({}))
  const parsed = z.object({
    pokedexIds: z.array(z.number().int().positive()).length(TEAM_SIZE),
  }).safeParse(body)
  if (!parsed.success) return c.json({ error: 'team_must_be_6' }, 400)

  const playerId = getUserId(c)
  const db = await getDb()
  const room = await getRoom(db, code)
  if (!room) return c.json({ error: 'not_found' }, 404)
  if (room.status !== 'waiting') return c.json({ error: 'room_already_started' }, 409)

  const player = room.players.find((p) => p.id === playerId)
  if (!player) return c.json({ error: 'player_not_in_room' }, 403)

  const unique = [...new Set(parsed.data.pokedexIds)]
  if (unique.length !== parsed.data.pokedexIds.length) {
    return c.json({ error: 'duplicate_pokemon' }, 400)
  }
  const legendaryCount = unique.filter((id) => LEGENDARY_IDS.includes(id)).length
  if (legendaryCount > 1) return c.json({ error: 'too_many_legendaries' }, 400)

  const found = await getPokemonByDexIds(db, unique)
  if (found.length !== unique.length) return c.json({ error: 'unknown_pokemon' }, 400)

  const newPlayers = room.players.map((p) =>
    p.id === playerId ? { ...p, teamPokemonIds: unique, ready: true } : p,
  )
  const updated = await updateRoom(db, code, { players: newPlayers })
  return c.json({ room: updated })
})

// ─── POST /rooms/:code/stage { stageId } ─────────────────────────────────
roomRoutes.post('/:code/stage', requireAuth, async (c) => {
  const code = c.req.param('code').toUpperCase()
  const body = await c.req.json().catch(() => ({}))
  const parsed = z.object({
    stageId: z.enum(ALL_STAGE_IDS as [StageId, ...StageId[]]),
  }).safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_payload' }, 400)

  const playerId = getUserId(c)
  const db = await getDb()
  const room = await getRoom(db, code)
  if (!room) return c.json({ error: 'not_found' }, 404)
  if (room.status !== 'waiting') return c.json({ error: 'room_already_started' }, 409)
  if (room.hostPlayerId !== playerId) return c.json({ error: 'only_host_can_pick_stage' }, 403)

  const updated = await updateRoom(db, code, { stageId: parsed.data.stageId })
  return c.json({ room: updated })
})

// ─── POST /rooms/:code/start ──────────────────────────────────────────────
roomRoutes.post('/:code/start', requireAuth, async (c) => {
  const code = c.req.param('code').toUpperCase()

  const playerId = getUserId(c)
  const db = await getDb()
  const room = await getRoom(db, code)
  if (!room) return c.json({ error: 'not_found' }, 404)
  if (room.status !== 'waiting') return c.json({ error: 'already_started' }, 409)
  if (room.hostPlayerId !== playerId) return c.json({ error: 'only_host_can_start' }, 403)
  if (room.players.length !== 2) return c.json({ error: 'need_two_players' }, 409)
  if (!room.players.every((p) => p.ready && p.teamPokemonIds.length === TEAM_SIZE)) {
    return c.json({ error: 'players_not_ready' }, 409)
  }

  const battle = await buildInitialBattle(db, room)
  await insertBattle(db, battle)
  await updateRoom(db, code, { status: 'playing' })
  return c.json({ battle })
})
