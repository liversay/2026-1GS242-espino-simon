import type { Db } from 'mongodb'
import type { Move } from '@pokept/shared'

export async function upsertMove(db: Db, doc: Move): Promise<void> {
  await db.collection<Move>('moves').updateOne(
    { moveId: doc.moveId },
    { $set: doc },
    { upsert: true },
  )
}

export async function getMovesByIds(db: Db, ids: number[]): Promise<Move[]> {
  return db.collection<Move>('moves')
    .find({ moveId: { $in: ids } }, { projection: { _id: 0 } })
    .toArray()
}

export async function getMoveById(db: Db, id: number): Promise<Move | null> {
  return db.collection<Move>('moves').findOne({ moveId: id }, { projection: { _id: 0 } })
}
