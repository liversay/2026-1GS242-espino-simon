import { ALL_STAGE_IDS, type StageId } from '@pokept/shared'
import styles from './stages.module.css'

function toLabel(id: StageId): string {
  const parts = id.split('-')
  const last = parts[parts.length - 1]!
  if (last === '2') parts[parts.length - 1] = '(Alt)'
  else if (last === 'night') parts[parts.length - 1] = '(Night)'
  return parts
    .map((w) => (w.startsWith('(') ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

export const STAGE_LABELS: Record<StageId, string> = Object.fromEntries(
  ALL_STAGE_IDS.map((id) => [id, toLabel(id)]),
) as Record<StageId, string>

export function Stage({ id }: { id: StageId }) {
  return (
    <div className={styles.stage}>
      <div
        className={styles.scenarioBg}
        style={{ backgroundImage: `url(/scenarios/${id}.png)` }}
      />
      <div className={styles.overlay} />
    </div>
  )
}
