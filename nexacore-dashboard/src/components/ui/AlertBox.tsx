"use client";

import { tv } from "tailwind-variants";
import { AlertTriangle, CircleX, Info, CircleCheck } from "lucide-react";
import Icon from "./Icon";

type AlertBoxVariant = "warning" | "error" | "info" | "success";

// Glyph por variante — dato NO-clase (icono lucide): vive fuera del tv (el tv sólo maneja las clases CSS).
const VARIANT_ICON = {
  warning: AlertTriangle,
  error: CircleX,
  info: Info,
  success: CircleCheck,
} as const;

// Varios elementos varían (contenedor color/borde + icono color) → `slots`. `text` es estático pero se declara
// slot para documentar la composición. Raw-concat previo → twMerge:false (conserva el conjunto de clases fiel).
export const alertBox = tv(
  {
    slots: {
      container: "inline-flex items-start gap-2 rounded-lg border p-3",
      icon: "mt-0.5 shrink-0",
      // select-text: el texto va en un <div> (no en la lista de opt-in de tags) → se reabre la selección
      // para que el mensaje sea copiable, sin reactivar el caret sobre divs de layout (ECO-115).
      text: "select-text text-caption text-content-primary",
    },
    variants: {
      variant: {
        warning: {
          container: "border-warning-border bg-warning-bg",
          icon: "text-warning",
        },
        error: {
          container: "border-error-border bg-error-bg",
          icon: "text-error",
        },
        info: {
          container: "border-info-border bg-info-bg",
          icon: "text-info",
        },
        success: {
          container: "border-success-border bg-success-bg",
          icon: "text-success",
        },
      },
    },
  },
  { twMerge: false },
);

// Superficie de docs (single-source): slots + variante → borde/bg + glyph/color (las clases viven en el tv).
export const alertBoxSpecs = {
  variants: {
    warning: "border-warning-border bg-warning-bg — AlertTriangle text-warning",
    error: "border-error-border bg-error-bg — CircleX text-error",
    info: "border-info-border bg-info-bg — Info text-info",
    success: "border-success-border bg-success-bg — CircleCheck text-success",
  },
  layout: {
    container: "rounded-lg border p-3 flex items-start gap-2",
    icon: "mt-0.5 shrink-0 md (16px) — color matches variant (text-warning/error/info/success)",
    text: "text-caption text-content-primary",
  },
} as const;

interface AlertBoxProps {
  variant: AlertBoxVariant;
  children: React.ReactNode;
  className?: string;
}

export default function AlertBox({
  variant,
  children,
  className = "",
}: AlertBoxProps) {
  const Glyph = VARIANT_ICON[variant];
  const { container, icon, text } = alertBox({ variant });

  return (
    <div className={container({ className })} role="alert">
      <Icon icon={Glyph} size="md" className={icon()} />
      <div className={text()}>{children}</div>
    </div>
  );
}
