'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { requestEmailChange } from '@/lib/email-change-api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type ApiError = { error?: { message?: string; statusCode?: number } };

function extractMessage(err: unknown, fallback: string): string {
  const e = err as ApiError;
  if (e?.error?.statusCode === 429) return 'Too many requests. Try again later.';
  return e?.error?.message ?? fallback;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailForm() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Hide for OAuth users — they can't change email
  if (!user || user.provider !== 'LOCAL') return null;

  const isValidEmail = EMAIL_REGEX.test(newEmail);
  const isSameEmail = newEmail.toLowerCase() === user.email.toLowerCase();
  const isValidPassword = password.length >= 8;
  const canSubmit = isValidEmail && !isSameEmail && isValidPassword && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await requestEmailChange(newEmail, password);
      setSuccess(true);
      setNewEmail('');
      setPassword('');
    } catch (err: unknown) {
      setError(extractMessage(err, 'Failed to request email change.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="change-email" className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
      <h2 className="mb-6 text-body-sm font-semibold uppercase tracking-wider text-content-primary">
        Change Email
      </h2>

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

        {error && <p className="text-caption text-error">{error}</p>}
        {success && (
          <p className="text-caption text-success">
            Verification email sent to your new address. Check your inbox.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="md" fullWidth={false} loading={loading} disabled={!canSubmit}>
            Change Email
          </Button>
        </div>
      </form>
    </div>
  );
}
