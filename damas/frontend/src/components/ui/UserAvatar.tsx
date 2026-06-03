/** Avatar de usuario propio (no el UserButton de Clerk) con dropdown en tema Quings. */

import { useClerk, useUser } from "@clerk/tanstack-react-start";
import { AnimatePresence, motion } from "motion/react";
import { LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clerkAppearance } from "@/lib/clerkAppearance";
import { playSfx } from "@/lib/sound";

function initials(name?: string | null, email?: string | null): string {
  const base = (name ?? email ?? "Q").trim();
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function UserAvatar() {
  const { user } = useUser();
  const clerk = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = user?.fullName ?? user?.username ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  // Solo mostramos imagen si el usuario subió una propia (evita el avatar autogenerado).
  const img = user?.hasImage ? user.imageUrl : null;

  function toggle() {
    setOpen((o) => {
      if (!o) playSfx("select");
      return !o;
    });
  }

  return (
    <div className="avatar-wrap" ref={ref}>
      <button
        className="avatar-btn"
        onClick={toggle}
        aria-label="Menú de usuario"
        onMouseEnter={() => playSfx("hover")}
      >
        {img ? (
          <img src={img} alt={name ?? "Usuario"} />
        ) : (
          <span className="avatar-initials">{initials(name, email)}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="avatar-menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div className="avatar-menu-head">
              <div className="avatar-menu-name">{name ?? "Quing"}</div>
              {email && <div className="avatar-menu-email">{email}</div>}
            </div>
            <button
              className="avatar-menu-item"
              onMouseEnter={() => playSfx("hover")}
              onClick={() => {
                setOpen(false);
                clerk.openUserProfile({ appearance: clerkAppearance });
              }}
            >
              <UserRound size={16} strokeWidth={2.2} />
              Perfil
            </button>
            <button
              className="avatar-menu-item danger"
              onMouseEnter={() => playSfx("hover")}
              onClick={() => {
                playSfx("back");
                void clerk.signOut();
              }}
            >
              <LogOut size={16} strokeWidth={2.2} />
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
