'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { deleteAccount } from '@/lib/delete-account-api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type ApiError = { error?: { message?: string; statusCode?: number } };

function extractMessage(err: unknown, fallback: string): string {
  const e = err as ApiError;
  if (e?.error?.statusCode === 429) return 'Too many requests. Try again later.';
  if (e?.error?.statusCode === 403) return 'SUPERADMIN accounts cannot be deleted.';
  if (e?.error?.statusCode === 401) return 'Incorrect password.';
  const msg = e?.error?.message ?? fallback;
  return msg.endsWith('.') ? msg : `${msg}.`;
}

export default function DeleteAccount() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requiresPassword = user?.hasPassword ?? false;
  const isConfirmValid = confirmText === 'DELETE';
  const isPasswordValid = !requiresPassword || password.length >= 8;
  const canConfirm = isConfirmValid && isPasswordValid && !loading;

  const handleClose = () => {
    if (loading) return;
    setShowModal(false);
    setConfirmText('');
    setPassword('');
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAccount(requiresPassword ? password : undefined);
      await logout();
      router.push('/login');
    } catch (err: unknown) {
      addToast({ variant: 'error', title: 'Delete failed', description: extractMessage(err, 'Failed to delete account.') });
    } finally {
      setLoading(false);
    }
  };

  // Escape key handler
  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  if (!user) return null;

  return (
    <>
      {/* Danger zone card */}
      <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
        <h2 className="mb-4 text-body-sm font-semibold uppercase tracking-wider text-error">
          Danger Zone
        </h2>
        <p className="mb-6 text-body-sm text-content-secondary">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Button
          variant="danger"
          size="md"
          fullWidth={false}
          onClick={() => setShowModal(true)}
        >
          Delete Account
        </Button>
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === overlayRef.current) handleClose();
          }}
        >
          <div className="w-[427px] overflow-hidden rounded-3xl border border-border-default bg-surface-secondary shadow-card">
            {/* Top section */}
            <div className="border-b border-border-default bg-surface-primary p-6">
              <h2 className="text-heading-md text-content-primary">Delete Account</h2>
              <p className="mt-2 text-body-sm text-content-secondary">
                This action is permanent and cannot be undone. All your data will be anonymized
                and your sessions will be revoked.
              </p>

              <div className="mt-4">
                <p className="mb-2 text-body-sm text-content-secondary">
                  Type <span className="font-semibold text-content-primary">DELETE</span> to confirm
                </p>
                <Input
                  name="confirmDelete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                />
              </div>

              {requiresPassword && (
                <div className="mt-4">
                  <Input
                    label="Password"
                    name="deletePassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
              )}

            </div>

            {/* Bottom section — buttons */}
            <div className="flex justify-end gap-3 p-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="h-10 rounded-md px-6 text-body-sm font-medium tracking-[-0.28px] text-content-secondary transition-colors hover:bg-surface-subtle disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canConfirm}
                className="h-10 rounded-md px-6 text-body-sm font-medium tracking-[-0.28px] bg-error text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
