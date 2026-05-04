"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Auth events broadcast across tabs via the BroadcastChannel API.
 *
 * - `LOGOUT`: emitted by any tab on user-initiated logout or 401 cascade
 *   (handleAuthFailure). Receiving tabs dispatch their own LOGOUT and redirect
 *   to /login without waiting for their next request to 401.
 * - `AUTH_SUCCESS`: emitted on successful login. Currently a no-op for
 *   listeners (each tab is responsible for its own state). Reserved for future
 *   use cases like refreshing user info in other tabs after a profile update.
 */
export type CrossTabAuthEvent = "LOGOUT" | "AUTH_SUCCESS";

type Message = { type: CrossTabAuthEvent; ts: number };

const CHANNEL_NAME = "em-auth";

/**
 * BroadcastChannel-based cross-tab auth synchronization (SCRUM-349 sub-task 2).
 *
 * Scope: same browser profile + same origin. Incognito windows are separate
 * profiles by design — events do NOT propagate across them.
 *
 * Browser support: 97%+ as of 2026 per caniuse. Falls back to a silent no-op
 * `broadcast` when `BroadcastChannel` is undefined; listener never fires.
 *
 * @param onEvent Stable callback invoked when an event is received from
 *   another tab. Should be wrapped in `useCallback` by the caller. Self-broadcast
 *   is NOT delivered (BroadcastChannel does not deliver to the originating tab).
 * @returns `broadcast` function to send an event to other tabs.
 */
export function useCrossTabAuth(onEvent: (event: CrossTabAuthEvent) => void): {
  broadcast: (event: CrossTabAuthEvent) => void;
} {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onEventRef = useRef(onEvent);

  // Keep the latest onEvent without retriggering the mount-only effect.
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    const handler = (e: MessageEvent<Message>) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type !== "LOGOUT" && e.data.type !== "AUTH_SUCCESS") return;
      onEventRef.current(e.data.type);
    };

    channel.addEventListener("message", handler);

    return () => {
      channel.removeEventListener("message", handler);
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const broadcast = useCallback((event: CrossTabAuthEvent) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.postMessage({ type: event, ts: Date.now() } satisfies Message);
  }, []);

  return { broadcast };
}
