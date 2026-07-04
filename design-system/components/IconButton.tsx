"use client";

import React, { forwardRef } from "react";
import Tooltip, { type TooltipPosition } from "./Tooltip";
import { cn } from "@/lib/utils";

export type IconButtonVariant = "default" | "danger" | "boxed" | "boxed-hover";

export const baseClass =
  "inline-flex items-center justify-center shrink-0 p-2 rounded-md cursor-pointer disabled:pointer-events-none disabled:opacity-50";

export const variantClasses: Record<string, string> = {
  default:
    "text-content-primary/50 transition-colors hover:text-content-primary",
  "inside input":
    "text-content-secondary transition-colors hover:text-content-primary/75 hover:bg-surface-tertiary",
  danger: "text-error transition-colors hover:bg-error-bg",
  boxed:
    "bg-surface-tertiary text-content-primary hover:bg-surface-subtle focus-visible:ring-1 focus-visible:ring-border-components aria-pressed:ring-1 aria-pressed:ring-border-strong",
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
  /** Forma: "square" (rounded-md, default) o "circle" (rounded-full). @default "square" */
  shape?: "square" | "circle";
  /** Gira el icono al hover del botón: "cw" (horario) / "ccw" (antihorario). @default none */
  spinOnHover?: "cw" | "ccw";
  loading?: boolean;
  /** Show tooltip on hover. If true, uses aria-label as text. Pass string for custom text. */
  tooltip?: boolean | string;
  /** Tooltip position. Default: auto */
  tooltipPosition?: TooltipPosition;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      variant = "default",
      size = "sm",
      shape = "square",
      spinOnHover,
      loading = false,
      tooltip,
      tooltipPosition = "auto",
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) {
    const content = loading ? (
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current/20 border-t-current" />
    ) : spinOnHover ? (
      <span
        className={cn(
          "inline-flex transition-transform duration-300",
          spinOnHover === "ccw"
            ? "group-hover/icon-btn:-rotate-12"
            : "group-hover/icon-btn:rotate-12",
        )}
      >
        {children}
      </span>
    ) : (
      children
    );

    const button = (
      <button
        ref={ref}
        type="button"
        className={cn(
          baseClass,
          variantClasses[variant],
          sizeClasses[size],
          shape === "circle" && "rounded-full",
          spinOnHover && "group/icon-btn",
          className,
        )}
        disabled={loading || disabled}
        {...props}
      >
        {content}
      </button>
    );

    if (!tooltip) return button;

    const tooltipText =
      typeof tooltip === "string" ? tooltip : (props["aria-label"] ?? "");

    if (!tooltipText) return button;

    return (
      <Tooltip content={tooltipText} position={tooltipPosition}>
        {button}
      </Tooltip>
    );
  },
);

export default IconButton;
