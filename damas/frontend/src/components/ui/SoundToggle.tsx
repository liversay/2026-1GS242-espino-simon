/** Toggle de sonido del HUD (mute persistente compartido). */

import { Volume2, VolumeX } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { playSfx } from "@/lib/sound";

export function SoundToggle() {
  const { sound, toggleSound } = useSettings();
  return (
    <button
      className="hud-icon-btn"
      onClick={() => {
        toggleSound();
        if (!sound) playSfx("select"); // suena al activar
      }}
      data-tooltip={sound ? "Silenciar" : "Activar sonido"}
      aria-label={sound ? "Silenciar" : "Activar sonido"}
    >
      {sound ? <Volume2 size={18} strokeWidth={2.2} /> : <VolumeX size={18} strokeWidth={2.2} />}
    </button>
  );
}
