// DotPattern — slot decorativo del design-system (ECO-86, fase 1 de satellite-design).
// Textura de puntos (SVG `<pattern>`) como fondo posicionado. DECORACIÓN pura — `aria-hidden`,
// sin eventos. El color hereda de `currentColor` → se tematiza con una clase de texto por TOKEN
// (p.ej. `text-border-subtle` o `text-accent`), nunca un hex. Colócalo en un `<Section isolateDecoration>`.
import { useId } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export interface DotPatternProps extends ComponentPropsWithoutRef<"svg"> {
  /** Lado de la celda del patrón en px. @default 16 */
  gap?: number;
  /** Radio del punto en px. @default 1 */
  radius?: number;
}

export function DotPattern({ gap = 16, radius = 1, className, ...props }: DotPatternProps) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 h-full w-full text-border-subtle",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
          <circle cx={gap / 2} cy={gap / 2} r={radius} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export default DotPattern;
