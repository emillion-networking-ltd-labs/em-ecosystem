'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

type RateLimitBannerProps = {
  retryAfter: number;
  message: string;
  onExpired?: () => void;
};

export default function RateLimitBanner({ retryAfter, message, onExpired }: RateLimitBannerProps) {
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
      setSecondsLeft(prev => {
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

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  return (
    <div className="flex items-start gap-2 rounded-md border border-error/20 bg-error/5 p-3">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-error" />
      <div className="flex-1">
        <p className="text-xs leading-5 text-error">{message}</p>
        {secondsLeft > 0 && (
          <p className="mt-1 text-xs font-medium text-error/75">
            Try again in {timeDisplay}
          </p>
        )}
      </div>
    </div>
  );
}
