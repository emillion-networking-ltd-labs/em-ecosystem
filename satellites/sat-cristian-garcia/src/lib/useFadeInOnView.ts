"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Per-element viewport-triggered fade-in.
 *
 * Each element calling this hook gets its own IntersectionObserver, so it
 * animates only when IT enters the viewport — not when its parent section does.
 * Use this for cards or items spread across multiple viewport heights.
 *
 * Implementation note: uses CSS `animation` (keyframes) instead of `transition`
 * to guarantee the delay/order even when multiple elements become inView in
 * the same render. CSS animations have deterministic timing; transitions can
 * race with React state updates of `transitionDelay`.
 *
 * Returns a ref to attach to the element, plus a ready-made `style` that hides
 * the element until inView, then runs the keyframe animation with the configured
 * delay and duration. Pass `delay` to stagger items that enter the viewport
 * together (e.g. siblings in a grid).
 *
 * Reduced-motion users: the CSS media override (in globals.css) neutralizes
 * the keyframe animations — items render at natural opacity.
 */
export function useFadeInOnView<T extends HTMLElement>({
  threshold = 0.15,
  delay = 0,
  duration = 700,
  from = "bottom",
}: { threshold?: number; delay?: number; duration?: number; from?: "bottom" | "left" | "right" } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const animationName =
    from === "left" ? "fade-from-left" : from === "right" ? "fade-from-right" : "fade-up";

  // Always start at opacity 0. When inView becomes true, apply the animation
  // which goes from opacity 0 to 1 over `duration` ms after `delay` ms.
  // `forwards` keeps the element at the final state after the animation ends.
  const style: React.CSSProperties = inView
    ? {
        opacity: 0,
        animation: `${animationName} ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
      }
    : { opacity: 0 };

  return {
    ref,
    inView,
    className: "",
    style,
  };
}
