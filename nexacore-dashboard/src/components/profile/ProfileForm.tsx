"use client";

import { useState } from "react";
import {
  Pencil,
  MonitorDot,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { PROFILE_TOAST } from "@/lib/toast-messages";
import { apiClient } from "@/lib/api";
import { requestEmailChange } from "@/lib/email-change-api";
import { extractMessageByStatus } from "@/lib/error-utils";
import { HTTP_STATUS } from "@/lib/error-constants";
import { validatePassword, PASSWORD_MIN_LENGTH } from "@/lib/validation";
import type { SafeUser } from "@/lib/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfileForm() {
  const { user, refreshSession, logout } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  // Edit name
  const [editOpen, setEditOpen] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [nameLoading, setNameLoading] = useState(false);

  // Change email
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Change password
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  if (!user) return null;

  const fullName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email.split("@")[0];

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isLocked = !user.isActive;
  const statusLabel = isLocked
    ? "Locked"
    : user.isActive
      ? "Active"
      : "Inactive";
  const hasPassword = user.hasPassword ?? true;
  const isOAuthOnly = user.oauthProviders.length > 0 && !hasPassword;

  // ─── Name handlers ───

  const openEdit = () => {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setEditOpen(true);
  };

  const handleSaveName = async () => {
    setNameLoading(true);
    try {
      await apiClient.patch<SafeUser>("/users/me", { firstName, lastName });
      await refreshSession();
      addToast(PROFILE_TOAST.PROFILE_UPDATED);
      setEditOpen(false);
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      const msg = apiErr?.error?.message || "Could not update profile.";
      addToast(
        PROFILE_TOAST.PROFILE_UPDATE_FAILED(
          msg.endsWith(".") ? msg : `${msg}.`,
        ),
      );
    } finally {
      setNameLoading(false);
    }
  };

  // ─── Email handlers ───

  const openEmailModal = () => {
    setNewEmail("");
    setEmailPassword("");
    setEmailOpen(true);
  };

  const isValidEmail = EMAIL_REGEX.test(newEmail);
  const isSameEmail = newEmail.toLowerCase() === user.email.toLowerCase();
  const handleSaveEmail = async () => {
    setEmailLoading(true);
    try {
      await requestEmailChange(newEmail, emailPassword);
      addToast(PROFILE_TOAST.VERIFICATION_EMAIL_SENT(newEmail));
      setEmailOpen(false);
    } catch (err: unknown) {
      const msg = extractMessageByStatus(
        err,
        {
          [HTTP_STATUS.TOO_MANY_REQUESTS]:
            "Too many requests. Try again later.",
        },
        "Failed to request email change.",
      );
      addToast(PROFILE_TOAST.EMAIL_CHANGE_FAILED(msg));
    } finally {
      setEmailLoading(false);
    }
  };

  // ─── Password handlers ───

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordOpen(true);
  };

  const handleSavePassword = async () => {
    setPasswordError("");
    const pwError = validatePassword(newPassword);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordLoading(true);
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
      setPasswordOpen(false);
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
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border-strong bg-surface-primary">
        {/* Banner area — hover shows edit button */}
        <div className="group/banner relative h-24 bg-surface-subtle px-6 pt-4">
          <h2 className="text-h3 font-semibold uppercase tracking-wider text-content-primary">
            Profile Information
          </h2>
          <IconButton
            variant="boxed"
            size="sm"
            aria-label="Change banner"
            className="absolute right-4 top-4 sm:opacity-0 transition-opacity sm:group-hover/banner:opacity-100"
          >
            <Pencil size={16} />
          </IconButton>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className="-mt-10">
            <button
              type="button"
              aria-label="Change avatar"
              className="rounded-full bg-surface-tertiary p-2 ring-1 ring-border-strong cursor-pointer transition-opacity hover:opacity-80"
            >
              <Avatar src={user.avatarUrl} name={fullName} size="lg" />
            </button>
          </div>

          {/* Identity + Metadata + Actions */}
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[auto_1px_auto_1px_1fr] sm:items-center sm:gap-6">
            {/* Name + email + badge */}
            <div className="group/name flex flex-col">
              <div className="flex items-center gap-2">
                <p className="text-h2 font-semibold text-content-primary">
                  {fullName}
                </p>
                <IconButton
                  variant="boxed"
                  size="sm"
                  onClick={openEdit}
                  aria-label="Edit name"
                  className="sm:opacity-0 transition-opacity sm:group-hover/name:opacity-100"
                >
                  <Pencil size={16} />
                </IconButton>
              </div>
              <p className="mt-1 text-body text-content-secondary">
                {user.email}
              </p>
              <div className="mt-2">
                <Badge variant="info" size="md">
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Divider 1 */}
            <div className="hidden self-stretch bg-border-strong sm:block" />

            {/* Account metadata */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-body text-content-tertiary">Member since</dt>
              <dd className="text-body text-content-primary">{memberSince}</dd>

              <dt className="text-body text-content-tertiary">Status</dt>
              <dd className="flex items-center gap-1.5 text-body text-content-primary">
                <MonitorDot
                  size={16}
                  className={
                    isLocked
                      ? "text-error"
                      : user.isActive
                        ? "text-success"
                        : "text-content-disabled"
                  }
                />
                {statusLabel}
              </dd>

              <dt className="text-body text-content-tertiary">Email</dt>
              <dd className="flex items-center gap-1.5 text-body">
                {user.emailVerified ? (
                  <>
                    <ShieldCheck size={16} className="text-success" />
                    <span className="text-success">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className="text-warning" />
                    <span className="text-warning">Not verified</span>
                  </>
                )}
              </dd>
            </dl>

            {/* Divider 2 */}
            <div className="hidden self-stretch bg-border-strong sm:block" />

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {!isOAuthOnly && (
                <Button variant="outline" size="md" onClick={openEmailModal}>
                  <Mail size={16} />
                  Change Email
                </Button>
              )}
              <Button variant="outline" size="md" onClick={openPasswordModal}>
                <Lock size={16} />
                {hasPassword ? "Change Password" : "Set Password"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit name modal */}
      <ConfirmModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onConfirm={handleSaveName}
        title="Edit Profile"
        description="Update your name."
        confirmLabel="Save"
        cancelLabel="Cancel"
        size="md"
        loading={nameLoading}
      >
        <div className="mt-4 space-y-4">
          <Input
            label="First Name"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
          <Input
            label="Last Name"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>
      </ConfirmModal>

      {/* Change email modal */}
      <ConfirmModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        onConfirm={handleSaveEmail}
        title="Change Email"
        description="A verification link will be sent to your new email address."
        confirmLabel="Change Email"
        cancelLabel="Cancel"
        size="md"
        loading={emailLoading}
      >
        <div className="mt-4 space-y-4">
          <Input
            label="New Email"
            name="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email address"
            error={
              newEmail && !isValidEmail
                ? "Enter a valid email address"
                : newEmail && isSameEmail
                  ? "New email must be different from current email"
                  : undefined
            }
          />
          <Input
            label="Current Password"
            name="emailChangePassword"
            type="password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
      </ConfirmModal>

      {/* Change password modal */}
      <ConfirmModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onConfirm={handleSavePassword}
        title={hasPassword ? "Change Password" : "Set Password"}
        description={
          hasPassword
            ? "Enter your current password and choose a new one."
            : "Set a password for an alternative login method."
        }
        confirmLabel="Update"
        cancelLabel="Cancel"
        size="md"
        loading={passwordLoading}
      >
        <div className="mt-4 space-y-4">
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
          {passwordError && (
            <p className="text-caption text-error" role="alert">
              {passwordError}
            </p>
          )}
        </div>
      </ConfirmModal>
    </>
  );
}
