"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import React from "react";
import { tv } from "tailwind-variants";
import type { LucideIcon } from "lucide-react";
import Icon, { type IconSize } from "./Icon";

export type IconBadgeVariant =
  "default" | "success" | "warning" | "error" | "info";

const ROOT_BASE = "inline-flex shrink-0 items-center justify-center";

const VARIANT_CLASSES = {
  default: "bg-surface-subtle text-content-primary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
} as const;

const SIZE_CLASSES = {
  sm: "h-8 w-8 rounded-md",
  md: "h-10 w-10 rounded-md",
  lg: "h-14 w-14 rounded-md",
} as const;

// Ejes independientes (variant color + size caja), sin compound. Raw-concat previo → twMerge:false (misma
// convención que Button/Badge/Avatar: no hay text-size que colisione, se conserva el concat fiel).
export const iconBadge = tv(
  {
    base: ROOT_BASE,
    variants: {
      variant: { ...VARIANT_CLASSES },
      size: { ...SIZE_CLASSES },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
  { twMerge: false },
);

// Superficie de docs (single-source): describe la caja de cada tamaño + el icono que el contenedor impone.
// Deriva de los consts reales → no vuelve a driftar respecto a lo que se renderiza.
export const iconBadgeSpecs = {
  variants: VARIANT_CLASSES,
  sizes: {
    sm: `${SIZE_CLASSES.sm} (32px, icon 16px = md)`,
    md: `${SIZE_CLASSES.md} (40px, icon 24px = lg)`,
    lg: `${SIZE_CLASSES.lg} (56px, icon 32px = xl)`,
  },
} as const;

// El contenedor impone el tamaño del icono desde la escala registrada (ICON_SIZES), no a mano. Con la escala
// regular de ECO-184 (…lg24·xl32·2xl40), el badge lg recupera su 32 fiel (xl); md=24 (lg), sm=16 (md).
const iconSize: Record<"sm" | "md" | "lg", IconSize> = {
  sm: "md",
  md: "lg",
  lg: "xl",
};

interface IconBadgeProps {
  variant?: IconBadgeVariant;
  size?: "sm" | "md" | "lg";
  /**
   * Glyph de lucide. El contenedor le impone el tamaño desde la escala (sm→md 16, md→lg 24, lg→xl 32) y el color
   * desde la variante → el consumidor NO pasa size ni color a mano. Para contenido no-glyph usa `children`.
   */
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}

export default function IconBadge({
  variant = "default",
  size = "sm",
  icon: Glyph,
  className = "",
  children,
}: IconBadgeProps) {
  const glyph = Glyph ? <Icon icon={Glyph} size={iconSize[size]} /> : children;
  return <div className={iconBadge({ variant, size, className })}>{glyph}</div>;
}
