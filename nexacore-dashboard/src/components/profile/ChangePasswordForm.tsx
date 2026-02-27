'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordStrength = (() => {
    if (!newPassword) return { level: 0, label: '' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    const labels = ['', 'Weak', 'Fair', 'Strong'];
    return { level: score, label: labels[score] };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch('/users/me/password', { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
      <h2 className="mb-6 text-body-sm font-semibold uppercase tracking-wider text-content-primary">
        Change Password
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Current Password"
          name="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
        />

        <div>
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          {newPassword && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= passwordStrength.level
                        ? passwordStrength.level <= 1
                          ? 'bg-error'
                          : passwordStrength.level <= 2
                            ? 'bg-warning'
                            : 'bg-success'
                        : 'bg-surface-subtle'
                    }`}
                  />
                ))}
              </div>
              <span className="text-caption text-content-tertiary">{passwordStrength.label}</span>
            </div>
          )}
        </div>

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
        />

        {error && <p className="text-caption text-error">{error}</p>}
        {success && <p className="text-caption text-success">Password changed successfully.</p>}

        <div className="flex justify-end">
          <Button type="submit" size="md" fullWidth={false} loading={loading}>
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
