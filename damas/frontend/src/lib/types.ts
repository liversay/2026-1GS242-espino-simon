/** Tipos compartidos del cliente (espejo de las respuestas del backend). */

import type { GameStatus, Move, Player } from "@quings/game-engine";

export type { Move, Player, GameStatus };

export interface Profile {
  id: string;
  username: string;
  coronas: number;
  bestWinMoves: number | null;
  totalWins: number;
  totalGames: number;
  ownedSkinIds: string[];
  equippedSkinId: string;
}

export interface Game {
  _id: string;
  userId: string;
  board: number[][];
  turn: Player;
  status: GameStatus;
  moveCount: number;
  history: Move[];
  createdAt: string;
  updatedAt: string;
}

export interface MoveResult {
  game: Game;
  aiMove: Move | null;
  finished: boolean;
}

export type SkinRarity = "common" | "rare" | "epic" | "legendary";
export type SkinMaterial = "matte" | "metallic" | "foil" | "neon";

export interface PieceStyle {
  baseColor: string;
  accentColor: string;
  crownColor: string;
  material: SkinMaterial;
  icon?: string;
}

export interface Skin {
  _id: string;
  name: string;
  rarity: SkinRarity;
  priceCoronas: number;
  pieceStyle: PieceStyle;
  thumbnail: string;
  description: string;
}

export interface CoronaPack {
  _id: string;
  name: string;
  coronas: number;
  priceUsd: number;
  stripePriceLabel: string;
}

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
