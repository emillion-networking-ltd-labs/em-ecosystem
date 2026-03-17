"use client";

import AuthErrorFallback from "@/components/auth/AuthErrorFallback";

export default function ForgotPasswordError({
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
      context="password recovery"
    />
  );
}
