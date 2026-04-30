"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Viewport-triggered stagger animation.
 *
 * Returns a ref to attach to the stagger container, and a className to apply
 * to that same container:
 *   - Initial / pre-IO:  "stagger-init"       (children set to opacity: 0)
 *   - After first entry: animationClass        (stagger animation plays)
 *
 * Available animation classes: "animate-stagger-slow" (subtle, 10px rise, 800ms),
 * "animate-fade-up" (pronounced, 24px rise, 500ms crisp stagger).
 *
 * Reduced-motion users: the CSS media override (in globals.css) neutralizes
 * all stagger classes — children render at natural opacity without animation.
 *
 * Fires once. Observer disconnects after first viewport entry.
 */
export function useStaggerOnView<T extends HTMLElement>(
  animationClass:
    | "animate-stagger-slow"
    | "animate-fade-up" = "animate-stagger-slow",
  threshold = 0.15,
) {
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

  return {
    ref,
    className: inView ? animationClass : "stagger-init",
  };
}
