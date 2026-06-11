import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Grid3x3, Lock, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BoardPreview } from "@/components/BoardPreview";
import { Layout } from "@/components/Layout";
import { SkinPreview } from "@/components/SkinPreview";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { ApiError, useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";
import type { Board, Skin, SkinRarity } from "@/lib/types";

export const Route = createFileRoute("/shop")({ component: ShopPage });

const RARITY_LABEL: Record<SkinRarity, string> = {
  common: "Común",
  rare: "Rara",
  epic: "Épica",
  legendary: "Legendaria",
};

const FILTERS: { key: SkinRarity | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "common", label: "Común" },
  { key: "rare", label: "Rara" },
  { key: "epic", label: "Épica" },
  { key: "legendary", label: "Legendaria" },
];

type Category = "pieces" | "boards";

function ShopPage() {
  const api = useApi();
  const { profile, refresh } = useProfile();
  const [category, setCategory] = useState<Category>("pieces");
  const [skins, setSkins] = useState<Skin[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const [filter, setFilter] = useState<SkinRarity | "all">("all");

  useEffect(() => {
    api.skins().then(setSkins).catch(() => undefined);
    api.boards().then(setBoards).catch(() => undefined);
  }, [api]);

  function showToast(text: string, bad = false) {
    setToast({ text, bad });
    setTimeout(() => setToast(null), 2600);
  }

  async function buySkin(skin: Skin) {
    setBusy(skin._id);
    try {
      await api.buySkin(skin._id);
      await refresh();
      playSfx("reward");
      showToast(`¡${skin.name} adquirida!`);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Error en la compra", true);
    } finally {
      setBusy(null);
    }
  }

  async function buyBoard(board: Board) {
    setBusy(board._id);
    try {
      await api.buyBoard(board._id);
      await refresh();
      playSfx("reward");
      showToast(`¡${board.name} adquirido!`);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Error en la compra", true);
    } finally {
      setBusy(null);
    }
  }

  const ownedSkins = new Set(profile?.ownedSkinIds ?? []);
  const ownedBoards = new Set(profile?.ownedBoardIds ?? []);
  const coronas = profile?.coronas ?? 0;

  const visibleSkins = useMemo(
    () => (filter === "all" ? skins : skins.filter((s) => s.rarity === filter)),
    [skins, filter],
  );
  const visibleBoards = useMemo(
    () => (filter === "all" ? boards : boards.filter((b) => b.rarity === filter)),
    [boards, filter],
  );

  return (
    <Layout title="Tienda">
      {/* Categoría: fichas vs tableros */}
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
              playSfx("select");
            }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="row wrap" style={{ marginBottom: 18, gap: 8 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`pill${filter === f.key ? " gold" : ""}`}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => playSfx("hover")}
            onClick={() => {
              setFilter(f.key);
              playSfx("select");
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {category === "pieces" ? (
        <Stagger className="shop-grid">
          {visibleSkins.map((skin) => {
            const isOwned = ownedSkins.has(skin._id);
            const canAfford = coronas >= skin.priceCoronas;
            return (
              <StaggerItem key={skin._id}>
                <div
                  className={`card skin-card rarity-${skin.rarity}`}
                  onMouseEnter={() => playSfx("hover")}
                >
                  <span className={`rarity-badge ${skin.rarity}`}>{RARITY_LABEL[skin.rarity]}</span>
                  <SkinPreview style={skin.pieceStyle} />
                  <h3 style={{ fontSize: 24 }}>{skin.name}</h3>
                  <p className="muted" style={{ fontSize: 13, minHeight: 34 }}>
                    {skin.description}
                  </p>
                  {isOwned ? (
                    <span className="pill gold">
                      <Check size={14} strokeWidth={2.6} /> Adquirida
                    </span>
                  ) : (
                    <button
                      className="btn block"
                      disabled={busy === skin._id || !canAfford}
                      onClick={() => buySkin(skin)}
                    >
                      {busy === skin._id ? (
                        "Comprando…"
                      ) : skin.priceCoronas === 0 ? (
                        "Gratis"
                      ) : (
                        <>
                          {!canAfford && <Lock size={15} strokeWidth={2.2} />}
                          <Crown size={16} strokeWidth={2.2} /> {skin.priceCoronas.toLocaleString("es")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      ) : (
        <Stagger className="shop-grid">
          {visibleBoards.map((board) => {
            const isOwned = ownedBoards.has(board._id);
            const canAfford = coronas >= board.priceCoronas;
            return (
              <StaggerItem key={board._id}>
                <div
                  className={`card skin-card rarity-${board.rarity}`}
                  onMouseEnter={() => playSfx("hover")}
                >
                  <span className={`rarity-badge ${board.rarity}`}>{RARITY_LABEL[board.rarity]}</span>
                  <BoardPreview style={board.boardStyle} />
                  <h3 style={{ fontSize: 24 }}>{board.name}</h3>
                  <p className="muted" style={{ fontSize: 13, minHeight: 34 }}>
                    {board.description}
                  </p>
                  {isOwned ? (
                    <span className="pill gold">
                      <Check size={14} strokeWidth={2.6} /> Adquirido
                    </span>
                  ) : (
                    <button
                      className="btn block"
                      disabled={busy === board._id || !canAfford}
                      onClick={() => buyBoard(board)}
                    >
                      {busy === board._id ? (
                        "Comprando…"
                      ) : board.priceCoronas === 0 ? (
                        "Gratis"
                      ) : (
                        <>
                          {!canAfford && <Lock size={15} strokeWidth={2.2} />}
                          <Crown size={16} strokeWidth={2.2} /> {board.priceCoronas.toLocaleString("es")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      {toast && <div className={`toast${toast.bad ? " bad" : ""}`}>{toast.text}</div>}
    </Layout>
  );
}
