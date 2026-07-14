"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { type TextareaHTMLAttributes } from "react";

// Primitivo TEXTAREA del design-system — campo multilínea CONSISTENTE con Input (mismo borde
// `border-border-components` + outline de foco que cambia en hover/focus/error). Tokens del proyecto. El
// estado de error se orquesta vía `hasError` (lo aporta FormField). Hereda los atributos nativos de textarea.
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export default function Textarea({
  hasError = false,
  className = "",
  rows = 4,
  disabled,
  ...props
}: TextareaProps) {
  const outline = hasError
    ? "outline-error"
    : "outline-transparent hover:outline-content-secondary focus:outline-content-secondary";
  return (
    <textarea
      rows={rows}
      disabled={disabled}
      className={`w-full resize-y rounded-lg border border-border-components bg-transparent px-4 py-3 text-body leading-6 text-content-primary outline-solid outline-2 outline-offset-2 transition-colors placeholder:text-content-placeholder ${outline} ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      } ${className}`}
      {...props}
    />
  );
}
