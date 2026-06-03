/** Vista previa de una skin (ficha reina) para tienda e inventario. */

import type { PieceStyle } from "@/lib/types";
import { Piece } from "./Piece";

export function SkinPreview({ style }: { style: PieceStyle }) {
  return (
    <div className="preview">
      {/* value 3 = reina del jugador para mostrar la corona y el estilo completo */}
      <Piece value={3} skin={style} />
    </div>
  );
}
