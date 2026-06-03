import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useApi } from "@/lib/api";
import type { RankingResult } from "@/lib/types";

export const Route = createFileRoute("/ranking")({ component: RankingPage });

function RankingPage() {
  const api = useApi();
  const [data, setData] = useState<RankingResult | null>(null);

  useEffect(() => {
    api.ranking().then(setData).catch(() => setData({ top: [], me: null }));
  }, [api]);

  return (
    <Layout>
      <h1 style={{ fontSize: 40, marginBottom: 6 }}>Ranking global</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Mejor partida = menos movimientos para ganar. ¡Sé eficiente!
      </p>

      {data === null ? (
        <p className="muted">Cargando…</p>
      ) : data.top.length === 0 ? (
        <div className="notice center">Aún no hay victorias registradas. ¡Sé el primero!</div>
      ) : (
        <div className="card" style={{ padding: 6 }}>
          <table className="rank">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Mejor (mov)</th>
                <th>Victorias</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((r) => (
                <tr key={r.userId} className={r.isCurrentUser ? "me" : ""}>
                  <td className="rk">{r.rank}</td>
                  <td>
                    {r.username} {r.isCurrentUser && <span className="pill gold">tú</span>}
                  </td>
                  <td>{r.bestWinMoves}</td>
                  <td>{r.totalWins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.me && !data.top.some((r) => r.isCurrentUser) && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="label">Tu posición</div>
          <div className="row spread">
            <span className="rk" style={{ fontSize: 22, color: "var(--gold-400)" }}>
              #{data.me.rank}
            </span>
            <span>{data.me.username}</span>
            <span>{data.me.bestWinMoves} mov</span>
          </div>
        </div>
      )}
    </Layout>
  );
}
