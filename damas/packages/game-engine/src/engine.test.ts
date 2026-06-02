/**
 * Pruebas del motor de damas Quings.
 * Ejecutar: `bun test` dentro de packages/game-engine (o `bun run test:engine` en la raíz).
 */

import { describe, expect, test } from "bun:test";
import {
  AI_PAWN,
  AI_QUEEN,
  BOARD_SIZE,
  EMPTY,
  PLAYER_PAWN,
  PLAYER_QUEEN,
  applyMove,
  applyMoveToBoard,
  computeStatus,
  countPieces,
  createInitialBoard,
  createInitialGameState,
  generateCaptureMoves,
  generateLegalMoves,
  generateSimpleMoves,
  isDarkSquare,
  isLegalMove,
  type Move,
} from "./index";

function emptyBoard(): number[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array<number>(BOARD_SIZE).fill(EMPTY));
}

describe("tablero inicial", () => {
  test("12 fichas por lado, todas en casillas oscuras", () => {
    const b = createInitialBoard();
    expect(countPieces(b, "player")).toBe(12);
    expect(countPieces(b, "ai")).toBe(12);
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (b[r][c] !== EMPTY) expect(isDarkSquare(r, c)).toBe(true);
      }
    }
  });

  test("IA arriba (filas 0-2), jugador abajo (filas 5-7)", () => {
    const b = createInitialBoard();
    expect(b[0].some((v) => v === AI_PAWN)).toBe(true);
    expect(b[7].some((v) => v === PLAYER_PAWN)).toBe(true);
  });
});

describe("movimientos simples", () => {
  test("peón del jugador avanza solo hacia arriba", () => {
    const b = emptyBoard();
    b[5][2] = PLAYER_PAWN;
    const moves = generateSimpleMoves(b, "player");
    expect(moves.every((m) => m.to.row === 4)).toBe(true);
    expect(moves.map((m) => `${m.to.row},${m.to.col}`).sort()).toEqual(["4,1", "4,3"]);
  });

  test("peón de la IA avanza solo hacia abajo", () => {
    const b = emptyBoard();
    b[2][3] = AI_PAWN;
    const moves = generateSimpleMoves(b, "ai");
    expect(moves.every((m) => m.to.row === 3)).toBe(true);
  });

  test("la reina se mueve en las 4 diagonales", () => {
    const b = emptyBoard();
    b[4][4] = PLAYER_QUEEN;
    const moves = generateSimpleMoves(b, "player");
    expect(moves.length).toBe(4);
  });
});

describe("capturas", () => {
  test("captura simple del peón del jugador hacia adelante", () => {
    const b = emptyBoard();
    b[5][2] = PLAYER_PAWN;
    b[4][3] = AI_PAWN; // rival adyacente, vacío detrás en [3][4]
    const caps = generateCaptureMoves(b, "player");
    expect(caps.length).toBe(1);
    expect(caps[0].to).toEqual({ row: 3, col: 4 });
    expect(caps[0].captures).toEqual([{ row: 4, col: 3 }]);
  });

  test("captura obligatoria: solo capturas cuando existe alguna", () => {
    const b = emptyBoard();
    b[5][2] = PLAYER_PAWN;
    b[4][3] = AI_PAWN;
    b[6][6] = PLAYER_PAWN; // este podría moverse simple, pero hay captura disponible
    const legal = generateLegalMoves(b, "player");
    expect(legal.every((m) => m.captures.length > 0)).toBe(true);
  });

  test("captura múltiple (doble salto) en una sola jugada", () => {
    const b = emptyBoard();
    b[5][2] = PLAYER_PAWN;
    b[4][3] = AI_PAWN;
    b[2][3] = AI_PAWN; // segundo salto desde [3][4] saltando [2][3] -> [1][2]
    const caps = generateCaptureMoves(b, "player");
    const doble = caps.find((m) => m.captures.length === 2);
    expect(doble).toBeTruthy();
    expect(doble!.to).toEqual({ row: 1, col: 2 });
  });
});

