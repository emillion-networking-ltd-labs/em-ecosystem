"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

  // SCRUM-322: prevent stale-state updates if the consumer unmounts mid-fetch.
  // mountedRef equivalent to AbortController for helpers that don't yet expose
  // a signal parameter (listTrustedDevices etc.).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTrustedDevices();
      if (!mountedRef.current) return;
      setDevices(data);
    } catch (err) {
      if (!mountedRef.current) return;
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
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const trustCurrentDevice = useCallback(
    async (
      password: string,
    ): Promise<
      | "trusted"
      | "already"
      | "invalid-password"
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
        const result = await trustDevice(fp, password);
        await fetchDevices();
        return result.alreadyTrusted ? "already" : "trusted";
      } catch (err) {
        const apiErr = err as {
          error?: {
            statusCode?: number;
            retryAfter?: number;
            message?: string;
          };
        };
        const status = apiErr?.error?.statusCode;
        if (status === HTTP_STATUS.UNAUTHORIZED) {
          return "invalid-password";
        }
        if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
          return {
            status: "rate-limited" as const,
            retryAfter: apiErr.error?.retryAfter ?? 60,
          };
        }
        setError("Failed to trust device.");
        return false;
      }
    },
    [fetchDevices],
  );

  const revokeDevice = useCallback(
    async (
      id: string,
      password: string,
    ): Promise<
      | true
      | "invalid-password"
      | { status: "rate-limited"; retryAfter: number }
      | false
    > => {
      setError(null);
      try {
        await revokeDeviceApi(id, password);
        await fetchDevices();
        return true;
      } catch (err) {
        const apiErr = err as {
          error?: { statusCode?: number; retryAfter?: number };
        };
        const status = apiErr?.error?.statusCode;
        if (status === HTTP_STATUS.UNAUTHORIZED) {
          return "invalid-password";
        }
        if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
          // SCRUM-327: caller decides UI (toast + banner + close).
          return {
            status: "rate-limited" as const,
            retryAfter: apiErr.error?.retryAfter ?? 60,
          };
        }
        setError(extractMessageByStatus(err, {}, "Failed to revoke device."));
        return false;
      }
    },
    [fetchDevices],
  );

  const revokeAllDevicesAction = useCallback(
    async (
      password: string,
    ): Promise<
      | true
      | "invalid-password"
      | { status: "rate-limited"; retryAfter: number }
      | false
    > => {
      setError(null);
      try {
        await revokeAllDevicesApi(password);
        await fetchDevices();
        return true;
      } catch (err) {
        const apiErr = err as {
          error?: { statusCode?: number; retryAfter?: number };
        };
        const status = apiErr?.error?.statusCode;
        if (status === HTTP_STATUS.UNAUTHORIZED) {
          return "invalid-password";
        }
        if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
          return {
            status: "rate-limited" as const,
            retryAfter: apiErr.error?.retryAfter ?? 60,
          };
        }
        setError(
          extractMessageByStatus(err, {}, "Failed to revoke all devices."),
        );
        return false;
      }
    },
    [fetchDevices],
  );

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
