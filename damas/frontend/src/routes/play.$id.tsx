import { type Move, applyMove, hasAnyCapture } from "@quings/game-engine";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Board } from "@/components/Board";
import { Layout } from "@/components/Layout";
import { useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { useSettings } from "@/lib/settings";
import { playSfx } from "@/lib/sound";
import type { Game, PieceStyle, Skin } from "@/lib/types";

export const Route = createFileRoute("/play/$id")({ component: PlayPage });

const CLASSIC_STYLE: PieceStyle = {
  baseColor: "#F4EEDD",
  accentColor: "#C8922B",
  crownColor: "#EBB63F",
  material: "matte",
};

function winReward(moveCount: number): number {
  return 50 + Math.max(0, (80 - moveCount) * 2);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function PlayPage() {
  const { id } = Route.useParams();
  const api = useApi();
  const navigate = useNavigate();
  const { profile, refresh } = useProfile();
  const { speed, sound, setSpeed, toggleSound } = useSettings();

  const [game, setGame] = useState<Game | null>(null);
  const [skins, setSkins] = useState<Skin[]>([]);
  const [busy, setBusy] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .getGame(id)
      .then((g) => alive && setGame(g))
      .catch(() => alive && setLoadError(true));
    api.skins().then((s) => alive && setSkins(s)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [api, id]);

  // Fondo dinámico según el contexto.
  useEffect(() => {
    const b = document.body;
    b.classList.remove("turn-ai", "turn-win", "turn-lose");
    if (game?.status === "won") b.classList.add("turn-win");
    else if (game?.status === "lost") b.classList.add("turn-lose");
    else if (aiThinking) b.classList.add("turn-ai");
    return () => b.classList.remove("turn-ai", "turn-win", "turn-lose");
  }, [game?.status, aiThinking]);

  const equipped =
    skins.find((s) => s._id === profile?.equippedSkinId)?.pieceStyle ?? CLASSIC_STYLE;

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 360 / speed);
  }, [speed]);

  const handleMove = useCallback(
    async (move: Move) => {
      if (!game || busy) return;
      setBusy(true);
      setError(null);

      // Aplicación optimista del movimiento humano para respuesta inmediata.
      const local = applyMove(
        { board: game.board, turn: game.turn, status: game.status, moveCount: game.moveCount, history: game.history },
        move,
      );
      setGame((g) => (g ? { ...g, board: local.board, turn: local.turn, status: local.status, moveCount: local.moveCount } : g));
      setLastMove(move);
      playSfx(move.captures.length ? "capture" : "move");
      if (move.captures.length) triggerShake();
      const aiTurn = local.status === "in_progress" && local.turn === "ai";
      setAiThinking(aiTurn);

      try {
        const result = await api.move(id, move);
        if (result.aiMove) {
          await sleep(420 / speed);
          setLastMove(result.aiMove);
          playSfx(result.aiMove.captures.length ? "capture" : "move");
          if (result.aiMove.captures.length) triggerShake();
          await sleep(120 / speed);
        }
        setGame(result.game);
        setAiThinking(false);
        if (result.finished) {
          playSfx(result.game.status === "won" ? "win" : "lose");
          void refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al mover");
        const fresh = await api.getGame(id).catch(() => null);
        if (fresh) setGame(fresh);
        setLastMove(null);
      } finally {
        setBusy(false);
        setAiThinking(false);
      }
    },
    [api, busy, game, id, refresh, speed, triggerShake],
  );

  async function doResign() {
    setConfirmResign(false);
    if (!game || game.status !== "in_progress") return;
    const updated = await api.resign(id);
    setGame(updated);
    playSfx("lose");
    void refresh();
  }

  if (loadError) {
    return (
      <Layout>
        <div className="notice center stack">
          <h2 style={{ fontSize: 28 }}>Partida no encontrada</h2>
          <Link to="/" className="btn">
            Volver al lobby
          </Link>
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <p className="muted">Cargando partida…</p>
      </Layout>
    );
  }

  const playerTurn = game.status === "in_progress" && game.turn === "player" && !busy;
  const mustCapture = playerTurn && hasAnyCapture(game.board, "player");

  return (
    <Layout>
      <div className="row spread wrap" style={{ alignItems: "flex-start", gap: 24 }}>
        <Board
          board={game.board}
          interactive={playerTurn}
          skin={equipped}
          lastMove={lastMove}
          shake={shake}
          onMove={handleMove}
        />

        <div className="stack" style={{ flex: "1 1 280px", minWidth: 260 }}>
          <div className="card stack">
            <div className="label">Turno</div>
            {game.status !== "in_progress" ? (
              <h2 style={{ fontSize: 28 }}>{game.status === "won" ? "¡Victoria!" : "Derrota"}</h2>
            ) : aiThinking ? (
              <span className="thinking">
                🤖 IA pensando (A*)
                <span className="dots">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            ) : (
              <h2 style={{ fontSize: 28 }}>{game.turn === "player" ? "Tu turno" : "Turno de la IA"}</h2>
            )}
            <div className="statline">
              <span className="pill gold">🎯 {game.moveCount} movimientos</span>
              <span className="pill">📜 {game.history.length} jugadas</span>
            </div>
            {mustCapture && (
              <div className="pill" style={{ background: "rgba(226,113,138,0.2)", borderColor: "rgba(226,113,138,0.6)" }}>
                ⚔️ ¡Captura obligatoria!
              </div>
            )}
            {error && <p style={{ color: "var(--rose-400)" }}>{error}</p>}
          </div>

          <div className="card stack">
            <div className="label">Controles</div>
            <button
              className="btn danger"
              onClick={() => setConfirmResign(true)}
              disabled={game.status !== "in_progress"}
            >
              🏳️ Abandonar
            </button>
            <Link to="/" className="btn secondary">
              ← Lobby
            </Link>
          </div>

          <div className="card stack">
            <div className="label">Ajustes</div>
            <div className="row wrap" style={{ gap: 8 }}>
              {[
                { v: 0.75, t: "Lento" },
                { v: 1, t: "Normal" },
                { v: 1.5, t: "Rápido" },
                { v: 2.5, t: "Turbo" },
              ].map((o) => (
                <button
                  key={o.v}
                  className={`pill${speed === o.v ? " gold" : ""}`}
                  onClick={() => setSpeed(o.v)}
                  style={{ cursor: "pointer" }}
                >
                  {o.t}
                </button>
              ))}
            </div>
            <button className="pill" onClick={toggleSound} style={{ cursor: "pointer", width: "fit-content" }}>
              {sound ? "🔊 Sonido on" : "🔇 Sonido off"}
            </button>
          </div>
        </div>
      </div>

      {confirmResign && (
        <div className="overlay" onClick={() => setConfirmResign(false)}>
          <div className="panel stack" style={{ minWidth: 300 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 48 }}>🏳️</div>
            <h2 style={{ fontSize: 30 }}>¿Abandonar la partida?</h2>
            <p className="muted">Contará como derrota.</p>
            <div className="row" style={{ justifyContent: "center", marginTop: 4 }}>
              <button className="btn danger" onClick={doResign}>
                Sí, abandonar
              </button>
              <button className="btn secondary" onClick={() => setConfirmResign(false)}>
                Seguir jugando
              </button>
            </div>
          </div>
        </div>
      )}

      {game.status !== "in_progress" && (
        <EndOverlay
          status={game.status}
          moveCount={game.moveCount}
          onNew={async () => {
            const g = await api.createGame();
            navigate({ to: "/play/$id", params: { id: g._id } });
          }}
        />
      )}
    </Layout>
  );
}

function EndOverlay({
  status,
  moveCount,
  onNew,
}: {
  status: "won" | "lost";
  moveCount: number;
  onNew: () => void;
}) {
  const won = status === "won";
  return (
    <div className="overlay">
      <div className="panel stack" style={{ minWidth: 320 }}>
        <div style={{ fontSize: 64 }}>{won ? "👑" : "💀"}</div>
        <h1 style={{ fontSize: 52, color: won ? "var(--gold-400)" : "var(--rose-400)" }}>
          {won ? "¡VICTORIA!" : "DERROTA"}
        </h1>
        <p className="muted">Ganaste en {moveCount} movimientos.</p>
        {won && (
          <div className="coronas" style={{ margin: "0 auto" }}>
            <span className="crown">👑</span>+{winReward(moveCount)} Coronas
          </div>
        )}
        <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
          <button className="btn" onClick={onNew}>
            ▶ Nueva partida
          </button>
          <Link to="/" className="btn secondary">
            Lobby
          </Link>
        </div>
      </div>
    </div>
  );
}
