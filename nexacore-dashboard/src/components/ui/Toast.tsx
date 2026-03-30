"use client";

import { useState, useEffect, useCallback } from "react";
import { TriangleAlert, CircleCheck, CircleAlert, Info, X } from "lucide-react";
import IconButton from "./IconButton";

type ToastVariant = "error" | "success" | "warning" | "info";

type ToastProps = {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: number) => void;
};

const VARIANT_CONFIG = {
  error: { icon: TriangleAlert, className: "text-error" },
  success: { icon: CircleCheck, className: "text-success" },
  warning: { icon: CircleAlert, className: "text-warning" },
  info: { icon: Info, className: "text-info" },
} as const;

const DEFAULT_DURATION = 5000;

export default function Toast({
  id,
  variant,
  title,
  description,
  duration,
  onClose,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const { icon: Icon, className: variantClass } = VARIANT_CONFIG[variant];

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
      className={`pointer-events-auto group flex max-w-[550px] items-start gap-2 rounded-full border border-border-strong bg-surface-primary px-6 py-4 ${
        isExiting ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <Icon size={16} className={`mt-px shrink-0 ${variantClass}`} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-caption font-semibold leading-tight text-content-primary">
          {title}
        </p>
        {description && (
          <p className="text-caption leading-tight text-content-primary/50">
            {description}
          </p>
        )}
      </div>

      <IconButton
        size="sm"
        onClick={dismiss}
        className="mt-px opacity-0 transition-all group-hover:opacity-100"
        aria-label="Close notification"
      >
        <X size={16} />
      </IconButton>
    </div>
  );
}
