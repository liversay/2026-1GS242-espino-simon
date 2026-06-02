/**
 * rules.ts — Aplicación de movimientos, promoción, detección de fin de partida
 * y validación de legalidad.
 */

import {
  AI_PAWN,
  AI_QUEEN,
  EMPTY,
  PLAYER_PAWN,
  PLAYER_QUEEN,
  type GameState,
  type GameStatus,
  type Move,
  type Player,
  cloneBoard,
  coordsEqual,
  countPieces,
  opponent,
  promotionRow,
} from "./board";
import { generateLegalMoves } from "./moves";

function sameCaptures(a: { row: number; col: number }[], b: { row: number; col: number }[]): boolean {
  if (a.length !== b.length) return false;
  // Comparación independiente del orden.
  const setB = new Set(b.map((c) => `${c.row},${c.col}`));
  return a.every((c) => setB.has(`${c.row},${c.col}`));
}

/** Busca el movimiento legal que coincide con el solicitado (from/to/captures). */
export function findLegalMove(board: number[][], player: Player, requested: Move): Move | null {
  const legal = generateLegalMoves(board, player);
  return (
    legal.find(
      (m) =>
        coordsEqual(m.from, requested.from) &&
        coordsEqual(m.to, requested.to) &&
        sameCaptures(m.captures, requested.captures ?? []),
    ) ?? null
  );
}

export function isLegalMove(board: number[][], player: Player, requested: Move): boolean {
  return findLegalMove(board, player, requested) !== null;
}

/**
 * Aplica un movimiento al tablero (no valida; usar findLegalMove antes).
 * Maneja remoción de capturas y promoción a reina.
 */
export function applyMoveToBoard(board: number[][], player: Player, move: Move): number[][] {
  const b = cloneBoard(board);
  const piece = b[move.from.row][move.from.col];
  b[move.from.row][move.from.col] = EMPTY;

  for (const cap of move.captures) {
    b[cap.row][cap.col] = EMPTY;
  }

  let landed = piece;
  // Promoción: peón que llega a su fila de coronación.
  if (piece === PLAYER_PAWN && move.to.row === promotionRow("player")) {
    landed = PLAYER_QUEEN;
  } else if (piece === AI_PAWN && move.to.row === promotionRow("ai")) {
    landed = AI_QUEEN;
  }
  b[move.to.row][move.to.col] = landed;
  return b;
}

/** Estado de la partida desde la perspectiva del jugador humano, dado el tablero y el turno. */
export function computeStatus(board: number[][], turn: Player): GameStatus {
  const aiPieces = countPieces(board, "ai");
  const playerPieces = countPieces(board, "player");

  if (aiPieces === 0) return "won";
  if (playerPieces === 0) return "lost";

  // Sin movimientos legales para quien le toca => pierde.
  const moves = generateLegalMoves(board, turn);
  if (moves.length === 0) {
    return turn === "player" ? "lost" : "won";
  }
  return "in_progress";
}

/**
 * Aplica un movimiento legal a un GameState completo: actualiza tablero, turno,
 * moveCount (solo cuenta movimientos del humano), history y status.
 */
export function applyMove(state: GameState, move: Move): GameState {
  const legal = findLegalMove(state.board, state.turn, move);
  if (!legal) {
    throw new Error("Movimiento ilegal");
  }

  const board = applyMoveToBoard(state.board, state.turn, legal);
  const nextTurn = opponent(state.turn);
  const moveCount = state.turn === "player" ? state.moveCount + 1 : state.moveCount;
  const status = computeStatus(board, nextTurn);

  return {
    board,
    turn: nextTurn,
    status,
    moveCount,
    history: [...state.history, legal],
  };
}

/** ¿La partida terminó (desde la perspectiva del humano)? */
export function isGameOver(state: GameState): boolean {
  return state.status !== "in_progress";
}

/** Marca una rendición del humano como derrota. */
export function resign(state: GameState): GameState {
  return { ...state, status: "lost" };
}

export { PLAYER_PAWN, AI_PAWN, PLAYER_QUEEN, AI_QUEEN };
