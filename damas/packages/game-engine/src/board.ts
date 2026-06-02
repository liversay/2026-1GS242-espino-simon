/**
 * board.ts — Tipos base y matriz 8x8 del tablero de damas Quings.
 *
 * Convención (PRD §5):
 *   board[row][col], fila 0 = arriba.
 *   0 = vacía, 1 = peón jugador, 2 = peón IA, 3 = reina jugador, 4 = reina IA.
 *
 * Orientación: el jugador humano avanza hacia ARRIBA (filas decrecientes);
 * la IA avanza hacia ABAJO (filas crecientes).
 */

export type Player = "player" | "ai";

export interface Coord {
  row: number;
  col: number;
}

/** Un movimiento aplicado. `captures` vacío => movimiento simple. */
export interface Move {
  from: Coord;
  to: Coord;
  captures: Coord[];
}

export type GameStatus = "in_progress" | "won" | "lost";

export interface GameState {
  board: number[][]; // 8x8
  turn: Player;
  /** status desde la perspectiva del jugador humano */
  status: GameStatus;
  /** movimientos hechos por el jugador humano (para ranking) */
  moveCount: number;
  history: Move[];
}

// ---- Valores de celda ----
export const EMPTY = 0;
export const PLAYER_PAWN = 1;
export const AI_PAWN = 2;
export const PLAYER_QUEEN = 3;
export const AI_QUEEN = 4;

export const BOARD_SIZE = 8;

/** Direcciones diagonales hacia "adelante" según el jugador. */
export function forwardDirs(player: Player): number[] {
  // player sube (row-1), ai baja (row+1)
  return player === "player" ? [-1] : [1];
}

export const ALL_DIAG_ROW_DIRS = [-1, 1];
export const DIAG_COL_DIRS = [-1, 1];

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** Las fichas viven en casillas oscuras: (row + col) impar. */
export function isDarkSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 1;
}

export function isEmpty(v: number): boolean {
  return v === EMPTY;
}

export function isQueen(v: number): boolean {
  return v === PLAYER_QUEEN || v === AI_QUEEN;
}

export function isPawn(v: number): boolean {
  return v === PLAYER_PAWN || v === AI_PAWN;
}

/** Dueño de una ficha, o null si la celda está vacía. */
export function ownerOf(v: number): Player | null {
  if (v === PLAYER_PAWN || v === PLAYER_QUEEN) return "player";
  if (v === AI_PAWN || v === AI_QUEEN) return "ai";
  return null;
}

export function isEnemy(v: number, player: Player): boolean {
  const o = ownerOf(v);
  return o !== null && o !== player;
}

export function opponent(player: Player): Player {
  return player === "player" ? "ai" : "player";
}

/** Fila de promoción (donde un peón corona) para cada jugador. */
export function promotionRow(player: Player): number {
  return player === "player" ? 0 : BOARD_SIZE - 1;
}

export function cloneBoard(board: number[][]): number[][] {
  return board.map((r) => r.slice());
}

/**
 * Posición inicial estándar de damas: 3 filas por lado en casillas oscuras.
 * IA arriba (filas 0,1,2), jugador abajo (filas 5,6,7).
 */
export function createInitialBoard(): number[][] {
  const board: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array<number>(BOARD_SIZE).fill(EMPTY),
  );
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!isDarkSquare(row, col)) continue;
      if (row <= 2) board[row][col] = AI_PAWN;
      else if (row >= 5) board[row][col] = PLAYER_PAWN;
    }
  }
  return board;
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    turn: "player",
    status: "in_progress",
    moveCount: 0,
    history: [],
  };
}

export function coordsEqual(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col;
}

export function countPieces(board: number[][], player: Player): number {
  let n = 0;
  for (const row of board) {
    for (const v of row) {
      if (ownerOf(v) === player) n++;
    }
  }
  return n;
}
