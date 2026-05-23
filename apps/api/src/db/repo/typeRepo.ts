import type { Db } from 'mongodb'
import type { PokeType, TypeRelations } from '@pokept/shared'

export async function upsertTypeRelations(db: Db, doc: TypeRelations): Promise<void> {
  await db.collection<TypeRelations>('types').updateOne(
    { name: doc.name },
    { $set: doc },
    { upsert: true },
  )
}

export async function listAllTypeRelations(db: Db): Promise<TypeRelations[]> {
  return db.collection<TypeRelations>('types').find({}, { projection: { _id: 0 } }).toArray()
}

let cache: Map<PokeType, TypeRelations> | null = null

export async function getTypeRelationsCache(db: Db): Promise<Map<PokeType, TypeRelations>> {
  if (cache) return cache
  const all = await listAllTypeRelations(db)
  cache = new Map(all.map((t) => [t.name, t]))
  return cache
}

export function invalidateTypeCache(): void {
  cache = null
}
