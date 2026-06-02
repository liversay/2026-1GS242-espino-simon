/**
 * Pruebas del A* del ai-service: legalidad, captura obligatoria y juego razonable.
 */

import { describe, expect, test } from "bun:test";
import {
  AI_PAWN,
  BOARD_SIZE,
  EMPTY,
  PLAYER_PAWN,
  createInitialBoard,
  isLegalMove,
} from "@quings/game-engine";
import { findBestMove } from "./astar";

function emptyBoard(): number[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array<number>(BOARD_SIZE).fill(EMPTY));
}

describe("A* findBestMove", () => {
  test("devuelve un movimiento legal en el tablero inicial", () => {
    const board = createInitialBoard();
    const res = findBestMove(board, "ai");
    expect(res.move).not.toBeNull();
    expect(isLegalMove(board, "ai", res.move!)).toBe(true);
    expect(res.nodesExplored).toBeGreaterThan(0);
  });

  test("toma una captura obligatoria cuando existe", () => {
    const b = emptyBoard();
    // IA en [3][3] puede capturar peón del jugador en [4][4] aterrizando en [5][5].
    b[3][3] = AI_PAWN;
    b[4][4] = PLAYER_PAWN;
    const res = findBestMove(b, "ai");
    expect(res.move).not.toBeNull();
    expect(res.move!.captures.length).toBeGreaterThan(0);
    expect(res.move!.to).toEqual({ row: 5, col: 5 });
  });

  test("prefiere una doble captura sobre una simple", () => {
    const b = emptyBoard();
    b[2][2] = AI_PAWN;
    b[3][3] = PLAYER_PAWN; // salto -> [4][4]
    b[5][5] = PLAYER_PAWN; // segundo salto -> [6][6]
    const res = findBestMove(b, "ai");
    expect(res.move!.captures.length).toBe(2);
  });

  test("no devuelve movimiento si no hay jugadas", () => {
    const b = emptyBoard();
    b[5][2] = PLAYER_PAWN; // sin fichas de la IA
    const res = findBestMove(b, "ai");
    expect(res.move).toBeNull();
  });
});
