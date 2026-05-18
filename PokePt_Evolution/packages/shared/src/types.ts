// Tipos compartidos entre el API (Hono) y el frontend (TanStack Start).
// Cada tipo persistido en Mongo se modela tal como aparece en el documento.

export type StageId =
  | 'pradera-sinnoh'
  | 'mt-coronet'
  | 'lago-veraz'
  | 'liga-pokemon'
  | 'bosque-eterno'
  | 'cumbre-nevada'

export const ALL_STAGE_IDS: StageId[] = [
  'pradera-sinnoh',
  'mt-coronet',
  'lago-veraz',
  'liga-pokemon',
  'bosque-eterno',
  'cumbre-nevada',
]

export type PokeType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy'

export type DamageClass = 'physical' | 'special' | 'status'

export type StatusKind =
  | 'burn' | 'poison' | 'paralysis'
  | 'atk-' | 'def-' | 'spe-'

export interface BaseStats {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export interface MoveEffect {
  kind: StatusKind
  chance: number  // 1-100
}

export interface Move {
  moveId: number
  name: string
  type: PokeType
  power: number  // 0 si status
  accuracy: number  // 1-100, 100 si no falla nunca
  priority: number
  damageClass: DamageClass
  effect?: MoveEffect
}

export interface Pokemon {
  pokedexId: number
  name: string
  types: PokeType[]
  baseStats: BaseStats
  spriteUrl: string
  moveIds: number[]  // 4 movs referenciando Move.moveId
}

export interface TypeRelations {
  name: PokeType
  doubleDamageFrom: PokeType[]
  halfDamageFrom: PokeType[]
  noDamageFrom: PokeType[]
}

export interface RoomPlayer {
  id: string
  name: string
  ready: boolean
  teamPokemonIds: number[]
}

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface Room {
  code: string
  status: RoomStatus
  hostPlayerId: string
  stageId: StageId
  players: RoomPlayer[]
  createdAt: string
}

export interface BattleIvs {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number
}

export interface BattleStats {
  maxHp: number
  atk: number; def: number; spa: number; spd: number; spe: number
}

export interface StatStages {
  atk: number; def: number; spa: number; spd: number; spe: number
}

export interface PokemonStatus {
  kind: StatusKind
  remainingTurns: number
}

export interface BattleMove {
  moveId: number
  name: string
  type: PokeType
  power: number
  accuracy: number
  priority: number
  damageClass: DamageClass
  effect?: MoveEffect
}

export interface BattlePokemon {
  speciesId: number
  name: string
  types: PokeType[]
  level: number
  ivs: BattleIvs
  currentHp: number
  stats: BattleStats
  moves: BattleMove[]
  statStages: StatStages
  status?: PokemonStatus
  spriteUrl: string
  fainted: boolean
}

export interface BattlePlayer {
  id: string
  name: string
  team: BattlePokemon[]
  activeIndex: number
}

export type ActionType = 'move' | 'switch'

export type BattleAction =
  | { type: 'move'; moveId: number }
  | { type: 'switch'; targetIndex: number }

export type LogEffectiveness = 'super' | 'normal' | 'low' | 'none'

export type LogEntry =
  | { kind: 'announce'; text: string }
  | { kind: 'move'; playerId: string; pokemonName: string; moveName: string }
  | { kind: 'damage'; playerId: string; targetIndex: number; amount: number; isCrit: boolean; effectiveness: LogEffectiveness }
  | { kind: 'miss'; playerId: string; pokemonName: string }
  | { kind: 'status-apply'; playerId: string; targetIndex: number; status: StatusKind }
  | { kind: 'status-tick'; playerId: string; targetIndex: number; status: StatusKind; amount: number }
  | { kind: 'status-end'; playerId: string; targetIndex: number; status: StatusKind }
  | { kind: 'switch'; playerId: string; fromIndex: number; toIndex: number; pokemonName: string }
  | { kind: 'faint'; playerId: string; pokemonName: string }
  | { kind: 'effectiveness'; effectiveness: LogEffectiveness }
  | { kind: 'victory'; winnerId: string; winnerName: string }

export type BattleStatus = 'in-progress' | 'finished'

export interface Battle {
  roomCode: string
  turn: number
  status: BattleStatus
  stageId: StageId
  players: BattlePlayer[]
  pendingActions: Record<string, BattleAction>
  awaitingPlayers: string[]
  log: LogEntry[]
  winnerId?: string
  createdAt: string
  updatedAt: string
}
