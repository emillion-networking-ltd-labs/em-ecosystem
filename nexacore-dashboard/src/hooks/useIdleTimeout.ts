"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const USER_EVENTS: (keyof DocumentEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

/**
 * Tracks user inactivity. Shows warning `warningMs` before timeout.
 * Returns { showWarning, secondsLeft, keepAlive } for the UI.
 */
export function useIdleTimeout(
  timeoutMs: number,
  onIdle: () => void,
  enabled: boolean,
  warningMs = 120_000,
) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onIdleRef = useRef(onIdle);
  const warningActiveRef = useRef(false);
  onIdleRef.current = onIdle;

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    idleTimerRef.current = null;
    warningTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();
    warningActiveRef.current = false;
    setShowWarning(false);

    const warningDelay = Math.max(timeoutMs - warningMs, 0);

    warningTimerRef.current = setTimeout(() => {
      warningActiveRef.current = true;
      const secs = Math.ceil(warningMs / 1000);
      setSecondsLeft(secs);
      setShowWarning(true);
      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningDelay);

    idleTimerRef.current = setTimeout(() => {
      clearAllTimers();
      warningActiveRef.current = false;
      setShowWarning(false);
      onIdleRef.current();
    }, timeoutMs);
  }, [timeoutMs, warningMs, clearAllTimers]);

  const handleUserActivity = useCallback(() => {
    // Only reset if warning is NOT showing — once warning appears,
    // only "Keep me signed in" button should reset
    if (!warningActiveRef.current) {
      startTimers();
    }
  }, [startTimers]);

  const keepAlive = useCallback(() => {
    warningActiveRef.current = false;
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      warningActiveRef.current = false;
      setShowWarning(false);
      return;
    }

    startTimers();

    for (const event of USER_EVENTS) {
      document.addEventListener(event, handleUserActivity, { passive: true });
    }

    return () => {
      clearAllTimers();
      for (const event of USER_EVENTS) {
        document.removeEventListener(event, handleUserActivity);
      }
    };
  }, [enabled, startTimers, handleUserActivity, clearAllTimers]);

  return { showWarning, secondsLeft, keepAlive };
}
