import { Hono } from 'hono'
// stub: la implementación completa llega en la fase de salas
export const roomRoutes = new Hono()
roomRoutes.get('/', (c) => c.json({ stub: 'rooms' }))
