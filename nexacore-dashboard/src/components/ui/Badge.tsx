"use client";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export const baseClass = "inline-flex items-center font-normal rounded-md";

export const variantClasses = {
  default: "bg-surface-subtle text-content-secondary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
};

export const sizeClasses = {
  sm: "text-caption px-2 py-0.5",
  md: "text-body px-2.5 py-1",
  lg: "text-subtitle px-3 py-1.5",
};

export default function Badge({
  variant = "default",
  size = "md",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-normal rounded-md ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
