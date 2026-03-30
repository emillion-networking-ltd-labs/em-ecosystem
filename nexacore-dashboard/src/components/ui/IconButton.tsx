"use client";

import React from "react";

export type IconButtonVariant = "default" | "danger" | "boxed" | "boxed-hover";

export const baseClass =
  "inline-flex items-center justify-center shrink-0 p-2 rounded-md cursor-pointer";

export const variantClasses: Record<string, string> = {
  default:
    "text-content-primary/50 transition-colors hover:text-content-primary",
  "inside input":
    "text-content-secondary transition-colors hover:text-content-primary/75 hover:bg-surface-tertiary",
  danger: "text-error transition-colors hover:bg-error-bg",
  boxed: "bg-surface-tertiary text-content-primary hover:bg-surface-subtle",
  "boxed-hover":
    "text-content-primary/50 transition-colors hover:bg-surface-tertiary hover:text-content-primary",
};

export const sizeClasses = {
  sm: "p-2 rounded-md",
  md: "p-3 rounded-md",
};

export const usage = {
  "theme toggle": "AuthLayout — Moon/SunDim 16px (default)",
  "copy secret": "MfaSetupStep — Copy/Check 16px (default)",
  "password eye": "Input — Eye/EyeOff 16px (inside input)",
  "calendar nav": "Calendar — ChevronLeft/Right 16px (boxed)",
  "calendar day": "Calendar — day number text (circle)",
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
}

export default function IconButton({
  variant = "default",
  size = "sm",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
      ) : (
        children
      )}
    </button>
  );
}
