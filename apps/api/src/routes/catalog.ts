import { Hono } from 'hono'
import { getDb } from '../db/mongo'
import { getPokemonByDexId, listPokemon } from '../db/repo/pokemonRepo'

export const catalogRoutes = new Hono()

catalogRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const pageSize = Math.min(48, Math.max(1, Number(c.req.query('pageSize') ?? 24)))
  const search = c.req.query('search')?.trim() || undefined
  const db = await getDb()
  const { items, total } = await listPokemon(db, {
    skip: (page - 1) * pageSize,
    limit: pageSize,
    search,
  })
  return c.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
})

catalogRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400)
  const db = await getDb()
  const p = await getPokemonByDexId(db, id)
  if (!p) return c.json({ error: 'not_found' }, 404)
  return c.json(p)
})
