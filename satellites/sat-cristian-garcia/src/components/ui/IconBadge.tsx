"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import Icon, { type IconSize } from "./Icon";

export type IconBadgeVariant =
  "default" | "success" | "warning" | "error" | "info";

export const iconBadgeSpecs = {
  variants: {
    default: "bg-surface-subtle text-content-primary",
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    error: "bg-error-bg text-error",
    info: "bg-info-bg text-info",
  },
  sizes: {
    sm: "h-8 w-8 rounded-md (32px, icon 16px = md)",
    md: "h-10 w-10 rounded-md (40px, icon 24px = lg)",
    lg: "h-14 w-14 rounded-md (56px, icon 32px = xl)",
  },
};

// El contenedor impone el tamaño del icono desde la escala registrada (ICON_SIZES), no a mano. Con la escala
// regular de ECO-184 (…lg24·xl32·2xl40), el badge lg recupera su 32 fiel (xl); md=24 (lg), sm=16 (md).
const iconSize: Record<"sm" | "md" | "lg", IconSize> = {
  sm: "md",
  md: "lg",
  lg: "xl",
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
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {glyph}
    </div>
  );
}
