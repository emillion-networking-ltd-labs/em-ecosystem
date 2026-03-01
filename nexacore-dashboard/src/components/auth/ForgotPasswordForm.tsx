'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import Input from '@/components/ui/Input';
import InfinitySpinner from '@/components/ui/InfinitySpinner';
import RateLimitBanner from '@/components/ui/RateLimitBanner';
import { useAuth } from '@/hooks/useAuth';
import { useRateLimit } from '@/hooks/useRateLimit';
import { RateLimitError } from '@/lib/types';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  const router = useRouter();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setEmailError('Enter your email address');
      return;
    }
    setEmailError(null);
    try {
      const success = await forgotPassword(email);
      if (success) router.push('/check-email');
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimit(err.retryAfter, err.message);
      }
    }
  };

  const isDisabled = isLoading || rateLimitInfo.isRateLimited;
  const showRateLimit = rateLimitInfo.isRateLimited;
  const activeError = emailError || error;
  const showError = !showRateLimit && !!activeError;

  return (
    /* Body — Figma: layoutMode HORIZONTAL, itemSpacing 24 */
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px fixed, vertical center, inner 300px */}
      <div className="flex w-full flex-col justify-center md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Password Recovery
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
            Start the NexaCore password reset process. A secure identity check
            will be required to restore account access.
          </p>
        </div>
      </div>

      {/* Form — Figma: 348x146 FIXED, vertical, gap 8 */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {/* Email Field — Figma: 348x146 FIXED, vertical, gap 8 */}
          <div className="flex min-h-[146px] flex-col gap-2">
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={e => { clearError(); setEmailError(null); setEmail(e.target.value); }}
              placeholder="your@email.com"
              hasError={showError || !!emailError}
              autoFocus
            />

            {/* System Message — Figma: 348x24 FIXED, rate limit banner or error */}
            {showRateLimit ? (
              <RateLimitBanner
                retryAfter={rateLimitInfo.retryAfter!}
                message={rateLimitInfo.message!}
                onExpired={clearRateLimit}
              />
            ) : (
              <div className={`flex items-center gap-2 ${showError ? 'min-h-6' : 'h-6'}`}>
                {showError && (
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
                href="/login"
                className="whitespace-nowrap text-sm font-medium leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
              >
                Back to Sign In
              </Link>
            </div>
          </div>

          {/* Recovery Button — Figma: 348x40, primary, single button */}
          <button
            type="submit"
            disabled={isDisabled}
            className="relative flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className={isLoading ? 'opacity-30' : ''}>Send Recovery Email</span>
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
