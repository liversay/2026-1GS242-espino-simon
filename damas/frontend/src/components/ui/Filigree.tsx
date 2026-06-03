/** Filigrana dorada ornamental que se "dibuja" en la entrada (animando pathLength). */

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function Filigree({ side }: { side: "left" | "right" }) {
  const reduced = useReducedMotion();
  const draw = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
    : {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration: 1.1, ease: "easeInOut" as const, delay: 0.25 },
      };

  return (
    <svg
      className="filigree"
      viewBox="0 0 160 60"
      width="160"
      height="60"
      fill="none"
      aria-hidden
      style={{ transform: side === "right" ? "scaleX(-1)" : undefined }}
    >
      <motion.path
        d="M158 30 C120 30 120 8 92 8 C70 8 70 30 50 30 C34 30 30 16 16 22 C8 25 6 30 2 30"
        stroke="url(#fg)"
        strokeWidth="2.5"
        strokeLinecap="round"
        {...draw}
      />
      <motion.path
        d="M50 30 C70 30 70 52 92 52 C112 52 116 38 132 42"
        stroke="url(#fg)"
        strokeWidth="2"
        strokeLinecap="round"
        {...draw}
        transition={{ ...draw.transition, delay: (draw.transition?.delay ?? 0) + 0.15 }}
      />
      <motion.circle
        cx="158"
        cy="30"
        r="3.5"
        fill="var(--gold-400)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: reduced ? 0.2 : 1.2, duration: 0.3 }}
      />
      <defs>
        <linearGradient id="fg" x1="0" y1="0" x2="160" y2="0">
          <stop offset="0%" stopColor="#C8922B" />
          <stop offset="55%" stopColor="#F8D86B" />
          <stop offset="100%" stopColor="#EBB63F" />
        </linearGradient>
      </defs>
    </svg>
  );
}
