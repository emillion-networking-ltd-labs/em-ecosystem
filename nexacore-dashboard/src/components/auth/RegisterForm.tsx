"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import Input from "@/components/ui/Input";
import InfinitySpinner from "@/components/ui/InfinitySpinner";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import OAuthButtons from "./OAuthButtons";
import Divider from "@/components/ui/Divider";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/hooks/useToast";
import { RateLimitError } from "@/lib/types";
import TurnstileWidget from "@/components/ui/TurnstileWidget";
import { validatePassword } from "@/lib/validation";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

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
        addToast({
          variant: "success",
          title: "Account created",
          description: "Check your inbox to verify your email.",
        });
        router.push("/activation/check-email");
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimit(err.retryAfter, err.message);
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
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Create Account
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
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
              <div
                className={`flex items-center gap-2 ${showError ? "min-h-6" : "h-6"}`}
              >
                {showError && (
                  <>
                    <AlertTriangle size={16} className="shrink-0 text-error" />
                    <span className="text-xs leading-6 text-error">
                      {activeError}
                    </span>
                  </>
                )}
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
            <Link
              href="/login"
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Back to Sign In
            </Link>
            <button
              type="submit"
              disabled={isDisabled}
              className="relative flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className={isLoading ? "opacity-30" : ""}>
                Create Account
              </span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Actions — OR + OAuth */}
        <Divider label="OR" className="py-2" />
        <OAuthButtons />
      </div>
    </div>
  );
}
