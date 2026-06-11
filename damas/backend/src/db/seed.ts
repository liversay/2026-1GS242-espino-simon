/** Carga el catálogo funcional de skins y paquetes de Coronas en MongoDB (idempotente). */

import { boards, coronaPacks, skins, users } from "./collections";
import { closeDb } from "./mongo";
import {
  BOARDS,
  CORONA_PACKS,
  DEFAULT_BOARD_ID,
  DEFAULT_SKIN_ID,
  DEMO_USERS,
  SKINS,
} from "./seed-data";

async function seed(): Promise<void> {
  const skinsCol = await skins();
  for (const s of SKINS) {
    await skinsCol.replaceOne({ _id: s._id }, s, { upsert: true });
  }
  console.log(`✔ ${SKINS.length} skins cargadas`);

  const boardsCol = await boards();
  for (const b of BOARDS) {
    await boardsCol.replaceOne({ _id: b._id }, b, { upsert: true });
  }
  // Elimina tableros obsoletos que ya no están en el catálogo (p. ej. el verde épico).
  await boardsCol.deleteMany({ _id: { $nin: BOARDS.map((b) => b._id) } });
  console.log(`✔ ${BOARDS.length} tableros cargados`);

  const packsCol = await coronaPacks();
  for (const p of CORONA_PACKS) {
    await packsCol.replaceOne({ _id: p._id }, p, { upsert: true });
  }
  console.log(`✔ ${CORONA_PACKS.length} paquetes de Coronas cargados`);

  // Jugadores ficticios para el ranking (idempotente por clerkUserId).
  const usersCol = await users();
  const now = new Date();
  for (const u of DEMO_USERS) {
    await usersCol.updateOne(
      { clerkUserId: u.clerkUserId },
      {
        $set: {
          username: u.username,
          bestWinMoves: u.bestWinMoves,
          totalWins: u.totalWins,
          totalGames: u.totalGames,
          updatedAt: now,
        },
        $setOnInsert: {
          coronas: 0,
          ownedSkinIds: [DEFAULT_SKIN_ID],
          equippedSkinId: DEFAULT_SKIN_ID,
          ownedBoardIds: [DEFAULT_BOARD_ID],
          equippedBoardId: DEFAULT_BOARD_ID,
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }
  console.log(`✔ ${DEMO_USERS.length} jugadores demo para el ranking`);

  await closeDb();
  console.log("🌱 Seed completado");
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
