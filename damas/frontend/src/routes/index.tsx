import { useAuth } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Backpack,
  ChevronLeft,
  ChevronRight,
  Crown,
  History,
  LogIn,
  type LucideIcon,
  RotateCcw,
  Star,
  Store,
  Swords,
  Trophy,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { CoronasPill } from "@/components/ui/CoronasPill";
import { Filigree } from "@/components/ui/Filigree";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useApi } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";
import { useGoldNavigate } from "@/lib/transition";
import type { Game } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) {
    return (
      <div className="lobby">
        <div className="lobby-inner">
          <img src="/quings-logo.svg" alt="Quings" className="lobby-emblem spin-slow" />
        </div>
      </div>
    );
  }
  return isSignedIn ? <Lobby /> : <SignedOutHero />;
}

interface MenuEntry {
  key: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  to?: string;
}

function Lobby() {
  const api = useApi();
  const { profile } = useProfile();
  const go = useGoldNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [busy, setBusy] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api.listGames().then(setGames).catch(() => undefined);
  }, [api]);

  const lastGame = games[0];

  const newGame = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    playSfx("select");
    try {
      const g = await api.createGame();
      go({ to: "/play/$id", params: { id: g._id } });
    } finally {
      setBusy(false);
    }
  }, [api, busy, go]);

  const items: MenuEntry[] = [
    { key: "play", label: "JUGAR", icon: Swords, primary: true },
    { key: "games", label: "PARTIDAS GUARDADAS", icon: History, to: "/games" },
    { key: "ranking", label: "RANKING", icon: Trophy, to: "/ranking" },
    { key: "shop", label: "TIENDA", icon: Store, to: "/shop" },
    { key: "locker", label: "INVENTARIO", icon: Backpack, to: "/locker" },
    { key: "coronas", label: "COMPRAR CORONAS", icon: Crown, to: "/coronas" },
  ];

  const activate = useCallback(
    (i: number) => {
      const it = items[i];
      if (!it) return;
      if (it.primary) void newGame();
      else if (it.to) go({ to: it.to });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [go, newGame],
  );

  // Navegación por teclado (flechas + Enter), feel de consola.
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const len = items.length;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => (i + 1) % len);
        playSfx("hover");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => (i - 1 + len) % len);
        playSfx("hover");
      } else if (e.key === "Enter") {
        activate(idxRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [len, activate]);

  return (
    <div className="lobby">
      <AmbientBackground />

      <div className="lobby-hud">
        {profile && <CoronasPill amount={profile.coronas} />}
        <SoundToggle />
        <UserAvatar />
      </div>

      <div className="lobby-inner">
        <motion.img
          src="/quings-logo.svg"
          alt="Quings"
          className="lobby-emblem"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        <div className="title-row">
          <Filigree side="left" />
          <motion.h1
            className="wordmark"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            QUINGS
          </motion.h1>
          <Filigree side="right" />
        </div>

        <motion.div
          className="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: 0.5 }}
        >
          Bienvenido, {profile?.username ?? "Quing"}
        </motion.div>

        <motion.div
          className="lobby-stats"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <span className="pill gold">
            <Trophy size={14} strokeWidth={2.4} /> {profile?.totalWins ?? 0} victorias
          </span>
          <span className="pill">
            <Star size={14} strokeWidth={2.4} /> Mejor:{" "}
            {profile?.bestWinMoves != null ? `${profile.bestWinMoves} mov` : "—"}
          </span>
        </motion.div>

        <Stagger className="menu">
          {items.map((it, i) => {
            const Icon = it.icon;
            const active = idx === i;
            return (
              <div key={it.key}>
                <StaggerItem>
                  <button
                    className={`menu-item${it.primary ? " primary" : ""}${active ? " active" : ""}`}
                    onMouseEnter={() => {
                      setIdx(i);
                      playSfx("hover");
                    }}
                    onFocus={() => setIdx(i)}
                    onClick={() => activate(i)}
                    disabled={it.primary && busy}
                  >
                    <ChevronRight className="orn l" size={20} strokeWidth={2.6} />
                    <Icon size={it.primary ? 28 : 22} strokeWidth={2.2} />
                    <span>{it.primary && busy ? "CREANDO…" : it.label}</span>
                    <ChevronLeft className="orn r" size={20} strokeWidth={2.6} />
                  </button>
                </StaggerItem>
                {it.primary && lastGame && (
                  <StaggerItem>
                    <button
                      className="menu-continue"
                      onMouseEnter={() => playSfx("hover")}
                      onClick={() => go({ to: "/play/$id", params: { id: lastGame._id } })}
                    >
                      <RotateCcw size={15} strokeWidth={2.2} />
                      Continuar última partida ({lastGame.moveCount} mov)
                    </button>
                  </StaggerItem>
                )}
              </div>
            );
          })}
        </Stagger>
      </div>
    </div>
  );
}

function SignedOutHero() {
  return (
    <div className="lobby">
      <AmbientBackground />
      <div className="lobby-inner">
        <motion.img
          src="/quings-logo.svg"
          alt="Quings"
          className="lobby-emblem"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        />
        <div className="title-row">
          <Filigree side="left" />
          <h1 className="wordmark">QUINGS</h1>
          <Filigree side="right" />
        </div>
        <p className="muted" style={{ fontSize: 18, maxWidth: 460, marginTop: 18 }}>
          Damas contra una IA que piensa con <strong>A*</strong>. Gana Coronas, colecciona skins y
          escala el ranking global.
        </p>
        <div className="row" style={{ justifyContent: "center", marginTop: 26 }}>
          <a href="/sign-in" className="btn lg">
            <LogIn size={20} strokeWidth={2.2} /> Entrar
          </a>
          <a href="/sign-up" className="btn lg secondary">
            <UserPlus size={20} strokeWidth={2.2} /> Crear cuenta
          </a>
        </div>
      </div>
    </div>
  );
}
