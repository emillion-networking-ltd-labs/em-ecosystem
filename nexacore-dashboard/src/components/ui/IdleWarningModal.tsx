"use client";

import Button from "./Button";

type IdleWarningModalProps = {
  secondsLeft: number;
  onKeepAlive: () => void;
};

export default function IdleWarningModal({
  secondsLeft,
  onKeepAlive,
}: IdleWarningModalProps) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr =
    mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex w-[340px] flex-col items-center gap-4 rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
        <div className="text-h1 font-semibold text-warning">{timeStr}</div>
        <p className="text-center text-body text-content-primary">
          Your session is about to expire due to inactivity.
        </p>
        <Button onClick={onKeepAlive} fullWidth>
          Keep me signed in
        </Button>
      </div>
    </div>
  );
}
