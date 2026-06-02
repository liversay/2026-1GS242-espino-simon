/**
 * services/skins.ts — Marketplace de skins pagadas con Coronas (no usa Stripe).
 */

import { type SkinDoc, ObjectId, skins, transactions, users } from "../db/collections";
import { HttpError } from "./games";

export async function listSkins(): Promise<SkinDoc[]> {
  const order = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
  const all = await (await skins()).find({}).toArray();
  return all.sort((a, b) => order[a.rarity] - order[b.rarity] || a.priceCoronas - b.priceCoronas);
}

export async function buySkin(userId: ObjectId, skinId: string): Promise<{ coronas: number; ownedSkinIds: string[] }> {
  const skin = await (await skins()).findOne({ _id: skinId });
  if (!skin) throw new HttpError(404, "Skin no encontrada");

  const usersCol = await users();
  const user = await usersCol.findOne({ _id: userId });
  if (!user) throw new HttpError(404, "Usuario no encontrado");

  if (user.ownedSkinIds.includes(skinId)) throw new HttpError(409, "Ya posees esta skin");
  if (user.coronas < skin.priceCoronas) throw new HttpError(402, "Coronas insuficientes");

  await usersCol.updateOne(
    { _id: userId },
    {
      $inc: { coronas: -skin.priceCoronas },
      $push: { ownedSkinIds: skinId },
      $set: { updatedAt: new Date() },
    },
  );
  await (await transactions()).insertOne({
    userId,
    type: "buy_skin",
    amount: -skin.priceCoronas,
    skinId,
    createdAt: new Date(),
  });

  return { coronas: user.coronas - skin.priceCoronas, ownedSkinIds: [...user.ownedSkinIds, skinId] };
}

export async function equipSkin(userId: ObjectId, skinId: string): Promise<{ equippedSkinId: string }> {
  const usersCol = await users();
  const user = await usersCol.findOne({ _id: userId });
  if (!user) throw new HttpError(404, "Usuario no encontrado");
  if (!user.ownedSkinIds.includes(skinId)) throw new HttpError(403, "No posees esta skin");

  await usersCol.updateOne(
    { _id: userId },
    { $set: { equippedSkinId: skinId, updatedAt: new Date() } },
  );
  return { equippedSkinId: skinId };
}
