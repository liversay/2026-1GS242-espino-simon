import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { SkinPreview } from "@/components/SkinPreview";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { ApiError, useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";
import type { Skin, SkinRarity } from "@/lib/types";

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

function ShopPage() {
  const api = useApi();
  const { profile, refresh } = useProfile();
  const [skins, setSkins] = useState<Skin[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const [filter, setFilter] = useState<SkinRarity | "all">("all");

  useEffect(() => {
    api.skins().then(setSkins).catch(() => undefined);
  }, [api]);

  function showToast(text: string, bad = false) {
    setToast({ text, bad });
    setTimeout(() => setToast(null), 2600);
  }

  async function buy(skin: Skin) {
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

  const owned = new Set(profile?.ownedSkinIds ?? []);
  const visible = useMemo(
    () => (filter === "all" ? skins : skins.filter((s) => s.rarity === filter)),
    [skins, filter],
  );

  return (
    <Layout title="Tienda">
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

      <Stagger className="shop-grid">
        {visible.map((skin) => {
          const isOwned = owned.has(skin._id);
          const canAfford = (profile?.coronas ?? 0) >= skin.priceCoronas;
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
                    onClick={() => buy(skin)}
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

      {toast && <div className={`toast${toast.bad ? " bad" : ""}`}>{toast.text}</div>}
    </Layout>
  );
}
