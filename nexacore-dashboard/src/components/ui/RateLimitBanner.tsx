'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

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

  return (
    <div className="flex items-start gap-2">
      <AlertTriangle size={16} className="mt-1 shrink-0 text-error" />
      <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs leading-6 text-error">{message}</span>
        {secondsLeft > 0 && <CountdownTimer seconds={secondsLeft} />}
      </div>
    </div>
  );
}
