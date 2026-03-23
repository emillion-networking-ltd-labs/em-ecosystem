import { useState, useCallback } from "react";
import type { RateLimitInfo, RateLimitKind } from "@/lib/types";

const DEFAULT_RATE_LIMIT: RateLimitInfo = {
  isRateLimited: false,
  retryAfter: null,
  message: null,
  kind: null,
};

export function useRateLimit() {
  const [rateLimitInfo, setRateLimitInfo] =
    useState<RateLimitInfo>(DEFAULT_RATE_LIMIT);

  const setRateLimit = useCallback(
    (retryAfter: number, message: string, kind: RateLimitKind = "throttle") => {
      setRateLimitInfo({ isRateLimited: true, retryAfter, message, kind });
    },
    [],
  );

  const clearRateLimit = useCallback(() => {
    setRateLimitInfo(DEFAULT_RATE_LIMIT);
  }, []);

  return { rateLimitInfo, setRateLimit, clearRateLimit };
}
