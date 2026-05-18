import type { StatusKind } from '@pokept/shared'

const LABEL: Record<StatusKind, string> = {
  burn: 'BRN',
  poison: 'PSN',
  paralysis: 'PAR',
  'atk-': 'ATK↓',
  'def-': 'DEF↓',
  'spe-': 'SPE↓',
}

const BG: Record<StatusKind, string> = {
  burn: '#ee6433',
  poison: '#a040a0',
  paralysis: '#f0c030',
  'atk-': '#cf444f',
  'def-': '#4f70cf',
  'spe-': '#4fa860',
}

export function StatusBadge({ status }: { status: StatusKind }) {
  return (
    <span
      className="bounce-in"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        background: BG[status],
        color: 'white',
        textShadow: '1px 1px 0 rgba(0,0,0,0.4)',
        padding: '2px 6px',
        border: '2px solid var(--pp-ink)',
        letterSpacing: '0.05em',
      }}
    >
      {LABEL[status]}
    </span>
  )
}
