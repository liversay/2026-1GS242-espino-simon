/**
 * heuristic.ts — Evaluación ponderada del tablero desde la perspectiva de la IA.
 *
 * Heurística principal (minimizadora, PRD §6.2):
 *   h = cantidad de formas en que el oponente puede capturar mis fichas.
 * Combinada con factores de material, capturas disponibles, control de centro,
 * exposición de fichas, reinas y cercanía de promoción. Valor positivo => mejor para la IA.
 */

import {
  AI_PAWN,
  AI_QUEEN,
  PLAYER_PAWN,
  PLAYER_QUEEN,
  type Player,
  generateCaptureMoves,
  opponent,
  ownerOf,
} from "@quings/game-engine";

const PAWN_VALUE = 1;
const QUEEN_VALUE = 1.6;

function material(board: number[][], player: Player): number {
  let m = 0;
  for (const row of board) {
    for (const v of row) {
      if (ownerOf(v) !== player) continue;
      m += v === PLAYER_QUEEN || v === AI_QUEEN ? QUEEN_VALUE : PAWN_VALUE;
    }
  }
  return m;
}

/** Fichas de `player` en el bloque central (filas/cols 2..5). */
function centerControl(board: number[][], player: Player): number {
  let n = 0;
  for (let r = 2; r <= 5; r++) {
    for (let c = 2; c <= 5; c++) {
      if (ownerOf(board[r][c]) === player) n++;
    }
  }
  return n;
}

/** Número de fichas distintas de `player` que el rival amenaza con capturar. */
function exposedPieces(board: number[][], player: Player): number {
  const enemy = opponent(player);
  const caps = generateCaptureMoves(board, enemy);
  const threatened = new Set<string>();
  for (const m of caps) {
    for (const cap of m.captures) {
      if (ownerOf(board[cap.row][cap.col]) === player) {
        threatened.add(`${cap.row},${cap.col}`);
      }
    }
  }
  return threatened.size;
}

function queenCount(board: number[][], player: Player): number {
  const q = player === "ai" ? AI_QUEEN : PLAYER_QUEEN;
  let n = 0;
  for (const row of board) for (const v of row) if (v === q) n++;
  return n;
}

/** Cercanía de promoción: peones de la IA cuanto más cerca de la fila 7, mejor. */
function promotionProximity(board: number[][]): number {
  let score = 0;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === AI_PAWN) score += r / 7;
      else if (board[r][c] === PLAYER_PAWN) score -= (7 - r) / 7;
    }
  }
  return score;
}

/**
 * Evaluación final desde la perspectiva de la IA (mayor = mejor para la IA).
 * Pesos del PRD §6.2.
 */
export function evaluate(board: number[][]): number {
  const materialIA = material(board, "ai");
  const materialRival = material(board, "player");

  // Heurística principal: formas en que el oponente puede capturar fichas de la IA.
  const amenazasContraIA = generateCaptureMoves(board, "player").length;
  // Capturas disponibles para la IA (favorecer capturar).
  const capturasIA = generateCaptureMoves(board, "ai").length;

  const centroIA = centerControl(board, "ai");
  const centroRival = centerControl(board, "player");
  const fichasIAExpuestas = exposedPieces(board, "ai");
  const reinasIA = queenCount(board, "ai");
  const cercaniaPromocionIA = promotionProximity(board);

  return (
    10 * (materialIA - materialRival) -
    15 * amenazasContraIA +
    8 * capturasIA +
    2 * (centroIA - centroRival) -
    6 * fichasIAExpuestas +
    3 * reinasIA +
    cercaniaPromocionIA
  );
}
