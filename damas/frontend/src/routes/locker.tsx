import { createFileRoute } from "@tanstack/react-router";
import { Backpack, Check, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Piece } from "@/components/Piece";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";
import { useGoldNavigate } from "@/lib/transition";
import type { Skin } from "@/lib/types";

export const Route = createFileRoute("/locker")({ component: LockerPage });

function LockerPage() {
  const api = useApi();
  const go = useGoldNavigate();
  const { profile, refresh } = useProfile();
  const [skins, setSkins] = useState<Skin[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

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
  const previewSkin = useMemo(
    () =>
      ownedSkins.find((s) => s._id === (selected ?? profile?.equippedSkinId)) ?? ownedSkins[0],
    [ownedSkins, selected, profile?.equippedSkinId],
  );

  return (
    <Layout title="Inventario">
      {previewSkin && (
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

      {ownedSkins.length === 0 ? (
        <div className="notice center stack" style={{ alignItems: "center" }}>
          <Backpack size={40} strokeWidth={1.8} color="var(--gold-400)" />
          <h3 style={{ fontSize: 24 }}>Tu inventario está vacío</h3>
          <button className="btn" onClick={() => go({ to: "/shop" })}>
            <Store size={18} strokeWidth={2.2} /> Ir a la tienda
          </button>
        </div>
      ) : (
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
                    onClick={() => equip(skin)}
                  >
                    {equipped ? "En uso" : busy === skin._id ? "Equipando…" : "Equipar"}
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
