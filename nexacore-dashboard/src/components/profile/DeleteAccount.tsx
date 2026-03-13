"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { deleteAccount } from "@/lib/delete-account-api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { extractMessageByStatus } from "@/lib/error-utils";
import { HTTP_STATUS } from "@/lib/error-constants";

export default function DeleteAccount() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const requiresPassword = user?.hasPassword ?? false;
  const isConfirmValid = confirmText === "DELETE";
  const isPasswordValid = !requiresPassword || password.length >= 8;
  const canConfirm = isConfirmValid && isPasswordValid && !loading;

  const handleClose = useCallback(() => {
    if (loading) return;
    setShowModal(false);
    setConfirmText("");
    setPassword("");
  }, [loading]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAccount(requiresPassword ? password : undefined);
      await logout();
      router.push("/login");
    } catch (err: unknown) {
      const msg = extractMessageByStatus(
        err,
        {
          [HTTP_STATUS.TOO_MANY_REQUESTS]:
            "Too many requests. Try again later.",
          [HTTP_STATUS.FORBIDDEN]: "SUPERADMIN accounts cannot be deleted.",
          [HTTP_STATUS.UNAUTHORIZED]: "Incorrect password.",
        },
        "Failed to delete account.",
      );
      addToast({ variant: "error", title: "Delete failed", description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Save previous focus and focus first element on open
  useEffect(() => {
    if (!showModal) return;
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
  }, [showModal]);

  // Keyboard handler: Escape + focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
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
    [handleClose],
  );

  useEffect(() => {
    if (!showModal) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal, handleKeyDown]);

  if (!user) return null;

  return (
    <>
      {/* Danger zone card */}
      <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
        <h2 className="mb-4 text-body-sm font-semibold uppercase tracking-wider text-error">
          Danger Zone
        </h2>
        <p className="mb-6 text-body-sm text-content-secondary">
          Permanently delete your account and all associated data. This action
          cannot be undone.
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
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-modal-title"
            className="w-[427px] overflow-hidden rounded-3xl border border-border-default bg-surface-secondary shadow-card"
          >
            {/* Top section */}
            <div className="border-b border-border-default bg-surface-primary p-6">
              <h2
                id="delete-account-modal-title"
                className="text-heading-md text-content-primary"
              >
                Delete Account
              </h2>
              <p className="mt-2 text-body-sm text-content-secondary">
                This action is permanent and cannot be undone. All your data
                will be anonymized and your sessions will be revoked.
              </p>

              <div className="mt-4">
                <p className="mb-2 text-body-sm text-content-secondary">
                  Type{" "}
                  <span className="font-semibold text-content-primary">
                    DELETE
                  </span>{" "}
                  to confirm
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
                {loading ? "Deleting..." : "Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
