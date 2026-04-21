"use client";

import Button from "./Button";
import CountdownTimer from "./CountdownTimer";

type IdleWarningModalProps = {
  secondsLeft: number;
  onKeepAlive: () => void;
};

export default function IdleWarningModal({
  secondsLeft,
  onKeepAlive,
}: IdleWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)]">
      <div className="flex w-[340px] flex-col items-center gap-4 rounded-xl border border-border-strong bg-surface-secondary p-6 shadow-card">
        <CountdownTimer seconds={secondsLeft} variant="warning" size="lg" />
        <p className="text-center text-body text-content-secondary">
          Your session is about to expire due to inactivity.
        </p>
        <Button onClick={onKeepAlive} fullWidth autoFocus>
          Keep me signed in
        </Button>
      </div>
    </div>
  );
}
