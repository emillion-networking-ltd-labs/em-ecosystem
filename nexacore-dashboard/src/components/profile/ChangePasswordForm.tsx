"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
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
        addToast({
          variant: "success",
          title: "Password changed",
          description: "Please log in again with your new password.",
        });
        await logout();
        router.push("/login");
        return;
      }
      addToast({
        variant: "success",
        title: "Password set",
        description: "Your password has been updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refreshSession();
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      const msg = apiErr?.error?.message || "Could not change password.";
      addToast({
        variant: "error",
        title: "Password change failed",
        description: msg.endsWith(".") ? msg : `${msg}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
      <h2 className="mb-6 text-body-sm font-semibold uppercase tracking-wider text-content-primary">
        {hasPassword ? "Change Password" : "Set Password"}
      </h2>

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
              className={`mt-1 text-xs ${newPassword.length >= PASSWORD_MIN_LENGTH ? "text-success" : "text-error"}`}
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
