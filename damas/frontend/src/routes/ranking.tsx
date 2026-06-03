import { createFileRoute } from "@tanstack/react-router";
import { Medal, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useApi } from "@/lib/api";
import type { RankingResult, RankingRow } from "@/lib/types";

export const Route = createFileRoute("/ranking")({ component: RankingPage });

const MEDAL: Record<number, string> = {
  1: "#F8D86B",
  2: "#CBD5E1",
  3: "#D8A05A",
};

function RankCell({ row }: { row: RankingRow }) {
  const color = MEDAL[row.rank];
  if (color) return <Medal size={22} strokeWidth={2.2} color={color} />;
  return <span className="rk">{row.rank}</span>;
}

function RankingPage() {
  const api = useApi();
  const [data, setData] = useState<RankingResult | null>(null);

  useEffect(() => {
    api.ranking().then(setData).catch(() => setData({ top: [], me: null }));
  }, [api]);

  return (
    <Layout title="Ranking">
      <p className="muted" style={{ marginBottom: 20 }}>
        Menos movimientos, más alto. ¡Sé eficiente!
      </p>

      {data === null ? (
        <div className="stack">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 46 }} />
          ))}
        </div>
      ) : data.top.length === 0 ? (
        <div className="notice center stack" style={{ alignItems: "center" }}>
          <Trophy size={40} strokeWidth={1.8} color="var(--gold-400)" />
          <h3 style={{ fontSize: 24 }}>Aún no hay victorias registradas</h3>
          <p className="muted">¡Sé el primero en ganar!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 6 }}>
          <table className="rank">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Jugador</th>
                <th>Mejor (mov)</th>
                <th>Victorias</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((r) => (
                <tr key={r.userId} className={r.isCurrentUser ? "me" : ""}>
                  <td>
                    <RankCell row={r} />
                  </td>
                  <td>
                    {r.username}{" "}
                    {r.isCurrentUser && <span className="pill gold">tú</span>}
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
            <span className="rk" style={{ fontSize: 22 }}>
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
