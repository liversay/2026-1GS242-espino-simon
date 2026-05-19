import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createBunWebSocket } from 'hono/bun'
import { getDb } from './db/mongo'
import { catalogRoutes } from './routes/catalog'
import { roomRoutes } from './routes/rooms'
import { battleRoutes } from './routes/battles'
import { wsSubscribe, wsUnsubscribe } from './ws'

const PORT = Number(process.env.PORT ?? 3001)

const { upgradeWebSocket, injectWebSocket } = createBunWebSocket()

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: '*' }))

app.get('/health', (c) => c.json({ ok: true, service: 'pokept-api' }))

// ─── WebSocket upgrade: /ws/:code ─────────────────────────────────────────
// Clients (lobby + battle) connect here to receive live pushes whenever
// room or battle state changes. The code identifies the channel.
app.get(
  '/ws/:code',
  upgradeWebSocket((c) => {
    const code = c.req.param('code').toUpperCase()
    return {
      onOpen(_, ws) { wsSubscribe(code, ws) },
      onClose(_, ws) { wsUnsubscribe(code, ws) },
      onError(_, ws) { wsUnsubscribe(code, ws) },
    }
  }),
)

app.route('/pokemon', catalogRoutes)
app.route('/rooms', roomRoutes)
app.route('/battles', battleRoutes)

app.onError((err, c) => {
  console.error('[api] error:', err)
  const status = (err as { status?: number }).status
  return c.json({ error: err.message || 'internal_error' }, (status as 400 | 401 | 403 | 404 | 409 | 500) ?? 500)
})

await getDb()
console.log(`[api] mongo connected; listening on :${PORT}`)

// Bun.serve is required for WebSocket support (injectWebSocket hooks into it).
const server = Bun.serve({ port: PORT, fetch: app.fetch })
injectWebSocket(server)
