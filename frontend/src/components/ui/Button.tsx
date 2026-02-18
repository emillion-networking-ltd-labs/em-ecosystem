"use client";

import { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  loading?: boolean;
}

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-light active:bg-accent-dark disabled:opacity-50",
  secondary:
    "bg-surface-secondary text-content-primary hover:bg-border-subtle active:bg-border",
  outline:
    "bg-transparent text-content-primary border border-border hover:bg-surface-secondary active:bg-border-subtle",
};

export function Button({
  variant = "primary",
  loading = false,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`w-full rounded-card px-6 py-2.5 text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
