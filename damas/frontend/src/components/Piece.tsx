/** Render de una ficha según la skin equipada (jugador) o el estilo fijo del rival (IA). */

import type { CSSProperties } from "react";
import type { PieceStyle } from "@/lib/types";

/** Estilo fijo de las fichas de la IA (siempre distinguible del jugador). */
export const AI_PIECE_STYLE: PieceStyle = {
  baseColor: "#262a31",
  accentColor: "#7c8696",
  crownColor: "#9fbbd8",
  material: "matte",
};

export function Piece({
  value,
  skin,
  selected,
  mine,
}: {
  value: number;
  skin: PieceStyle;
  selected?: boolean;
  /** Marca la ficha como del jugador humano (contorno verde para distinguirla). */
  mine?: boolean;
}) {
  if (value === 0) return null;
  const isPlayer = value === 1 || value === 3;
  const isQueen = value === 3 || value === 4;
  const style = isPlayer ? skin : AI_PIECE_STYLE;

  const css: CSSProperties = {
    backgroundColor: style.baseColor,
    backgroundImage: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.45), transparent 55%)`,
    ["--accent" as string]: style.accentColor,
  };

  return (
    <div
      className={`piece ${style.material}${selected ? " sel" : ""}${mine ? " mine" : ""}`}
      style={css}
    >
      <span className="ring" />
      {isQueen ? (
        <span className="crown" style={{ color: style.crownColor }}>
          👑
        </span>
      ) : style.icon ? (
        <span className="glyph">{style.icon}</span>
      ) : null}
    </div>
  );
}
