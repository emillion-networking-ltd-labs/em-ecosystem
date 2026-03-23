"use client";

import InfinitySpinner from "./InfinitySpinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export const variantClasses = {
  primary:
    "bg-surface-inverse text-content-inverse border border-border-strong transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
  secondary:
    "bg-surface-tertiary text-content-secondary border border-border-strong transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50",
  outline:
    "bg-transparent text-content-primary border border-border-strong transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50",
  danger:
    "bg-transparent text-error border border-error-border transition-colors hover:bg-error-bg disabled:pointer-events-none disabled:opacity-50",
};

export const baseClass = "inline-flex items-center justify-center gap-2";

export const sizeClasses = {
  sm: "px-4 py-1.5 text-caption font-normal rounded-md h-8",
  md: "px-6 py-2.5 text-body-sm font-normal rounded-md h-10",
  lg: "px-8 py-3 text-body-lg font-normal rounded-md h-12",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <InfinitySpinner size={size === "sm" ? "sm" : "md"} />
      ) : (
        children
      )}
    </button>
  );
}
