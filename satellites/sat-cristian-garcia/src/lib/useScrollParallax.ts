"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Subtle scroll-driven parallax for sections.
 *
 * As the section enters and passes through the viewport, it translates downward
 * by up to `maxOffset` px, creating a "lag" effect against the rest of the page.
 * Used by the home sections (Services, Portfolio, Transformations, AppPreview,
 * CTA) — apply here to keep new sections visually consistent.
 *
 * Returns a ref to attach to the <section>, plus a ready-made `style` with the
 * transform. Pure scroll-driven; not affected by IntersectionObserver.
 */
export function useScrollParallax<T extends HTMLElement>(maxOffset = 40) {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const trigger = window.innerHeight;
      const progress = Math.min(
        Math.max((trigger - rect.top) / trigger, 0),
        1,
      );
      setOffset(progress * maxOffset);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [maxOffset]);

  return {
    ref,
    style: { transform: `translateY(${offset}px)` },
  };
}
