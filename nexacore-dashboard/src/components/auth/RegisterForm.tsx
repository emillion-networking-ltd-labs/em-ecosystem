"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import InlineError from "@/components/ui/InlineError";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import { AUTH_TOAST } from "@/lib/toast-messages";
import OAuthButtons from "./OAuthButtons";
import Divider from "@/components/ui/Divider";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/hooks/useToast";
import { RateLimitError } from "@/lib/types";
import TurnstileWidget from "@/components/ui/TurnstileWidget";
import { validatePassword, isValidEmail } from "@/lib/validation";

export default function RegisterForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { register, isLoading, error, clearError } = useAuth();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  const { addToast } = useToast();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const router = useRouter();

  // Clear stale errors from other auth forms on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    if (e.target.name === "email") setEmailError(null);
    if (e.target.name === "password") setPasswordError(null);
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setEmailError("Enter your email address");
      return;
    }
    if (!isValidEmail(formData.email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    const pwError = validatePassword(formData.password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }
    setEmailError(null);
    setPasswordError(null);
    try {
      const success = await register(
        formData.email,
        formData.password,
        turnstileToken ?? undefined,
      );
      if (success) {
        addToast(AUTH_TOAST.ACCOUNT_CREATED);
        router.push("/activation/check-email");
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimit(err.retryAfter, err.message);
        // Toast-only convention. INBOX_HINT copy — alludes to email so a
        // legitimate user (whose address may have triggered a security
        // notification email if already registered) is informed, but the
        // wording is conditional ("if we sent you an email") and never
        // confirms registration status. Anti-enumeration safe.
        addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_INBOX_HINT());
      }
    } finally {
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
    }
  };

  const isDisabled = isLoading || rateLimitInfo.isRateLimited;

  const activeError = emailError || passwordError || error;
  const showRateLimit = rateLimitInfo.isRateLimited;
  const showError = !showRateLimit && !!activeError;

  return (
    /* Body — Figma: layoutMode HORIZONTAL, itemSpacing 24 */
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px fixed, vertical, pAlign MIN (top), inner 300px */}
      <div className="flex w-full flex-col md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-h1 font-semibold text-content-primary">
            Create Account
          </h1>
          <p className="text-justify text-body text-content-secondary">
            Create your NexaCore user profile. This session will be available to
            other EM Ecosystem modules in the browser.
          </p>
        </div>
      </div>

      {/* Form — Figma: 348px, vertical, itemSpacing 8 */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={handleRegister} className="flex flex-col gap-2">
          {/* Form Fields — Figma: 348x196, min-h allows System Message to expand */}
          <div className="flex min-h-[196px] flex-col gap-2">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              hasError={!!emailError || !!error}
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              hasError={!!passwordError || !!error}
            />

            {/* System Message — single slot: RateLimitBanner / Error */}
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
          </div>

          {/* Turnstile CAPTCHA */}
          <TurnstileWidget
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            resetKey={turnstileResetKey}
          />

          {/* Buttons Field — Figma: horizontal, itemSpacing 8 */}
          <div className="flex gap-2">
            <Button
              as={Link}
              href="/login"
              variant="outline"
              className="flex-1"
            >
              Back to Sign In
            </Button>
            <Button
              type="submit"
              disabled={isDisabled}
              loading={isLoading}
              className="flex-1"
            >
              Create Account
            </Button>
          </div>
        </form>

        {/* Actions — OR + OAuth */}
        <Divider label="OR" className="py-2" />
        <OAuthButtons />
      </div>
    </div>
  );
}
