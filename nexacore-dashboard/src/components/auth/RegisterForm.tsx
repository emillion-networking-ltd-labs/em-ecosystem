'use client';

import { useState } from 'react';
import Link from 'next/link';
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
      {/* Title Group — Figma: 330px fixed, vertical center, inner 300px */}
      <div className="flex w-full flex-col justify-center md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Create an Account
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
          {/* Form Fields — Figma: 348x204 FIXED, vertical, itemSpacing 8 */}
          <div className="flex h-[204px] flex-col gap-2">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />

            {/* System Message — Figma: 348x24, HORIZONTAL, center */}
            <div className="flex h-6 items-center gap-2" />
          </div>

          {/* Buttons Field — Figma: horizontal, itemSpacing 8 */}
          <div className="flex gap-2">
            <Link
              href="/login"
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Back to Login
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-10 flex-1 items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
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
