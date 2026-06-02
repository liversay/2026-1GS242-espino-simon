/**
 * services/coronas.ts — Compra de Coronas con dinero real vía Stripe Checkout.
 * Stripe se usa SOLO para comprar Coronas (no para skins).
 */

import Stripe from "stripe";
import { type CoronaPackDoc, ObjectId, coronaPacks, transactions, users } from "../db/collections";
import { env } from "../env";
import { HttpError } from "./games";

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, "Stripe no está configurado");
  if (!stripe) stripe = new Stripe(env.STRIPE_SECRET_KEY);
  return stripe;
}

export async function listPacks(): Promise<CoronaPackDoc[]> {
  return (await coronaPacks()).find({}).sort({ priceUsd: 1 }).toArray();
}

export async function createCheckout(userId: ObjectId, packId: string): Promise<{ url: string }> {
  const pack = await (await coronaPacks()).findOne({ _id: packId });
  if (!pack) throw new HttpError(404, "Paquete no encontrado");

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(pack.priceUsd * 100),
          product_data: {
            name: pack.stripePriceLabel,
            description: `${pack.coronas} Coronas para Quings`,
          },
        },
      },
    ],
    metadata: {
      userId: userId.toString(),
      packId: pack._id,
      coronas: String(pack.coronas),
    },
    success_url: `${env.FRONTEND_URL}/coronas?status=success`,
    cancel_url: `${env.FRONTEND_URL}/coronas?status=cancel`,
  });

  if (!session.url) throw new HttpError(502, "Stripe no devolvió URL de checkout");
  return { url: session.url };
}

/** Procesa el webhook de Stripe: acredita Coronas al confirmarse el pago. */
export async function handleStripeEvent(rawBody: string, signature: string): Promise<void> {
  const event = getStripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object as Stripe.Checkout.Session;
  const meta = session.metadata ?? {};
  if (!meta.userId || !meta.coronas) return;

  const userId = new ObjectId(meta.userId);
  const coronas = Number(meta.coronas);

  // Idempotencia: no acreditar dos veces la misma sesión.
  const txCol = await transactions();
  const already = await txCol.findOne({ stripeSessionId: session.id });
  if (already) return;

  await (await users()).updateOne(
    { _id: userId },
    { $inc: { coronas }, $set: { updatedAt: new Date() } },
  );
  await txCol.insertOne({
    userId,
    type: "purchase_coronas",
    amount: coronas,
    stripeSessionId: session.id,
    createdAt: new Date(),
  });
}