describe("regla de retroceso del peón", () => {
  test("un peón NO puede capturar hacia atrás como primer salto", () => {
    const b = emptyBoard();
    // peón del jugador en [3][3]; rival "detrás" (más abajo) en [4][4], vacío en [5][5].
    b[3][3] = PLAYER_PAWN;
    b[4][4] = AI_PAWN;
    const caps = generateCaptureMoves(b, "player");
    expect(caps.length).toBe(0); // hacia atrás no permitido sin captura previa
  });

  test("un peón SÍ puede capturar hacia atrás tras una captura hacia adelante (cadena)", () => {
    const b = emptyBoard();
    // 1er salto forward: [5][2] salta [4][3] -> [3][4].
    // 2do salto backward: desde [3][4] salta [4][5] -> [5][6].
    b[5][2] = PLAYER_PAWN;
    b[4][3] = AI_PAWN;
    b[4][5] = AI_PAWN;
    const caps = generateCaptureMoves(b, "player");
    const cadena = caps.find((m) => m.captures.length === 2);
    expect(cadena).toBeTruthy();
    expect(cadena!.to).toEqual({ row: 5, col: 6 });
  });
});

describe("promoción", () => {
  test("peón del jugador corona al llegar a fila 0", () => {
    const b = emptyBoard();
    b[1][2] = PLAYER_PAWN;
    const move: Move = { from: { row: 1, col: 2 }, to: { row: 0, col: 1 }, captures: [] };
    const nb = applyMoveToBoard(b, "player", move);
    expect(nb[0][1]).toBe(PLAYER_QUEEN);
  });

  test("peón de la IA corona al llegar a fila 7", () => {
    const b = emptyBoard();
    b[6][1] = AI_PAWN;
    const move: Move = { from: { row: 6, col: 1 }, to: { row: 7, col: 2 }, captures: [] };
    const nb = applyMoveToBoard(b, "ai", move);
    expect(nb[7][2]).toBe(AI_QUEEN);
  });
});

describe("fin de partida", () => {
  test("victoria si la IA se queda sin fichas", () => {
    const b = emptyBoard();
    b[5][2] = PLAYER_PAWN;
    expect(computeStatus(b, "player")).toBe("won");
  });

  test("derrota si el jugador se queda sin fichas", () => {
    const b = emptyBoard();
    b[2][3] = AI_PAWN;
    expect(computeStatus(b, "ai")).toBe("lost");
  });

  test("derrota si el jugador no tiene movimientos legales", () => {
    const b2 = emptyBoard();
    b2[0][7] = PLAYER_PAWN; // peón del jugador en fila 0: no puede avanzar (borde), sin diagonales válidas
    b2[3][3] = AI_PAWN; // la IA aún tiene fichas, así que no es victoria por eliminación
    expect(generateLegalMoves(b2, "player").length).toBe(0);
    expect(computeStatus(b2, "player")).toBe("lost");
  });
});

describe("applyMove (GameState)", () => {
  test("alterna turno y cuenta solo movimientos del humano", () => {
    const s0 = createInitialGameState();
    const legal = generateLegalMoves(s0.board, "player");
    const s1 = applyMove(s0, legal[0]);
    expect(s1.turn).toBe("ai");
    expect(s1.moveCount).toBe(1);
    expect(s1.history.length).toBe(1);

    const aiMoves = generateLegalMoves(s1.board, "ai");
    const s2 = applyMove(s1, aiMoves[0]);
    expect(s2.turn).toBe("player");
    expect(s2.moveCount).toBe(1); // el movimiento de la IA no cuenta
  });

  test("rechaza movimientos ilegales", () => {
    const s0 = createInitialGameState();
    expect(() =>
      applyMove(s0, { from: { row: 5, col: 0 }, to: { row: 3, col: 0 }, captures: [] }),
    ).toThrow();
  });

  test("isLegalMove valida contra la captura obligatoria", () => {
    const b = emptyBoard();
    b[5][2] = PLAYER_PAWN;
    b[4][3] = AI_PAWN;
    // intento de movimiento simple ignorando la captura obligatoria
    expect(
      isLegalMove(b, "player", { from: { row: 5, col: 2 }, to: { row: 4, col: 1 }, captures: [] }),
    ).toBe(false);
  });
});
