import type { Context, Next } from 'hono'
import { verifyToken } from '@clerk/backend'

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return c.json({ error: 'unauthorized' }, 401)

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    })
    c.set('userId' as never, payload.sub)
    await next()
  } catch {
    return c.json({ error: 'invalid_token' }, 401)
  }
}

export function getUserId(c: Context): string {
  return c.get('userId' as never) as string
}
