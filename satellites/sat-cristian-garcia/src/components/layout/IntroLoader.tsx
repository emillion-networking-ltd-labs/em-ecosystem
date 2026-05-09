"use client";

import { useEffect, useState } from "react";

/**
 * IntroLoader — splash screen + loading indicator on first visit per browser session.
 *
 * Acts as a REAL loader, not a fixed-duration animation:
 * - Appears in the SSR HTML so it covers the page from the very first paint
 *   (no flash of page content while React hydrates).
 * - Plays its entry sequence (words → phrase → period) on a fixed timeline.
 * - Then HOLDS in the "phrase + period visible" state until BOTH:
 *     (a) minimum branding hold elapsed (MIN_HOLD_MS) — guarantees entry plays in full
 *     (b) `window.load` has fired — page resources are ready
 * - When both conditions met, JS adds `.exiting` class and the CSS exit
 *   sequence (tremble → punch-out → overlay fade) runs. Page reveals only
 *   AFTER the overlay finishes fading — never during a splash animation.
 *
 * Net result:
 *   - Fast page: splash plays for ~2.7s + 0.65s exit = ~3.35s total.
 *   - Slow page: splash holds visible until load fires, then runs exit.
 *
 * Repeat-visit FOUC fix: synchronous script in <head> (INTRO_INIT_SCRIPT in
 * layout.tsx) adds `.intro-skip` to <html> when sessionStorage flag is set,
 * and CSS hides the overlay before first paint.
 *
 * Other behavior:
 * - sessionStorage gate → shows once per browser session.
 * - prefers-reduced-motion → skipped entirely (WCAG 2.3.3).
 * - Body scroll locked while overlay is visible.
 * - Always dark theme regardless of user preference (branding).
 */
const MIN_HOLD_MS = 2700; // Words (1400) + phrase fade-in (800) + period (500) = 2700
const EXIT_MS = 650; // Tremble (200) + punch-out (200) + overlay fade (250)

export default function IntroLoader() {
  // Default true so the overlay is in the SSR HTML and covers the page from
  // the very first paint. CSS hides it for repeat visitors via .intro-skip.
  const [show, setShow] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const alreadySeen = sessionStorage.getItem("intro_seen");

    // Skip path: never lock scroll, unmount immediately.
    if (reduceMotion || alreadySeen) {
      setShow(false);
      return;
    }

    document.body.style.overflow = "hidden";

    let pageReady = document.readyState === "complete";
    let holdElapsed = false;
    let exitFired = false;
    let unmountTimer: ReturnType<typeof setTimeout> | undefined;

    const startExit = () => {
      if (exitFired || !pageReady || !holdElapsed) return;
      exitFired = true;
      setExiting(true);
      unmountTimer = setTimeout(() => {
        // Mark as seen ONLY after the splash has fully completed. This keeps
        // the splash StrictMode-dev safe (double-invoke of useEffect won't
        // see the flag set by the first invocation and skip itself), and
        // also means a reload mid-splash will replay the splash next time
        // (the user hasn't really "seen" it if it didn't finish).
        sessionStorage.setItem("intro_seen", "1");
        // Notify in-view animation hooks so above-fold cards (which were
        // hidden behind the splash) start observing/animating now.
        // See useFadeInOnView / useStaggerOnView splash gate.
        window.dispatchEvent(new CustomEvent("intro:exit"));
        setShow(false);
        document.body.style.overflow = "";
      }, EXIT_MS);
    };

    const holdTimer = setTimeout(() => {
      holdElapsed = true;
      startExit();
    }, MIN_HOLD_MS);

    const onLoad = () => {
      pageReady = true;
      startExit();
    };

    if (!pageReady) {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      clearTimeout(holdTimer);
      if (unmountTimer) clearTimeout(unmountTimer);
      window.removeEventListener("load", onLoad);
      document.body.style.overflow = "";
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={exiting ? "intro-loader exiting" : "intro-loader"}
      aria-hidden="true"
    >
      <div className="intro-frame intro-frame-w1">AQUÍ</div>
      <div className="intro-frame intro-frame-w2">CAMBIARÁS</div>
      <div className="intro-frame intro-frame-w3">TU</div>
      <div className="intro-frame intro-frame-w4">VIDA</div>
      <div className="intro-frame intro-frame-phrase">
        AQUÍ CAMBIARÁS TU VIDA<span className="intro-period">.</span>
      </div>
    </div>
  );
}
