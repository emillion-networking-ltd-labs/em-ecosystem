"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { PROFILE_TOAST } from "@/lib/toast-messages";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AlertBox from "@/components/ui/AlertBox";
import { validatePassword, PASSWORD_MIN_LENGTH } from "@/lib/validation";

export default function ChangePasswordForm() {
  const { user, refreshSession, logout } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const hasPassword = user?.hasPassword ?? true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    const pwError = validatePassword(newPassword);
    if (pwError) {
      setLocalError(pwError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { newPassword };
      if (hasPassword) body.currentPassword = currentPassword;
      await apiClient.patch("/users/me/password", body);
      if (hasPassword) {
        addToast(PROFILE_TOAST.PASSWORD_CHANGED);
        await logout();
        router.push("/login");
        return;
      }
      addToast(PROFILE_TOAST.PASSWORD_SET);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refreshSession();
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      const msg = apiErr?.error?.message || "Could not change password.";
      addToast(
        PROFILE_TOAST.PASSWORD_CHANGE_FAILED(
          msg.endsWith(".") ? msg : `${msg}.`,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border-strong bg-surface-primary p-6">
      <h2 className="mb-6 text-h3 font-semibold uppercase tracking-wider text-content-primary">
        {hasPassword ? "Change Password" : "Set Password"}
      </h2>

      {!hasPassword && (
        <AlertBox variant="warning" className="mb-4">
          Set a password for an alternative login method.
        </AlertBox>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {hasPassword && (
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
        )}

        <div>
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          {newPassword && (
            <p
              className={`mt-1 text-caption ${newPassword.length >= PASSWORD_MIN_LENGTH ? "text-success" : "text-error"}`}
            >
              {newPassword.length >= PASSWORD_MIN_LENGTH
                ? "Minimum length met"
                : `Minimum ${PASSWORD_MIN_LENGTH} characters required`}
            </p>
          )}
        </div>

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          error={
            confirmPassword && newPassword !== confirmPassword
              ? "Passwords do not match"
              : undefined
          }
        />

        {localError && (
          <p
            className="text-caption text-error"
            role="alert"
            aria-live="polite"
          >
            {localError}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="md" fullWidth={false} loading={loading}>
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
