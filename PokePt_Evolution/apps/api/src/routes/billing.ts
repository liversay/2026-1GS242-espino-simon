import { Hono } from 'hono'
import Stripe from 'stripe'
import { getDb } from '../db/mongo'
import { findUser, upsertUser } from '../db/repo/userRepo'
import { requireAuth, getUserId } from '../middleware/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const PRICE_ID = process.env.STRIPE_PRICE_ID!
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!
const SUCCESS_URL = process.env.FRONTEND_URL
  ? `${process.env.FRONTEND_URL}/billing/success`
  : 'http://localhost:3000/billing/success'
const CANCEL_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'

export const billingRoutes = new Hono()

// ─── POST /billing/checkout — crea una sesión de Checkout (subscription) ──
billingRoutes.post('/checkout', requireAuth, async (c) => {
  const clerkUserId = getUserId(c)
  const db = await getDb()
  let user = await findUser(db, clerkUserId)

  // Auto-create user if missing
  if (!user) {
    user = await upsertUser(db, {
      clerkUserId,
      email: '',
      subscriptionStatus: 'free',
      stripeCustomerId: null,
      createdAt: new Date().toISOString(),
    })
  }

  // Crear/reusar Stripe customer
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { clerkUserId },
    })
    customerId = customer.id
    await db.collection('users').updateOne(
      { clerkUserId },
      { $set: { stripeCustomerId: customerId } },
    )
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: SUCCESS_URL,
    cancel_url: CANCEL_URL,
  })

  return c.json({ url: session.url })
})

// ─── GET /billing/portal — gestión de suscripción ─────────────────────────
billingRoutes.get('/portal', requireAuth, async (c) => {
  const clerkUserId = getUserId(c)
  const db = await getDb()
  const user = await findUser(db, clerkUserId)
  if (!user?.stripeCustomerId) {
    return c.json({ error: 'no_subscription' }, 404)
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: CANCEL_URL,
  })

  return c.json({ url: portalSession.url })
})

// ─── POST /billing/webhook — eventos de Stripe ────────────────────────────
billingRoutes.post('/webhook', async (c) => {
  const sig = c.req.header('stripe-signature') ?? ''
  const rawBody = await c.req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET)
  } catch {
    return c.json({ error: 'invalid_signature' }, 400)
  }

  const db = await getDb()

  const getClerkUserIdFromCustomer = async (customerId: string): Promise<string | null> => {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer.deleted) return null
      return (customer as Stripe.Customer).metadata?.clerkUserId ?? null
    } catch {
      return null
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break
      const clerkUserId = await getClerkUserIdFromCustomer(session.customer as string)
      if (!clerkUserId) break
      await db.collection('users').updateOne(
        { clerkUserId },
        { $set: { subscriptionStatus: 'premium' } },
      )
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const clerkUserId = await getClerkUserIdFromCustomer(sub.customer as string)
      if (!clerkUserId) break
      await db.collection('users').updateOne(
        { clerkUserId },
        { $set: { subscriptionStatus: 'free' } },
      )
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const clerkUserId = await getClerkUserIdFromCustomer(sub.customer as string)
      if (!clerkUserId) break
      const isPremium = sub.status === 'active' || sub.status === 'trialing'
      await db.collection('users').updateOne(
        { clerkUserId },
        { $set: { subscriptionStatus: isPremium ? 'premium' : 'free' } },
      )
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.warn('[billing] payment_failed for customer', invoice.customer)
      break
    }

    default:
      break
  }

  return c.json({ received: true })
})
