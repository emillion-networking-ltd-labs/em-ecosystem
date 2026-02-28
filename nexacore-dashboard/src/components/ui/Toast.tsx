'use client';

import { useState, useEffect, useCallback } from 'react';
import { TriangleAlert, CircleCheck, CircleAlert, Info, X } from 'lucide-react';

type ToastVariant = 'error' | 'success' | 'warning' | 'info';

type ToastProps = {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: number) => void;
};

const VARIANT_CONFIG = {
  error: { icon: TriangleAlert, color: '#ef4444' },
  success: { icon: CircleCheck, color: '#22c55e' },
  warning: { icon: CircleAlert, color: '#f59e0b' },
  info: { icon: Info, color: '#60a5fa' },
} as const;

const DEFAULT_DURATION = 5000;

export default function Toast({ id, variant, title, description, duration, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const { icon: Icon, color } = VARIANT_CONFIG[variant];

  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  }, [id, onClose]);

  useEffect(() => {
    const timer = setTimeout(dismiss, duration ?? DEFAULT_DURATION);
    return () => clearTimeout(timer);
  }, [dismiss, duration]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex w-[400px] items-center gap-2 rounded-full border border-border-default bg-surface-primary p-6 shadow-card ${
        isExiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <Icon size={16} className="shrink-0" style={{ color }} />

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-tight text-content-primary">{title}</p>
        {description && (
          <p className="mt-1 text-[12px] leading-tight text-content-secondary">{description}</p>
        )}
      </div>

      <button
        onClick={dismiss}
        className="shrink-0 text-content-secondary transition-colors hover:text-content-primary"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
