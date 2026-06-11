/**
 * ai-service — Microservicio de IA (A*) para Quings. Stateless: tablero -> mejor movimiento.
 * Un solo endpoint de decisión (POST /move) + GET /health. No escribe en base de datos.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Player } from "@quings/game-engine";
import { type SearchOptions, findBestMove } from "./astar";

/** Configuración de búsqueda A* por nivel de dificultad (1 = fácil … 4 = experto). */
const DIFFICULTY: Record<number, SearchOptions> = {
  1: { maxDepth: 1, blunderChance: 0.6 }, // Principiante: corto de vista y comete errores
  2: { maxDepth: 2, blunderChance: 0.25 }, // Aprendiz
  3: { maxDepth: 3, blunderChance: 0 }, // Hábil (comportamiento clásico)
  4: { maxDepth: 5, blunderChance: 0 }, // Maestro: mira más jugadas adelante
};

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok", service: "ai-service", algorithm: "A*" }));

interface MoveRequest {
  board: number[][];
  currentPlayer?: Player;
  /** Nivel de dificultad 1–4 (por defecto 3). */
  difficulty?: number;
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

  const level = Number(body.difficulty);
  const options = DIFFICULTY[level] ?? DIFFICULTY[3];
  const result = findBestMove(board, currentPlayer, options);

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
