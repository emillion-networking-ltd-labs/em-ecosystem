'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import OAuthButtons from './OAuthButtons';

type LoginStep = 'email' | 'password';

export default function LoginForm() {
  const [step, setStep] = useState<LoginStep>('email');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;
    setStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password) return;
    setIsLoading(true);
    try {
      // TODO: SCRUM-19 — integrate with AuthContext login
      console.log('Login:', formData);
    } catch {
      // handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'password') {
    return (
      <PasswordStep
        password={formData.password}
        isLoading={isLoading}
        onChange={handleChange}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    /* Body — Figma: layoutMode HORIZONTAL, itemSpacing 24 */
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px fixed, vertical center */}
      <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Sign in
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
          {/* Email Field — Figma: 348x120 FIXED height (includes 24px reserved space) */}
          <div className="h-[120px]">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              autoFocus
            />
          </div>

          {/* Buttons Field — Figma: horizontal, itemSpacing 8 */}
          <div className="flex gap-2">
            <Link href="/register" className="flex-1">
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-transparent text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
              >
                Create account
              </button>
            </Link>
            <button
              type="submit"
              className="flex h-10 flex-1 items-center justify-center rounded-md border border-border-default bg-surface-inverse text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
            >
              Next
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

/* ===== Password Step ===== */
/* Figma: Auth - Login - Password — no OAuth, no Create Account */
/* Figma: Email Field 348x130 FIXED, contains password + forgot link */

type PasswordStepProps = {
  password: string;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
};

function PasswordStep({ password, isLoading, onChange, onSubmit }: PasswordStepProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — same as email step */}
      <div className="flex w-full flex-col items-center justify-center gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Sign in
          </h1>
          <p className="text-sm leading-[21px] text-content-primary/50">
            Connect using your NexaCore Account. This session will be available
            to other EM Ecosystem modules in the browser.
          </p>
        </div>
      </div>

      {/* Form — Figma: 348px, password + forgot + Sign in */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          {/* Password Field — Figma: 348x130 FIXED */}
          <div className="h-[130px]">
            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
              autoFocus
            />

            {/* Forgot password — Inline Link (ui-design-system: 50% → 75% + underline) */}
            <button
              type="button"
              className="mt-2 self-start text-sm font-medium leading-[21px] text-content-secondary transition-colors hover:text-content-primary/75 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign in button — Figma: full width 348px, dark bg */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex h-10 w-full items-center justify-center rounded-md bg-surface-inverse text-base font-semibold text-content-inverse transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
