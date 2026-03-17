"use client";

import AuthErrorFallback from "@/components/auth/AuthErrorFallback";

export default function OAuthCallbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AuthErrorFallback
      error={error}
      reset={reset}
      context="OAuth authentication"
    />
  );
}
