import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BaseStats, Pokemon } from '@pokept/shared'
import { LEGENDARY_IDS } from '@pokept/shared'
import { api, ApiError } from '../lib/api'
import { TypeChip } from './TypeChip'
import styles from './TeamPicker.module.css'

export interface TeamSlot { id: number; isShiny: boolean }

interface Props {
  selected: TeamSlot[]
  disabled?: boolean
  onChange: (selected: TeamSlot[]) => void
  isPremium?: boolean
}

const MAX_TEAM = 6

// ─── Stat tooltip ─────────────────────────────────────────────────────────

const STAT_DEFS: { key: keyof BaseStats; label: string }[] = [
  { key: 'hp',  label: 'HP'  },
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
]

function statColor(v: number): string {
  if (v < 60)  return 'var(--pp-hp-red)'
  if (v < 90)  return 'var(--pp-hp-yellow)'
  return 'var(--pp-hp-green)'
}

interface TooltipTarget { pokemon: Pokemon; anchor: DOMRect }

function StatTooltip({ target }: { target: TooltipTarget }) {
  const { pokemon, anchor } = target
  const TW = 210
  const margin = 8
  let left = anchor.right + margin
  if (left + TW > window.innerWidth - margin) left = anchor.left - TW - margin
  let top = anchor.top
  const TH = 200
  if (top + TH > window.innerHeight - margin) top = window.innerHeight - TH - margin

  return createPortal(
    <div className={styles.statTooltip} style={{ left, top, width: TW }}>
      <p className={styles.statTooltipName}>{pokemon.name}</p>
      <table className={styles.statTable}>
        <tbody>
          {STAT_DEFS.map(({ key, label }) => {
            const val = pokemon.baseStats[key]
            return (
              <tr key={key}>
                <td className={styles.statLabel}>{label}</td>
                <td className={styles.statVal}>{val}</td>
                <td className={styles.statBarCell}>
                  <div
                    className={styles.statBar}
                    style={{
                      width: `${Math.round((val / 255) * 100)}%`,
                      background: statColor(val),
                    }}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>,
    document.body,
  )
}

// ─── Shiny modal ──────────────────────────────────────────────────────────

interface ShinyModalProps {
  pokemon: Pokemon
  onPick: (isShiny: boolean) => void
  onClose: () => void
}

function ShinyModal({ pokemon, onPick, onClose }: ShinyModalProps) {
  return createPortal(
    <div className={styles.shinyOverlay} onClick={onClose}>
      <div className={styles.shinyModal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.shinyModalTitle}>{pokemon.name}</p>
        <p className={styles.shinyModalSub}>Choose your variant</p>
        <div className={styles.shinyChoices}>
          <button type="button" className={styles.shinyChoice} onClick={() => onPick(false)}>
            <img src={pokemon.spriteUrl} alt={`${pokemon.name} normal`} className={styles.shinySprite} />
            <span className={styles.shinyChoiceLabel}>Normal</span>
          </button>
          <button type="button" className={`${styles.shinyChoice} ${styles.shinyChoiceShiny}`} onClick={() => onPick(true)}>
            <img src={pokemon.shinySpriteUrl || pokemon.spriteUrl} alt={`${pokemon.name} shiny`} className={styles.shinySprite} />
            <span className={styles.shinyChoiceLabel}>✨ Shiny</span>
          </button>
        </div>
        <button type="button" className={styles.shinyClose} onClick={onClose}>× Cancel</button>
      </div>
    </div>,
    document.body,
  )
}

function UpsellModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setErr(null)
    try {
      const { url } = await api.createCheckout()
      if (url) window.location.href = url
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not start checkout.')
      setLoading(false)
    }
  }

  return createPortal(
    <div className={styles.shinyOverlay} onClick={onClose}>
      <div className={styles.shinyModal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.shinyModalTitle}>✨ Premium Feature</p>
        <p className={styles.shinyModalSub}>
          Upgrade to Premium to choose shiny variants for your Pokémon team.
        </p>
        {err && <p style={{ color: 'var(--ds-menu-red)', fontFamily: 'var(--font-game)', marginBottom: 8 }}>{err}</p>}
        <button type="button" className="btn btn--hot" style={{ width: '100%', marginBottom: 8 }} onClick={handleUpgrade} disabled={loading}>
          {loading ? 'Redirecting…' : 'Upgrade for $10/mo'}
        </button>
        <button type="button" className={styles.shinyClose} onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>,
    document.body,
  )
}

// ─── Main component ───────────────────────────────────────────────────────

export function TeamPicker({ selected, disabled, onChange, isPremium }: Props) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [data, setData] = useState<{ items: Pokemon[]; totalPages: number; total: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statsTarget, setStatsTarget] = useState<TooltipTarget | null>(null)
  const [shinyModalPokemon, setShinyModalPokemon] = useState<Pokemon | null>(null)
  const [showUpsell, setShowUpsell] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.listPokemon({ page, pageSize: 24, search: search.trim() || undefined })
      .then((r) => { if (!cancelled) setData(r) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, search])

  const selectedSet = new Set(selected.map((s) => s.id))
  const selectedLegendaryCount = selected.filter((s) => LEGENDARY_IDS.includes(s.id)).length

  const toggle = (p: Pokemon, isShiny: boolean) => {
    if (disabled) return
    const id = p.pokedexId
    if (selectedSet.has(id)) {
      onChange(selected.filter((s) => s.id !== id))
    } else if (selected.length < MAX_TEAM) {
      if (LEGENDARY_IDS.includes(id) && selectedLegendaryCount >= 1) return
      onChange([...selected, { id, isShiny }])
    }
  }

  const handleCardClick = (p: Pokemon) => {
    if (disabled) return
    const id = p.pokedexId
    if (selectedSet.has(id)) {
      // Deselect — no shiny modal needed
      onChange(selected.filter((s) => s.id !== id))
      return
    }
    if (selected.length >= MAX_TEAM) return
    if (LEGENDARY_IDS.includes(id) && selectedLegendaryCount >= 1) return

    if (isPremium) {
      setShinyModalPokemon(p)
    } else {
      toggle(p, false)
    }
  }

  const handleShinyBtn = (e: React.MouseEvent, p: Pokemon) => {
    e.stopPropagation()
    if (disabled) return
    if (!selectedSet.has(p.pokedexId)) {
      if (isPremium) {
        setShinyModalPokemon(p)
      } else {
        setShowUpsell(true)
      }
    }
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, p: Pokemon) => {
    setStatsTarget({ pokemon: p, anchor: e.currentTarget.getBoundingClientRect() })
  }

  const handleMouseLeave = () => setStatsTarget(null)

  const handleInfoClick = (e: React.MouseEvent<HTMLButtonElement>, p: Pokemon) => {
    e.stopPropagation()
    setStatsTarget(prev =>
      prev?.pokemon.pokedexId === p.pokedexId
        ? null
        : { pokemon: p, anchor: e.currentTarget.getBoundingClientRect() }
    )
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
              const pickedSlot = selected.find((s) => s.id === p.pokedexId)
              const isLegendary = LEGENDARY_IDS.includes(p.pokedexId)
              const legendaryBlocked = isLegendary && !picked && selectedLegendaryCount >= 1
              return (
                <button
                  key={p.pokedexId}
                  type="button"
                  className={`${styles.card} ${picked ? styles.cardPicked : ''} ${isLegendary ? styles.cardLegendary : ''} ${pickedSlot?.isShiny ? styles.cardShiny : ''}`}
                  onClick={() => handleCardClick(p)}
                  onMouseEnter={(e) => handleMouseEnter(e, p)}
                  onMouseLeave={handleMouseLeave}
                  disabled={disabled || (!picked && selected.length >= MAX_TEAM) || legendaryBlocked}
                  data-primary-type={p.types[0]}
                  style={{ ['--type-glow' as string]: `var(--type-${p.types[0]})` }}
                >
                  {isLegendary && <span className={styles.legendaryBadge}>★</span>}
                  <span className={styles.dexId}>Nº{String(p.pokedexId).padStart(3, '0')}</span>
                  <img
                    src={pickedSlot?.isShiny ? (p.shinySpriteUrl || p.spriteUrl) : p.spriteUrl}
                    alt={p.name}
                    loading="lazy"
                  />
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.types}>
                    {p.types.map((t) => <TypeChip key={t} type={t} />)}
                  </span>
                  {picked && (
                    <span className={styles.checkmark}>
                      {pickedSlot?.isShiny ? '✨' : '✓'}
                    </span>
                  )}
                  {/* Info button (touch) */}
                  <button
                    type="button"
                    className={styles.infoBtn}
                    onClick={(e) => handleInfoClick(e, p)}
                    aria-label={`Ver stats de ${p.name}`}
                  >i</button>
                  {/* Shiny button */}
                  {!picked && !disabled && (
                    <button
                      type="button"
                      className={`${styles.shinyBtn} ${isPremium ? styles.shinyBtnPremium : ''}`}
                      onClick={(e) => handleShinyBtn(e, p)}
                      aria-label={`Versión shiny de ${p.name}`}
                      title={isPremium ? 'Elegir variante shiny' : '✨ Premium feature'}
                    >✨</button>
                  )}
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

      {statsTarget && <StatTooltip target={statsTarget} />}

      {shinyModalPokemon && (
        <ShinyModal
          pokemon={shinyModalPokemon}
          onPick={(isShiny) => {
            toggle(shinyModalPokemon, isShiny)
            setShinyModalPokemon(null)
          }}
          onClose={() => setShinyModalPokemon(null)}
        />
      )}

      {showUpsell && <UpsellModal onClose={() => setShowUpsell(false)} />}
    </div>
  )
}
