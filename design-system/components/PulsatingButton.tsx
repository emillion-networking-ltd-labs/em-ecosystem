// PulsatingButton — Magic UI (MIT, © Magic UI), adoptado (ECO-106, fase 1 / ADR-019). CTA que "respira":
// un overlay hereda el fondo del botón y late con `animate-pulse` (utilidad core de Tailwind, sin keyframe
// nuevo). Reconstruido sobre tokens: el color de marca = el del Button primary (`surface-inverse` /
// `content-inverse`), NO el accent. Se omiten del original: la variante `ripple` (requería keyframe propio)
// y el `useLayoutEffect` que sincroniza `--bg` (innecesario: con color por token `bg-inherit` basta).
"use client";

import React from "react";

import { cn } from "@/lib/utils";

interface PulsatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Override del color del pulso. Por defecto hereda el fondo del botón (`surface-inverse`). */
  pulseColor?: string;
}

export const PulsatingButton = React.forwardRef<HTMLButtonElement, PulsatingButtonProps>(
  ({ className, children, pulseColor, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-lg border border-border-components bg-surface-inverse px-4 py-2 text-center text-body font-semibold text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 animate-pulse rounded-[inherit]",
            !pulseColor && "bg-inherit",
          )}
          style={pulseColor ? { backgroundColor: pulseColor } : undefined}
        />
      </button>
    );
  },
);

PulsatingButton.displayName = "PulsatingButton";

export default PulsatingButton;
