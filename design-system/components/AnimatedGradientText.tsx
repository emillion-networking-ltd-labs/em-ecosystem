// AnimatedGradientText — Magic UI (MIT), adoptado (ECO-82; alineado en ECO-108: defaults del gradiente →
// colores de marca accent/accent-2, no naranja/morado genéricos). Requiere keyframe `gradient` (tokens.css).
import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedGradientTextProps extends ComponentPropsWithoutRef<"div"> {
  speed?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "var(--color-accent)",
  colorTo = "var(--color-accent-2)",
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      style={
        {
          "--bg-size": `${speed * 300}%`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as React.CSSProperties
      }
      className={cn(
        `animate-gradient inline bg-linear-to-r from-(--color-from) via-(--color-to) to-(--color-from) bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent`,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
