'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { requestEmailChange } from '@/lib/email-change-api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Info } from 'lucide-react';

type ApiError = { error?: { message?: string; statusCode?: number } };

function extractMessage(err: unknown, fallback: string): string {
  const e = err as ApiError;
  if (e?.error?.statusCode === 429) return 'Too many requests. Try again later.';
  const msg = e?.error?.message ?? fallback;
  return msg.endsWith('.') ? msg : `${msg}.`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailForm() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const isLocal = user.provider === 'LOCAL';
  const providerName = user.provider === 'GOOGLE' ? 'Google' : user.provider === 'GITHUB' ? 'GitHub' : user.provider;

  const isValidEmail = EMAIL_REGEX.test(newEmail);
  const isSameEmail = newEmail.toLowerCase() === user.email.toLowerCase();
  const isValidPassword = password.length >= 8;
  const canSubmit = isLocal && isValidEmail && !isSameEmail && isValidPassword && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLocal) return;
    setLoading(true);
    try {
      await requestEmailChange(newEmail, password);
      addToast({ variant: 'success', title: 'Verification email sent', description: 'Check the inbox of your new email address to confirm the change.' });
      setNewEmail('');
      setPassword('');
    } catch (err: unknown) {
      addToast({ variant: 'error', title: 'Email change failed', description: extractMessage(err, 'Failed to request email change.') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="change-email" className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
      <h2 className="mb-6 text-body-sm font-semibold uppercase tracking-wider text-content-primary">
        Change Email
      </h2>

      {!isLocal ? (
        <div className="flex items-start gap-3 rounded-xl bg-surface-subtle p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-content-secondary" />
          <p className="text-body-sm text-content-secondary">
            Your email is managed by {providerName}. To change your email, disconnect your {providerName} account in{' '}
            <a href="#connected-accounts" className="font-medium text-content-primary underline underline-offset-2 hover:text-brand">
              Connected Accounts
            </a>{' '}
            first.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="New Email"
            name="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email address"
            error={
              newEmail && !isValidEmail
                ? 'Enter a valid email address'
                : newEmail && isSameEmail
                  ? 'New email must be different from current email'
                  : undefined
            }
          />

          <Input
            label="Current Password"
            name="emailChangePassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          <div className="flex justify-end">
            <Button type="submit" size="md" fullWidth={false} loading={loading} disabled={!canSubmit}>
              Change Email
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
