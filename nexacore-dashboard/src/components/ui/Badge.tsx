"use client";

// @ds-role: primitive — leaf (a single <span>), composes no siblings.
// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { tv, type VariantProps } from "tailwind-variants";

interface BadgeProps {
  variant?:
    "default" | "success" | "warning" | "error" | "info" | "kbd" | "overlay";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

// Per-axis class constants: the SINGLE source of the `tv` contract and of `badgeSpecs` (catalog doc). ECO-168.
const VARIANT_CLASSES = {
  default: "bg-surface-subtle text-content-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
  kbd: "bg-surface-tertiary text-content-primary font-mono",
  overlay:
    "bg-surface-inverse text-content-inverse border border-line-strong backdrop-blur-xs",
} as const;
const SIZE_CLASSES = {
  sm: "text-caption px-2 py-0.5",
  md: "text-body px-2.5 py-1",
  lg: "text-h3 px-3 py-1.5",
} as const;
const ROOT_BASE = "inline-flex items-center font-normal rounded-md";

// DS variant contract (design-system-quality / ADR-029): tailwind-variants. Badge is a single element
// (span) → no slots. twMerge OFF: the DS resolves overrides with `!important`, not with merge — which
// would collapse the custom `text-*` tokens (it drops the `text-success`/`text-error` color when it sits
// next to `text-body`/`text-caption` sizing). Without merge it concatenates, faithful to the previous maps.
export const badge = tv(
  {
    base: ROOT_BASE,
    variants: {
      variant: {
        default: VARIANT_CLASSES.default,
        success: VARIANT_CLASSES.success,
        warning: VARIANT_CLASSES.warning,
        error: VARIANT_CLASSES.error,
        info: VARIANT_CLASSES.info,
        kbd: VARIANT_CLASSES.kbd,
        overlay: VARIANT_CLASSES.overlay,
      },
      size: {
        sm: SIZE_CLASSES.sm,
        md: SIZE_CLASSES.md,
        lg: SIZE_CLASSES.lg,
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
  { twMerge: false },
);

export type BadgeVariants = VariantProps<typeof badge>;

// Catalog documentation surface (the `<name>Specs` convention), single-source from the same consts.
export const badgeSpecs = {
  base: ROOT_BASE,
  variants: VARIANT_CLASSES,
  sizes: SIZE_CLASSES,
} as const;

export default function Badge({
  variant = "default",
  size = "md",
  children,
  className,
}: BadgeProps) {
  return (
    <span className={badge({ variant, size, className })}>{children}</span>
  );
}
