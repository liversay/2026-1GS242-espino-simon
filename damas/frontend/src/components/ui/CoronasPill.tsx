/** Pill de Coronas con animación count-up y destello al cambiar el saldo. */

import { Crown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function CoronasPill({ amount }: { amount: number }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(amount);
  const [pulse, setPulse] = useState(false);
  const prev = useRef(amount);

  useEffect(() => {
    const from = prev.current;
    const to = amount;
    prev.current = to;
    if (from === to) return;

    setPulse(true);
    const pulseTimer = setTimeout(() => setPulse(false), 600);

    if (reduced) {
      setDisplay(to);
      return () => clearTimeout(pulseTimer);
    }

    const duration = 600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(pulseTimer);
    };
  }, [amount, reduced]);

  return (
    <span
      className={`coronas-pill${pulse ? " pulse" : ""}`}
      data-tooltip="Tu saldo de Coronas — gánalas jugando o cómpralas"
    >
      <Crown size={16} strokeWidth={2.4} />
      {display.toLocaleString("es")}
    </span>
  );
}
