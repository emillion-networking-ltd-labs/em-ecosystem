// Grid — layout primitive del design-system (ECO-86, fase 1 de satellite-design).
// Rejilla responsive con columnas y gap GOBERNADOS por la escala. Colapsa a 1 columna en móvil
// por construcción (mobile-first). Es el riel para grids de servicios/portfolio/pricing sin que
// el generador invente media-queries a mano.
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const cols = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const;

const gaps = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-12",
} as const;

export interface GridProps extends ComponentPropsWithoutRef<"div"> {
  /** Nº de columnas en el breakpoint mayor (siempre 1 en móvil). @default 3 */
  cols?: keyof typeof cols;
  /** Separación entre celdas desde la escala. @default "md" */
  gap?: keyof typeof gaps;
}

export function Grid({ cols: colsProp = 3, gap = "md", className, ...props }: GridProps) {
  return <div className={cn("grid", cols[colsProp], gaps[gap], className)} {...props} />;
}

export default Grid;
