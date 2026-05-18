import type { Db } from 'mongodb'
import type { Pokemon } from '@pokept/shared'

export async function upsertPokemon(db: Db, doc: Pokemon): Promise<void> {
  await db.collection<Pokemon>('pokemon').updateOne(
    { pokedexId: doc.pokedexId },
    { $set: doc },
    { upsert: true },
  )
}

export async function getPokemonByDexId(db: Db, id: number): Promise<Pokemon | null> {
  return db.collection<Pokemon>('pokemon').findOne({ pokedexId: id }, { projection: { _id: 0 } })
}

export async function getPokemonByDexIds(db: Db, ids: number[]): Promise<Pokemon[]> {
  return db.collection<Pokemon>('pokemon')
    .find({ pokedexId: { $in: ids } }, { projection: { _id: 0 } })
    .toArray()
}

export async function listPokemon(db: Db, opts: { skip?: number; limit?: number; search?: string } = {}): Promise<{ items: Pokemon[]; total: number }> {
  const filter: Record<string, unknown> = {}
  if (opts.search) {
    filter.name = { $regex: opts.search, $options: 'i' }
  }
  const col = db.collection<Pokemon>('pokemon')
  const [items, total] = await Promise.all([
    col.find(filter, { projection: { _id: 0 } })
      .sort({ pokedexId: 1 })
      .skip(opts.skip ?? 0)
      .limit(opts.limit ?? 24)
      .toArray(),
    col.countDocuments(filter),
  ])
  return { items, total }
}

export async function countPokemon(db: Db): Promise<number> {
  return db.collection('pokemon').countDocuments()
}
