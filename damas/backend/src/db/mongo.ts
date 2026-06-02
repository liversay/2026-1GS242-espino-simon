/** Conexión singleton a MongoDB. El backend es el ÚNICO servicio que escribe en la BD. */

import { Db, MongoClient } from "mongodb";
import { env } from "../env";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI no configurada");
  }
  client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  // El nombre de la BD puede venir en la URI; si no, usamos "quings".
  const dbName = new URL(env.MONGODB_URI).pathname.replace(/^\//, "") || "quings";
  db = client.db(dbName || "quings");
  await ensureIndexes(db);
  console.log(`🍃 MongoDB conectado (db: ${db.databaseName})`);
  return db;
}

async function ensureIndexes(database: Db): Promise<void> {
  await database.collection("users").createIndex({ clerkUserId: 1 }, { unique: true });
  await database.collection("users").createIndex({ bestWinMoves: 1 });
  await database.collection("games").createIndex({ userId: 1, status: 1, updatedAt: -1 });
  await database.collection("transactions").createIndex({ userId: 1, createdAt: -1 });
}

export async function closeDb(): Promise<void> {
  await client?.close();
  client = null;
  db = null;
}
