"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { useAuth } from "@/hooks/useAuth";
import {
  passkeyRegisterOptions,
  passkeyRegisterVerify,
  passkeyLoginOptions,
  listPasskeys as apiListPasskeys,
  renamePasskey as apiRenamePasskey,
  deletePasskey as apiDeletePasskey,
} from "@/lib/passkey-api";
import type { PasskeyResponse, PasskeyRegisterResult } from "@/lib/types";

type ApiError = {
  error?: { message?: string; statusCode?: number; retryAfter?: number };
};

function extractMessage(err: unknown, fallback: string): string {
  const msg = (err as ApiError)?.error?.message ?? fallback;
  return msg.endsWith(".") ? msg : `${msg}.`;
}

export function usePasskey() {
  const { passkeyLogin } = useAuth();
  const [passkeys, setPasskeys] = useState<PasskeyResponse[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    retryAfter: number;
  } | null>(null);
  const clearRateLimit = useCallback(() => setRateLimitInfo(null), []);
  const abortRef = useRef(false);
  const [isConditionalAvailable, setIsConditionalAvailable] = useState(false);
  const conditionalAbortRef = useRef<AbortController | null>(null);

  const isSupported =
    typeof window !== "undefined" && !!window.PublicKeyCredential;

  const clearError = useCallback(() => setError(null), []);

  const fetchPasskeys = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await apiListPasskeys();
      setPasskeys(data);
    } catch (err) {
      setError(extractMessage(err, "Failed to load passkeys."));
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const registerPasskey = useCallback(
    async (
      password: string,
      name?: string,
    ): Promise<PasskeyRegisterResult | "invalid-password" | null> => {
      setIsRegistering(true);
      setError(null);
      try {
        const options = await passkeyRegisterOptions(password);
        const credential = await startRegistration({
          optionsJSON: options as never,
        });
        const result = await passkeyRegisterVerify(
          credential as unknown as Record<string, unknown>,
          name,
        );
        // Don't fetchPasskeys here — let the component control timing for animation
        return result;
      } catch (err: unknown) {
        if ((err as Error)?.name === "NotAllowedError") return null;
        const apiErr = err as ApiError;
        if (apiErr?.error?.statusCode === 401) {
          // SCRUM-327: invalid password — surface to caller for inline field error
          return "invalid-password";
        }
        if (apiErr?.error?.statusCode === 429) {
          setRateLimitInfo({ retryAfter: apiErr.error.retryAfter ?? 60 });
          return null;
        }
        setError(extractMessage(err, "Passkey registration failed."));
        return null;
      } finally {
        setIsRegistering(false);
      }
    },
    [fetchPasskeys],
  );

  const loginWithPasskey = useCallback(
    async (email?: string): Promise<void> => {
      setIsLoggingIn(true);
      setError(null);
      abortRef.current = false;
      try {
        const { options, challengeId } = await passkeyLoginOptions(email);
        if (abortRef.current) return;
        const credential = await startAuthentication({
          optionsJSON: options as never,
        });
        if (abortRef.current) return;
        await passkeyLogin(
          challengeId,
          credential as unknown as Record<string, unknown>,
        );
      } catch (err: unknown) {
        if ((err as Error)?.name === "NotAllowedError") return;
        // AuthContext.passkeyLogin already shows a toast — avoid duplicate inline error
      } finally {
        setIsLoggingIn(false);
      }
    },
    [passkeyLogin],
  );

  const handleRename = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      setError(null);
      try {
        await apiRenamePasskey(id, name);
        await fetchPasskeys();
        return true;
      } catch (err) {
        setError(extractMessage(err, "Failed to rename passkey."));
        return false;
      }
    },
    [fetchPasskeys],
  );

  const handleDelete = useCallback(
    async (id: string, password: string): Promise<string | null> => {
      setError(null);
      // SCRUM-327: NO optimistic removal. The action is gated by re-auth, so
      // a server-side rejection (401 invalid password) is a real possibility.
      // Optimistic removal + rollback caused a flicker (item disappears, then
      // reappears) — bad UX for destructive actions. Wait for server confirm.
      // (Same decision as useTrustedDevices.revokeDevice — see SCRUM-327 verify.)
      try {
        await apiDeletePasskey(id, password);
        // Refetch on success — AnimatePresence will animate the exit.
        await fetchPasskeys();
        return null;
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr?.error?.statusCode === 401) {
          // Invalid password — surface to caller for action-specific toast.
          return "invalid-password";
        }
        if (apiErr?.error?.statusCode === 429) {
          setRateLimitInfo({ retryAfter: apiErr.error.retryAfter ?? 60 });
          return "rate-limited";
        }
        const msg = extractMessage(err, "Failed to delete passkey.");
        setError(msg);
        return msg;
      }
    },
    [fetchPasskeys],
  );

  // Detect WebAuthn Conditional UI support (autofill-assisted passkeys)
  useEffect(() => {
    let cancelled = false;
    const pk = window.PublicKeyCredential as unknown as
      | { isConditionalMediationAvailable?: () => Promise<boolean> }
      | undefined;
    if (pk?.isConditionalMediationAvailable) {
      pk.isConditionalMediationAvailable().then((available) => {
        if (!cancelled) setIsConditionalAvailable(available);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const startConditionalUI = useCallback(async (): Promise<void> => {
    if (!isConditionalAvailable) return;
    // Abort any existing conditional request
    conditionalAbortRef.current?.abort();
    const controller = new AbortController();
    conditionalAbortRef.current = controller;
    try {
      const { options, challengeId } = await passkeyLoginOptions();
      if (controller.signal.aborted) return;
      const credential = await startAuthentication({
        optionsJSON: options as never,
        useBrowserAutofill: true,
      });
      if (controller.signal.aborted) return;
      await passkeyLogin(
        challengeId,
        credential as unknown as Record<string, unknown>,
      );
    } catch (err: unknown) {
      const name = (err as Error)?.name;
      if (name === "AbortError" || name === "NotAllowedError") return;
      // Silently ignore — conditional UI is a progressive enhancement
    } finally {
      if (conditionalAbortRef.current === controller) {
        conditionalAbortRef.current = null;
      }
    }
  }, [isConditionalAvailable, passkeyLogin]);

  const abortConditionalUI = useCallback(() => {
    conditionalAbortRef.current?.abort();
    conditionalAbortRef.current = null;
  }, []);

  return {
    isSupported,
    passkeys,
    isLoadingList,
    fetchPasskeys,
    registerPasskey,
    isRegistering,
    loginWithPasskey,
    isLoggingIn,
    renamePasskey: handleRename,
    deletePasskey: handleDelete,
    error,
    clearError,
    rateLimitInfo,
    clearRateLimit,
    isConditionalAvailable,
    startConditionalUI,
    abortConditionalUI,
  };
}
