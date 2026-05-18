import { Hono } from 'hono'
import { z } from 'zod'
import { getDb } from '../db/mongo'
import { getBattle, replaceBattle } from '../db/repo/battleRepo'
import { resolveTurn } from '../battle/engine'
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

const actionSchema = z.object({
  playerId: z.string().min(1),
  action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('move'), moveId: z.number().int().positive() }),
    z.object({ type: z.literal('switch'), targetIndex: z.number().int().min(0).max(5) }),
  ]),
})

// ─── POST /battles/:code/action ──────────────────────────────────────────
battleRoutes.post('/:code/action', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const body = await c.req.json().catch(() => ({}))
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_payload' }, 400)
  const { playerId, action } = parsed.data

  const db = await getDb()
  const battle = await getBattle(db, code)
  if (!battle) return c.json({ error: 'not_found' }, 404)
  if (battle.status === 'finished') return c.json({ error: 'battle_finished' }, 409)
  const player = battle.players.find((p) => p.id === playerId)
  if (!player) return c.json({ error: 'player_not_in_battle' }, 403)
  if (battle.pendingActions[playerId]) {
    return c.json({ error: 'already_submitted_this_turn' }, 409)
  }

  // Validar move pertenece y Pokémon activo no debilitado
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

  battle.pendingActions[playerId] = action as BattleAction
  battle.awaitingPlayers = battle.players.map((p) => p.id).filter((id) => !battle.pendingActions[id])

  // Si ambos enviaron, resolver el turno.
  if (battle.awaitingPlayers.length === 0) {
    const [pa, pb] = battle.players
    const aAction = battle.pendingActions[pa!.id]!
    const bAction = battle.pendingActions[pb!.id]!
    await resolveTurn(db, battle, pa!.id, aAction, pb!.id, bAction)
  }

  await replaceBattle(db, battle)
  return c.json(battle)
})
