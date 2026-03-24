"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown, AlertTriangle, Key } from "lucide-react";
import Input from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import InfinitySpinner from "@/components/ui/InfinitySpinner";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import OAuthButtons from "./OAuthButtons";
import Divider from "@/components/ui/Divider";
import MfaTotpStep from "./MfaTotpStep";
import MfaSetupStep from "./MfaSetupStep";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/context/ToastContext";
import { usePasskey } from "@/hooks/usePasskey";
import { RateLimitError } from "@/lib/types";
import { validatePassword } from "@/lib/validation";
import type { RateLimitInfo } from "@/lib/types";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

type LoginStep = "email" | "password";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export default function LoginForm() {
  const [step, setStep] = useState<LoginStep>("email");
  const [stepDirection, setStepDirection] = useState<"forward" | "back">(
    "forward",
  );
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const {
    login,
    isLoading,
    isAuthenticated,
    error,
    clearError,
    mfaRequired,
    mfaSetupRequired,
  } = useAuth();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  const {
    isSupported: passkeySupported,
    loginWithPasskey,
    isLoggingIn: passkeyLoading,
    isConditionalAvailable,
    startConditionalUI,
    abortConditionalUI,
  } = usePasskey();
  const { addToast } = useToast();
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthErrorShown = useRef(false);

  // Clear stale errors from other auth forms on mount + read OAuth error from URL
  useEffect(() => {
    clearError();
    const oauthError = searchParams.get("oauth_error");
    if (oauthError && !oauthErrorShown.current) {
      oauthErrorShown.current = true;
      addToast({
        variant: "error",
        title: "Sign in failed",
        description: decodeURIComponent(oauthError),
      });
    }
  }, [clearError, searchParams, addToast]);

  // Start WebAuthn Conditional UI on mount (passkey autofill suggestions)
  useEffect(() => {
    if (isConditionalAvailable) {
      startConditionalUI();
    }
    return () => {
      abortConditionalUI();
    };
  }, [isConditionalAvailable, startConditionalUI, abortConditionalUI]);

  // Redirect away if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    if (e.target.name === "email") setEmailError(null);
    if (e.target.name === "password") setPasswordError(null);
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEmailNext = (e: React.FormEvent) => {
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
    clearError();
    abortConditionalUI();
    setStepDirection("forward");
    setStep("password");
  };

  const handlePasskeyLogin = async () => {
    setPasskeyError(null);
    clearError();
    abortConditionalUI();
    try {
      await loginWithPasskey(formData.email || undefined);
    } catch {
      setPasskeyError("Passkey authentication failed. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(formData.password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }
    setPasswordError(null);
    try {
      await login(
        formData.email,
        formData.password,
        turnstileToken ?? undefined,
      );
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimit(err.retryAfter, err.message, "throttle");
        addToast({
          variant: "warning",
          title: "Too many attempts",
          description:
            "If you are a registered user, please check your email for further instructions.",
        });
      }
    } finally {
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
    }
    // On AUTH_SUCCESS → isAuthenticated → useEffect redirects to /dashboard
  };

  if (mfaSetupRequired) {
    return <MfaSetupStep />;
  }

  if (mfaRequired) {
    return <MfaTotpStep />;
  }

  if (step === "password") {
    return (
      <PasswordStep
        email={formData.email}
        password={formData.password}
        isLoading={isLoading}
        error={error}
        passwordError={passwordError}
        rateLimitInfo={rateLimitInfo}
        onChange={handleChange}
        onSubmit={handleLogin}
        onChangeEmail={() => {
          clearError();
          clearRateLimit();
          setPasswordError(null);
          setStepDirection("back");
          setStep("email");
        }}
        onRateLimitExpired={clearRateLimit}
        onTurnstileToken={setTurnstileToken}
        turnstileResetKey={turnstileResetKey}
        direction="forward"
      />
    );
  }

  return (
    /* Body — Figma: layoutMode HORIZONTAL, itemSpacing 24 */
    <div
      className={`flex flex-col gap-6 md:flex-row ${stepDirection === "back" ? "auth-step-back" : ""}`}
    >
      {/* Title Group — Figma: 330px fixed, vertical, pAlign MIN (top) */}
      <div className="flex w-full flex-col gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-h1 font-semibold text-content-primary">
            Sign In
          </h1>
          <p className="text-justify text-body text-content-primary/50">
            Connect using your NexaCore Account. This session will be available
            to other EM Ecosystem modules in the browser.
          </p>
        </div>
      </div>

      {/* Form — Figma: 348px fixed, vertical, itemSpacing 8 */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={handleEmailNext} className="flex flex-col gap-2">
          {/* Email Field — Figma: 348x110 FIXED, vertical, gap 8 */}
          <div className="flex h-[110px] flex-col gap-2">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              hasError={!!emailError}
              autoComplete="username webauthn"
              autoFocus
            />

            {/* System Message — Figma: 348x24, HORIZONTAL, center */}
            {(() => {
              const activeError = emailError;
              return (
                <div
                  role="alert"
                  aria-live="polite"
                  className={`flex items-center gap-2 ${activeError ? "min-h-6" : "h-6"}`}
                >
                  {activeError && (
                    <>
                      <AlertTriangle
                        size={16}
                        className="shrink-0 text-error"
                      />
                      <span className="flex-1 text-caption leading-6 text-error">
                        {activeError}
                      </span>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Buttons Field — Figma: horizontal, itemSpacing 8 */}
          <div className="flex gap-2">
            <Link
              href="/register"
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-strong bg-transparent px-6 py-2.5 text-body font-normal text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Create Account
            </Link>
            <button
              type="submit"
              className="flex h-10 flex-1 items-center justify-center rounded-md border border-border-strong bg-surface-inverse px-6 py-2.5 text-body font-normal text-content-inverse transition-opacity hover:opacity-90"
            >
              Next
            </button>
          </div>
        </form>

        {/* Passkey Login */}
        {passkeySupported && (
          <div>
            <Divider label="OR" className="py-2" />
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
              aria-label="Sign in with passkey"
              className="relative flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border-strong bg-transparent px-6 py-2.5 text-body font-normal text-content-primary transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50"
            >
              <Key
                size={16}
                className={`text-content-primary/50 ${passkeyLoading ? "opacity-30" : ""}`}
              />
              <span className={passkeyLoading ? "opacity-30" : ""}>
                Sign in with passkey
              </span>
              {passkeyLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>
            {passkeyError && (
              <div role="alert" className="mt-2 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0 text-error" />
                <span className="text-caption text-error">{passkeyError}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions — OAuth */}
        <Divider className="my-4" />
        <OAuthButtons />
      </div>
    </div>
  );
}

/* ===== Password Step ===== */
/* Figma: Auth-Login-Step-Password — no OAuth, no Create Account */
/* Select Email Button replaces subtitle, shows email from step 1 (Google-inspired) */

type PasswordStepProps = {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  passwordError: string | null;
  rateLimitInfo: RateLimitInfo;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onChangeEmail: () => void;
  onRateLimitExpired: () => void;
  onTurnstileToken: (token: string | null) => void;
  turnstileResetKey: number;
  direction: "forward" | "back";
};

function PasswordStep({
  email,
  password,
  isLoading,
  error,
  passwordError,
  rateLimitInfo,
  onChange,
  onSubmit,
  onChangeEmail,
  onRateLimitExpired,
  onTurnstileToken,
  turnstileResetKey,
  direction,
}: PasswordStepProps) {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsEmailOpen(false);
      }
    }
    if (isEmailOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isEmailOpen]);

  const emailInitial = email.charAt(0).toUpperCase();
  const activeError = passwordError || error;
  const showError = !!activeError && !rateLimitInfo.isRateLimited;
  const isDisabled = isLoading || rateLimitInfo.isRateLimited;

  return (
    <div
      className={`flex flex-col gap-6 md:flex-row ${direction === "forward" ? "auth-step-forward" : "auth-step-back"}`}
    >
      {/* Title Group — Figma: 330px fixed, vertical, pAlign MIN (top), inner 300px */}
      <div className="flex w-full flex-col md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-h1 font-semibold text-content-primary">
            Sign In
          </h1>

          {/* Select Email Button — Figma: cornerRadius 100 (pill), px-16, text-body, Bordered variant */}
          <div ref={dropdownRef} className="relative self-start">
            <button
              type="button"
              onClick={() => setIsEmailOpen(!isEmailOpen)}
              className={`flex h-10 items-center justify-center gap-2 rounded-md px-6 py-2.5 text-body font-normal whitespace-nowrap transition-colors ${
                isEmailOpen
                  ? "border border-border-strong bg-surface-subtle text-content-primary"
                  : "border border-border-strong bg-transparent text-content-primary hover:bg-surface-subtle"
              }`}
            >
              <span className="whitespace-nowrap leading-none">{email}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${isEmailOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Email Dropdown — same visual pattern as LanguageSelector */}
            {isEmailOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-[300px]">
                <div className="rounded-xl border border-border-strong bg-surface-primary p-4 shadow-card">
                  <button
                    type="button"
                    onClick={() => setIsEmailOpen(false)}
                    className="flex h-10 w-full items-center gap-2 rounded-md bg-surface-subtle px-2 text-body font-normal text-content-primary transition-colors"
                  >
                    <Avatar size="sm" name={emailInitial} />
                    <span className="truncate text-body">{email}</span>
                  </button>

                  {/* Change email — Link/Simple pattern (75% → 100%, hover:underline) */}
                  <button
                    type="button"
                    onClick={onChangeEmail}
                    className="mt-4 w-full px-2 text-left text-body font-normal text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
                  >
                    Try a different email address
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form — Figma: 348px, password + System Message (error + forgot link) + Sign In */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          {/* Password Field — Figma: 348x148 FIXED, vertical, gap 8 */}
          <div className="flex min-h-[148px] flex-col gap-2">
            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
              hasError={showError}
              autoFocus
            />

            {/* System Message — rate limit banner or error */}
            {rateLimitInfo.isRateLimited && rateLimitInfo.retryAfter ? (
              <RateLimitBanner
                retryAfter={rateLimitInfo.retryAfter}
                message={rateLimitInfo.message ?? "Too many attempts."}
                kind={rateLimitInfo.kind ?? undefined}
                onExpired={onRateLimitExpired}
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
                    <span className="flex-1 text-caption leading-6 text-error">
                      {activeError}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Password Recovery Button — Figma: 348x21, always visible, right-aligned */}
            <div className="flex items-center justify-end">
              <Link
                href={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="whitespace-nowrap text-body font-normal text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Turnstile CAPTCHA — managed mode, Cloudflare decides when to show challenge */}
          <TurnstileWidget
            onToken={onTurnstileToken}
            onExpire={() => onTurnstileToken(null)}
            resetKey={turnstileResetKey}
          />

          {/* Sign In button — Figma: full width 348px, primary button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="relative flex h-10 w-full items-center justify-center rounded-md border border-border-strong bg-surface-inverse px-6 py-2.5 text-body font-normal text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className={isLoading ? "opacity-30" : ""}>Sign In</span>
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
