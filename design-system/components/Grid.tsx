// Grid — layout primitive del design-system (ECO-86; API rehecha en ECO-131).
// Rejilla con columnas y gap GOBERNADOS. `cols` acepta un número (curva mobile-first 1→2→N) o un objeto
// responsive por breakpoint (`{ base, sm, md, lg, xl }`) para casos como 1→3 (Pricing) que la curva fija no
// expresaba. `minItemWidth` activa un auto-fit content-driven (repeat(auto-fit, minmax(w, 1fr))) sin
// breakpoints, ideal para galerías de tarjetas. Gap desde la escala compartida (lib/layout).
import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from "react";
import { cn } from "@/lib/utils";
import { GAP, type Gap } from "@/lib/layout";

// Curva mobile-first cuando `cols` es un número: colapsa a 1 en móvil, 2 en sm y N en lg.
const colsCurve = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const;

// Tabla ESTÁTICA de clases por breakpoint (Tailwind escanea literales — no se pueden construir dinámicamente).
const COL = {
  base: { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-6" },
  sm: { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5", 6: "sm:grid-cols-6" },
  md: { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5", 6: "md:grid-cols-6" },
  lg: { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" },
  xl: { 1: "xl:grid-cols-1", 2: "xl:grid-cols-2", 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5", 6: "xl:grid-cols-6" },
} as const;

const aligns = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;
const justifies = {
  start: "justify-items-start",
  center: "justify-items-center",
  end: "justify-items-end",
  stretch: "justify-items-stretch",
} as const;

type ColCount = keyof (typeof COL)["base"]; // 1..6
type ColsResponsive = Partial<Record<keyof typeof COL, ColCount>>;

export interface GridProps extends ComponentPropsWithoutRef<"div"> {
  /** Columnas: número (curva mobile-first 1→2→N, cols 1-4) u objeto responsive por breakpoint (cols 1-6). @default 3 */
  cols?: keyof typeof colsCurve | ColsResponsive;
  /** Ancho mínimo de celda para auto-fit (`repeat(auto-fit, minmax(w, 1fr))`) — ignora `cols`. P.ej. "16rem". */
  minItemWidth?: string;
  /** Separación entre celdas (escala compartida lib/layout). @default "md" */
  gap?: Gap;
  /** align-items (alineación transversal de las celdas). */
  align?: keyof typeof aligns;
  /** justify-items (alineación de cada celda en su columna). */
  justify?: keyof typeof justifies;
  /** Etiqueta a renderizar. @default "div" */
  as?: ElementType;
}

function colsClass(cols: keyof typeof colsCurve | ColsResponsive): string {
  if (typeof cols === "number") return colsCurve[cols];
  return (Object.keys(COL) as (keyof typeof COL)[])
    .filter((bp) => cols[bp] != null)
    .map((bp) => COL[bp][cols[bp] as ColCount])
    .join(" ");
}

export function Grid({
  cols = 3,
  minItemWidth,
  gap = "md",
  align,
  justify,
  as,
  className,
  style,
  ...props
}: GridProps) {
  const Comp = as ?? "div";
  const autoFit = minItemWidth != null;
  const autoFitStyle: CSSProperties | undefined = autoFit
    ? { gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))` }
    : undefined;
  return (
    <Comp
      className={cn(
        "grid",
        !autoFit && colsClass(cols),
        GAP[gap],
        align && aligns[align],
        justify && justifies[justify],
        className,
      )}
      style={autoFit ? { ...autoFitStyle, ...style } : style}
      {...props}
    />
  );
}

export default Grid;
