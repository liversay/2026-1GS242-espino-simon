/**
 * Middleware de autenticación con Clerk.
 * Verifica el token de sesión (Authorization: Bearer <token>) con @clerk/backend,
 * y garantiza que exista el documento `user` en Mongo (creándolo en el primer login).
 */

import { verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";
import { env } from "../env";
import { type UserDoc, users } from "../db/collections";
import { DEFAULT_BOARD_ID, DEFAULT_SKIN_ID } from "../db/seed-data";

export interface AuthVariables {
  clerkUserId: string;
  user: UserDoc;
}

function bearer(c: Context): string | null {
  const header = c.req.header("Authorization") ?? c.req.header("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

async function ensureUser(clerkUserId: string, claims: Record<string, unknown>): Promise<UserDoc> {
  const col = await users();
  const existing = await col.findOne({ clerkUserId });
  if (existing) {
    // Migración para cuentas previas a las skins de tablero.
    if (existing.equippedBoardId === undefined) {
      await col.updateOne(
        { _id: existing._id },
        { $set: { ownedBoardIds: [DEFAULT_BOARD_ID], equippedBoardId: DEFAULT_BOARD_ID } },
      );
      existing.ownedBoardIds = [DEFAULT_BOARD_ID];
      existing.equippedBoardId = DEFAULT_BOARD_ID;
    }
    return existing;
  }

  const username =
    (typeof claims.username === "string" && claims.username) ||
    (typeof claims.email === "string" && (claims.email as string).split("@")[0]) ||
    `Quing-${clerkUserId.slice(-6)}`;

  const now = new Date();
  const doc: UserDoc = {
    clerkUserId,
    username,
    coronas: env.CORONAS_INICIALES,
    bestWinMoves: null,
    totalWins: 0,
    totalGames: 0,
    ownedSkinIds: [DEFAULT_SKIN_ID],
    equippedSkinId: DEFAULT_SKIN_ID,
    ownedBoardIds: [DEFAULT_BOARD_ID],
    equippedBoardId: DEFAULT_BOARD_ID,
    createdAt: now,
    updatedAt: now,
  };
  const res = await col.insertOne(doc);
  return { ...doc, _id: res.insertedId };
}

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const token = bearer(c);
  if (!token) return c.json({ error: "No autenticado" }, 401);

  let payload: Record<string, unknown>;
  try {
    payload = (await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY })) as Record<
      string,
      unknown
    >;
  } catch {
    return c.json({ error: "Token inválido" }, 401);
  }

  const clerkUserId = payload.sub as string | undefined;
  if (!clerkUserId) return c.json({ error: "Token sin sujeto" }, 401);

  const user = await ensureUser(clerkUserId, payload);
  c.set("clerkUserId", clerkUserId);
  c.set("user", user);
  await next();
}
