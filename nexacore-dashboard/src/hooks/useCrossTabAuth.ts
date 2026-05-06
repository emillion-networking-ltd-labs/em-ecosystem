"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Auth events broadcast across tabs.
 *
 * - `LOGOUT`: emitted by any tab on user-initiated logout or 401 cascade
 *   (handleAuthFailure). Receiving tabs dispatch their own LOGOUT and redirect
 *   to /login without waiting for their next request to 401.
 * - `AUTH_SUCCESS`: emitted on successful login. Currently a no-op for
 *   listeners (each tab is responsible for its own state). Reserved for future
 *   use cases like refreshing user info in other tabs after a profile update.
 */
export type CrossTabAuthEvent = "LOGOUT" | "AUTH_SUCCESS";

type Message = { type: CrossTabAuthEvent; id: string };

const CHANNEL_NAME = "em-auth";
const STORAGE_KEY = "em-auth-event";

/**
 * Dual-channel cross-tab auth synchronization (SCRUM-349 sub-task 2 + follow-up).
 *
 * Broadcasts every event through TWO independent channels in parallel:
 *
 *   1. `BroadcastChannel` — fast, modern, doesn't touch storage. 97%+ support.
 *   2. `storage` event on `localStorage` — universal fallback. Fires in every
 *      other tab of the same origin without exception (separate windows,
 *      different processes, environments where BroadcastChannel is silently
 *      blocked by extensions or enterprise policy, etc.).
 *
 * The receiver dedupes by message `id` so that an event arriving via both
 * channels still triggers `onEvent` only once. Each broadcast generates a
 * unique id (`crypto.randomUUID`).
 *
 * Why dual: relying on BroadcastChannel alone is brittle — Slack, Linear,
 * banking apps all stack a localStorage fallback for exactly this reason.
 *
 * Scope: same browser profile + same origin. Incognito windows are separate
 * profiles by design — events do NOT propagate across them.
 *
 * @param onEvent Stable callback invoked when an event is received from
 *   another tab. Should be wrapped in `useCallback` by the caller. Self-broadcast
 *   is NOT delivered.
 * @returns `broadcast` function to send an event to other tabs.
 */
export function useCrossTabAuth(onEvent: (event: CrossTabAuthEvent) => void): {
  broadcast: (event: CrossTabAuthEvent) => void;
} {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onEventRef = useRef(onEvent);
  const lastIdRef = useRef<string>("");

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dispatch = (data: unknown) => {
      if (!data || typeof data !== "object") return;
      const msg = data as Partial<Message>;
      if (typeof msg.id !== "string" || msg.id.length === 0) return;
      if (msg.type !== "LOGOUT" && msg.type !== "AUTH_SUCCESS") return;
      // Dedupe: the same broadcast can arrive via BroadcastChannel AND the
      // storage event. The id is unique per broadcast call, so seeing the
      // same id twice means duplicate delivery — drop the second one.
      if (msg.id === lastIdRef.current) return;
      lastIdRef.current = msg.id;
      onEventRef.current(msg.type);
    };

    let channel: BroadcastChannel | null = null;
    const bcHandler = (e: MessageEvent<unknown>) => dispatch(e.data);
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;
      channel.addEventListener("message", bcHandler);
    }

    const storageHandler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        dispatch(JSON.parse(e.newValue));
      } catch {
        // Malformed JSON — ignore.
      }
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      if (channel) {
        channel.removeEventListener("message", bcHandler);
        channel.close();
        channelRef.current = null;
      }
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const broadcast = useCallback((event: CrossTabAuthEvent) => {
    const payload: Message = { type: event, id: makeId() };

    channelRef.current?.postMessage(payload);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const serialized = JSON.stringify(payload);
        window.localStorage.setItem(STORAGE_KEY, serialized);
        // Remove immediately so the same logical event can be re-emitted later
        // (storage event fires on each setItem; the subsequent removeItem fires
        // with newValue=null and is filtered by listeners).
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Private mode, quota exceeded, or storage disabled — BroadcastChannel
        // path still delivered if available.
      }
    }
  }, []);

  return { broadcast };
}

function makeId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
