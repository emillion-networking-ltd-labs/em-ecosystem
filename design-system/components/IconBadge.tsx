"use client";

import React from "react";

export type IconBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info";

export const iconBadgeSpecs = {
  variants: {
    default: "bg-surface-subtle text-content-primary",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    error: "bg-error-bg text-error",
    info: "bg-info-bg text-info",
  },
  sizes: {
    sm: "h-8 w-8 rounded-md (32px, icon 16px)",
    md: "h-10 w-10 rounded-md (40px, icon 24px)",
    lg: "h-14 w-14 rounded-md (56px, icon 32px)",
  },
};

const variantClasses: Record<IconBadgeVariant, string> = {
  default: "bg-surface-subtle text-content-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
};

const sizeClasses = {
  sm: "h-8 w-8 rounded-md",
  md: "h-10 w-10 rounded-md",
  lg: "h-14 w-14 rounded-md",
};

interface IconBadgeProps {
  variant?: IconBadgeVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export default function IconBadge({
  variant = "default",
  size = "sm",
  className = "",
  children,
}: IconBadgeProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </div>
  );
}
