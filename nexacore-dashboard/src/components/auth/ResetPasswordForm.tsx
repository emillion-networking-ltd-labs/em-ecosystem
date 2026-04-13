"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import InlineError from "@/components/ui/InlineError";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import { AUTH_TOAST } from "@/lib/toast-messages";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/context/ToastContext";
import { RateLimitError } from "@/lib/types";
import { validatePassword } from "@/lib/validation";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { resetPassword, validateResetToken, isLoading, error, clearError } =
    useAuth();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Validate token on mount — redirect to forgot-password if invalid/expired
  useEffect(() => {
    let cancelled = false;

    if (!token) {
      addToast(AUTH_TOAST.MISSING_RESET_TOKEN);
      router.replace("/forgot-password");
      return;
    }

    validateResetToken(token).then((valid) => {
      if (cancelled) return;
      if (!valid) {
        addToast(AUTH_TOAST.EXPIRED_LINK);
        router.replace("/forgot-password");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token, validateResetToken, addToast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!token) {
      setLocalError("Invalid or missing reset token.");
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      setLocalError(pwError);
      return;
    }
    if (!confirmPassword) {
      setLocalError("Confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      const ok = await resetPassword(token, password);
      if (ok) {
        addToast(AUTH_TOAST.PASSWORD_UPDATED);
        router.replace("/login");
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimit(err.retryAfter, err.message);
      }
    }
  };

  const isDisabled = isLoading || rateLimitInfo.isRateLimited;
  const activeError = localError || error;
  const showRateLimit = rateLimitInfo.isRateLimited;
  const showError = !showRateLimit && !!activeError;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px, vertical, pAlign MIN (top) */}
      <div className="flex w-full flex-col md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-h1 font-semibold text-content-primary">
            Reset Password
          </h1>
          <p className="text-justify text-body text-content-secondary">
            Enter your new password. It must be at least 8 characters and
            different from your current one.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[348px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {/* Form Fields — Figma: 348x233, VERTICAL, itemSpacing 8 */}
          <div className="flex min-h-[233px] flex-col gap-2">
            <Input
              label="New Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                clearError();
                setLocalError(null);
                setPassword(e.target.value);
              }}
              placeholder="Enter your password"
              hasError={showError}
              autoFocus
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                clearError();
                setLocalError(null);
                setConfirmPassword(e.target.value);
              }}
              placeholder="Enter your password"
              hasError={showError}
            />

            {showRateLimit ? (
              <RateLimitBanner
                retryAfter={rateLimitInfo.retryAfter!}
                message={rateLimitInfo.message!}
                onExpired={clearRateLimit}
              />
            ) : (
              <div aria-live="polite" className={showError ? "min-h-6" : "h-6"}>
                {showError && <InlineError message={activeError} />}
              </div>
            )}

            {/* Back to Sign In — Figma: right-aligned text link */}
            <div className="flex items-center justify-end">
              <Button
                as={Link}
                href="/login"
                variant="link-underline"
                size="md"
                fullWidth={false}
              >
                Back to Sign In
              </Button>
            </div>
          </div>

          {/* Reset Password — Figma: single full-width primary button */}
          <Button type="submit" disabled={isDisabled} loading={isLoading}>
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}
