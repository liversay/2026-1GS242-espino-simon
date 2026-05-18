import { useEffect, useState } from 'react'
import type { Pokemon } from '@pokept/shared'
import { LEGENDARY_IDS } from '@pokept/shared'
import { api } from '../lib/api'
import { TypeChip } from './TypeChip'
import styles from './TeamPicker.module.css'

interface Props {
  selected: number[]
  disabled?: boolean
  onChange: (selected: number[]) => void
}

const MAX_TEAM = 6

export function TeamPicker({ selected, disabled, onChange }: Props) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [data, setData] = useState<{ items: Pokemon[]; totalPages: number; total: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.listPokemon({ page, pageSize: 24, search: search.trim() || undefined })
      .then((r) => { if (!cancelled) setData(r) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, search])

  const selectedSet = new Set(selected)
  const selectedLegendaryCount = selected.filter((id) => LEGENDARY_IDS.includes(id)).length

  const toggle = (id: number) => {
    if (disabled) return
    if (selectedSet.has(id)) {
      onChange(selected.filter((x) => x !== id))
    } else if (selected.length < MAX_TEAM) {
      if (LEGENDARY_IDS.includes(id) && selectedLegendaryCount >= 1) return
      onChange([...selected, id])
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <span className="kicker">Catalog · Pokémon</span>
        <h3 className={styles.h3}>Pick your team (up to 6)</h3>
        <p className={styles.legendaryNote}>★ Legendary — max 1 per team</p>
        <input
          className="input"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </header>

      {loading && !data ? (
        <p className={styles.muted}>Loading…</p>
      ) : error ? (
        <p className={styles.error}>Error: {error}</p>
      ) : !data ? null : (
        <>
          <div className={styles.grid}>
            {data.items.map((p) => {
              const picked = selectedSet.has(p.pokedexId)
              const isLegendary = LEGENDARY_IDS.includes(p.pokedexId)
              const legendaryBlocked = isLegendary && !picked && selectedLegendaryCount >= 1
              return (
                <button
                  key={p.pokedexId}
                  type="button"
                  className={`${styles.card} ${picked ? styles.cardPicked : ''} ${isLegendary ? styles.cardLegendary : ''}`}
                  onClick={() => toggle(p.pokedexId)}
                  disabled={disabled || (!picked && selected.length >= MAX_TEAM) || legendaryBlocked}
                  data-primary-type={p.types[0]}
                  style={{ ['--type-glow' as string]: `var(--type-${p.types[0]})` }}
                >
                  {isLegendary && <span className={styles.legendaryBadge}>★</span>}
                  <span className={styles.dexId}>Nº{String(p.pokedexId).padStart(3, '0')}</span>
                  <img src={p.spriteUrl} alt={p.name} loading="lazy" />
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.types}>
                    {p.types.map((t) => <TypeChip key={t} type={t} />)}
                  </span>
                  {picked && <span className={styles.checkmark}>✓</span>}
                </button>
              )
            })}
          </div>

          <footer className={styles.pager}>
            <button
              type="button"
              className="btn"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >← Previous</button>
            <span className={styles.pageInfo}>
              Page {data.totalPages === 0 ? 0 : page} / {data.totalPages} · {data.total} Pokémon
            </span>
            <button
              type="button"
              className="btn"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >Next →</button>
          </footer>
        </>
      )}
    </div>
  )
}
