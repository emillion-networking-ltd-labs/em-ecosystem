"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="global-error-body">
        <div className="global-error-container">
          {/* Error icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8a1111"
            strokeWidth="1.5"
            className="global-error-icon"
            role="img"
            aria-label="Error"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <h1 className="global-error-title">Something went wrong</h1>

          <p className="global-error-message">
            An unexpected error occurred. Please try again.
          </p>

          {error.digest && (
            <p className="global-error-digest">Reference: {error.digest}</p>
          )}

          <div className="global-error-actions">
            <button onClick={reset} className="global-error-btn-primary">
              Try again
            </button>
            <a href="/login" className="global-error-btn-secondary">
              Go to login
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
