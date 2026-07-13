// @ds-tier: decorative — efecto cosechado — efecto ripple de fondo
// Ripple — Magic UI (MIT, © Magic UI), adoptado (ECO-106, fase 1 / ADR-019). Fondo de círculos concéntricos
// que laten (escala) con stagger; se desvanecen hacia el centro con una máscara. VERBATIM salvo: color crudo
// `bg-foreground/25` + `var(--foreground)` → token `content-primary`; el latido usa el keyframe `ripple`
// (`--animate-ripple`) añadido a `tokens.css` (append). Solo `cn` (ya presente).
import React, { type ComponentPropsWithoutRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
  ...props
}: RippleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none mask-[linear-gradient(to_bottom,white,transparent)]",
        className,
      )}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = `${i * 0.06}s`;

        return (
          <div
            key={i}
            className="absolute animate-ripple rounded-full border bg-content-primary/25 shadow-xl"
            style={
              {
                "--i": i,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                borderStyle: "solid",
                borderWidth: "1px",
                borderColor: "var(--color-content-primary)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1)",
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";

export default Ripple;
