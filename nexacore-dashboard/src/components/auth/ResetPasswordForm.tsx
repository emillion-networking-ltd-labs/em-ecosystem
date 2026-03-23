"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import Input from "@/components/ui/Input";
import InfinitySpinner from "@/components/ui/InfinitySpinner";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
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
      addToast({
        variant: "warning",
        title: "Missing reset token",
        description: "Please request a new password reset link.",
      });
      router.replace("/forgot-password");
      return;
    }

    validateResetToken(token).then((valid) => {
      if (cancelled) return;
      if (!valid) {
        addToast({
          variant: "warning",
          title: "Expired or invalid link",
          description: "Your reset link has expired. Request a new one.",
        });
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
        addToast({
          variant: "success",
          title: "Password updated",
          description: "Your password has been reset. Sign in now.",
        });
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
          <h1 className="text-h1 font-semibold leading-[36px] text-content-primary">
            Reset Password
          </h1>
          <p className="text-justify text-body leading-[21px] text-content-primary/50">
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
              <div
                role="alert"
                aria-live="polite"
                className={`flex items-center gap-2 ${showError ? "min-h-6" : "h-6"}`}
              >
                {showError && (
                  <>
                    <AlertTriangle size={16} className="shrink-0 text-error" />
                    <span className="text-caption leading-6 text-error">
                      {activeError}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Back to Sign In — Figma: right-aligned text link */}
            <div className="flex items-center justify-end">
              <Link
                href="/login"
                className="whitespace-nowrap text-body font-normal leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
              >
                Back to Sign In
              </Link>
            </div>
          </div>

          {/* Reset Password — Figma: single full-width primary button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="relative flex h-10 w-full items-center justify-center rounded-md border border-border-strong bg-surface-inverse px-6 py-2.5 text-h3 font-normal text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className={isLoading ? "opacity-30" : ""}>
              Reset Password
            </span>
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <InfinitySpinner />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
