// GridPattern — slot decorativo del design-system (ECO-86, fase 1 de satellite-design).
// Textura de rejilla (líneas, SVG `<pattern>`) como fondo posicionado. DECORACIÓN pura
// — `aria-hidden`, sin eventos. Color por `currentColor` → tematizable con una clase de texto por
// TOKEN (nunca hex). Da sensación técnica/editorial a una banda. Colócalo en `<Section isolateDecoration>`.
import { useId } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export interface GridPatternProps extends ComponentPropsWithoutRef<"svg"> {
  /** Lado de la celda del patrón en px. @default 32 */
  gap?: number;
  /** Grosor de la línea en px. @default 1 */
  stroke?: number;
}

export function GridPattern({ gap = 32, stroke = 1, className, ...props }: GridPatternProps) {
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
          <path
            d={`M ${gap} 0 L 0 0 0 ${gap}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export default GridPattern;
