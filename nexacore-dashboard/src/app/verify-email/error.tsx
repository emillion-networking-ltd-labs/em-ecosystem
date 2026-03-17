"use client";

import AuthErrorFallback from "@/components/auth/AuthErrorFallback";

export default function VerifyEmailError({
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
      context="email verification"
    />
  );
}
