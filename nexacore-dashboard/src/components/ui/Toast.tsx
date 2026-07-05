"use client";

import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TriangleAlert, CircleCheck, CircleAlert, Info, X } from "lucide-react";

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
  const { icon: Icon, className: variantClass } = VARIANT_CONFIG[variant];

  const dismiss = useCallback(() => {
    onClose(id);
  }, [id, onClose]);

  useEffect(() => {
    const timer = setTimeout(dismiss, duration ?? DEFAULT_DURATION);
    return () => clearTimeout(timer);
  }, [dismiss, duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
      transition={{ duration: 0.3 }}
      role="alert"
      aria-live="assertive"
      className="pointer-events-auto group grid w-fit max-w-[550px] grid-cols-[14px_1fr_auto] items-start gap-x-2 rounded-3xl border border-border-strong bg-surface-primary py-3 pl-5 pr-4"
    >
      {/* Col 1: icon — vertically centered with the title (row 1) */}
      <Icon size={14} className={`self-center shrink-0 ${variantClass}`} />
      {/* Col 2: title */}
      <p className="min-w-0 text-caption font-semibold leading-4 text-content-primary">
        {title}
      </p>
      {/* Col 3: close button — top aligned */}
      <button
        onClick={dismiss}
        className="row-span-2 mt-[-7px] mr-[-7px] self-start shrink-0 rounded-md p-1 text-content-tertiary opacity-0 transition-all hover:text-content-primary group-hover:opacity-100"
        aria-label="Close notification"
      >
        <X size={12} />
      </button>
      {/* Col 2 row 2: description */}
      {description && (
        <p className="col-start-2 text-caption leading-4 text-content-secondary">
          {description}
        </p>
      )}
    </motion.div>
  );
}
