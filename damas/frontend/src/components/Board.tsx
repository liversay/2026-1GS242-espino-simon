/** Tablero arcade interactivo. Usa @quings/game-engine para resaltar jugadas legales. */

import { type Coord, type Move, generateLegalMoves, isDarkSquare } from "@quings/game-engine";
import { useEffect, useMemo, useState } from "react";
import type { PieceStyle } from "@/lib/types";
import { Piece } from "./Piece";

export function Board({
  board,
  interactive,
  skin,
  lastMove,
  shake,
  onMove,
}: {
  board: number[][];
  interactive: boolean;
  skin: PieceStyle;
  lastMove: Move | null;
  shake: boolean;
  onMove: (move: Move) => void;
}) {
  const [selected, setSelected] = useState<Coord | null>(null);

  // Las jugadas legales del humano se calculan localmente (misma fuente de verdad que el backend).
  const legal = useMemo<Move[]>(
    () => (interactive ? generateLegalMoves(board, "player") : []),
    [board, interactive],
  );

  // Limpia la selección cuando cambia el tablero (tras aplicar una jugada).
  useEffect(() => setSelected(null), [board]);

  const selectableFroms = useMemo(
    () => new Set(legal.map((m) => `${m.from.row},${m.from.col}`)),
    [legal],
  );

  const destsForSelected = useMemo(
    () =>
      selected ? legal.filter((m) => m.from.row === selected.row && m.from.col === selected.col) : [],
    [legal, selected],
  );

  const destMap = useMemo(() => {
    const map = new Map<string, boolean>(); // key -> isCapture
    for (const m of destsForSelected) map.set(`${m.to.row},${m.to.col}`, m.captures.length > 0);
    return map;
  }, [destsForSelected]);

  function clickCell(r: number, c: number) {
    if (!interactive) return;
    const key = `${r},${c}`;
    if (selectableFroms.has(key)) {
      setSelected((s) => (s && s.row === r && s.col === c ? null : { row: r, col: c }));
      return;
    }
    if (selected) {
      const move = destsForSelected.find((m) => m.to.row === r && m.to.col === c);
      if (move) {
        setSelected(null);
        onMove(move);
      }
    }
  }

  return (
    <div className={`board-wrap${shake ? " shake" : ""}`}>
      <div className="board">
        {board.map((rowArr, r) =>
          rowArr.map((value, c) => {
            const dark = isDarkSquare(r, c);
            const key = `${r},${c}`;
            const isSelectable = interactive && selectableFroms.has(key);
            const isSelected = selected?.row === r && selected?.col === c;
            const dest = destMap.get(key);
            const fromHl = lastMove && lastMove.from.row === r && lastMove.from.col === c;
            const toHl = lastMove && lastMove.to.row === r && lastMove.to.col === c;
            const classes = [
              "cell",
              dark ? "dark" : "light",
              dark && (r + c) % 4 === 1 ? "alt" : "",
              isSelectable ? "selectable" : "",
              fromHl ? "from-hl" : "",
              toHl ? "to-hl" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={key} className={classes} onClick={() => clickCell(r, c)}>
                {value !== 0 && <Piece value={value} skin={skin} selected={isSelected} />}
                {dest !== undefined && <span className={`dot${dest ? " capture" : ""}`} />}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
