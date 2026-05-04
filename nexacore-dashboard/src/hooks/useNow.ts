"use client";

import { useEffect, useState } from "react";

/**
 * Re-render the calling component on a fixed interval.
 *
 * Use this when the UI shows DERIVED time values that need to "tick"
 * forward as wall-clock time advances — e.g. relative timestamps
 * ("Last active 11m ago"). Without it, those captions stay frozen at
 * whatever the elapsed time was at the last render even though minutes
 * keep passing.
 *
 * Industry pattern: GitHub, Stripe, Slack, Twitter all use a 60 s tick
 * for relative-time captions on lists. 30 s here for slightly nicer
 * sub-minute transitions ("Just now" → "1m ago") at negligible CPU cost.
 *
 * Uses a single setInterval; cleans up on unmount. Safe to mount in many
 * components — the cost is one ticker per consumer, but each render
 * triggered is cheap (React diffing on unchanged tree).
 *
 * @param intervalMs Tick frequency. Defaults to 30 000 ms (30 s).
 * @returns Current Date.now() value, refreshed each tick. Most callers
 *   ignore the return value and just rely on the side-effect re-render
 *   to recompute their formatRelativeTime calls.
 */
export function useNow(intervalMs: number = 30_000): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
