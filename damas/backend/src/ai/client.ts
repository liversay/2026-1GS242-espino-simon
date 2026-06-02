/** Cliente REST hacia el microservicio de IA (A*). El backend NUNCA decide la jugada. */

import type { Move, Player } from "@quings/game-engine";
import { env } from "../env";

export async function requestAiMove(board: number[][], currentPlayer: Player = "ai"): Promise<Move> {
  const res = await fetch(`${env.AI_SERVICE_URL}/move`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ board, currentPlayer }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ai-service respondió ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { from: Move["from"]; to: Move["to"]; captures: Move["captures"] };
  return { from: data.from, to: data.to, captures: data.captures ?? [] };
}
