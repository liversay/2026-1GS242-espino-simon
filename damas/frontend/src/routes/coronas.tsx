import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ApiError, useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import type { CoronaPack } from "@/lib/types";

export const Route = createFileRoute("/coronas")({
  validateSearch: (s: Record<string, unknown>) => ({ status: (s.status as string) ?? undefined }),
  component: CoronasPage,
});

function CoronasPage() {
  const api = useApi();
  const { profile, refresh } = useProfile();
  const search = useSearch({ from: "/coronas" });
  const [packs, setPacks] = useState<CoronaPack[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);

  useEffect(() => {
    api.coronaPacks().then(setPacks).catch(() => undefined);
  }, [api]);

  // Al volver de Stripe, refrescar el saldo (el webhook acredita las Coronas).
  useEffect(() => {
    if (search.status === "success") {
      setToast({ text: "¡Pago recibido! Tus Coronas se acreditarán en un momento." });
      const t = setInterval(() => void refresh(), 1500);
      setTimeout(() => clearInterval(t), 9000);
      return () => clearInterval(t);
    }
    if (search.status === "cancel") {
      setToast({ text: "Pago cancelado.", bad: true });
    }
  }, [search.status, refresh]);

  async function buy(pack: CoronaPack) {
    setBusy(pack._id);
    try {
      const { url } = await api.checkout(pack._id);
      window.location.href = url;
    } catch (e) {
      setToast({
        text: e instanceof ApiError ? e.message : "Error al iniciar el pago",
        bad: true,
      });
      setBusy(null);
    }
  }

  return (
    <Layout>
      <div className="row spread wrap" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 40 }}>Comprar Coronas</h1>
        {profile && (
          <span className="coronas">
            <span className="crown">👑</span>
            {profile.coronas.toLocaleString("es")}
          </span>
        )}
      </div>
      <p className="muted" style={{ marginBottom: 20 }}>
        Recarga con tarjeta (Stripe, modo prueba). Usa las Coronas para comprar skins.
      </p>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
        {packs.map((pack) => (
          <div key={pack._id} className="card skin-card">
            <div style={{ fontSize: 48 }}>👑</div>
            <h3 style={{ fontSize: 26 }}>{pack.name}</h3>
            <div className="pill gold" style={{ fontSize: 16 }}>
              {pack.coronas.toLocaleString("es")} Coronas
            </div>
            <button className="btn block" disabled={busy === pack._id} onClick={() => buy(pack)}>
              {busy === pack._id ? "Redirigiendo…" : `$${pack.priceUsd.toFixed(2)}`}
            </button>
          </div>
        ))}
      </div>

      {toast && <div className={`toast${toast.bad ? " bad" : ""}`}>{toast.text}</div>}
    </Layout>
  );
}
