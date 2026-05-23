import { Hono } from 'hono'
import { createClerkClient } from '@clerk/backend'
import { getDb } from '../db/mongo'
import { findUser, upsertUser } from '../db/repo/userRepo'
import { requireAuth, getUserId } from '../middleware/auth'

export const userRoutes = new Hono()

userRoutes.use('*', requireAuth)

// ─── GET /me ──────────────────────────────────────────────────────────────
userRoutes.get('/', async (c) => {
  const clerkUserId = getUserId(c)
  const db = await getDb()

  let user = await findUser(db, clerkUserId)
  if (!user) {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })
    const clerkUser = await clerk.users.getUser(clerkUserId)
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
    user = await upsertUser(db, {
      clerkUserId,
      email,
      subscriptionStatus: 'free',
      stripeCustomerId: null,
      createdAt: new Date().toISOString(),
    })
  }

  return c.json(user)
})
