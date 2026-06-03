import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { SkinPreview } from "@/components/SkinPreview";
import { useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";
import type { Skin } from "@/lib/types";

export const Route = createFileRoute("/locker")({ component: LockerPage });

function LockerPage() {
  const api = useApi();
  const { profile, refresh } = useProfile();
  const [skins, setSkins] = useState<Skin[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    api.skins().then(setSkins).catch(() => undefined);
  }, [api]);

  async function equip(skin: Skin) {
    setBusy(skin._id);
    try {
      await api.equipSkin(skin._id);
      await refresh();
      playSfx("select");
      setToast(`${skin.name} equipada`);
      setTimeout(() => setToast(null), 2200);
    } finally {
      setBusy(null);
    }
  }

  const ownedIds = new Set(profile?.ownedSkinIds ?? []);
  const ownedSkins = skins.filter((s) => ownedIds.has(s._id));

  return (
    <Layout>
      <h1 style={{ fontSize: 40, marginBottom: 6 }}>Inventario</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Equipa una skin para usarla en tus partidas.{" "}
        <Link to="/shop" style={{ color: "var(--gold-400)" }}>
          Ir a la tienda →
        </Link>
      </p>

      <div className="shop-grid">
        {ownedSkins.map((skin) => {
          const equipped = profile?.equippedSkinId === skin._id;
          return (
            <div key={skin._id} className={`card skin-card rarity-${skin.rarity}`}>
              {equipped && <span className="equipped-tag">Equipada</span>}
              <SkinPreview style={skin.pieceStyle} />
              <h3 style={{ fontSize: 24 }}>{skin.name}</h3>
              <button
                className={`btn block${equipped ? " secondary" : ""}`}
                disabled={equipped || busy === skin._id}
                onClick={() => equip(skin)}
              >
                {equipped ? "✓ En uso" : busy === skin._id ? "Equipando…" : "Equipar"}
              </button>
            </div>
          );
        })}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </Layout>
  );
}
