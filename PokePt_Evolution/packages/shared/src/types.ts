// Tipos compartidos entre el API (Hono) y el frontend (TanStack Start).
// Cada tipo persistido en Mongo se modela tal como aparece en el documento.

export type StageId =
  | 'beach'
  | 'beach-2'
  | 'beach-night'
  | 'cave'
  | 'cave-2'
  | 'cave-night'
  | 'desert'
  | 'desert-night'
  | 'lake'
  | 'lake-night'
  | 'mountain'
  | 'mountain-2'
  | 'mountain-night'
  | 'ocean'
  | 'ocean-night'
  | 'path'
  | 'path-2'
  | 'path-night'
  | 'snow'
  | 'snow-night'
  | 'tall-grass'
  | 'tall-grass-night'
  | 'underwater'

export const ALL_STAGE_IDS: StageId[] = [
  'beach', 'beach-2', 'beach-night',
  'cave', 'cave-2', 'cave-night',
  'desert', 'desert-night',
  'lake', 'lake-night',
  'mountain', 'mountain-2', 'mountain-night',
  'ocean', 'ocean-night',
  'path', 'path-2', 'path-night',
  'snow', 'snow-night',
  'tall-grass', 'tall-grass-night',
  'underwater',
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
  shinySpriteUrl: string
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
  teamShinyIds: number[]
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
  isShiny: boolean
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
  | { kind: 'send_out'; playerId: string; pokemonName: string }
  | { kind: 'faint'; playerId: string; pokemonName: string }
  | { kind: 'effectiveness'; effectiveness: LogEffectiveness }
  | { kind: 'turn-start'; playerId: string; playerName: string }
  | { kind: 'victory'; winnerId: string; winnerName: string }

export type BattleStatus = 'coin-flip' | 'in-progress' | 'finished'

export type CoinFace = 'heads' | 'tails'

export interface CoinFlipState {
  guestChoice: CoinFace | null
  result: CoinFace | null
  winnerId: string | null
  completedAt: string | null
  /** Set when the guest clicks Continue; hides the overlay for both players. */
  acknowledgedAt: string | null
}

/** Pokédex IDs of legendary/mythical Pokémon available in the first 340. */
export const LEGENDARY_IDS: number[] = [144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251]

export interface Battle {
  roomCode: string
  turn: number
  status: BattleStatus
  stageId: StageId
  hostPlayerId: string
  players: BattlePlayer[]
  /** Quien tiene el turno actual. null durante coin-flip y al finished. */
  currentTurnPlayerId: string | null
  /** Si != null, ese jugador debe enviar SOLO una acción 'switch' antes de continuar. */
  mustSwitchPlayerId: string | null
  coinFlip: CoinFlipState
  log: LogEntry[]
  winnerId?: string
  createdAt: string
  updatedAt: string
}
