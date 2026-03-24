"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile error boundary caught:", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
      <div className="text-center py-8">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto mb-4 text-error"
          role="img"
          aria-label="Error"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>

        <h2 className="mb-2 text-h2 font-semibold text-content-primary">
          Something went wrong
        </h2>

        <p className="mb-6 text-body text-content-secondary">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "An error occurred while loading your profile. Please try again."}
        </p>

        {error.digest && (
          <p className="mb-6 text-caption text-content-tertiary">
            Reference: {error.digest}
          </p>
        )}

        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
