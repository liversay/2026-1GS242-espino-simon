/**
 * moves.ts — Generación de movimientos legales.
 *
 * Reglas implementadas (PRD §4):
 *  - Movimiento simple en diagonal (peón solo hacia adelante; reina ambos sentidos).
 *  - Captura saltando ficha rival adyacente hacia casilla vacía detrás.
 *  - Capturas múltiples obligatorias: mientras existan saltos en la cadena, se continúa.
 *  - Captura obligatoria: si hay alguna captura disponible, solo se permiten capturas.
 *  - Regla de retroceso del peón: un peón solo puede capturar hacia atrás si dentro del
 *    mismo turno ya capturó hacia adelante (bandera `hasCapturedForward` en la cadena).
 *  - Promoción: si un peón aterriza en su fila de coronación, corona y termina la cadena.
 */

import {
  EMPTY,
  type Coord,
  type Move,
  type Player,
  cloneBoard,
  inBounds,
  isEnemy,
  isQueen,
  ownerOf,
  promotionRow,
} from "./board";

const COL_DIRS = [-1, 1];
const ROW_DIRS = [-1, 1];

function forwardRowDir(player: Player): number {
  return player === "player" ? -1 : 1;
}

interface CapturePath {
  to: Coord;
  captures: Coord[];
}

function key(r: number, c: number): string {
  return `${r},${c}`;
}

/**
 * Búsqueda recursiva de cadenas de captura desde una posición.
 * `wb` es un tablero de trabajo con la ficha origen ya removida; las fichas
 * capturadas permanecen físicamente (bloquean aterrizajes) pero se registran en
 * `capturedKeys` para no saltarlas dos veces.
 */
function explodeCaptures(
  wb: number[][],
  player: Player,
  isKing: boolean,
  cur: Coord,
  captured: Coord[],
  capturedKeys: Set<string>,
  hasCapturedForward: boolean,
  out: CapturePath[],
): void {
  const fwd = forwardRowDir(player);
  const before = out.length;

  for (const dr of ROW_DIRS) {
    for (const dc of COL_DIRS) {
      // Peón: solo hacia atrás si ya capturó hacia adelante en esta cadena.
      if (!isKing && dr !== fwd && !hasCapturedForward) continue;

      const er = cur.row + dr;
      const ec = cur.col + dc;
      const lr = cur.row + 2 * dr;
      const lc = cur.col + 2 * dc;

      if (!inBounds(lr, lc) || !inBounds(er, ec)) continue;
      if (wb[lr][lc] !== EMPTY) continue; // aterrizaje debe estar vacío
      if (!isEnemy(wb[er][ec], player)) continue;
      if (capturedKeys.has(key(er, ec))) continue; // ya saltada

      const newCaptured = [...captured, { row: er, col: ec }];
      const newKeys = new Set(capturedKeys);
      newKeys.add(key(er, ec));
      const newHasFwd = hasCapturedForward || dr === fwd;
      const promoted = !isKing && lr === promotionRow(player);

      if (promoted) {
        // Coronar termina la cadena.
        out.push({ to: { row: lr, col: lc }, captures: newCaptured });
      } else {
        const branchBefore = out.length;
        explodeCaptures(
          wb,
          player,
          isKing,
          { row: lr, col: lc },
          newCaptured,
          newKeys,
          newHasFwd,
          out,
        );
        // Si no se pudo extender, esta posición es hoja (fin de cadena).
        if (out.length === branchBefore) {
          out.push({ to: { row: lr, col: lc }, captures: newCaptured });
        }
      }
    }
  }

  // Si nada se agregó y no estábamos en raíz, el llamador lo trata como hoja.
  void before;
}

/** Todas las capturas legales del jugador (cadenas máximas por rama). */
export function generateCaptureMoves(board: number[][], player: Player): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (ownerOf(board[r][c]) !== player) continue;
      const isKing = isQueen(board[r][c]);
      const wb = cloneBoard(board);
      wb[r][c] = EMPTY;
      const paths: CapturePath[] = [];
      explodeCaptures(wb, player, isKing, { row: r, col: c }, [], new Set(), false, paths);
      for (const p of paths) {
        moves.push({ from: { row: r, col: c }, to: p.to, captures: p.captures });
      }
    }
  }
  return moves;
}

/** Movimientos simples (sin captura) del jugador. */
export function generateSimpleMoves(board: number[][], player: Player): Move[] {
  const moves: Move[] = [];
  const fwd = forwardRowDir(player);
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (ownerOf(board[r][c]) !== player) continue;
      const isKing = isQueen(board[r][c]);
      const rowDirs = isKing ? ROW_DIRS : [fwd];
      for (const dr of rowDirs) {
        for (const dc of COL_DIRS) {
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          if (board[nr][nc] !== EMPTY) continue;
          moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc }, captures: [] });
        }
      }
    }
  }
  return moves;
}

/**
 * Movimientos legales del jugador en el tablero dado.
 * Aplica captura obligatoria: si existe al menos una captura, solo se devuelven capturas.
 */
export function generateLegalMoves(board: number[][], player: Player): Move[] {
  const captures = generateCaptureMoves(board, player);
  if (captures.length > 0) return captures;
  return generateSimpleMoves(board, player);
}

export function hasAnyCapture(board: number[][], player: Player): boolean {
  return generateCaptureMoves(board, player).length > 0;
}
