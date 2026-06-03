import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Crown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { ApiError, useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";
import type { CoronaPack } from "@/lib/types";

export const Route = createFileRoute("/coronas")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: (s.status as string) ?? undefined,
    session_id: (s.session_id as string) ?? undefined,
  }),
  component: CoronasPage,
});

function CoinRain() {
  const coins = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.8}s`,
        duration: `${1.6 + Math.random() * 1.4}s`,
        size: 18 + Math.random() * 16,
      })),
    [],
  );
  return (
    <div className="coin-rain" aria-hidden>
      {coins.map((c) => (
        <span
          key={c.id}
          className="coin"
          style={{ left: c.left, animationDelay: c.delay, animationDuration: c.duration }}
        >
          <Crown size={c.size} strokeWidth={2.2} />
        </span>
      ))}
    </div>
  );
}

function CoronasPage() {
  const api = useApi();
  const { profile, refresh } = useProfile();
  const search = useSearch({ from: "/coronas" });
  const [packs, setPacks] = useState<CoronaPack[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const [reward, setReward] = useState(false);

  useEffect(() => {
    api.coronaPacks().then(setPacks).catch(() => undefined);
  }, [api]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (search.status === "success" && search.session_id) {
      void (async () => {
        try {
          const { credited } = await api.confirmCheckout(search.session_id!);
          await refresh();
          if (credited > 0) {
            playSfx("reward");
            setReward(true);
            setTimeout(() => setReward(false), 3200);
          }
          setToast({ text: credited > 0 ? `¡+${credited} Coronas acreditadas!` : "Pago confirmado." });
        } catch {
          setToast({ text: "No se pudo confirmar el pago todavía.", bad: true });
        }
      })();
    } else if (search.status === "cancel") {
      setToast({ text: "Pago cancelado.", bad: true });
    }
  }, [search.status, search.session_id, api, refresh]);

  async function buy(pack: CoronaPack) {
    setBusy(pack._id);
    playSfx("select");
    try {
      const { url } = await api.checkout(pack._id);
      window.location.href = url;
    } catch (e) {
      setToast({ text: e instanceof ApiError ? e.message : "Error al iniciar el pago", bad: true });
      setBusy(null);
    }
  }

  // Mejor relación Coronas/USD.
  const bestId = useMemo(() => {
    let best: string | null = null;
    let ratio = -1;
    for (const p of packs) {
      const r = p.coronas / p.priceUsd;
      if (r > ratio) {
        ratio = r;
        best = p._id;
      }
    }
    return best;
  }, [packs]);

  return (
    <Layout title="Comprar Coronas">
      <p className="muted" style={{ marginBottom: 20 }}>
        Recarga con Stripe (modo prueba). Usa las Coronas para comprar skins.
      </p>

      <Stagger
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}
      >
        {packs.map((pack) => (
          <StaggerItem key={pack._id}>
            <div className="card skin-card" onMouseEnter={() => playSfx("hover")} style={{ position: "relative" }}>
              {pack._id === bestId && <span className="equipped-tag">Mejor valor</span>}
              <Crown size={44} strokeWidth={1.8} color="var(--gold-400)" />
              <h3 style={{ fontSize: 26 }}>{pack.name}</h3>
              <div className="pill gold" style={{ fontSize: 16 }}>
                {pack.coronas.toLocaleString("es")} Coronas
              </div>
              <button className="btn block" disabled={busy === pack._id} onClick={() => buy(pack)}>
                {busy === pack._id ? (
                  <>
                    <Loader2 size={16} className="spin" strokeWidth={2.4} /> Redirigiendo…
                  </>
                ) : (
                  `$${pack.priceUsd.toFixed(2)}`
                )}
              </button>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      {reward && <CoinRain />}
      {toast && <div className={`toast${toast.bad ? " bad" : ""}`}>{toast.text}</div>}
    </Layout>
  );
}
