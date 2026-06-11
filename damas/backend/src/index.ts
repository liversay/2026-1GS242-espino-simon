/**
 * backend — API de Quings (Hono). Único servicio que escribe en MongoDB.
 * Orquesta: usuarios (Clerk), partidas (game-engine + ai-service), ranking,
 * marketplace de skins (Coronas) y pagos (Stripe).
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Move } from "@quings/game-engine";
import { env } from "./env";
import { type AuthVariables, requireAuth } from "./middleware/auth";
import { type UserDoc, users } from "./db/collections";
import {
  HttpError,
  createGame,
  getGame,
  listInProgressGames,
  playHumanMove,
  resignGame,
} from "./services/games";
import { getRanking } from "./services/ranking";
import { buySkin, equipSkin, listSkins } from "./services/skins";
import { buyBoard, equipBoard, listBoards } from "./services/boards";
import { confirmCheckout, createCheckout, handleStripeEvent, listPacks } from "./services/coronas";

const app = new Hono<{ Variables: AuthVariables }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: env.FRONTEND_URL,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  }),
);

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status as 400);
  console.error(err);
  return c.json({ error: "Error interno del servidor" }, 500);
});

app.get("/health", (c) => c.json({ status: "ok", service: "backend" }));

// ---- Stripe webhook (PÚBLICO, raw body) — registrado ANTES del middleware de auth ----
app.post("/api/stripe/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.json({ error: "Falta firma de Stripe" }, 400);
  const rawBody = await c.req.text();
  try {
    await handleStripeEvent(rawBody, signature);
  } catch (err) {
    console.error("Webhook Stripe inválido:", err);
    return c.json({ error: "Firma inválida" }, 400);
  }
  return c.json({ received: true });
});

// ---- A partir de aquí, todo /api/* requiere autenticación Clerk ----
app.use("/api/*", requireAuth);

function profile(user: UserDoc) {
  return {
    id: user._id?.toString(),
    username: user.username,
    coronas: user.coronas,
    bestWinMoves: user.bestWinMoves,
    totalWins: user.totalWins,
    totalGames: user.totalGames,
    ownedSkinIds: user.ownedSkinIds,
    equippedSkinId: user.equippedSkinId,
    ownedBoardIds: user.ownedBoardIds ?? [],
    equippedBoardId: user.equippedBoardId ?? "classic-board",
  };
}

// ---- Perfil ----
app.get("/api/me", (c) => c.json(profile(c.get("user"))));

app.patch("/api/me", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { username?: string };
  const username = (body.username ?? "").trim();
  if (username.length < 3 || username.length > 20) {
    return c.json({ error: "El nombre debe tener entre 3 y 20 caracteres" }, 400);
  }
  await (await users()).updateOne(
    { _id: user._id },
    { $set: { username, updatedAt: new Date() } },
  );
  return c.json({ ...profile(user), username });
});

// ---- Partidas ----
app.post("/api/games", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { difficulty?: number };
  const game = await createGame(c.get("user")._id!, body.difficulty);
  return c.json(game, 201);
});

app.get("/api/games", async (c) => {
  const list = await listInProgressGames(c.get("user")._id!);
  return c.json(list);
});

app.get("/api/games/:id", async (c) => {
  const game = await getGame(c.get("user")._id!, c.req.param("id"));
  if (!game) return c.json({ error: "Partida no encontrada" }, 404);
  return c.json(game);
});

app.post("/api/games/:id/move", async (c) => {
  const body = (await c.req.json()) as Move & { difficulty?: number };
  const result = await playHumanMove(
    c.get("user")._id!,
    c.req.param("id"),
    {
      from: body.from,
      to: body.to,
      captures: body.captures ?? [],
    },
    body.difficulty,
  );
  return c.json(result);
});

app.post("/api/games/:id/resign", async (c) => {
  const game = await resignGame(c.get("user")._id!, c.req.param("id"));
  return c.json(game);
});

// ---- Ranking ----
app.get("/api/ranking", async (c) => {
  const ranking = await getRanking(c.get("user")._id!);
  return c.json(ranking);
});

// ---- Marketplace ----
app.get("/api/skins", async (c) => c.json(await listSkins()));

app.post("/api/skins/:id/buy", async (c) => {
  const res = await buySkin(c.get("user")._id!, c.req.param("id"));
  return c.json(res);
});

app.post("/api/skins/:id/equip", async (c) => {
  const res = await equipSkin(c.get("user")._id!, c.req.param("id"));
  return c.json(res);
});

// ---- Marketplace de tableros ----
app.get("/api/boards", async (c) => c.json(await listBoards()));

app.post("/api/boards/:id/buy", async (c) => {
  const res = await buyBoard(c.get("user")._id!, c.req.param("id"));
  return c.json(res);
});

app.post("/api/boards/:id/equip", async (c) => {
  const res = await equipBoard(c.get("user")._id!, c.req.param("id"));
  return c.json(res);
});

// ---- Coronas (Stripe) ----
app.get("/api/corona-packs", async (c) => c.json(await listPacks()));

app.post("/api/checkout", async (c) => {
  const body = (await c.req.json()) as { packId: string };
  const res = await createCheckout(c.get("user")._id!, body.packId);
  return c.json(res);
});

app.post("/api/checkout/confirm", async (c) => {
  const body = (await c.req.json()) as { sessionId: string };
  const res = await confirmCheckout(c.get("user")._id!, body.sessionId);
  return c.json(res);
});

console.log(`🏰 backend Quings escuchando en :${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
