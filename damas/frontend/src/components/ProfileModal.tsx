/**
 * Modal de "Detalles del perfil": monta el <UserProfile> de Clerk con una página
 * personalizada "Apodo" para editar el nickname propio de Quings (username en Mongo,
 * vía PATCH /api/me). Se abre desde el avatar en lugar de clerk.openUserProfile().
 */

import { UserProfile } from "@clerk/tanstack-react-start";
import { AnimatePresence, motion } from "motion/react";
import { Check, Crown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError, useApi } from "@/lib/api";
import { clerkAppearance } from "@/lib/clerkAppearance";
import { useProfile } from "@/lib/profile";
import { playSfx } from "@/lib/sound";

const MIN = 3;
const MAX = 20;

/** Formulario para cambiar el apodo. Vive como página personalizada del UserProfile. */
function NicknamePage({ onSaved }: { onSaved: (nick: string) => void }) {
  const api = useApi();
  const { profile, setProfile } = useProfile();
  const [value, setValue] = useState(profile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza el campo cuando el perfil termina de cargar.
  useEffect(() => {
    if (profile?.username) setValue(profile.username);
  }, [profile?.username]);

  const trimmed = value.trim();
  const unchanged = trimmed === (profile?.username ?? "");
  const invalid = trimmed.length < MIN || trimmed.length > MAX;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid || unchanged || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.setUsername(trimmed);
      setProfile(updated);
      playSfx("select");
      onSaved(updated.username);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el apodo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="nick-page">
      <header className="nick-head">
        <Crown size={26} strokeWidth={2} />
        <div>
          <h1>Apodo</h1>
          <p>Es el nombre con el que apareces en el ranking y el lobby.</p>
        </div>
      </header>

      <form className="nick-form" onSubmit={submit}>
        <label className="nick-label" htmlFor="nick-input">
          Tu apodo
        </label>
        <input
          id="nick-input"
          className="nick-input"
          value={value}
          maxLength={MAX}
          autoComplete="off"
          spellCheck={false}
          placeholder="Quing"
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
        />
        <div className="nick-hint">
          <span>Entre {MIN} y {MAX} caracteres.</span>
          <span>{trimmed.length}/{MAX}</span>
        </div>

        {error && <p className="nick-msg err">{error}</p>}

        <button
          type="submit"
          className="btn block"
          disabled={saving || invalid || unchanged}
          onMouseEnter={() => playSfx("hover")}
        >
          {saving ? "Guardando…" : "Guardar apodo"}
        </button>
      </form>
    </div>
  );
}

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // El popout de confirmación se oculta solo a los 2.6 s.
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(null), 2600);
    return () => clearTimeout(t);
  }, [confirm]);

  return (
    <AnimatePresence>
      <motion.div
        className="overlay profile-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
      >
        <motion.div
          className="profile-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <button className="profile-close" aria-label="Cerrar" onClick={onClose}>
            <X size={18} strokeWidth={2.4} />
          </button>
          <UserProfile routing="hash" appearance={clerkAppearance}>
            <UserProfile.Page
              label="Apodo"
              url="apodo"
              labelIcon={<Crown size={16} strokeWidth={2.2} />}
            >
              <NicknamePage onSaved={(nick) => setConfirm(nick)} />
            </UserProfile.Page>
          </UserProfile>
        </motion.div>

        <AnimatePresence>
          {confirm && (
            <motion.div
              className="nick-confirm"
              role="status"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
            >
              <span className="nick-confirm-icon">
                <Check size={18} strokeWidth={3} />
              </span>
              <div>
                <strong>¡Apodo guardado!</strong>
                <span>Ahora eres {confirm}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
