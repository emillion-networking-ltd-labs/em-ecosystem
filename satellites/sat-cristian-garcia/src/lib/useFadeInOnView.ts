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
  threshold = 0.1,
  rootMargin = "0% 0% -15% 0%",
  delay = 0,
  duration = 700,
  from = "bottom",
}: {
  threshold?: number;
  /** Negative bottom margin (e.g. "0% 0% -15% 0%") prevents the element from
   *  firing when its top edge is merely peeking into the viewport bottom.
   *  See https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API */
  rootMargin?: string;
  delay?: number;
  duration?: number;
  from?: "bottom" | "left" | "right";
} = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const startObserving = () => {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        },
        { threshold, rootMargin },
      );
      io.observe(el);
      return io;
    };

    // Splash gate: while the IntroLoader is covering the page, defer the IO so
    // above-fold elements don't run their fade-in animation invisibly behind the
    // splash. Detection: sessionStorage flag absent AND a `.intro-loader` element
    // currently in the DOM. Reduced-motion users have no `.intro-loader`, so this
    // path is skipped and the IO starts immediately.
    const splashActive =
      typeof window !== "undefined" &&
      !sessionStorage.getItem("intro_seen") &&
      document.querySelector(".intro-loader") !== null;

    if (splashActive) {
      let io: IntersectionObserver | null = null;
      const onIntroExit = () => {
        io = startObserving();
      };
      window.addEventListener("intro:exit", onIntroExit, { once: true });
      return () => {
        window.removeEventListener("intro:exit", onIntroExit);
        io?.disconnect();
      };
    }

    const io = startObserving();
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  const animationName =
    from === "left"
      ? "fade-from-left"
      : from === "right"
        ? "fade-from-right"
        : "fade-up";

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
