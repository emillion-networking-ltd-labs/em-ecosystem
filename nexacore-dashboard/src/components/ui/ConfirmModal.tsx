'use client';

import { useEffect, useRef } from 'react';

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
  children?: React.ReactNode;
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  children,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-[427px] overflow-hidden rounded-3xl border border-border-default bg-surface-secondary shadow-card">
        {/* Top section */}
        <div className="flex gap-4 border-b border-border-default bg-surface-primary p-6">
          <div className="flex-1">
            <h2 className="text-heading-md text-content-primary">{title}</h2>
            <p className="mt-2 text-body-sm text-content-secondary">{description}</p>
            {children}
          </div>
        </div>

        {/* Bottom section — buttons */}
        <div className="flex justify-end gap-3 p-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-md px-6 text-body-sm font-medium tracking-[-0.28px] text-content-secondary transition-colors hover:bg-surface-subtle"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`h-10 rounded-md px-6 text-body-sm font-medium tracking-[-0.28px] transition-colors disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-error text-white hover:opacity-90'
                : 'bg-surface-inverse text-content-inverse hover:opacity-90'
            }`}
          >
            {loading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
