import { MongoClient, type Db } from 'mongodb'

const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGO_DB ?? 'pokept'

let client: MongoClient | null = null
let db: Db | null = null

export async function getDb(): Promise<Db> {
  if (db) return db
  client = new MongoClient(MONGO_URL, {
    serverSelectionTimeoutMS: 5000,
  })
  await client.connect()
  db = client.db(DB_NAME)
  await ensureIndexes(db)
  return db
}

async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection('pokemon').createIndex({ pokedexId: 1 }, { unique: true }),
    db.collection('moves').createIndex({ moveId: 1 }, { unique: true }),
    db.collection('types').createIndex({ name: 1 }, { unique: true }),
    db.collection('rooms').createIndex({ code: 1 }, { unique: true }),
    db.collection('battles').createIndex({ roomCode: 1 }, { unique: true }),
  ])
}

export async function closeDb(): Promise<void> {
  await client?.close()
  client = null
  db = null
}
