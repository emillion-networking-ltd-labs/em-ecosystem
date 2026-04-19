"use client";

import { useState, useCallback } from "react";
import { getFingerprint } from "@/lib/fingerprint";
import {
  trustDevice,
  listTrustedDevices,
  revokeDevice as revokeDeviceApi,
  revokeAllDevices as revokeAllDevicesApi,
} from "@/lib/trusted-device-api";
import type { TrustedDeviceResponse } from "@/lib/types";
import { extractMessageByStatus } from "@/lib/error-utils";
import { HTTP_STATUS } from "@/lib/error-constants";

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
      setError(
        extractMessageByStatus(
          err,
          {
            [HTTP_STATUS.TOO_MANY_REQUESTS]:
              "Too many requests. Try again later.",
          },
          "Failed to load trusted devices.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trustCurrentDevice = useCallback(async (): Promise<
    | "trusted"
    | "already"
    | { status: "rate-limited"; retryAfter: number }
    | false
  > => {
    setError(null);
    try {
      const fp = await getFingerprint();
      if (!fp) {
        setError("Device fingerprinting not available.");
        return false;
      }
      const result = await trustDevice(fp);
      await fetchDevices();
      return result.alreadyTrusted ? "already" : "trusted";
    } catch (err) {
      const apiErr = err as {
        error?: { statusCode?: number; retryAfter?: number; message?: string };
      };
      const isRateLimited =
        apiErr?.error?.statusCode === HTTP_STATUS.TOO_MANY_REQUESTS;
      if (!isRateLimited) {
        setError("Failed to trust device.");
      }
      return isRateLimited
        ? {
            status: "rate-limited" as const,
            retryAfter: apiErr.error?.retryAfter ?? 60,
          }
        : false;
    }
  }, [fetchDevices]);

  const revokeDevice = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      // Optimistic: remove from local state first so AnimatePresence can animate exit
      setDevices((prev) => prev.filter((d) => d.id !== id));
      try {
        await revokeDeviceApi(id);
        return true;
      } catch (err) {
        // Rollback: re-fetch on failure
        await fetchDevices();
        setError(
          extractMessageByStatus(
            err,
            {
              [HTTP_STATUS.TOO_MANY_REQUESTS]:
                "Too many requests. Try again later.",
            },
            "Failed to revoke device.",
          ),
        );
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
      setError(
        extractMessageByStatus(
          err,
          {
            [HTTP_STATUS.TOO_MANY_REQUESTS]:
              "Too many requests. Try again later.",
          },
          "Failed to revoke all devices.",
        ),
      );
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
