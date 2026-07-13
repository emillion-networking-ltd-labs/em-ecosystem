"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import Button from "./Button";
import IconButton from "./IconButton";

export const confirmModalSpecs = {
  variants: {
    primary: "Button primary (bg-surface-inverse)",
    danger: "Button danger (bg-error)",
  },
  sizes: {
    sm: "max-w-[390px] — confirmations, simple yes/no dialogs",
    md: "max-w-[480px] — form dialogs (edit profile, change email/password)",
    lg: "max-w-[600px] — complex forms, multi-step dialogs",
  },
  usage: {
    confirm: "Default: title + description + Confirm/Cancel. Size sm.",
    form: "With children (Input fields). Add size=md. Enter submits via onConfirm.",
    danger: "Destructive action: variant=danger, red confirm button.",
  },
  layout: {
    radius: "rounded-xl (card inner)",
    overlay: "bg-(--overlay) — click does NOT close (Escape + X only)",
    topSection:
      "bg-surface-primary p-6 sm:p-6 p-4 border-b border-border-default",
    bottomSection: "bg-surface-secondary px-6 py-3",
  },
  accessibility: {
    role: "dialog, aria-modal=true",
    focusTrap: "Tab/Shift+Tab cycles within modal",
    escape: "Closes modal",
    overlayClick: "Does NOT close modal (prevents accidental dismissal)",
    enterKey: "Triggers onConfirm (standard form submission)",
    focusRestore: "Previous focus restored on close",
    autofocus:
      "Input → first input | Danger no input → Cancel | Primary no input → Confirm (W3C WAI ARIA APG)",
  },
  close: {
    position: "absolute right-4 top-4",
    visibility: "Always visible (not hover-only — mobile needs it)",
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
  size?: "sm" | "md" | "lg" | "xl";
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
  size = "sm",
  loading = false,
  children,
}: ConfirmModalProps) {
  const sizeClasses = {
    sm: "max-w-[390px]",
    md: "max-w-[480px]",
    lg: "max-w-[600px]",
    xl: "max-w-[720px]",
  };
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Smart autofocus: input > cancel (danger) > confirm (primary)
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Wait for children to render
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;

      // 1. Focus first input if present
      const firstInput = panel.querySelector<HTMLElement>(
        "input:not([disabled]), textarea:not([disabled])",
      );
      if (firstInput) {
        firstInput.focus();
        return;
      }

      // 2. Danger without input → focus Cancel
      if (variant === "danger") {
        const cancelBtn = panel.querySelector<HTMLElement>(
          "[data-role='modal-cancel']",
        );
        if (cancelBtn) {
          cancelBtn.focus();
          return;
        }
      }

      // 3. Primary without input → focus Confirm
      const confirmBtn = panel.querySelector<HTMLElement>(
        "[data-role='modal-confirm']",
      );
      if (confirmBtn) confirmBtn.focus();
    });

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [open, variant]);

  // Keyboard handler: Escape + Enter + focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Enter triggers confirm (unless in textarea or button)
      if (e.key === "Enter" && !loading) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "TEXTAREA" && target.tagName !== "BUTTON") {
          e.preventDefault();
          onConfirm();
          return;
        }
      }

      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    [onClose, onConfirm, loading],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // Lock body scroll — compensate scrollbar width to prevent layout shift
  useEffect(() => {
    if (!open) return;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--overlay)">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className={`group w-full ${sizeClasses[size]} mx-4 max-h-[90vh] overflow-y-auto rounded-xl border border-border-strong bg-surface-secondary shadow-card`}
      >
        {/* Top section */}
        <div className="relative rounded-t-xl border-b border-border-default bg-surface-primary p-4 sm:p-6">
          {/* Close — top-right CORNER (less inset than the content padding so it sits above-right of
              the title, not crowding it). Appears on hover over the modal (or keyboard focus). */}
          <IconButton
            variant="default"
            size="sm"
            icon={X}
            className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:right-4 sm:top-4"
            aria-label="Close"
            onClick={onClose}
          />
          <h2
            id="confirm-modal-title"
            className="pr-8 text-h2 font-semibold text-content-primary"
          >
            {title}
          </h2>
          <p className="mt-2 pr-4 text-body text-content-secondary">
            {description}
          </p>
          {children}
        </div>

        {/* Bottom section — buttons */}
        <div className="flex justify-end gap-3 rounded-b-xl px-4 py-3 sm:px-6">
          <Button
            variant="outline"
            size="md"
            fullWidth={false}
            onClick={onClose}
            disabled={loading}
            data-role="modal-cancel"
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
            data-role="modal-confirm"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
