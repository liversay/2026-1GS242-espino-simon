import type { Db } from 'mongodb'
import type { Room } from '@pokept/shared'

export async function insertRoom(db: Db, room: Room): Promise<void> {
  await db.collection<Room>('rooms').insertOne(room as Room & { _id?: unknown })
}

export async function getRoom(db: Db, code: string): Promise<Room | null> {
  return db.collection<Room>('rooms').findOne({ code }, { projection: { _id: 0 } })
}

export async function updateRoom(db: Db, code: string, update: Partial<Room>): Promise<Room | null> {
  const res = await db.collection<Room>('rooms').findOneAndUpdate(
    { code },
    { $set: update },
    { returnDocument: 'after', projection: { _id: 0 } },
  )
  return res as unknown as Room | null
}
