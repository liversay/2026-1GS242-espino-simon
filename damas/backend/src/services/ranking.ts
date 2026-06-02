/**
 * services/ranking.ts — Ranking global por "mejor partida" = menor cantidad de movimientos
 * para ganar (bestWinMoves). Menos movimientos => más arriba. Ignora usuarios sin victorias.
 */

import { ObjectId, users } from "../db/collections";

export interface RankingRow {
  rank: number;
  userId: string;
  username: string;
  bestWinMoves: number;
  totalWins: number;
  isCurrentUser: boolean;
}

export interface RankingResult {
  top: RankingRow[];
  me: RankingRow | null;
}

export async function getRanking(currentUserId: ObjectId, limit = 50): Promise<RankingResult> {
  const col = await users();
  const ranked = await col
    .find({ bestWinMoves: { $ne: null } })
    .sort({ bestWinMoves: 1, totalWins: -1, updatedAt: 1 })
    .toArray();

  const rows: RankingRow[] = ranked.map((u, i) => ({
    rank: i + 1,
    userId: u._id!.toString(),
    username: u.username,
    bestWinMoves: u.bestWinMoves as number,
    totalWins: u.totalWins,
    isCurrentUser: u._id!.equals(currentUserId),
  }));

  const me = rows.find((r) => r.isCurrentUser) ?? null;
  return { top: rows.slice(0, limit), me };
}
