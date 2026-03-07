'use client';

import { useState, useCallback } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import {
  trustDevice,
  listTrustedDevices,
  revokeDevice as revokeDeviceApi,
  revokeAllDevices as revokeAllDevicesApi,
} from '@/lib/trusted-device-api';
import type { TrustedDeviceResponse } from '@/lib/types';

type ApiError = { error?: { message?: string; statusCode?: number } };

function extractMessage(err: unknown, fallback: string): string {
  const e = err as ApiError;
  if (e?.error?.statusCode === 429) return 'Too many requests. Try again later.';
  const msg = e?.error?.message ?? fallback;
  return msg.endsWith('.') ? msg : `${msg}.`;
}

export function useTrustedDevices() {
  const [devices, setDevices] = useState<TrustedDeviceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTrustedDevices();
      setDevices(data);
    } catch (err) {
      setError(extractMessage(err, 'Failed to load trusted devices.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trustCurrentDevice = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const fp = await getFingerprint();
      if (!fp) {
        setError('Device fingerprinting not available.');
        return false;
      }
      await trustDevice(fp);
      await fetchDevices();
      return true;
    } catch (err) {
      setError(extractMessage(err, 'Failed to trust device.'));
      return false;
    }
  }, [fetchDevices]);

  const revokeDevice = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        await revokeDeviceApi(id);
        await fetchDevices();
        return true;
      } catch (err) {
        setError(extractMessage(err, 'Failed to revoke device.'));
        return false;
      }
    },
    [fetchDevices],
  );

  const revokeAllDevicesAction = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      await revokeAllDevicesApi();
      await fetchDevices();
      return true;
    } catch (err) {
      setError(extractMessage(err, 'Failed to revoke all devices.'));
      return false;
    }
  }, [fetchDevices]);

  return {
    devices,
    isLoading,
    fetchDevices,
    trustCurrentDevice,
    revokeDevice,
    revokeAllDevices: revokeAllDevicesAction,
    error,
    clearError,
  };
}
