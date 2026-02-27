'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RulerDimensionLine, Check, AlertTriangle } from 'lucide-react';
import Input from '@/components/ui/Input';
import InfinitySpinner from '@/components/ui/InfinitySpinner';
import { useAuth } from '@/hooks/useAuth';

/* Password requirement — minimum 8 characters */
const PASSWORD_REQUIREMENTS = [
  { key: 'long', Icon: RulerDimensionLine, test: (p: string) => p.length >= 8 },
] as const;

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!token) {
      setLocalError('Invalid or missing reset token.');
      return;
    }
    if (!password) {
      setLocalError('Enter a new password.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    const ok = await resetPassword(token, password);
    if (ok) setSuccess(true);
  };

  const activeError = localError || error;
  const showError = !!activeError;
  const showPasswordCheck = !showError && password.length > 0;

  if (success) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col justify-center md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
              Password Reset
            </h1>
            <p className="text-justify text-sm leading-[21px] text-content-primary/50">
              Your password has been updated successfully. You can now sign in
              with your new credentials.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 md:w-[348px]">
          <Link
            href="/login"
            className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col justify-center md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Reset Password
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
            Enter your new password. Make sure it meets the security
            requirements shown below.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[348px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex min-h-[204px] flex-col gap-2">
            <Input
              label="New Password"
              type="password"
              name="password"
              value={password}
              onChange={e => { clearError(); setLocalError(null); setPassword(e.target.value); }}
              placeholder="Enter new password"
              hasError={showError}
              autoFocus
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={e => { clearError(); setLocalError(null); setConfirmPassword(e.target.value); }}
              placeholder="Confirm new password"
              hasError={showError}
            />

            <div className={`flex items-center gap-2 ${showError ? 'min-h-6' : 'h-6'}`}>
              {showPasswordCheck && (
                <div className="flex shrink-0 items-center gap-[15px]">
                  {PASSWORD_REQUIREMENTS.map(({ key, Icon, test }) => {
                    const met = test(password);
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
                <>
                  <AlertTriangle size={16} className="shrink-0 text-error" />
                  <span className="text-xs leading-6 text-error">{activeError}</span>
                </>
              )}
            </div>
          </div>

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
              <span className={isLoading ? 'opacity-30' : ''}>Reset Password</span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
