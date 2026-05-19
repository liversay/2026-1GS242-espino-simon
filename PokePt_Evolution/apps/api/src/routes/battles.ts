import { Hono } from 'hono'
import { z } from 'zod'
import { getDb } from '../db/mongo'
import { getBattle, replaceBattle } from '../db/repo/battleRepo'
import { applyCoinFlipChoice, applyTurn } from '../battle/engine'
import { broadcast } from '../ws'
import type { BattleAction } from '@pokept/shared'



export const battleRoutes = new Hono()

// ─── GET /battles/:code ───────────────────────────────────────────────────
battleRoutes.get('/:code', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const db = await getDb()
  const battle = await getBattle(db, code)
  if (!battle) return c.json({ error: 'not_found' }, 404)
  return c.json(battle)
})

// ─── POST /battles/:code/coin-flip-choice { playerId, choice } ───────────
const coinFlipSchema = z.object({
  playerId: z.string().min(1),
  choice: z.enum(['heads', 'tails']),
})

battleRoutes.post('/:code/coin-flip-choice', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const body = await c.req.json().catch(() => ({}))
  const parsed = coinFlipSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_payload' }, 400)
  const { playerId, choice } = parsed.data

  const db = await getDb()
  const battle = await getBattle(db, code)
  if (!battle) return c.json({ error: 'not_found' }, 404)
  if (battle.status !== 'coin-flip') return c.json({ error: 'coin_flip_already_done' }, 409)
  if (battle.coinFlip.guestChoice !== null) return c.json({ error: 'choice_already_made' }, 409)
  if (playerId === battle.hostPlayerId) return c.json({ error: 'only_guest_chooses' }, 403)
  const player = battle.players.find((p) => p.id === playerId)
  if (!player) return c.json({ error: 'player_not_in_battle' }, 403)

  applyCoinFlipChoice(battle, choice)
  await replaceBattle(db, battle)
  broadcast(code, 'battle', battle)
  return c.json(battle)
})

// ─── POST /battles/:code/coinflip-acknowledge { playerId } ──────────────
const acknowledgeSchema = z.object({ playerId: z.string().min(1) })

battleRoutes.post('/:code/coinflip-acknowledge', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const body = await c.req.json().catch(() => ({}))
  const parsed = acknowledgeSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_payload' }, 400)
  const { playerId } = parsed.data

  const db = await getDb()
  const battle = await getBattle(db, code)
  if (!battle) return c.json({ error: 'not_found' }, 404)
  if (battle.coinFlip.acknowledgedAt) return c.json(battle) // already acknowledged
  if (playerId === battle.hostPlayerId) return c.json({ error: 'only_guest_acknowledges' }, 403)
  const player = battle.players.find((p) => p.id === playerId)
  if (!player) return c.json({ error: 'player_not_in_battle' }, 403)

  battle.coinFlip.acknowledgedAt = new Date().toISOString()
  await replaceBattle(db, battle)
  broadcast(code, 'battle', battle)
  return c.json(battle)
})

// ─── POST /battles/:code/action { playerId, action } ────────────────────
const actionSchema = z.object({
  playerId: z.string().min(1),
  action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('move'), moveId: z.number().int().positive() }),
    z.object({ type: z.literal('switch'), targetIndex: z.number().int().min(0).max(5) }),
  ]),
})

battleRoutes.post('/:code/action', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const body = await c.req.json().catch(() => ({}))
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_payload' }, 400)
  const { playerId, action } = parsed.data

  const db = await getDb()
  const battle = await getBattle(db, code)
  if (!battle) return c.json({ error: 'not_found' }, 404)
  if (battle.status !== 'in-progress') return c.json({ error: 'battle_not_in_progress' }, 409)

  // Si hay un switch forzado pendiente, solo ese jugador puede actuar y solo
  // con una acción de tipo 'switch'.
  if (battle.mustSwitchPlayerId) {
    if (battle.mustSwitchPlayerId !== playerId) {
      return c.json({ error: 'waiting_for_forced_switch' }, 409)
    }
    if (action.type !== 'switch') {
      return c.json({ error: 'must_switch_first' }, 400)
    }
  } else if (battle.currentTurnPlayerId !== playerId) {
    return c.json({ error: 'not_your_turn' }, 409)
  }

  const player = battle.players.find((p) => p.id === playerId)
  if (!player) return c.json({ error: 'player_not_in_battle' }, 403)

  const active = player.team[player.activeIndex]!
  if (active.fainted && action.type === 'move') {
    return c.json({ error: 'active_pokemon_fainted' }, 400)
  }
  if (action.type === 'move') {
    if (!active.moves.some((m) => m.moveId === action.moveId)) {
      return c.json({ error: 'move_not_in_pokemon' }, 400)
    }
  } else {
    const target = player.team[action.targetIndex]
    if (!target) return c.json({ error: 'invalid_switch_target' }, 400)
    if (target.fainted) return c.json({ error: 'cannot_switch_to_fainted' }, 400)
    if (action.targetIndex === player.activeIndex) {
      return c.json({ error: 'already_active' }, 400)
    }
  }

  await applyTurn(db, battle, playerId, action as BattleAction)
  await replaceBattle(db, battle)
  broadcast(code, 'battle', battle)
  return c.json(battle)
})

// ─── POST /battles/:code/forfeit { playerId } ────────────────────────────
const forfeitSchema = z.object({ playerId: z.string().min(1) })

battleRoutes.post('/:code/forfeit', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const body = await c.req.json().catch(() => ({}))
  const parsed = forfeitSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_payload' }, 400)
  const { playerId } = parsed.data

  const db = await getDb()
  const battle = await getBattle(db, code)
  if (!battle) return c.json({ error: 'not_found' }, 404)
  if (battle.status !== 'in-progress') return c.json({ error: 'battle_not_in_progress' }, 409)

  const loser = battle.players.find((p) => p.id === playerId)
  if (!loser) return c.json({ error: 'player_not_in_battle' }, 403)

  const winner = battle.players.find((p) => p.id !== playerId)!
  battle.status = 'finished'
  battle.winnerId = winner.id
  battle.log.push({ kind: 'victory', winnerId: winner.id, winnerName: winner.name })

  await replaceBattle(db, battle)
  broadcast(code, 'battle', battle)
  return c.json(battle)
})
