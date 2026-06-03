/**
 * transition.tsx — Transición de ruta dorada reutilizable entre pantallas.
 * `useGoldNavigate()` dispara un wipe dorado y luego navega; `useGoldBack()` igual con sonido "back".
 */

import { useNavigate } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { playSfx } from "./sound";

interface TransitionCtx {
  run: (cb: () => void) => void;
  active: boolean;
}

const Ctx = createContext<TransitionCtx | null>(null);

export function GoldTransitionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const busy = useRef(false);

  const run = useCallback((cb: () => void) => {
    if (busy.current) return;
    busy.current = true;
    setActive(true);
    window.setTimeout(() => {
      cb();
      window.setTimeout(() => {
        setActive(false);
        busy.current = false;
      }, 240);
    }, 240);
  }, []);

  return (
    <Ctx.Provider value={{ run, active }}>
      {children}
      <div className={`gold-wipe${active ? " on" : ""}`} aria-hidden />
    </Ctx.Provider>
  );
}

function useTransition(): TransitionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTransition fuera de GoldTransitionProvider");
  return ctx;
}

interface GoOptions {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  replace?: boolean;
}

/** Navega a una ruta con la transición dorada + sonido ("select" por defecto, "back" al volver). */
export function useGoldNavigate() {
  const navigate = useNavigate();
  const { run } = useTransition();
  return useCallback(
    (opts: GoOptions, sound: "select" | "back" = "select") => {
      playSfx(sound);
      run(() => void navigate(opts as Parameters<typeof navigate>[0]));
    },
    [navigate, run],
  );
}
