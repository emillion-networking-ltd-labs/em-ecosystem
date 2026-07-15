"use client";

import { useState, useRef } from "react";
import {
  Pencil,
  Camera,
  Trash2,
  MonitorDot,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Avatar, { resolveAvatarSrc } from "@/components/ui/Avatar";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ImageCropper from "@/components/ui/ImageCropper";
import type { CropData } from "@/components/ui/ImageCropper";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { PROFILE_TOAST } from "@/lib/toast-messages";
import { apiClient } from "@/lib/api";
import { requestEmailChange } from "@/lib/email-change-api";
import { extractMessageByStatus } from "@/lib/error-utils";
import { HTTP_STATUS } from "@/lib/error-constants";
import {
  validatePassword,
  PASSWORD_MIN_LENGTH,
  isValidEmail as checkEmailValid,
} from "@/lib/validation";
import type { SafeUser } from "@/lib/types";

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

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalAvatarSrc, setOriginalAvatarSrc] = useState<string | null>(
    null,
  );
  const [originalAvatarFile, setOriginalAvatarFile] = useState<File | null>(
    null,
  );
  const [cropperOpen, setCropperOpen] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [removeAvatarOpen, setRemoveAvatarOpen] = useState(false);
  const [removeAvatarLoading, setRemoveAvatarLoading] = useState(false);
  const [emailFieldError, setEmailFieldError] = useState("");

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

  // ─── Avatar handlers ───

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setOriginalAvatarSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCrop = async (blob: Blob, cropData: CropData) => {
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");
      formData.append("cropData", JSON.stringify(cropData));
      // Send original file if we have it (new upload, not re-edit)
      if (originalAvatarFile) {
        formData.append("original", originalAvatarFile);
      }
      await apiClient.upload("/users/me/avatar", formData);
      await refreshSession();
      addToast(PROFILE_TOAST.AVATAR_UPDATED);
      setCropperOpen(false);
      setOriginalAvatarFile(null);
    } catch {
      addToast(PROFILE_TOAST.AVATAR_UPDATE_FAILED("Could not upload avatar."));
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setRemoveAvatarLoading(true);
    try {
      await apiClient.delete("/users/me/avatar");
      await refreshSession();
      addToast(PROFILE_TOAST.AVATAR_REMOVED);
      setRemoveAvatarOpen(false);
    } catch {
      addToast(PROFILE_TOAST.AVATAR_UPDATE_FAILED("Could not remove avatar."));
    } finally {
      setRemoveAvatarLoading(false);
    }
  };

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
    setEmailFieldError("");
    setEmailOpen(true);
  };

  const isValidEmail = checkEmailValid(newEmail);
  const isSameEmail = newEmail.toLowerCase() === user.email.toLowerCase();
  const handleSaveEmail = async () => {
    if (!newEmail.trim()) {
      setEmailFieldError("Email is required");
      return;
    }
    if (!isValidEmail) {
      setEmailFieldError("Enter a valid email address");
      return;
    }
    if (isSameEmail) {
      setEmailFieldError("New email must be different from current email");
      return;
    }
    if (!emailPassword.trim()) {
      setEmailFieldError("Password is required");
      return;
    }
    setEmailFieldError("");
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
    if (hasPassword && !currentPassword.trim()) {
      setPasswordError("Current password is required");
      return;
    }
    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }
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
      <div className="overflow-hidden rounded-xl border border-line-strong bg-surface-primary">
        {/* Banner area — hover shows edit button */}
        <div className="group/banner relative h-24 bg-surface-subtle px-6 pt-4">
          <h2 className="text-h3 font-semibold uppercase tracking-wider text-content-primary">
            Profile Information
          </h2>
          <IconButton
            variant="boxed"
            size="sm"
            tooltip
            tooltipPosition="left"
            icon={Pencil}
            aria-label="Change banner"
            className="absolute right-4 top-4 sm:opacity-0 transition-opacity sm:group-hover/banner:opacity-100"
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className="-mt-10">
            <div className="group/avatar relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-surface-tertiary ring-1 ring-border-strong">
              <Avatar src={user.avatarUrl} name={fullName} size="lg" />
              <div className="absolute right-[-38px] top-0.5 flex flex-col gap-3 opacity-0 -translate-x-2 transition-all duration-200 group-hover/avatar:opacity-100 group-hover/avatar:translate-x-0 [&>*:nth-child(2)]:transition-all [&>*:nth-child(2)]:duration-200 [&>*:nth-child(2)]:delay-75">
                {user.avatarUrl ? (
                  <>
                    <IconButton
                      variant="boxed"
                      size="sm"
                      tooltip
                      icon={Pencil}
                      onClick={() => {
                        const src = user.avatarOriginalUrl
                          ? resolveAvatarSrc(user.avatarOriginalUrl)
                          : resolveAvatarSrc(user.avatarUrl!);
                        setOriginalAvatarSrc(src);
                        setOriginalAvatarFile(null);
                        setCropperOpen(true);
                      }}
                      aria-label="Edit photo"
                    />
                    <IconButton
                      variant="danger"
                      size="sm"
                      tooltip
                      tooltipPosition="bottom"
                      icon={Trash2}
                      onClick={() => setRemoveAvatarOpen(true)}
                      aria-label="Remove photo"
                    />
                  </>
                ) : (
                  <IconButton
                    variant="boxed"
                    size="sm"
                    tooltip
                    icon={Camera}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload photo"
                  />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Identity + Metadata + Actions */}
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1px_1fr_1px_1fr] sm:items-center sm:gap-6">
            {/* Name + email + badge */}
            <div className="group/name flex flex-col">
              <div className="flex items-center gap-2">
                <p className="text-h2 font-semibold text-content-primary">
                  {fullName}
                </p>
                <IconButton
                  variant="boxed"
                  size="sm"
                  tooltip
                  icon={Pencil}
                  onClick={openEdit}
                  aria-label="Edit name"
                  className="sm:opacity-0 transition-opacity sm:group-hover/name:opacity-100"
                />
              </div>
              <p className="mt-1 text-body text-content-secondary">
                {user.email}
              </p>
              <div className="mt-2">
                <Badge variant="info" size="sm">
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Divider 1 */}
            <div className="hidden self-stretch bg-border-strong sm:block" />

            {/* Account metadata */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 sm:mx-auto">
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
            autoComplete="given-name"
          />
          <Input
            label="Last Name"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
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
            onChange={(e) => {
              setNewEmail(e.target.value);
              setEmailFieldError("");
            }}
            placeholder="Enter new email address"
            error={
              emailFieldError &&
              (!newEmail.trim() || !isValidEmail || isSameEmail)
                ? emailFieldError
                : newEmail && !isValidEmail
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
            onChange={(e) => {
              setEmailPassword(e.target.value);
              setEmailFieldError("");
            }}
            placeholder="Enter your password"
            error={
              emailFieldError &&
              isValidEmail &&
              !isSameEmail &&
              !emailPassword.trim()
                ? emailFieldError
                : undefined
            }
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
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder="Enter current password"
              error={
                passwordError === "Current password is required"
                  ? passwordError
                  : undefined
              }
            />
          )}
          <div>
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder="Enter new password"
              error={
                passwordError &&
                passwordError !== "Current password is required" &&
                passwordError !== "Passwords do not match"
                  ? passwordError
                  : undefined
              }
            />
            {newPassword && !passwordError && (
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
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError("");
            }}
            placeholder="Confirm new password"
            error={
              passwordError === "Passwords do not match"
                ? passwordError
                : confirmPassword && newPassword !== confirmPassword
                  ? "Passwords do not match"
                  : undefined
            }
          />
          {confirmPassword && newPassword === confirmPassword && (
            <p className="mt-1 text-caption text-success">Passwords match</p>
          )}
        </div>
      </ConfirmModal>

      {/* Avatar crop modal */}
      <ImageCropper
        open={cropperOpen}
        imageSrc={originalAvatarSrc || ""}
        onCrop={handleCrop}
        onClose={() => setCropperOpen(false)}
        loading={avatarLoading}
        initialCropData={user.avatarCropData ?? undefined}
      />

      {/* Remove avatar confirmation */}
      <ConfirmModal
        open={removeAvatarOpen}
        onClose={() => setRemoveAvatarOpen(false)}
        onConfirm={handleRemoveAvatar}
        title="Remove Avatar"
        description="Your profile photo will be permanently deleted. This action cannot be undone."
        confirmLabel="Remove"
        variant="danger"
        loading={removeAvatarLoading}
      />
    </>
  );
}
