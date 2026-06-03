import { useAuth } from "@clerk/tanstack-react-start";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <div className="layout">
        <main className="container center">
          <img
            src="/quings-logo.svg"
            alt="Quings"
            className="spin-slow"
            style={{ width: 96, height: 96, marginTop: 80 }}
          />
        </main>
      </div>
    );
  }
  return isSignedIn ? <Lobby /> : <SignedOutHero />;
}

function SignedOutHero() {
  return (
    <div className="layout">
      <main className="container center" style={{ maxWidth: 720 }}>
        <img
          src="/quings-logo.svg"
          alt="Quings"
          className="spin-slow"
          style={{ width: 168, height: 168, margin: "32px auto 8px" }}
        />
        <h1 style={{ fontSize: 72, color: "var(--gold-400)", letterSpacing: "0.12em" }}>QUINGS</h1>
        <p className="muted" style={{ fontSize: 18, maxWidth: 480, margin: "8px auto 28px" }}>
          Damas contra una IA que piensa con <strong>A*</strong>. Gana <strong>Coronas</strong>,
          colecciona skins y escala el ranking global.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link to="/sign-in" className="btn lg">
            Entrar
          </Link>
          <Link to="/sign-up" className="btn lg secondary">
            Crear cuenta
          </Link>
        </div>
      </main>
    </div>
  );
}

function Lobby() {
  const api = useApi();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.listGames().then(setGames).catch(() => undefined);
  }, [api]);

  async function newGame() {
    setCreating(true);
    try {
      const game = await api.createGame();
      navigate({ to: "/play/$id", params: { id: game._id } });
    } finally {
      setCreating(false);
    }
  }

  const lastGame = games[0];

  return (
    <Layout>
      <div className="row spread wrap" style={{ marginBottom: 24 }}>
        <div>
          <div className="label">Bienvenido</div>
          <h1 style={{ fontSize: 40 }}>{profile?.username ?? "Quing"}</h1>
        </div>
        <div className="row wrap">
          <span className="pill gold">🏆 {profile?.totalWins ?? 0} victorias</span>
          <span className="pill">
            ⭐ Mejor: {profile?.bestWinMoves != null ? `${profile.bestWinMoves} mov` : "—"}
          </span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
        <div className="card stack">
          <div className="label">Jugar</div>
          <h2 style={{ fontSize: 30 }}>Nueva partida</h2>
          <p className="muted">Tablero 8×8 contra la IA. Tú mueves primero.</p>
          <button className="btn block lg" onClick={newGame} disabled={creating}>
            {creating ? "Creando…" : "▶ Jugar ahora"}
          </button>
          {lastGame && (
            <button
              className="btn block secondary"
              onClick={() => navigate({ to: "/play/$id", params: { id: lastGame._id } })}
            >
              ↻ Continuar última ({lastGame.moveCount} mov)
            </button>
          )}
        </div>

        <NavCard to="/games" icon="🎯" title="Partidas guardadas" desc="Continúa en cualquier dispositivo." />
        <NavCard to="/ranking" icon="📊" title="Ranking" desc="Menos movimientos, más alto." />
        <NavCard to="/shop" icon="🛒" title="Tienda" desc="Skins de fichas por rareza." />
        <NavCard to="/locker" icon="🎒" title="Inventario" desc="Equipa tus skins." />
        <NavCard to="/coronas" icon="👑" title="Comprar Coronas" desc="Recarga con Stripe." />
      </div>
    </Layout>
  );
}

function NavCard({ to, icon, title, desc }: { to: string; icon: string; title: string; desc: string }) {
  return (
    <Link to={to} className="card stack" style={{ textDecoration: "none" }}>
      <div style={{ fontSize: 34 }}>{icon}</div>
      <h2 style={{ fontSize: 26 }}>{title}</h2>
      <p className="muted">{desc}</p>
    </Link>
  );
}
