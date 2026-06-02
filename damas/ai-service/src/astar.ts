/**
 * astar.ts — Selección de jugada de la IA mediante búsqueda A* (f(n) = g(n) + h(n)).
 *
 * Modelo (PRD §6.1):
 *  - Nodo  = estado del tablero. Aristas = movimientos legales (game-engine, incl. captura
 *    obligatoria y cadenas de captura como una sola jugada).
 *  - g(n)  = profundidad/costo acumulado del camino desde la raíz.
 *  - h(n)  = heurística (evaluate, perspectiva de la IA). Ver heuristic.ts.
 *  - f(n)  = g(n) + h(n).
 *  - Frontera = cola de prioridad ordenada por f(n). Se expande el nodo más prometedor
 *    primero (best-first). Al alcanzar profundidad máxima (3) o un estado terminal, la hoja
 *    se evalúa y su valor se PROPAGA hacia la raíz con respaldo MIN/MAX:
 *      · nodo donde mueve la IA   -> MAX (la IA maximiza su evaluación)
 *      · nodo donde mueve el rival -> MIN (el rival minimiza la evaluación de la IA)
 *  - Se devuelve el movimiento de PRIMER NIVEL que conduce al mejor valor para la IA.
 *
 * No usa LLMs: es una función pura tablero -> mejor movimiento.
 */

import {
  type Move,
  type Player,
  applyMoveToBoard,
  countPieces,
  generateLegalMoves,
  opponent,
} from "@quings/game-engine";
import { evaluate } from "./heuristic";

export const MAX_DEPTH = 3;
const TERMINAL = 1_000_000;

export interface BestMoveResult {
  move: Move | null;
  score: number;
  nodesExplored: number;
  depth: number;
}

interface SearchNode {
  board: number[][];
  toMove: Player; // quién mueve en este nodo
  depth: number; // g(n)
  rootMove: Move | null; // jugada de primer nivel de la que desciende esta rama
  h: number; // heurística (perspectiva IA)
  f: number; // g + h
  children: SearchNode[];
  isLeaf: boolean;
}

function makeNode(
  board: number[][],
  toMove: Player,
  depth: number,
  rootMove: Move | null,
): SearchNode {
  const h = evaluate(board);
  return { board, toMove, depth, rootMove, h, f: depth + h, children: [], isLeaf: false };
}

/** Valor de una hoja desde la perspectiva de la IA, con desempate por profundidad. */
function leafValue(node: SearchNode, ai: Player): number {
  const aiPieces = countPieces(node.board, ai);
  const rivalPieces = countPieces(node.board, opponent(ai));
  if (rivalPieces === 0) return TERMINAL - node.depth; // victoria: cuanto antes, mejor
  if (aiPieces === 0) return -TERMINAL + node.depth; // derrota: cuanto más tarde, mejor

  const moves = generateLegalMoves(node.board, node.toMove);
  if (moves.length === 0) {
    // El que mueve está ahogado: pierde.
    return node.toMove === ai ? -TERMINAL + node.depth : TERMINAL - node.depth;
  }
  return evaluate(node.board);
}

/** Respaldo MIN/MAX recursivo sobre el árbol ya construido. */
function backup(node: SearchNode, ai: Player): number {
  if (node.children.length === 0) return leafValue(node, ai);
  const vals = node.children.map((c) => backup(c, ai));
  return node.toMove === ai ? Math.max(...vals) : Math.min(...vals);
}

/**
 * Ejecuta A* y devuelve el mejor movimiento para `aiPlayer`.
 */
export function findBestMove(board: number[][], aiPlayer: Player): BestMoveResult {
  const root = makeNode(board, aiPlayer, 0, null);

  // Frontera (cola de prioridad). Best-first: se expande el nodo más prometedor para
  // la IA primero (mayor f). Para nodos donde mueve el rival, su f bajo también es
  // informativo; ordenar por |f| relativo a la IA mantiene la frontera enfocada.
  const frontier: SearchNode[] = [root];
  let nodesExplored = 0;

  while (frontier.length > 0) {
    // Selección por prioridad f(n): nodo más prometedor primero.
    frontier.sort((a, b) => b.f - a.f);
    const node = frontier.shift()!;
    nodesExplored++;

    if (node.depth >= MAX_DEPTH) {
      node.isLeaf = true;
      continue;
    }

    const moves = generateLegalMoves(node.board, node.toMove);
    if (moves.length === 0) {
      node.isLeaf = true; // estado terminal (ahogado)
      continue;
    }
    // Si es terminal por eliminación, no expandir.
    if (countPieces(node.board, "ai") === 0 || countPieces(node.board, "player") === 0) {
      node.isLeaf = true;
      continue;
    }

    for (const m of moves) {
      const childBoard = applyMoveToBoard(node.board, node.toMove, m);
      const child = makeNode(
        childBoard,
        opponent(node.toMove),
        node.depth + 1,
        node.depth === 0 ? m : node.rootMove,
      );
      node.children.push(child);
      frontier.push(child);
    }
  }

  if (root.children.length === 0) {
    return { move: null, score: leafValue(root, aiPlayer), nodesExplored, depth: MAX_DEPTH };
  }

  // Propagación hacia la raíz: la IA elige el primer movimiento de mejor valor (MAX).
  let bestMove: Move | null = null;
  let bestScore = -Infinity;
  for (const child of root.children) {
    const v = backup(child, aiPlayer);
    if (v > bestScore) {
      bestScore = v;
      bestMove = child.rootMove;
    }
  }

  return { move: bestMove, score: bestScore, nodesExplored, depth: MAX_DEPTH };
}
