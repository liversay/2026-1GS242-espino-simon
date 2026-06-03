/** Fondo ambiental: partículas de polvo en drift + leve parallax con el cursor. */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const COUNT = 30;

export function AmbientBackground() {
  const reduced = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  // Solo en cliente: evita mismatch de hidratación por posiciones aleatorias.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const particles = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const size = 2 + Math.random() * 4;
        return {
          id: i,
          style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            opacity: 0.1 + Math.random() * 0.35,
            animationDuration: `${10 + Math.random() * 16}s`,
            animationDelay: `${-Math.random() * 20}s`,
          } as CSSProperties,
        };
      }),
    [],
  );

  useEffect(() => {
    if (reduced) return;
    const layer = layerRef.current;
    if (!layer) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e: PointerEvent) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        tx = dx * 14;
        ty = dy * 14;
        layer.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced || !mounted) return null;

  return (
    <div className="ambient" aria-hidden>
      <div className="ambient-layer" ref={layerRef}>
        {particles.map((p) => (
          <span key={p.id} className="dust" style={p.style} />
        ))}
      </div>
    </div>
  );
}
