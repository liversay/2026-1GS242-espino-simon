import { Hono } from 'hono'
// stub: la implementación completa llega con el motor de batalla
export const battleRoutes = new Hono()
battleRoutes.get('/', (c) => c.json({ stub: 'battles' }))
