import type { Db } from 'mongodb'

export type SubscriptionStatus = 'free' | 'premium'

export interface User {
  clerkUserId: string
  email: string
  subscriptionStatus: SubscriptionStatus
  stripeCustomerId: string | null
  createdAt: string
}

export async function findUser(db: Db, clerkUserId: string): Promise<User | null> {
  return db.collection<User>('users').findOne({ clerkUserId }, { projection: { _id: 0 } })
}

export async function upsertUser(db: Db, user: User): Promise<User> {
  await db.collection<User>('users').updateOne(
    { clerkUserId: user.clerkUserId },
    { $setOnInsert: user },
    { upsert: true },
  )
  return (await findUser(db, user.clerkUserId))!
}
