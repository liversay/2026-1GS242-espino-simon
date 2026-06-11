/** Vista previa de una skin de tablero (mini-tablero 4×4) para tienda e inventario. */

import type { CSSProperties } from "react";
import type { BoardStyle } from "@/lib/types";

export function BoardPreview({ style }: { style: BoardStyle }) {
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const dark = (r + c) % 2 === 1;
      const alt = dark && (r + c) % 4 === 1;
      cells.push(
        <div
          key={`${r},${c}`}
          style={{
            background: dark ? (alt ? style.darkAlt : style.dark) : style.light,
          }}
        />,
      );
    }
  }
  const frame: CSSProperties = {
    background: style.frame,
    padding: 8,
    borderRadius: 12,
    display: "inline-block",
    boxShadow: "inset 0 0 0 2px rgba(248,216,107,0.25)",
  };
  return (
    <div style={frame}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 26px)",
          gridTemplateRows: "repeat(4, 26px)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {cells}
      </div>
    </div>
  );
}
