'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
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
        email={formData.email}
        password={formData.password}
        isLoading={isLoading}
        onChange={handleChange}
        onSubmit={handleLogin}
        onChangeEmail={() => setStep('email')}
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
          {/* Email Field — Figma: 348x118 FIXED, vertical, gap 8 */}
          <div className="flex h-[118px] flex-col gap-2">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              autoFocus
            />

            {/* System Message — Figma: 348x24, HORIZONTAL, center */}
            <div className="flex h-6 items-center gap-2" />
          </div>

          {/* Buttons Field — Figma: horizontal, itemSpacing 8 */}
          <div className="flex gap-2">
            <Link
              href="/register"
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Create account
            </Link>
            <button
              type="submit"
              className="flex h-10 flex-1 items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
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
/* Figma: Auth-Login-Step-Password — no OAuth, no Create Account */
/* Select Email Button replaces subtitle, shows email from step 1 (Google-inspired) */

type PasswordStepProps = {
  email: string;
  password: string;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onChangeEmail: () => void;
};

function PasswordStep({ email, password, isLoading, onChange, onSubmit, onChangeEmail }: PasswordStepProps) {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const emailInitial = email.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px fixed, vertical center, inner 300px */}
      <div className="flex w-full flex-col justify-center md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Sign in
          </h1>

          {/* Select Email Button — trigger pattern matching LanguageSelector */}
          <div ref={dropdownRef} className="relative self-start">
            <button
              type="button"
              onClick={() => setIsEmailOpen(!isEmailOpen)}
              className={`flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-all ${
                isEmailOpen
                  ? 'border border-border-default bg-surface-primary text-content-primary'
                  : 'border border-border-default bg-transparent text-content-primary/75 hover:text-content-primary'
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
                    className="flex h-10 w-full items-center gap-2 rounded-md bg-surface-subtle px-2 font-medium text-content-primary transition-colors"
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

      {/* Form — Figma: 348px, password + forgot link + Sign in (no OAuth, no Create Account) */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          {/* Password Field — Figma: 348x117 FIXED, vertical, gap 8 */}
          <div className="flex h-[117px] flex-col gap-2">
            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
              autoFocus
            />

            {/* System Message — Figma: 348x24, horizontal, center aligned */}
            <div className="flex h-6 items-center">
              {/* Forgot password — Link/Underline (75% → 100%, hover:underline, active:underline dotted) */}
              <button
                type="button"
                className="text-sm font-medium leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Sign in button — Figma: full width 348px, primary button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
