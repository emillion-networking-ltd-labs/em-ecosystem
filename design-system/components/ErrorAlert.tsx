"use client";

import { X } from "lucide-react";
import IconButton from "./IconButton";

type ErrorAlertProps = {
  message: string;
  onDismiss?: () => void;
  className?: string;
};

export default function ErrorAlert({
  message,
  onDismiss,
  className = "",
}: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-error-border bg-error-bg p-4 ${className}`}
      role="alert"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="mt-0.5 shrink-0 text-error"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="flex-1 text-body text-error">{message}</p>
      {onDismiss && (
        <IconButton
          variant="danger"
          size="sm"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X size={16} />
        </IconButton>
      )}
    </div>
  );
}
