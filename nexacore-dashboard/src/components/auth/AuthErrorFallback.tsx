"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

interface AuthErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

export default function AuthErrorFallback({
  error,
  reset,
  context = "authentication",
}: AuthErrorFallbackProps) {
  useEffect(() => {
    console.error(`Auth error boundary caught (${context}):`, error);
  }, [error, context]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary px-4">
      <div className="w-full max-w-md text-center">
        <svg
          width="48"
          height="48"
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

        <h1 className="mb-2 text-heading-md text-content-primary">
          Something went wrong
        </h1>

        <p className="mb-6 text-body-sm text-content-secondary">
          {process.env.NODE_ENV === "development"
            ? error.message
            : `An error occurred during ${context}. Please try again.`}
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
            onClick={() => (window.location.href = "/login")}
          >
            Go to login
          </Button>
        </div>
      </div>
    </div>
  );
}
