import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { getDb } from './db/mongo'
import { catalogRoutes } from './routes/catalog'
import { roomRoutes } from './routes/rooms'
import { battleRoutes } from './routes/battles'
import { userRoutes } from './routes/users'
import { billingRoutes } from './routes/billing'

const PORT = Number(process.env.PORT ?? 3001)

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: '*' }))

app.get('/health', (c) => c.json({ ok: true, service: 'pokept-api' }))

app.route('/pokemon', catalogRoutes)
app.route('/rooms', roomRoutes)
app.route('/battles', battleRoutes)
app.route('/me', userRoutes)
app.route('/billing', billingRoutes)

app.onError((err, c) => {
  console.error('[api] error:', err)
  const status = (err as { status?: number }).status
  return c.json({ error: err.message || 'internal_error' }, (status as 400 | 401 | 403 | 404 | 409 | 500) ?? 500)
})

await getDb()
console.log(`[api] mongo connected; listening on :${PORT}`)

export default {
  port: PORT,
  fetch: app.fetch,
}
