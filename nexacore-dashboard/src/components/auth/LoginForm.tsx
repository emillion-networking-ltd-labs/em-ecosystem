'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, AlertTriangle, SendHorizontal, Key } from 'lucide-react';
import Input from '@/components/ui/Input';
import InfinitySpinner from '@/components/ui/InfinitySpinner';
import RateLimitBanner from '@/components/ui/RateLimitBanner';
import CountdownTimer from '@/components/ui/CountdownTimer';
import OAuthButtons from './OAuthButtons';
import MfaTotpStep from './MfaTotpStep';
import { useAuth } from '@/hooks/useAuth';
import { useRateLimit } from '@/hooks/useRateLimit';
import { useToast } from '@/context/ToastContext';
import { usePasskey } from '@/hooks/usePasskey';
import { RateLimitError } from '@/lib/types';
import type { RateLimitInfo } from '@/lib/types';

type LoginStep = 'email' | 'password';

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

// Module-level caches — survive component unmount/remount during SPA navigation
const lockoutCache = new Map<string, { retryAfter: number; lockedAt: number }>();
const resendCooldownCache = new Map<string, number>(); // email → timestamp when cooldown started

export default function LoginForm() {
  const [step, setStep] = useState<LoginStep>('email');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { login, isLoading, isAuthenticated, error, clearError, mfaRequired, resendVerificationPublic } = useAuth();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  const { isSupported: passkeySupported, loginWithPasskey, isLoggingIn: passkeyLoading } = usePasskey();
  const { addToast } = useToast();
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthErrorShown = useRef(false);

  // Clear stale errors from other auth forms on mount + read OAuth error from URL
  useEffect(() => {
    clearError();
    const oauthError = searchParams.get('oauth_error');
    if (oauthError && !oauthErrorShown.current) {
      oauthErrorShown.current = true;
      addToast({ variant: 'error', title: 'Sign in failed', description: decodeURIComponent(oauthError) });
    }
  }, [clearError, searchParams, addToast]);

  // Redirect away if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    if (e.target.name === 'email') setEmailError(null);
    if (e.target.name === 'password') setPasswordError(null);
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setEmailError('Enter your email address');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError(null);
    clearError();
    setStep('password');
  };

  const handlePasskeyLogin = async () => {
    setPasskeyError(null);
    clearError();
    try {
      await loginWithPasskey(formData.email || undefined);
    } catch {
      setPasskeyError('Passkey authentication failed. Please try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password) {
      setPasswordError('Enter your password');
      return;
    }
    setPasswordError(null);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      if (err instanceof RateLimitError) {
        if (err.kind === 'lockout') {
          // Cache lockout for this email so it survives IP throttle overlap
          lockoutCache.set(formData.email, {
            retryAfter: err.retryAfter,
            lockedAt: Date.now(),
          });
          setRateLimit(err.retryAfter, err.message, 'lockout');
        } else {
          // IP throttle — check if current email has a cached lockout still active
          const cached = lockoutCache.get(formData.email);
          if (cached) {
            const elapsed = Math.floor((Date.now() - cached.lockedAt) / 1000);
            const remaining = cached.retryAfter - elapsed;
            if (remaining > 0) {
              // Show the account lockout instead of the IP throttle
              setRateLimit(remaining, 'Too many attempts. Account locked.', 'lockout');
            } else {
              lockoutCache.delete(formData.email);
              setRateLimit(err.retryAfter, err.message, 'throttle');
            }
          } else {
            setRateLimit(err.retryAfter, err.message, 'throttle');
          }
        }
      }
    }
    // On AUTH_SUCCESS → isAuthenticated → useEffect redirects to /dashboard
  };

  if (mfaRequired) {
    return <MfaTotpStep />;
  }

  if (step === 'password') {
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
        onChangeEmail={() => { clearError(); clearRateLimit(); setPasswordError(null); setStep('email'); }}
        onRateLimitExpired={clearRateLimit}
        onResendVerification={resendVerificationPublic}
      />
    );
  }

  return (
    /* Body — Figma: layoutMode HORIZONTAL, itemSpacing 24 */
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px fixed, vertical, pAlign MIN (top) */}
      <div className="flex w-full flex-col gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Sign In
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
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
              autoFocus
            />

            {/* System Message — Figma: 348x24, HORIZONTAL, center */}
            {(() => {
              const activeError = emailError;
              return (
                <div className={`flex items-center gap-2 ${activeError ? 'min-h-6' : 'h-6'}`}>
                  {activeError && (
                    <>
                      <AlertTriangle size={16} className="shrink-0 text-error" />
                      <span className="flex-1 text-xs leading-6 text-error">{activeError}</span>
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
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Create Account
            </Link>
            <button
              type="submit"
              className="flex h-10 flex-1 items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
            >
              Next
            </button>
          </div>
        </form>

        {/* Passkey Login */}
        {passkeySupported && (
          <div className="mt-2">
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-content-primary/10" />
              <span className="text-xs text-content-tertiary">or</span>
              <div className="h-px flex-1 bg-content-primary/10" />
            </div>
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
              aria-label="Sign in with passkey"
              className="relative flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50"
            >
              <Key size={16} className={passkeyLoading ? 'opacity-30' : ''} />
              <span className={passkeyLoading ? 'opacity-30' : ''}>Sign in with passkey</span>
              {passkeyLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>
            {passkeyError && (
              <div className="mt-2 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0 text-error" />
                <span className="text-xs text-error">{passkeyError}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions — OR + OAuth */}
        <div className="mt-2">
          <OAuthButtons />
        </div>
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
  onResendVerification: (email: string) => Promise<boolean>;
};

function PasswordStep({ email, password, isLoading, error, passwordError, rateLimitInfo, onChange, onSubmit, onChangeEmail, onRateLimitExpired, onResendVerification }: PasswordStepProps) {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsEmailOpen(false);
      }
    }
    if (isEmailOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEmailOpen]);

  // Restore cooldown from module-level cache on mount
  useEffect(() => {
    const cachedAt = resendCooldownCache.get(email);
    if (cachedAt) {
      const elapsed = Math.floor((Date.now() - cachedAt) / 1000);
      const remaining = 60 - elapsed;
      if (remaining > 0) {
        setResendCooldown(remaining);
      } else {
        resendCooldownCache.delete(email);
      }
    }
  }, [email]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendVerification = useCallback(async () => {
    resendCooldownCache.set(email, Date.now());
    setResendCooldown(60);
    const ok = await onResendVerification(email);
    if (ok) {
      addToast({ variant: 'success', title: 'Verification email sent', description: 'Check your inbox for the verification link.' });
    }
  }, [email, onResendVerification, addToast]);

  const emailInitial = email.charAt(0).toUpperCase();
  const activeError = passwordError || error;
  const isVerificationError = !!error && error.toLowerCase().includes('verify your email');
  const showNonVerificationError = !isVerificationError && !!activeError && !rateLimitInfo.isRateLimited;
  const showResend = isVerificationError && !rateLimitInfo.isRateLimited;
  const isDisabled = isLoading || rateLimitInfo.isRateLimited;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px fixed, vertical, pAlign MIN (top), inner 300px */}
      <div className="flex w-full flex-col md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Sign In
          </h1>

          {/* Select Email Button — Figma: cornerRadius 100 (pill), px-16, text-base, Bordered variant */}
          <div ref={dropdownRef} className="relative self-start">
            <button
              type="button"
              onClick={() => setIsEmailOpen(!isEmailOpen)}
              className={`flex h-10 items-center justify-center gap-2 rounded-full px-4 text-base font-medium transition-all ${
                isEmailOpen
                  ? 'border border-border-default bg-surface-primary text-content-primary'
                  : 'border border-border-default bg-transparent text-content-primary'
              }`}
            >
              <span className="whitespace-nowrap leading-none">{email}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${isEmailOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Email Dropdown — same visual pattern as LanguageSelector */}
            {isEmailOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-[300px]">
                <div className="rounded-3xl border border-border-default bg-surface-primary p-4 shadow-card">
                  <button
                    type="button"
                    onClick={() => setIsEmailOpen(false)}
                    className="flex h-10 w-full items-center gap-2 rounded-md bg-surface-tertiary px-2 font-medium text-content-primary transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle">
                      <span className="text-xs font-semibold">{emailInitial}</span>
                    </div>
                    <span className="truncate text-[15px]">{email}</span>
                  </button>

                  {/* Change email — Link/Simple pattern (75% → 100%, hover:underline) */}
                  <button
                    type="button"
                    onClick={onChangeEmail}
                    className="mt-4 w-full px-2 text-left text-sm font-medium text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
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
              hasError={showNonVerificationError}
              autoFocus
            />

            {/* System Message — rate limit banner, resend verification, or error */}
            {rateLimitInfo.isRateLimited && rateLimitInfo.retryAfter ? (
              <RateLimitBanner
                retryAfter={rateLimitInfo.retryAfter}
                message={rateLimitInfo.message ?? 'Too many attempts.'}
                kind={rateLimitInfo.kind ?? undefined}
                onExpired={onRateLimitExpired}
              />
            ) : showResend ? (
              /* Resend verification — no inline error (toast covers it), just button + CountdownTimer */
              <div className="flex h-6 items-center gap-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0}
                  className={`inline-flex items-center gap-2 text-sm font-medium leading-[21px] transition-colors ${
                    resendCooldown > 0
                      ? 'pointer-events-none text-error/50'
                      : 'text-content-primary/75 hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted'
                  }`}
                >
                  <SendHorizontal size={14} className="shrink-0" />
                  Resend verification email
                </button>
                {resendCooldown > 0 && <CountdownTimer seconds={resendCooldown} />}
              </div>
            ) : (
              <div className={`flex items-center gap-2 ${showNonVerificationError ? 'min-h-6' : 'h-6'}`}>
                {showNonVerificationError && (
                  <>
                    <AlertTriangle size={16} className="shrink-0 text-error" />
                    <span className="flex-1 text-xs leading-6 text-error">{activeError}</span>
                  </>
                )}
              </div>
            )}

            {/* Password Recovery Button — Figma: 348x21, always visible, right-aligned */}
            <div className="flex items-center justify-end">
              <Link
                href={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="whitespace-nowrap text-sm font-medium leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Sign In button — Figma: full width 348px, primary button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="relative flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className={isLoading ? 'opacity-30' : ''}>Sign In</span>
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
