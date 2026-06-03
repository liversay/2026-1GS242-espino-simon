import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { SkinPreview } from "@/components/SkinPreview";
import { ApiError, useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";
import type { Skin } from "@/lib/types";

export const Route = createFileRoute("/shop")({ component: ShopPage });

const RARITY_LABEL: Record<Skin["rarity"], string> = {
  common: "Común",
  rare: "Rara",
  epic: "Épica",
  legendary: "Legendaria",
};

function ShopPage() {
  const api = useApi();
  const { profile, refresh } = useProfile();
  const [skins, setSkins] = useState<Skin[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);

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
      playSfx("buy");
      showToast(`¡${skin.name} adquirida!`);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Error en la compra", true);
    } finally {
      setBusy(null);
    }
  }

  const owned = new Set(profile?.ownedSkinIds ?? []);

  return (
    <Layout>
      <div className="row spread wrap" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 40 }}>Tienda de skins</h1>
        {profile && (
          <span className="coronas">
            <span className="crown">👑</span>
            {profile.coronas.toLocaleString("es")}
          </span>
        )}
      </div>

      <div className="shop-grid">
        {skins.map((skin) => {
          const isOwned = owned.has(skin._id);
          const canAfford = (profile?.coronas ?? 0) >= skin.priceCoronas;
          return (
            <div key={skin._id} className={`card skin-card rarity-${skin.rarity}`}>
              <span className={`rarity-badge ${skin.rarity}`}>{RARITY_LABEL[skin.rarity]}</span>
              <SkinPreview style={skin.pieceStyle} />
              <h3 style={{ fontSize: 24 }}>{skin.name}</h3>
              <p className="muted" style={{ fontSize: 13, minHeight: 34 }}>
                {skin.description}
              </p>
              {isOwned ? (
                <span className="pill gold">✓ Adquirida</span>
              ) : (
                <button
                  className="btn block"
                  disabled={busy === skin._id || !canAfford}
                  onClick={() => buy(skin)}
                >
                  {busy === skin._id
                    ? "Comprando…"
                    : skin.priceCoronas === 0
                      ? "Gratis"
                      : `👑 ${skin.priceCoronas.toLocaleString("es")}`}
                </button>
              )}
              {!isOwned && !canAfford && skin.priceCoronas > 0 && (
                <span className="muted" style={{ fontSize: 12 }}>
                  Coronas insuficientes
                </span>
              )}
            </div>
          );
        })}
      </div>

      {toast && <div className={`toast${toast.bad ? " bad" : ""}`}>{toast.text}</div>}
    </Layout>
  );
}
