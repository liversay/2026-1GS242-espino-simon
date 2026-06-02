/** Carga el catálogo funcional de skins y paquetes de Coronas en MongoDB (idempotente). */

import { coronaPacks, skins } from "./collections";
import { closeDb } from "./mongo";
import { CORONA_PACKS, SKINS } from "./seed-data";

async function seed(): Promise<void> {
  const skinsCol = await skins();
  for (const s of SKINS) {
    await skinsCol.replaceOne({ _id: s._id }, s, { upsert: true });
  }
  console.log(`✔ ${SKINS.length} skins cargadas`);

  const packsCol = await coronaPacks();
  for (const p of CORONA_PACKS) {
    await packsCol.replaceOne({ _id: p._id }, p, { upsert: true });
  }
  console.log(`✔ ${CORONA_PACKS.length} paquetes de Coronas cargados`);

  await closeDb();
  console.log("🌱 Seed completado");
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
