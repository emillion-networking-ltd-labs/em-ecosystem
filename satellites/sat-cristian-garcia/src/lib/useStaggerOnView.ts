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
  threshold = 0.1,
  /** Negative bottom margin prevents the group from firing when only its top
   *  edge is peeking into the viewport bottom. Default excludes the bottom 15%
   *  of the viewport from the trigger zone. */
  rootMargin = "0% 0% -15% 0%",
) {
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
    // above-fold groups don't stagger invisibly behind the splash. See same
    // pattern in useFadeInOnView.
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

  return {
    ref,
    className: inView ? animationClass : "stagger-init",
  };
}
