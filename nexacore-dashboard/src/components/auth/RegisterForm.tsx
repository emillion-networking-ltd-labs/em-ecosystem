'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import Input from '@/components/ui/Input';
import OAuthButtons from './OAuthButtons';

export default function RegisterForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setIsLoading(true);
    try {
      // TODO: SCRUM-19 — integrate with AuthContext register
      console.log('Register:', formData);
    } catch {
      // handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Body — Figma: layoutMode HORIZONTAL, itemSpacing 24 */
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group — Figma: 330px fixed, vertical center */}
      <div className="flex w-full flex-col items-center justify-center gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Create an Account
          </h1>
          <p className="text-sm leading-[21px] text-content-primary/50">
            Create your NexaCore user profile. This session will be available to
            other EM Ecosystem modules in the browser.
          </p>
          {/* Inline Link (ui-design-system: 50% → 75% + underline) */}
          <p className="text-sm leading-[21px] text-content-secondary">
            Already have an account?{' '}
            <Link href="/login" className="font-medium transition-colors hover:text-content-primary/75 hover:underline">
              Go back to the sign‑in screen.
            </Link>
          </p>
        </div>
      </div>

      {/* Form — Figma: 348px, email + password + Sign Up + OAuth */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={handleRegister} className="flex flex-col gap-2">
          {/* Email Field — Figma: 348x200 FIXED, contains both email + password */}
          <div className="h-[200px]">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              leftIcon={<Mail size={20} />}
              autoFocus
            />

            <div className="mt-2">
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Sign Up button — Figma: full width 348px, dark bg */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex h-10 w-full items-center justify-center rounded-md bg-surface-inverse text-base font-semibold text-content-inverse transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Actions — OR + OAuth */}
        <div className="mt-2">
          <OAuthButtons />
        </div>
      </div>
    </div>
  );
}
