// Wrapper común para los escenarios. Cada Stage es un div absolute-positioned
// dentro de su contenedor (relative) que llena 100% y tiene 3 capas opcionales.

import type { StageId } from '@pokept/shared'
import { PraderaSinnoh } from './PraderaSinnoh'
import { MtCoronet } from './MtCoronet'
import { LagoVeraz } from './LagoVeraz'
import { LigaPokemon } from './LigaPokemon'
import { BosqueEterno } from './BosqueEterno'
import { CumbreNevada } from './CumbreNevada'

interface StageProps {
  id: StageId
  scale?: number
  showLabel?: boolean
}

const LABELS: Record<StageId, string> = {
  'pradera-sinnoh': 'Pradera de Sinnoh',
  'mt-coronet': 'Cueva Mt. Coronet',
  'lago-veraz': 'Lago Veraz',
  'liga-pokemon': 'Estadio Liga Pokémon',
  'bosque-eterno': 'Bosque Eterno',
  'cumbre-nevada': 'Cumbre Nevada',
}

export const STAGE_LABELS = LABELS

export function Stage({ id }: StageProps) {
  switch (id) {
    case 'pradera-sinnoh': return <PraderaSinnoh />
    case 'mt-coronet': return <MtCoronet />
    case 'lago-veraz': return <LagoVeraz />
    case 'liga-pokemon': return <LigaPokemon />
    case 'bosque-eterno': return <BosqueEterno />
    case 'cumbre-nevada': return <CumbreNevada />
  }
}
