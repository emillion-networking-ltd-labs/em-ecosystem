"use client";

import { AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { tv } from "tailwind-variants";
import Icon from "./Icon";

// Multi-slot (container / icon / title / description). El eje `variant` (antes ternario inline) sólo tiñe el
// color del icono; el resto de slots es fijo. Raw-concat previo → twMerge:false (conserva el conjunto fiel).
export const emptyState = tv(
  {
    slots: {
      container: "flex flex-col items-center gap-3 py-12",
      icon: "",
      title: "text-body font-semibold text-content-primary",
      description: "text-caption text-content-secondary text-center",
    },
    variants: {
      variant: {
        default: { icon: "text-content-primary/30" },
        error: { icon: "text-error" },
      },
    },
    defaultVariants: { variant: "default" },
  },
  { twMerge: false },
);

// Superficie de docs (single-source): slots + ejes; las clases viven en el tv. El icono por defecto (glyph)
// depende de la variante: Inbox (default) / AlertTriangle (error) — es elección de componente, no clase.
export const emptyStateSpecs = {
  container: "flex flex-col items-center gap-3 py-12",
  "icon (variant=default)":
    "2xl (40px) text-content-primary/30 (default: Inbox)",
  "icon (variant=error)": "2xl (40px) text-error (default: AlertTriangle)",
  title: "text-body font-semibold text-content-primary",
  description: "text-caption text-content-secondary text-center",
  action: "Optional ReactNode (Button, Link, etc.)",
} as const;

interface EmptyStateProps {
  variant?: "default" | "error";
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const isError = variant === "error";
  const defaultIcon = isError ? (
    <Icon icon={AlertTriangle} size="2xl" />
  ) : (
    <Icon icon={Inbox} size="2xl" />
  );
  const styles = emptyState({ variant });

  return (
    <div className={styles.container({ class: className })}>
      <span className={styles.icon()}>{icon || defaultIcon}</span>
      <p className={styles.title()}>{title}</p>
      {description && <p className={styles.description()}>{description}</p>}
      {action}
    </div>
  );
}
