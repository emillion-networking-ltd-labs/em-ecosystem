/**
 * Centralized toast messages — single source of truth.
 * All addToast() calls should reference these constants.
 * Change here → auto-propagates to all usage sites.
 */

type ToastMsg = {
  variant: "error" | "success" | "warning" | "info";
  title: string;
  description?: string;
};

// ─── Auth ─────────────────────────────────────────
export const AUTH_TOAST = {
  LOGIN_FAILED: (msg: string): ToastMsg => ({
    variant: "error",
    title: "Sign in failed",
    description: msg,
  }),
  TOO_MANY_ATTEMPTS: (desc: string): ToastMsg => ({
    variant: "warning",
    title: "Too many attempts",
    description: desc,
  }),
  RECOVERY_SENT: {
    variant: "success",
    title: "Recovery email sent",
    description: "Check your inbox for the password reset link.",
  } as ToastMsg,
  ACCOUNT_CREATED: {
    variant: "success",
    title: "Account created",
    description: "Check your inbox to verify your email.",
  } as ToastMsg,
  MISSING_RESET_TOKEN: {
    variant: "warning",
    title: "Missing reset token",
    description: "Please request a new password reset link.",
  } as ToastMsg,
  EXPIRED_LINK: {
    variant: "warning",
    title: "Expired or invalid link",
    description: "Your reset link has expired. Request a new one.",
  } as ToastMsg,
  PASSWORD_UPDATED: {
    variant: "success",
    title: "Password updated",
    description: "Your password has been reset. Sign in now.",
  } as ToastMsg,
};

// ─── Profile ──────────────────────────────────────
export const PROFILE_TOAST = {
  SESSION_REVOKE_FAILED: {
    variant: "error",
    title: "Revoke failed",
    description: "Could not revoke the session.",
  } as ToastMsg,
  SESSIONS_REVOKE_FAILED: {
    variant: "error",
    title: "Revoke failed",
    description: "Could not revoke other sessions.",
  } as ToastMsg,
  VERIFICATION_EMAIL_SENT: (email: string): ToastMsg => ({
    variant: "success",
    title: "Verification email sent",
    description: `Check ${email} to confirm the change.`,
  }),
  EMAIL_CHANGE_FAILED: (msg: string): ToastMsg => ({
    variant: "error",
    title: "Email change failed",
    description: msg,
  }),
  PASSWORD_CHANGED: {
    variant: "success",
    title: "Password changed",
    description: "Please log in again with your new password.",
  } as ToastMsg,
  PASSWORD_SET: {
    variant: "success",
    title: "Password set",
    description: "Your password has been updated.",
  } as ToastMsg,
  PASSWORD_CHANGE_FAILED: (msg: string): ToastMsg => ({
    variant: "error",
    title: "Password change failed",
    description: msg,
  }),
  PROFILE_UPDATED: {
    variant: "success",
    title: "Profile updated",
    description: "Your changes have been saved.",
  } as ToastMsg,
  PROFILE_UPDATE_FAILED: (msg: string): ToastMsg => ({
    variant: "error",
    title: "Update failed",
    description: msg,
  }),
  AVATAR_UPDATED: {
    variant: "success",
    title: "Avatar updated",
    description: "Your profile photo has been saved.",
  } as ToastMsg,
  AVATAR_REMOVED: {
    variant: "success",
    title: "Avatar removed",
    description: "Your profile photo has been removed.",
  } as ToastMsg,
  AVATAR_UPDATE_FAILED: (msg: string): ToastMsg => ({
    variant: "error",
    title: "Avatar update failed",
    description: msg,
  }),
  ACCOUNT_DELETED: {
    variant: "success",
    title: "Account deleted",
    description: "Your account has been permanently removed.",
  } as ToastMsg,
  DEVICE_TRUSTED: {
    variant: "success",
    title: "Device trusted",
    description: "This device has been added to your trusted list.",
  } as ToastMsg,
  DEVICE_ALREADY_TRUSTED: {
    variant: "info",
    title: "Already trusted",
    description: "This device is already in your trusted list.",
  } as ToastMsg,
  DEVICE_TRUST_FAILED: {
    variant: "error",
    title: "Trust failed",
    description: "Could not trust this device.",
  } as ToastMsg,
  TOO_MANY_REQUESTS: {
    variant: "error",
    title: "Too many requests",
    description: "Please wait a moment before trying again.",
  } as ToastMsg,
  DEVICE_REVOKED: {
    variant: "success",
    title: "Device revoked",
    description: "The device has been removed from your trusted list.",
  } as ToastMsg,
  DEVICE_REVOKE_FAILED: {
    variant: "error",
    title: "Revoke failed",
    description: "Could not revoke the trusted device.",
  } as ToastMsg,
  PASSKEY_REGISTERED: {
    variant: "success",
    title: "Passkey registered",
    description: "You can now sign in with this passkey.",
  } as ToastMsg,
  PASSKEY_DELETED: {
    variant: "success",
    title: "Passkey deleted",
    description: "The passkey has been removed.",
  } as ToastMsg,
  PASSKEY_RENAMED: {
    variant: "success",
    title: "Passkey renamed",
    description: "The passkey name has been updated.",
  } as ToastMsg,
  PASSKEY_FAILED: (msg: string): ToastMsg => ({
    variant: "error",
    title: "Passkey error",
    description: msg,
  }),
  OAUTH_CONNECTED: (provider: string): ToastMsg => ({
    variant: "success",
    title: `${provider} connected`,
    description: `Your ${provider} account has been linked.`,
  }),
  OAUTH_DISCONNECTED: (provider: string): ToastMsg => ({
    variant: "success",
    title: `${provider} disconnected`,
    description: `Your ${provider} account has been unlinked.`,
  }),
  OAUTH_FAILED: (msg: string): ToastMsg => ({
    variant: "error",
    title: "Connection failed",
    description: msg,
  }),
  MFA_ENABLED: {
    variant: "success",
    title: "MFA enabled",
    description: "Two-factor authentication is now active.",
  } as ToastMsg,
  MFA_DISABLED: {
    variant: "success",
    title: "MFA disabled",
    description: "Two-factor authentication has been removed.",
  } as ToastMsg,
  MFA_FAILED: (msg: string): ToastMsg => ({
    variant: "error",
    title: "MFA error",
    description: msg,
  }),
};

// ─── Admin ────────────────────────────────────────
export const ADMIN_TOAST = {
  LOAD_USERS_FAILED: {
    variant: "error",
    title: "Load users failed",
    description: "Could not retrieve the user list.",
  } as ToastMsg,
  ROLE_CHANGED: (email: string, role: string): ToastMsg => ({
    variant: "success",
    title: "Role updated",
    description: `${email} is now ${role}.`,
  }),
  LOCK_TOGGLED: (email: string, locked: boolean): ToastMsg => ({
    variant: "success",
    title: locked ? "Account locked" : "Account unlocked",
    description: `${email} has been ${locked ? "locked" : "unlocked"}.`,
  }),
};
