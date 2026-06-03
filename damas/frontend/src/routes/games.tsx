import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useApi } from "@/lib/api";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/games")({ component: GamesPage });

function GamesPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[] | null>(null);

  useEffect(() => {
    api.listGames().then(setGames).catch(() => setGames([]));
  }, [api]);

  async function newGame() {
    const g = await api.createGame();
    navigate({ to: "/play/$id", params: { id: g._id } });
  }

  return (
    <Layout>
      <div className="row spread wrap" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 40 }}>Partidas guardadas</h1>
        <button className="btn" onClick={newGame}>
          ▶ Nueva partida
        </button>
      </div>
      <p className="muted" style={{ marginBottom: 18 }}>
        Tus partidas en curso. Continúa desde cualquier dispositivo.
      </p>

      {games === null ? (
        <p className="muted">Cargando…</p>
      ) : games.length === 0 ? (
        <div className="notice center">No tienes partidas en curso. ¡Empieza una nueva!</div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
          {games.map((g) => (
            <Link
              key={g._id}
              to="/play/$id"
              params={{ id: g._id }}
              className="card stack"
              style={{ textDecoration: "none" }}
            >
              <div className="row spread">
                <span className="pill gold">🎯 {g.moveCount} mov</span>
                <span className="pill">{g.turn === "player" ? "Tu turno" : "IA"}</span>
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                Actualizada {new Date(g.updatedAt).toLocaleString("es")}
              </div>
              <span className="btn secondary block">↻ Continuar</span>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
