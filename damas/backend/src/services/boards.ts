/**
 * services/boards.ts — Marketplace de skins de tablero pagadas con Coronas (no usa Stripe).
 * Espejo de services/skins.ts pero para el estilo del tablero.
 */

import { type BoardDoc, ObjectId, boards, transactions, users } from "../db/collections";
import { HttpError } from "./games";

export async function listBoards(): Promise<BoardDoc[]> {
  const order = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
  const all = await (await boards()).find({}).toArray();
  return all.sort((a, b) => order[a.rarity] - order[b.rarity] || a.priceCoronas - b.priceCoronas);
}

export async function buyBoard(
  userId: ObjectId,
  boardId: string,
): Promise<{ coronas: number; ownedBoardIds: string[] }> {
  const board = await (await boards()).findOne({ _id: boardId });
  if (!board) throw new HttpError(404, "Tablero no encontrado");

  const usersCol = await users();
  const user = await usersCol.findOne({ _id: userId });
  if (!user) throw new HttpError(404, "Usuario no encontrado");

  const owned = user.ownedBoardIds ?? [];
  if (owned.includes(boardId)) throw new HttpError(409, "Ya posees este tablero");
  if (user.coronas < board.priceCoronas) throw new HttpError(402, "Coronas insuficientes");

  await usersCol.updateOne(
    { _id: userId },
    {
      $inc: { coronas: -board.priceCoronas },
      $push: { ownedBoardIds: boardId },
      $set: { updatedAt: new Date() },
    },
  );
  await (await transactions()).insertOne({
    userId,
    type: "buy_board",
    amount: -board.priceCoronas,
    boardId,
    createdAt: new Date(),
  });

  return { coronas: user.coronas - board.priceCoronas, ownedBoardIds: [...owned, boardId] };
}

export async function equipBoard(
  userId: ObjectId,
  boardId: string,
): Promise<{ equippedBoardId: string }> {
  const usersCol = await users();
  const user = await usersCol.findOne({ _id: userId });
  if (!user) throw new HttpError(404, "Usuario no encontrado");
  if (!(user.ownedBoardIds ?? []).includes(boardId)) throw new HttpError(403, "No posees este tablero");

  await usersCol.updateOne(
    { _id: userId },
    { $set: { equippedBoardId: boardId, updatedAt: new Date() } },
  );
  return { equippedBoardId: boardId };
}
