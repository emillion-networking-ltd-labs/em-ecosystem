'use client';

import { useState, useEffect } from 'react';
import { Key, Smartphone, Monitor, Pencil, Trash2, Plus, AlertTriangle, ShieldCheck } from 'lucide-react';
import { usePasskey } from '@/hooks/usePasskey';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { PasskeyResponse } from '@/lib/types';

type View = 'list' | 'registering';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function DeviceIcon({ deviceType }: { deviceType: string }) {
  return deviceType === 'multiDevice' ? (
    <Smartphone size={18} className="text-content-secondary" />
  ) : (
    <Monitor size={18} className="text-content-secondary" />
  );
}

function PasskeyItem({
  passkey,
  onRename,
  onDelete,
}: {
  passkey: PasskeyResponse;
  onRename: (pk: PasskeyResponse) => void;
  onDelete: (pk: PasskeyResponse) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-default p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-tertiary">
          <DeviceIcon deviceType={passkey.deviceType} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-medium text-content-primary">
              {passkey.name || 'Passkey'}
            </span>
            {passkey.backedUp && (
              <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[11px] font-medium text-content-secondary">
                Synced
              </span>
            )}
          </div>
          <span className="text-caption text-content-secondary">
            Last used: {formatRelativeTime(passkey.lastUsedAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onRename(passkey)}
          className="rounded-md p-2 text-content-secondary transition-colors hover:bg-surface-subtle hover:text-content-primary"
          aria-label={`Rename ${passkey.name || 'passkey'}`}
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(passkey)}
          className="rounded-md p-2 text-content-secondary transition-colors hover:bg-error-bg hover:text-error"
          aria-label={`Delete ${passkey.name || 'passkey'}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function PasskeyManager() {
  const {
    isSupported,
    passkeys,
    isLoadingList,
    fetchPasskeys,
    registerPasskey,
    isRegistering,
    renamePasskey,
    deletePasskey,
    error,
    clearError,
  } = usePasskey();

  const [view, setView] = useState<View>('list');
  const [regName, setRegName] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Rename state
  const [renamingPasskey, setRenamingPasskey] = useState<PasskeyResponse | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete state
  const [deletingPasskey, setDeletingPasskey] = useState<PasskeyResponse | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchPasskeys();
  }, [fetchPasskeys]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const handleRegister = async () => {
    clearError();
    const result = await registerPasskey(regName.trim() || undefined);
    if (result) {
      setSuccessMsg(`Passkey "${result.name}" registered successfully.`);
      setRegName('');
      setView('list');
    }
  };

  const handleRenameSubmit = async () => {
    if (!renamingPasskey || !renameValue.trim()) return;
    setIsRenaming(true);
    const ok = await renamePasskey(renamingPasskey.id, renameValue.trim());
    setIsRenaming(false);
    if (ok) {
      setSuccessMsg('Passkey renamed.');
      setRenamingPasskey(null);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingPasskey) return;
    setIsDeleting(true);
    setDeleteError(null);
    const ok = await deletePasskey(deletingPasskey.id, deletePassword || undefined);
    setIsDeleting(false);
    if (ok) {
      setSuccessMsg('Passkey deleted.');
      setDeletingPasskey(null);
      setDeletePassword('');
    } else {
      setDeleteError(error || 'Failed to delete passkey.');
    }
  };

  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key size={18} className="text-content-secondary" />
          <h2 className="text-body-sm font-semibold uppercase tracking-wider text-content-primary">
            Passkeys
          </h2>
        </div>
        {passkeys.length > 0 && (
          <div className="flex items-center gap-1.5 text-caption text-success">
            <ShieldCheck size={14} />
            <span>{passkeys.length} registered</span>
          </div>
        )}
      </div>

      {/* Browser support warning */}
      {!isSupported && (
        <div className="flex items-start gap-3 rounded-lg border border-warning-border bg-warning-bg p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
          <div>
            <p className="text-body-sm font-medium text-content-primary">
              Passkeys not supported
            </p>
            <p className="mt-1 text-caption text-content-secondary">
              Your browser does not support WebAuthn. Use a modern browser like Chrome, Edge, Safari, or Firefox.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && view === 'list' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-error-border bg-error-bg p-3">
          <AlertTriangle size={16} className="shrink-0 text-error" />
          <span className="text-caption text-error">{error}</span>
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-success-border bg-success-bg p-3">
          <ShieldCheck size={16} className="shrink-0 text-success" />
          <span className="text-caption text-success">{successMsg}</span>
        </div>
      )}

      {/* Loading */}
      {isLoadingList && passkeys.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-content-secondary border-t-transparent" />
        </div>
      )}

      {/* List View */}
      {isSupported && view === 'list' && (
        <>
          {!isLoadingList && passkeys.length === 0 && (
            <p className="mb-4 text-body-sm text-content-secondary">
              No passkeys registered. Add a passkey for faster, more secure sign-in using biometrics or your device.
            </p>
          )}

          {passkeys.length > 0 && (
            <div className="mb-4 space-y-3">
              {passkeys.map((pk) => (
                <PasskeyItem
                  key={pk.id}
                  passkey={pk}
                  onRename={(p) => {
                    clearError();
                    setRenameValue(p.name || '');
                    setRenamingPasskey(p);
                  }}
                  onDelete={(p) => {
                    clearError();
                    setDeleteError(null);
                    setDeletePassword('');
                    setDeletingPasskey(p);
                  }}
                />
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="md"
            fullWidth={false}
            onClick={() => {
              clearError();
              setRegName('');
              setView('registering');
            }}
            disabled={passkeys.length >= 10}
            className="gap-2"
          >
            <Plus size={16} />
            Add Passkey
          </Button>

          {passkeys.length >= 10 && (
            <p className="mt-2 text-caption text-content-secondary">
              Maximum of 10 passkeys reached. Remove one before adding another.
            </p>
          )}
        </>
      )}

      {/* Registering View */}
      {isSupported && view === 'registering' && (
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-content-secondary">
            Give your passkey a name to identify it later, then follow the biometric prompt.
          </p>
          <Input
            label="Passkey name (optional)"
            name="passkey-name"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            placeholder="e.g. My MacBook"
            maxLength={64}
            disabled={isRegistering}
          />
          {error && (
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 text-error" />
              <span className="text-caption text-error">{error}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => { clearError(); setView('list'); }}
              disabled={isRegistering}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              loading={isRegistering}
              onClick={handleRegister}
            >
              Register Passkey
            </Button>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      <ConfirmModal
        open={!!renamingPasskey}
        onClose={() => setRenamingPasskey(null)}
        onConfirm={handleRenameSubmit}
        title="Rename Passkey"
        description={`Enter a new name for "${renamingPasskey?.name || 'Passkey'}".`}
        confirmLabel="Save"
        loading={isRenaming}
      >
        <div className="mt-4">
          <Input
            name="rename-passkey"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="New name"
            maxLength={64}
            autoFocus
          />
        </div>
      </ConfirmModal>

      {/* Delete Modal */}
      <ConfirmModal
        open={!!deletingPasskey}
        onClose={() => { setDeletingPasskey(null); setDeleteError(null); }}
        onConfirm={handleDeleteSubmit}
        title="Delete Passkey"
        description={`Are you sure you want to delete "${deletingPasskey?.name || 'Passkey'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
      >
        <div className="mt-4">
          <Input
            label="Confirm with your password"
            type="password"
            name="delete-passkey-password"
            value={deletePassword}
            onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(null); }}
            placeholder="Enter your password"
            error={deleteError || undefined}
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
