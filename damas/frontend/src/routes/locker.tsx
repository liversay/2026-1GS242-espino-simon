import { createFileRoute } from "@tanstack/react-router";
import { Backpack, Check, Grid3x3, Store, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BoardPreview } from "@/components/BoardPreview";
import { Layout } from "@/components/Layout";
import { Piece } from "@/components/Piece";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";
import { useGoldNavigate } from "@/lib/transition";
import type { Board, Skin } from "@/lib/types";

export const Route = createFileRoute("/locker")({ component: LockerPage });

type Category = "pieces" | "boards";

function LockerPage() {
  const api = useApi();
  const go = useGoldNavigate();
  const { profile, refresh } = useProfile();
  const [category, setCategory] = useState<Category>("pieces");
  const [skins, setSkins] = useState<Skin[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api.skins().then(setSkins).catch(() => undefined);
    api.boards().then(setBoards).catch(() => undefined);
  }, [api]);

  function flash(text: string) {
    setToast(text);
    setTimeout(() => setToast(null), 2200);
  }

  async function equipSkin(skin: Skin) {
    setBusy(skin._id);
    try {
      await api.equipSkin(skin._id);
      await refresh();
      playSfx("select");
      flash(`${skin.name} equipada`);
    } finally {
      setBusy(null);
    }
  }

  async function equipBoard(board: Board) {
    setBusy(board._id);
    try {
      await api.equipBoard(board._id);
      await refresh();
      playSfx("select");
      flash(`${board.name} equipado`);
    } finally {
      setBusy(null);
    }
  }

  const ownedSkinIds = new Set(profile?.ownedSkinIds ?? []);
  const ownedBoardIds = new Set(profile?.ownedBoardIds ?? []);
  const ownedSkins = skins.filter((s) => ownedSkinIds.has(s._id));
  const ownedBoards = boards.filter((b) => ownedBoardIds.has(b._id));

  const previewSkin = useMemo(
    () => ownedSkins.find((s) => s._id === (selected ?? profile?.equippedSkinId)) ?? ownedSkins[0],
    [ownedSkins, selected, profile?.equippedSkinId],
  );
  const previewBoard = useMemo(
    () => ownedBoards.find((b) => b._id === (selected ?? profile?.equippedBoardId)) ?? ownedBoards[0],
    [ownedBoards, selected, profile?.equippedBoardId],
  );

  const owned = category === "pieces" ? ownedSkins : ownedBoards;

  return (
    <Layout title="Inventario">
      <div className="row wrap" style={{ marginBottom: 14, gap: 8 }}>
        {(
          [
            { key: "pieces", label: "Fichas", icon: <Swords size={15} strokeWidth={2.2} /> },
            { key: "boards", label: "Tableros", icon: <Grid3x3 size={15} strokeWidth={2.2} /> },
          ] as const
        ).map((c) => (
          <button
            key={c.key}
            className={`pill${category === c.key ? " gold" : ""}`}
            style={{ cursor: "pointer", fontSize: 15, padding: "8px 16px" }}
            onMouseEnter={() => playSfx("hover")}
            onClick={() => {
              setCategory(c.key);
              setSelected(null);
              playSfx("select");
            }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {category === "pieces" && previewSkin && (
        <div className="card row" style={{ gap: 24, alignItems: "center", marginBottom: 18 }}>
          <div className="row" style={{ gap: 14 }}>
            <div className="preview" style={{ ["--cell" as string]: "76px", width: 76, height: 76 }}>
              <Piece value={1} skin={previewSkin.pieceStyle} mine />
            </div>
            <div className="preview" style={{ ["--cell" as string]: "76px", width: 76, height: 76 }}>
              <Piece value={3} skin={previewSkin.pieceStyle} mine />
            </div>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <div className="label">Vista previa</div>
            <h3 style={{ fontSize: 24 }}>{previewSkin.name}</h3>
            <span className="muted" style={{ fontSize: 13 }}>
              Peón y reina con esta skin
            </span>
          </div>
        </div>
      )}

      {category === "boards" && previewBoard && (
        <div className="card row" style={{ gap: 24, alignItems: "center", marginBottom: 18 }}>
          <BoardPreview style={previewBoard.boardStyle} />
          <div className="stack" style={{ gap: 4 }}>
            <div className="label">Vista previa</div>
            <h3 style={{ fontSize: 24 }}>{previewBoard.name}</h3>
            <span className="muted" style={{ fontSize: 13 }}>
              Tablero con este estilo
            </span>
          </div>
        </div>
      )}

      {owned.length === 0 ? (
        <div className="notice center stack" style={{ alignItems: "center" }}>
          <Backpack size={40} strokeWidth={1.8} color="var(--gold-400)" />
          <h3 style={{ fontSize: 24 }}>
            No tienes {category === "pieces" ? "fichas" : "tableros"} aquí
          </h3>
          <button className="btn" onClick={() => go({ to: "/shop" })}>
            <Store size={18} strokeWidth={2.2} /> Ir a la tienda
          </button>
        </div>
      ) : category === "pieces" ? (
        <Stagger className="shop-grid">
          {ownedSkins.map((skin) => {
            const equipped = profile?.equippedSkinId === skin._id;
            return (
              <StaggerItem key={skin._id}>
                <div
                  className={`card skin-card rarity-${skin.rarity}`}
                  onMouseEnter={() => {
                    setSelected(skin._id);
                    playSfx("hover");
                  }}
                >
                  {equipped && (
                    <span className="equipped-tag">
                      <Check size={12} strokeWidth={2.8} /> Equipada
                    </span>
                  )}
                  <div className="preview">
                    <Piece value={3} skin={skin.pieceStyle} mine />
                  </div>
                  <h3 style={{ fontSize: 24 }}>{skin.name}</h3>
                  <button
                    className={`btn block${equipped ? " secondary" : ""}`}
                    disabled={equipped || busy === skin._id}
                    onClick={() => equipSkin(skin)}
                  >
                    {equipped ? "En uso" : busy === skin._id ? "Equipando…" : "Equipar"}
                  </button>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      ) : (
        <Stagger className="shop-grid">
          {ownedBoards.map((board) => {
            const equipped = profile?.equippedBoardId === board._id;
            return (
              <StaggerItem key={board._id}>
                <div
                  className={`card skin-card rarity-${board.rarity}`}
                  onMouseEnter={() => {
                    setSelected(board._id);
                    playSfx("hover");
                  }}
                >
                  {equipped && (
                    <span className="equipped-tag">
                      <Check size={12} strokeWidth={2.8} /> Equipado
                    </span>
                  )}
                  <BoardPreview style={board.boardStyle} />
                  <h3 style={{ fontSize: 24 }}>{board.name}</h3>
                  <button
                    className={`btn block${equipped ? " secondary" : ""}`}
                    disabled={equipped || busy === board._id}
                    onClick={() => equipBoard(board)}
                  >
                    {equipped ? "En uso" : busy === board._id ? "Equipando…" : "Equipar"}
                  </button>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      {toast && <div className="toast">{toast}</div>}
    </Layout>
  );
}
