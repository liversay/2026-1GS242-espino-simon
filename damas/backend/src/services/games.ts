/**
 * services/games.ts — Lógica de partidas. Valida con @quings/game-engine, aplica el
 * movimiento humano, solicita el movimiento de la IA al microservicio, persiste en Mongo
 * y otorga la recompensa de Coronas al ganar.
 */

import {
  type GameState,
  type Move,
  applyMove,
  createInitialGameState,
  findLegalMove,
} from "@quings/game-engine";
import { type GameDoc, ObjectId, games, transactions, users } from "../db/collections";
import { requestAiMove } from "../ai/client";

/** Recompensa de Coronas al ganar (PRD §8.3): menos movimientos => más Coronas. */
export function winReward(moveCount: number): number {
  return 50 + Math.max(0, (80 - moveCount) * 2);
}

function toState(g: GameDoc): GameState {
  return { board: g.board, turn: g.turn, status: g.status, moveCount: g.moveCount, history: g.history };
}

export async function createGame(userId: ObjectId): Promise<GameDoc> {
  const s = createInitialGameState();
  const now = new Date();
  const doc: GameDoc = {
    userId,
    board: s.board,
    turn: s.turn,
    status: s.status,
    moveCount: s.moveCount,
    history: s.history,
    createdAt: now,
    updatedAt: now,
  };
  const res = (await games()).insertOne(doc);
  return { ...doc, _id: (await res).insertedId };
}

export async function listInProgressGames(userId: ObjectId): Promise<GameDoc[]> {
  return (await games())
    .find({ userId, status: "in_progress" })
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function getGame(userId: ObjectId, gameId: string): Promise<GameDoc | null> {
  if (!ObjectId.isValid(gameId)) return null;
  return (await games()).findOne({ _id: new ObjectId(gameId), userId });
}

async function persist(gameId: ObjectId, state: GameState): Promise<void> {
  await (await games()).updateOne(
    { _id: gameId },
    {
      $set: {
        board: state.board,
        turn: state.turn,
        status: state.status,
        moveCount: state.moveCount,
        history: state.history,
        updatedAt: new Date(),
      },
    },
  );
}

/** Actualiza estadísticas del usuario y otorga recompensa cuando una partida termina. */
async function finalize(userId: ObjectId, state: GameState): Promise<void> {
  const usersCol = await users();
  if (state.status === "won") {
    const reward = winReward(state.moveCount);
    await usersCol.updateOne({ _id: userId }, {
      $inc: { totalGames: 1, totalWins: 1, coronas: reward },
      $min: { bestWinMoves: state.moveCount },
      $set: { updatedAt: new Date() },
    });
    // $min no inicializa null -> aseguramos bestWinMoves si estaba en null.
    await usersCol.updateOne(
      { _id: userId, bestWinMoves: null },
      { $set: { bestWinMoves: state.moveCount } },
    );
    await (await transactions()).insertOne({
      userId,
      type: "win_reward",
      amount: reward,
      createdAt: new Date(),
    });
  } else if (state.status === "lost") {
    await usersCol.updateOne(
      { _id: userId },
      { $inc: { totalGames: 1 }, $set: { updatedAt: new Date() } },
    );
  }
}

export interface MoveResult {
  game: GameDoc;
  aiMove: Move | null;
  finished: boolean;
}

/**
 * Aplica el movimiento del humano; si la partida sigue y toca a la IA, solicita y aplica
 * su jugada. Devuelve el GameState completo persistido.
 */
export async function playHumanMove(
  userId: ObjectId,
  gameId: string,
  requested: Move,
): Promise<MoveResult> {
  const game = await getGame(userId, gameId);
  if (!game) throw new HttpError(404, "Partida no encontrada");
  if (game.status !== "in_progress") throw new HttpError(409, "La partida ya terminó");
  if (game.turn !== "player") throw new HttpError(409, "No es el turno del jugador");

  // Validar el movimiento humano contra las reglas (captura obligatoria, retroceso, etc.).
  if (!findLegalMove(game.board, "player", requested)) {
    throw new HttpError(422, "Movimiento ilegal");
  }

  let state = applyMove(toState(game), requested);
  let aiMove: Move | null = null;

  // Si la partida sigue y toca a la IA, pedir su jugada al microservicio A*.
  if (state.status === "in_progress" && state.turn === "ai") {
    aiMove = await requestAiMove(state.board, "ai");
    if (!findLegalMove(state.board, "ai", aiMove)) {
      throw new HttpError(502, "La IA devolvió un movimiento ilegal");
    }
    state = applyMove(state, aiMove);
  }

  await persist(game._id!, state);
  if (state.status !== "in_progress") {
    await finalize(userId, state);
  }

  const updated = await getGame(userId, gameId);
  return { game: updated!, aiMove, finished: state.status !== "in_progress" };
}

export async function resignGame(userId: ObjectId, gameId: string): Promise<GameDoc> {
  const game = await getGame(userId, gameId);
  if (!game) throw new HttpError(404, "Partida no encontrada");
  if (game.status !== "in_progress") throw new HttpError(409, "La partida ya terminó");

  const state: GameState = { ...toState(game), status: "lost" };
  await persist(game._id!, state);
  await finalize(userId, state);
  return (await getGame(userId, gameId))!;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
