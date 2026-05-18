import type { PokeType } from '@pokept/shared'

export function TypeChip({ type }: { type: PokeType }) {
  return (
    <span
      className="type-chip"
      style={{ background: `var(--type-${type})` }}
    >
      {type}
    </span>
  )
}
