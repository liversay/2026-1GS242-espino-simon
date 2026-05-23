import type { Db } from 'mongodb'
import type { Battle } from '@pokept/shared'

export async function insertBattle(db: Db, battle: Battle): Promise<void> {
  await db.collection<Battle>('battles').insertOne(battle as Battle & { _id?: unknown })
}

export async function getBattle(db: Db, roomCode: string): Promise<Battle | null> {
  return db.collection<Battle>('battles').findOne({ roomCode }, { projection: { _id: 0 } })
}

// Atomic compare-and-swap usando turn como version field.
// Devuelve el doc actualizado o null si la versión cambió (perdió la carrera).
export async function casBattle(
  db: Db,
  roomCode: string,
  expectedTurn: number,
  update: Partial<Battle>,
): Promise<Battle | null> {
  const res = await db.collection<Battle>('battles').findOneAndUpdate(
    { roomCode, turn: expectedTurn },
    { $set: { ...update, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after', projection: { _id: 0 } },
  )
  return res as unknown as Battle | null
}

export async function replaceBattle(db: Db, battle: Battle): Promise<void> {
  await db.collection<Battle>('battles').replaceOne({ roomCode: battle.roomCode }, battle)
}
