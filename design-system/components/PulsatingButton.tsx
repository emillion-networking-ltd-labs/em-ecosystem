// PulsatingButton — Magic UI (MIT, © Magic UI), adoptado (ECO-106, fase 1 / ADR-019). CTA con un HALO que
// late hacia fuera (`box-shadow` animado, keyframe `button-pulse` en tokens.css) — el efecto reconocible de
// "pulsating", visible sobre cualquier fondo. Reconstruido sobre tokens: color de marca = el del Button
// primary (`surface-inverse`/`content-inverse`, NO accent) y forma del sistema (`rounded-md`). Se omiten del
// original la variante `ripple` y el `useLayoutEffect` de sync `--bg` (innecesarios con color por token).
"use client";

import React from "react";

import { cn } from "@/lib/utils";

interface PulsatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Color del halo. Por defecto el negro de marca (`surface-inverse`). */
  pulseColor?: string;
  /** Duración de un latido. */
  duration?: string;
  /** Distancia máxima a la que se expande el halo. */
  distance?: string;
}

export const PulsatingButton = React.forwardRef<HTMLButtonElement, PulsatingButtonProps>(
  ({ className, children, pulseColor, duration = "1.5s", distance = "8px", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative flex animate-button-pulse cursor-pointer items-center justify-center rounded-md border border-border-strong bg-surface-inverse px-4 py-2 text-center text-body font-normal text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        style={
          {
            "--pulse-color": pulseColor ?? "var(--color-surface-inverse)",
            "--duration": duration,
            "--distance": distance,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </button>
    );
  },
);

PulsatingButton.displayName = "PulsatingButton";

export default PulsatingButton;
