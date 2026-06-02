/**
 * ai-service — Microservicio de IA (A*) para Quings. Stateless: tablero -> mejor movimiento.
 * Un solo endpoint de decisión (POST /move) + GET /health. No escribe en base de datos.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Player } from "@quings/game-engine";
import { findBestMove } from "./astar";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok", service: "ai-service", algorithm: "A*" }));

interface MoveRequest {
  board: number[][];
  currentPlayer?: Player;
}

app.post("/move", async (c) => {
  let body: MoveRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "JSON inválido" }, 400);
  }

  const { board } = body;
  const currentPlayer: Player = body.currentPlayer ?? "ai";

  if (!Array.isArray(board) || board.length !== 8 || board.some((r) => !Array.isArray(r) || r.length !== 8)) {
    return c.json({ error: "Se requiere un tablero 8x8" }, 400);
  }

  const result = findBestMove(board, currentPlayer);

  if (!result.move) {
    return c.json({ error: "Sin movimientos legales", analysis: result }, 422);
  }

  return c.json({
    from: result.move.from,
    to: result.move.to,
    captures: result.move.captures,
    analysis: {
      score: Math.round(result.score),
      nodesExplored: result.nodesExplored,
      depth: result.depth,
    },
  });
});

const port = Number(process.env.PORT ?? 7070);
console.log(`🤖 ai-service (A*) escuchando en :${port}`);

export default {
  port,
  fetch: app.fetch,
};
