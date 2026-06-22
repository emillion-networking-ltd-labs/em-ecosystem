"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

// Scroll-reveal genérico y AUTOSUFICIENTE para las secciones del design system (ECO-54).
// No depende de keyframes en el CSS global (a diferencia de los hooks app-specific de SAT01): usa un
// IntersectionObserver + una transición INLINE de opacidad/translate. Respeta prefers-reduced-motion
// (muestra el contenido sin animar) y degrada a visible si no hay IntersectionObserver. El HTML siempre
// contiene el texto (opacity-0 no lo oculta a los crawlers); úsalo SOLO en secciones below-the-fold
// (no en el hero, para no penalizar el LCP).
export function useReveal<T extends HTMLElement>(opts: { delay?: number } = {}) {
  const { delay = 0 } = opts;
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "none" : "translateY(16px)",
    transition: `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`,
    willChange: "opacity, transform",
  };
  return { ref, style };
}
