"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import InlineError from "@/components/ui/InlineError";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/context/ToastContext";
import { AUTH_TOAST } from "@/lib/toast-messages";
import { RateLimitError } from "@/lib/types";
import { isValidEmail, validatePassword } from "@/lib/validation";

/**
 * LoginFormV2 — credentials capture for the AuthIntent v2 login flow.
 *
 * SCRUM-499 / AUTH v2 Phase 2.3. Single-step variant of v1 LoginForm
 * (no Turnstile, no OAuth, no Passkey — those reframings land in Phase 3+).
 *
 * Visual parity with v1 LoginForm: 330/348 column layout, h1 + subtitle,
 * `<Input>` + `<InlineError>` + `<Button>`. The fan-out (MFA / tenant_pick /
 * succeeded) is driven entirely by AuthContext.loginV2() and AuthIntentFlow.
 */
export default function LoginFormV2() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { loginV2, isLoading, isAuthenticated, error, clearError } = useAuth();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  const { addToast } = useToast();
  const router = useRouter();

  // Clear stale errors from other auth forms on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect away if already authenticated (mirrors v1 LoginForm)
  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    if (e.target.name === "email") setEmailError(null);
    if (e.target.name === "password") setPasswordError(null);
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setEmailError("Enter your email address");
      return;
    }
    if (!isValidEmail(formData.email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError(null);
    const pwError = validatePassword(formData.password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }
    setPasswordError(null);
    try {
      await loginV2(formData.email, formData.password);
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimit(err.retryAfter, err.message, "throttle");
        addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC());
      }
    }
  };

  const activeError =
    passwordError ||
    emailError ||
    (!rateLimitInfo.isRateLimited ? error : null);
  const showError = !!activeError && !rateLimitInfo.isRateLimited;
  const isDisabled = isLoading || rateLimitInfo.isRateLimited;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px fixed, vertical, pAlign MIN (top) */}
      <div className="flex w-full flex-col gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-h1 font-semibold text-content-primary">
            Sign In
          </h1>
          <p className="text-justify text-body text-content-secondary">
            Connect using your NexaCore Account. This session will be available
            to other EM Ecosystem modules in the browser.
          </p>
        </div>
      </div>

      {/* Form — Figma: 348px fixed, vertical, itemSpacing 8 */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex min-h-[148px] flex-col gap-2">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              hasError={!!emailError}
              autoComplete="username"
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              hasError={!!passwordError || (showError && !emailError)}
            />

            {/* System Message — rate limit banner or error */}
            {rateLimitInfo.isRateLimited && rateLimitInfo.retryAfter ? (
              <RateLimitBanner
                retryAfter={rateLimitInfo.retryAfter}
                message={rateLimitInfo.message ?? "Too many attempts."}
                kind={rateLimitInfo.kind ?? undefined}
                onExpired={clearRateLimit}
              />
            ) : (
              <div aria-live="polite" className={showError ? "min-h-6" : "h-6"}>
                {showError && <InlineError message={activeError!} />}
              </div>
            )}

            {/* Forgot password — right-aligned link, mirrors v1 PasswordStep */}
            <div className="flex items-center justify-end">
              <Button
                as={Link}
                href={`/forgot-password?email=${encodeURIComponent(formData.email)}`}
                variant="link-underline"
                size="md"
                fullWidth={false}
              >
                Forgot password?
              </Button>
            </div>
          </div>

          {/* Buttons — mirrors v1 first step: Create Account + Sign In */}
          <div className="flex gap-2">
            <Button
              as={Link}
              href="/register"
              variant="outline"
              className="flex-1"
            >
              Create Account
            </Button>
            <Button
              type="submit"
              disabled={isDisabled}
              loading={isLoading}
              className="flex-1"
            >
              Sign In
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
