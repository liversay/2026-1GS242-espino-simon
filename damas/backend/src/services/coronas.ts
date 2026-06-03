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
    success_url: `${env.FRONTEND_URL}/coronas?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/coronas?status=cancel`,
  });

  if (!session.url) throw new HttpError(502, "Stripe no devolvió URL de checkout");
  return { url: session.url };
}

/** Acredita las Coronas de una sesión pagada (idempotente por stripeSessionId). */
async function creditPurchase(session: {
  id: string;
  metadata?: Record<string, string> | null;
}): Promise<number | null> {
  const meta = session.metadata ?? {};
  if (!meta.userId || !meta.coronas) return null;

  const userId = new ObjectId(meta.userId);
  const coronas = Number(meta.coronas);

  const txCol = await transactions();
  const already = await txCol.findOne({ stripeSessionId: session.id });
  if (already) return null; // ya acreditado

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
  return coronas;
}

/**
 * Confirma una sesión de checkout al volver del pago (fallback fiable en local, donde el
 * webhook puede no llegar). Verifica que esté pagada y que pertenezca al usuario; acredita
 * de forma idempotente (no duplica con el webhook).
 */
export async function confirmCheckout(
  userId: ObjectId,
  sessionId: string,
): Promise<{ coronas: number; credited: number }> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    throw new HttpError(402, "El pago aún no se ha completado");
  }
  if (session.metadata?.userId !== userId.toString()) {
    throw new HttpError(403, "La sesión no pertenece a este usuario");
  }
  const credited = await creditPurchase({ id: session.id, metadata: session.metadata });
  const user = await (await users()).findOne({ _id: userId });
  return { coronas: user?.coronas ?? 0, credited: credited ?? 0 };
}

/** Procesa el webhook de Stripe: acredita Coronas al confirmarse el pago. */
export async function handleStripeEvent(rawBody: string, signature: string): Promise<void> {
  // constructEventAsync: necesario en runtimes (Bun/edge) donde Stripe usa SubtleCrypto (async).
  const event = await getStripe().webhooks.constructEventAsync(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );

  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object as Stripe.Checkout.Session;
  await creditPurchase({ id: session.id, metadata: session.metadata });
}
