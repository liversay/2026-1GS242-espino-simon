/** Ajustes globales: velocidad de animación y SFX (persistidos en localStorage). */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setSoundEnabled } from "./sound";

interface Settings {
  speed: number; // multiplicador: >1 acelera animaciones
  sound: boolean;
  setSpeed: (s: number) => void;
  toggleSound: () => void;
}

const Ctx = createContext<Settings | null>(null);

const SPEED_KEY = "quings.speed";
const SOUND_KEY = "quings.sound";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [speed, setSpeedState] = useState(1);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    const s = Number(localStorage.getItem(SPEED_KEY));
    if (s) setSpeedState(s);
    const snd = localStorage.getItem(SOUND_KEY);
    if (snd !== null) setSound(snd === "1");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--speed", String(speed));
  }, [speed]);

  useEffect(() => {
    setSoundEnabled(sound);
  }, [sound]);

  function setSpeed(s: number) {
    setSpeedState(s);
    localStorage.setItem(SPEED_KEY, String(s));
  }
  function toggleSound() {
    setSound((v) => {
      localStorage.setItem(SOUND_KEY, v ? "0" : "1");
      return !v;
    });
  }

  return (
    <Ctx.Provider value={{ speed, sound, setSpeed, toggleSound }}>{children}</Ctx.Provider>
  );
}

export function useSettings(): Settings {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings fuera de SettingsProvider");
  return ctx;
}
