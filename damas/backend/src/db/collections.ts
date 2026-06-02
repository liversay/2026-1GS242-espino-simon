/** Tipos de documentos y accesores tipados a las colecciones de MongoDB. */

import { Collection, ObjectId } from "mongodb";
import type { GameStatus, Move, Player } from "@quings/game-engine";
import { getDb } from "./mongo";

export interface UserDoc {
  _id?: ObjectId;
  clerkUserId: string;
  username: string;
  coronas: number;
  bestWinMoves: number | null;
  totalWins: number;
  totalGames: number;
  ownedSkinIds: string[];
  equippedSkinId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameDoc {
  _id?: ObjectId;
  userId: ObjectId;
  board: number[][];
  turn: Player;
  status: GameStatus;
  moveCount: number;
  history: Move[];
  createdAt: Date;
  updatedAt: Date;
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

export interface SkinDoc {
  _id: string;
  name: string;
  rarity: SkinRarity;
  priceCoronas: number;
  pieceStyle: PieceStyle;
  thumbnail: string;
  description: string;
}

export interface CoronaPackDoc {
  _id: string;
  name: string;
  coronas: number;
  priceUsd: number;
  stripePriceLabel: string;
}

export type TransactionType = "purchase_coronas" | "buy_skin" | "win_reward";

export interface TransactionDoc {
  _id?: ObjectId;
  userId: ObjectId;
  type: TransactionType;
  amount: number;
  skinId?: string;
  stripeSessionId?: string;
  createdAt: Date;
}

export async function users(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}
export async function games(): Promise<Collection<GameDoc>> {
  return (await getDb()).collection<GameDoc>("games");
}
export async function skins(): Promise<Collection<SkinDoc>> {
  return (await getDb()).collection<SkinDoc>("skins");
}
export async function coronaPacks(): Promise<Collection<CoronaPackDoc>> {
  return (await getDb()).collection<CoronaPackDoc>("coronaPacks");
}
export async function transactions(): Promise<Collection<TransactionDoc>> {
  return (await getDb()).collection<TransactionDoc>("transactions");
}

export { ObjectId };
