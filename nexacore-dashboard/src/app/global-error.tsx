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
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "#ffffff",
          color: "#1c1c1c",
        }}
      >
        <div
          style={{
            maxWidth: 400,
            width: "100%",
            padding: "0 16px",
            textAlign: "center",
          }}
        >
          {/* Error icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8a1111"
            strokeWidth="1.5"
            style={{ margin: "0 auto 16px" }}
            role="img"
            aria-label="Error"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              margin: "0 0 8px",
              color: "#1c1c1c",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "rgba(28, 28, 28, 0.5)",
              margin: "0 0 24px",
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred. Please try again.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: 12,
                color: "rgba(28, 28, 28, 0.4)",
                margin: "0 0 24px",
              }}
            >
              Reference: {error.digest}
            </p>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: "#1c1c1c",
                color: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.05)",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/login"
              style={{
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: "#f2f2f2",
                color: "rgba(28, 28, 28, 0.5)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
                borderRadius: 6,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Go to login
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
