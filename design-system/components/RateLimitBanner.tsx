"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import type { RateLimitKind } from "@/lib/types";

type RateLimitBannerProps = {
  retryAfter: number;
  message: string;
  kind?: RateLimitKind;
  onExpired?: () => void;
};

export default function RateLimitBanner({
  retryAfter,
  message,
  kind,
  onExpired,
}: RateLimitBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState(retryAfter);

  useEffect(() => {
    setSecondsLeft(retryAfter);
  }, [retryAfter]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpired?.();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpired]);

  const Icon = kind === "lockout" ? Lock : AlertTriangle;

  return (
    <div role="alert" className="flex items-start gap-2">
      <Icon size={16} className="mt-1 shrink-0 text-error" />
      <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-caption leading-6 text-error">{message}</span>
        {secondsLeft > 0 && <CountdownTimer seconds={secondsLeft} />}
      </div>
    </div>
  );
}
