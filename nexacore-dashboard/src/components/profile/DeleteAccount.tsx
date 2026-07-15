"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { PROFILE_TOAST } from "@/lib/toast-messages";
import { deleteAccount } from "@/lib/delete-account-api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { extractMessageByStatus } from "@/lib/error-utils";
import { HTTP_STATUS } from "@/lib/error-constants";

export default function DeleteAccount() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const requiresPassword = user?.hasPassword ?? false;
  const isConfirmValid = confirmText === "DELETE";
  const isPasswordValid = !requiresPassword || password.length >= 8;

  const handleClose = () => {
    if (loading) return;
    setShowModal(false);
    setConfirmText("");
    setPassword("");
    setFieldError("");
  };

  const handleDelete = async () => {
    if (!isConfirmValid) {
      setFieldError("Type DELETE to confirm");
      return;
    }
    if (!isPasswordValid) {
      setFieldError("Password is required");
      return;
    }
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
      addToast(PROFILE_TOAST.PROFILE_UPDATE_FAILED(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isSuperadmin = user.role === "SUPERADMIN";

  return (
    <>
      {/* Danger zone card */}
      <div className="rounded-xl border border-line-strong bg-surface-primary p-6">
        <h2 className="mb-4 text-h3 font-semibold uppercase tracking-wider text-error">
          Danger Zone
        </h2>
        <div className="card-flat flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body text-content-secondary">
            {isSuperadmin
              ? "The root account cannot be deleted. Transfer ownership before this action can be performed."
              : "Permanently delete your account and all associated data. This action cannot be undone."}
          </p>
          <Button
            variant="danger"
            size="md"
            fullWidth={false}
            disabled={isSuperadmin}
            className="shrink-0 sm:w-auto"
            onClick={() => setShowModal(true)}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Confirmation modal */}
      <ConfirmModal
        open={showModal}
        onClose={handleClose}
        onConfirm={handleDelete}
        title="Delete Account"
        description="This action is permanent and cannot be undone. All your data will be anonymized and your sessions will be revoked."
        confirmLabel="Delete My Account"
        variant="danger"
        size="md"
        loading={loading}
      >
        <div className="mt-4">
          <p className="mb-2 text-body text-content-secondary">
            Type{" "}
            <span className="font-semibold text-content-primary">DELETE</span>{" "}
            to confirm
          </p>
          <Input
            name="confirmDelete"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setFieldError("");
            }}
            placeholder="Type DELETE"
            error={fieldError && !isConfirmValid ? fieldError : undefined}
          />
        </div>

        {requiresPassword && (
          <div className="mt-4">
            <Input
              label="Password"
              name="deletePassword"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldError("");
              }}
              placeholder="Enter your password"
              error={
                fieldError && isConfirmValid && !isPasswordValid
                  ? fieldError
                  : undefined
              }
            />
          </div>
        )}
      </ConfirmModal>
    </>
  );
}
