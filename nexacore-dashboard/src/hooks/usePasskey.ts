'use client';

import { useState, useCallback, useRef } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useAuth } from '@/hooks/useAuth';
import {
  passkeyRegisterOptions,
  passkeyRegisterVerify,
  passkeyLoginOptions,
  listPasskeys as apiListPasskeys,
  renamePasskey as apiRenamePasskey,
  deletePasskey as apiDeletePasskey,
} from '@/lib/passkey-api';
import type { PasskeyResponse, PasskeyRegisterResult } from '@/lib/types';

type ApiError = { error?: { message?: string } };

function extractMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.error?.message ?? fallback;
}

export function usePasskey() {
  const { passkeyLogin } = useAuth();
  const [passkeys, setPasskeys] = useState<PasskeyResponse[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' && !!window.PublicKeyCredential;

  const clearError = useCallback(() => setError(null), []);

  const fetchPasskeys = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await apiListPasskeys();
      setPasskeys(data);
    } catch (err) {
      setError(extractMessage(err, 'Failed to load passkeys.'));
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const registerPasskey = useCallback(
    async (name?: string): Promise<PasskeyRegisterResult | null> => {
      setIsRegistering(true);
      setError(null);
      try {
        const options = await passkeyRegisterOptions();
        const credential = await startRegistration({ optionsJSON: options as never });
        const result = await passkeyRegisterVerify(credential as unknown as Record<string, unknown>, name);
        await fetchPasskeys();
        return result;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'NotAllowedError') return null;
        setError(extractMessage(err, 'Passkey registration failed.'));
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
        const credential = await startAuthentication({ optionsJSON: options as never });
        if (abortRef.current) return;
        await passkeyLogin(challengeId, credential as unknown as Record<string, unknown>);
      } catch (err: unknown) {
        if ((err as Error)?.name === 'NotAllowedError') return;
        setError(extractMessage(err, 'Passkey authentication failed.'));
        throw err;
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
        setError(extractMessage(err, 'Failed to rename passkey.'));
        return false;
      }
    },
    [fetchPasskeys],
  );

  const handleDelete = useCallback(
    async (id: string, password?: string): Promise<boolean> => {
      setError(null);
      try {
        await apiDeletePasskey(id, password);
        await fetchPasskeys();
        return true;
      } catch (err) {
        setError(extractMessage(err, 'Failed to delete passkey.'));
        return false;
      }
    },
    [fetchPasskeys],
  );

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
  };
}
