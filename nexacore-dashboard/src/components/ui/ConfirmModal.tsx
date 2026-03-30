"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import Button from "./Button";
import IconButton from "./IconButton";

export const confirmModalSpecs = {
  variants: {
    primary: "Button primary (bg-surface-inverse)",
    danger: "Button danger (bg-error)",
  },
  layout: {
    width: "max-w-[390px]",
    radius: "rounded-xl (card inner)",
    overlay: "bg-black/40",
    topSection: "bg-surface-primary p-6 border-b border-border-default",
    bottomSection: "bg-surface-secondary px-6 py-3",
  },
  accessibility: {
    role: "dialog, aria-modal=true",
    focusTrap: "Tab/Shift+Tab cycles within modal",
    escape: "Closes modal",
    overlayClick: "Closes modal",
    focusRestore: "Previous focus restored on close",
  },
  close: {
    position: "absolute right-4 top-4",
    visibility: "opacity-0 group-hover:opacity-100",
    component: "IconButton default sm + X 16px",
  },
};

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
  children?: React.ReactNode;
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
  children,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save previous focus and focus first element on open
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length > 0) focusable[0].focus();
    }
    return () => {
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // Keyboard handler: Escape + focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="group max-w-[390px] overflow-hidden rounded-xl border border-border-default bg-surface-secondary shadow-card"
      >
        {/* Top section */}
        <div className="relative border-b border-border-default bg-surface-primary p-6">
          <IconButton
            variant="default"
            size="sm"
            className="absolute right-6 top-6 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={16} />
          </IconButton>
          <h2
            id="confirm-modal-title"
            className="text-h2 font-semibold text-content-primary"
          >
            {title}
          </h2>
          <p className="mt-2 pr-4 text-body text-content-secondary">
            {description}
          </p>
          {children}
        </div>

        {/* Bottom section — buttons */}
        <div className="flex justify-end gap-3 px-6 py-3">
          <Button
            variant="outline"
            size="md"
            fullWidth={false}
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="md"
            fullWidth={false}
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
