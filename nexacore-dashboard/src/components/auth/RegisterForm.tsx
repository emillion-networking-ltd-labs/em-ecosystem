'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RulerDimensionLine, Hash, CaseUpper, CaseLower, Check, AlertTriangle } from 'lucide-react';
import Input from '@/components/ui/Input';
import InfinitySpinner from '@/components/ui/InfinitySpinner';
import OAuthButtons from './OAuthButtons';
import { useAuth } from '@/hooks/useAuth';

/* Password requirements — Figma: Password Check component, 4 criteria icons */
const PASSWORD_REQUIREMENTS = [
  { key: 'long',    Icon: RulerDimensionLine, test: (p: string) => p.length >= 8 },
  { key: 'number',  Icon: Hash,               test: (p: string) => /\d/.test(p) },
  { key: 'upper',   Icon: CaseUpper,          test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower',   Icon: CaseLower,          test: (p: string) => /[a-z]/.test(p) },
] as const;

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export default function RegisterForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [emailError, setEmailError] = useState<string | null>(null);
  const { register, isLoading, isAuthenticated, error, clearError } = useAuth();
  const router = useRouter();

  // Clear stale errors from other auth forms on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect away if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    if (e.target.name === 'email') setEmailError(null);
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setEmailError('Enter your email address');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    if (!formData.password) return;
    setEmailError(null);
    const success = await register(formData.email, formData.password);
    if (success) router.push('/email-sent');
  };

  /* System Message slot — only one message at a time:
     emailError / authError override everything; Password Check visible only while password has content */
  const activeError = emailError || error;
  const showError = !!activeError;
  const showPasswordCheck = !showError && formData.password.length > 0;

  return (
    /* Body — Figma: layoutMode HORIZONTAL, itemSpacing 24 */
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px fixed, vertical center, inner 300px */}
      <div className="flex w-full flex-col justify-center md:w-[330px]">
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
          {/* Form Fields — min-h allows System Message to expand for long errors */}
          <div className="flex min-h-[204px] flex-col gap-2">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              hasError={!!emailError || showError}
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              hasError={showError}
            />

            {/* System Message — single slot: Password Check XOR Error */}
            <div className={`flex items-center gap-2 ${showError ? 'min-h-6' : 'h-6'}`}>
              {showPasswordCheck && (
                /* Password Check — Figma: 200px, 5 icon+badge pairs */
                <div className="flex shrink-0 items-center gap-[15px]">
                  {PASSWORD_REQUIREMENTS.map(({ key, Icon, test }) => {
                    const met = test(formData.password);
                    return (
                      <div key={key} className="relative h-6 w-6">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-border-default">
                          <Icon size={14} className="text-content-primary/50" />
                        </div>
                        {met && (
                          <div className="absolute -bottom-1 -right-1 flex h-[14px] w-[14px] items-center justify-center rounded-full border border-border-default bg-surface-primary">
                            <Check size={8} className="text-green-800" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {showError && (
                /* Error — overrides Password Check, persists until user types */
                <>
                  <AlertTriangle size={16} className="shrink-0 text-error" />
                  <span className="text-xs leading-6 text-error">{activeError}</span>
                </>
              )}
            </div>
          </div>

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
              disabled={isLoading}
              className="relative flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none"
            >
              <span className={isLoading ? 'opacity-30' : ''}>Create Account</span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Actions — OR + OAuth */}
        <div className="mt-2">
          <OAuthButtons />
        </div>
      </div>
    </div>
  );
}
