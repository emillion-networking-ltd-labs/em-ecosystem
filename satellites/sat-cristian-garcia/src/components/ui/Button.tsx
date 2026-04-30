"use client";

import React from "react";
import InfinitySpinner from "./InfinitySpinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "link"
  | "link-underline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  as?: React.ElementType;
  href?: string;
}

export const variantClasses = {
  primary:
    "bg-surface-inverse text-content-inverse border border-border-components transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
  secondary:
    "bg-surface-tertiary text-content-secondary border border-border-components transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50",
  outline:
    "bg-transparent text-content-primary border border-border-components transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50",
  danger:
    "bg-transparent text-error border border-error-border transition-colors hover:bg-error-bg disabled:pointer-events-none disabled:opacity-50",
  link: "bg-transparent text-content-primary/75 border-0 transition-colors hover:text-content-primary disabled:pointer-events-none disabled:opacity-50",
  "link-underline":
    "bg-transparent text-content-primary/75 border-0 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted disabled:pointer-events-none disabled:opacity-50",
};

export const baseClass =
  "relative items-center justify-center gap-2 whitespace-nowrap";

export const sizeClasses = {
  sm: "px-4 py-1.5 text-caption font-normal rounded-md h-8",
  md: "px-6 py-2.5 text-body font-normal rounded-md h-10",
  lg: "px-8 py-3 text-h3 font-normal rounded-md h-12",
};

export const linkSizeClasses = {
  sm: "text-caption font-normal",
  md: "text-body font-normal",
  lg: "text-h3 font-normal",
};

export default function Button({
  as,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  children,
  className = "",
  disabled,
  href,
  ...props
}: ButtonProps) {
  // If `as` is not specified, default to "a" when href is provided so the
  // button actually navigates. Otherwise default to "button" for click handlers.
  // (`<button href="...">` is invalid HTML — browsers ignore the href.)
  const Component = as ?? (href ? "a" : "button");
  const isLink = variant === "link" || variant === "link-underline";
  const sizes = isLink ? linkSizeClasses[size] : sizeClasses[size];
  const display = isLink ? "inline-flex" : fullWidth ? "flex" : "inline-flex";

  const componentProps: Record<string, unknown> = {
    className: `${display} ${baseClass} ${variantClasses[variant]} ${sizes} ${!isLink && fullWidth ? "w-full" : ""} ${className}`,
    ...props,
  };

  if (href) componentProps.href = href;
  if (Component === "button") componentProps.disabled = loading || disabled;

  return React.createElement(
    Component,
    componentProps,
    <span
      className={`inline-flex items-center gap-2 ${loading ? "opacity-30" : ""}`}
    >
      {children}
    </span>,
    loading && (
      <span
        key="spinner"
        className="absolute inset-0 flex items-center justify-center"
      >
        <InfinitySpinner size={size === "sm" ? "sm" : "md"} />
      </span>
    ),
  );
}
