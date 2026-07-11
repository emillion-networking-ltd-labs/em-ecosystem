"use client";

import React, { forwardRef } from "react";
import { tv } from "tailwind-variants";
import Tooltip, { type TooltipPosition } from "./Tooltip";
import { cn } from "@/lib/utils";

export type IconButtonVariant = "default" | "danger" | "boxed" | "boxed-hover";

const ROOT_BASE =
  "inline-flex items-center justify-center shrink-0 p-2 rounded-md cursor-pointer disabled:pointer-events-none disabled:opacity-50";

const VARIANT_CLASSES = {
  default:
    "text-content-primary/50 transition-colors hover:text-content-primary",
  "inside input":
    "text-content-secondary transition-colors hover:text-content-primary/75 hover:bg-surface-tertiary",
  danger: "text-error transition-colors hover:bg-error-bg",
  boxed:
    "bg-surface-tertiary text-content-primary hover:bg-surface-subtle focus-visible:ring-1 focus-visible:ring-border-components aria-pressed:ring-1 aria-pressed:ring-border-strong",
  "boxed-hover":
    "text-content-primary/50 transition-colors hover:bg-surface-tertiary hover:text-content-primary",
} as const;

const SIZE_CLASSES = { sm: "p-2 rounded-md", md: "p-3 rounded-md" } as const;
const SHAPE_CLASSES = { square: "", circle: "rounded-full" } as const;

// A diferencia de Button/Badge (raw concat → twMerge:false), IconButton usaba cn()/twMerge: su tv va con
// twMerge ON (default) para IGUALAR ese comportamiento — shape=circle exige que rounded-full pise a rounded-md
// (lo resuelve twMerge) y NO hay text-size, así que el drop de color que motiva twMerge:false aquí no aplica.
export const iconButton = tv({
  base: ROOT_BASE,
  variants: {
    variant: {
      default: VARIANT_CLASSES.default,
      "inside input": VARIANT_CLASSES["inside input"],
      danger: VARIANT_CLASSES.danger,
      boxed: VARIANT_CLASSES.boxed,
      "boxed-hover": VARIANT_CLASSES["boxed-hover"],
    },
    size: { sm: SIZE_CLASSES.sm, md: SIZE_CLASSES.md },
    shape: { square: SHAPE_CLASSES.square, circle: SHAPE_CLASSES.circle },
  },
  defaultVariants: { variant: "default", size: "sm", shape: "square" },
});

// Superficie de docs (single-source): reemplaza los mapas exportados. Los consumidores leen esto.
export const iconButtonSpecs = {
  base: ROOT_BASE,
  variants: VARIANT_CLASSES,
  sizes: SIZE_CLASSES,
  shapes: SHAPE_CLASSES,
} as const;

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
        className={iconButton({
          variant,
          size,
          shape,
          className: cn(spinOnHover && "group/icon-btn", className),
        })}
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
