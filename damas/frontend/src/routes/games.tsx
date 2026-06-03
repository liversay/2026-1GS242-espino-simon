import { createFileRoute } from "@tanstack/react-router";
import { History, RotateCcw, Swords, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { useApi } from "@/lib/api";
import { playSfx } from "@/lib/sound";
import { useGoldNavigate } from "@/lib/transition";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/games")({ component: GamesPage });

function GamesPage() {
  const api = useApi();
  const go = useGoldNavigate();
  const [games, setGames] = useState<Game[] | null>(null);

  useEffect(() => {
    api.listGames().then(setGames).catch(() => setGames([]));
  }, [api]);

  async function newGame() {
    playSfx("select");
    const g = await api.createGame();
    go({ to: "/play/$id", params: { id: g._id } });
  }

  return (
    <Layout title="Partidas guardadas">
      <div className="row spread wrap" style={{ marginBottom: 8 }}>
        <p className="muted">Tus partidas en curso. Continúa desde cualquier dispositivo.</p>
        <button className="btn" onClick={newGame} onMouseEnter={() => playSfx("hover")}>
          <Swords size={18} strokeWidth={2.2} /> Nueva partida
        </button>
      </div>

      {games === null ? (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 150 }} />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="notice center stack" style={{ alignItems: "center" }}>
          <History size={40} strokeWidth={1.8} color="var(--gold-400)" />
          <h3 style={{ fontSize: 24 }}>No tienes partidas guardadas</h3>
          <button className="btn" onClick={newGame}>
            <Swords size={18} strokeWidth={2.2} /> Jugar
          </button>
        </div>
      ) : (
        <Stagger
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}
        >
          {games.map((g) => (
            <StaggerItem key={g._id}>
              <div
                className="card stack hoverable"
                onMouseEnter={() => playSfx("hover")}
                onClick={() => go({ to: "/play/$id", params: { id: g._id } })}
                style={{ cursor: "pointer", height: "100%" }}
              >
                <div className="row spread">
                  <span className="pill gold">
                    <Target size={13} strokeWidth={2.4} /> {g.moveCount} mov
                  </span>
                  <span className="pill">{g.turn === "player" ? "Tu turno" : "IA"}</span>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  Actualizada {new Date(g.updatedAt).toLocaleString("es")}
                </div>
                <span className="btn secondary block">
                  <RotateCcw size={16} strokeWidth={2.2} /> Continuar
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Layout>
  );
}
