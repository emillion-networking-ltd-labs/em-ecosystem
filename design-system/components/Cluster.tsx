// Cluster — layout primitive del design-system (ECO-131).
// Fila HORIZONTAL que envuelve (flex-wrap) con gap GOBERNADO: el riel para grupos de chips/badges, filas de
// botones (CTA doble), logos de clientes o metadatos — items que fluyen y bajan de línea en móvil sin romper.
// Complementa a Stack (vertical). Patrón "Cluster" de Every Layout / "Inline" de Braid.
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";
import { GAP, type Gap } from "@/lib/layout";

const aligns = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
} as const;
const justifies = {
  start: "justify-start",
  center: "justify-center",
  between: "justify-between",
  end: "justify-end",
} as const;

export interface ClusterProps extends ComponentPropsWithoutRef<"div"> {
  /** Separación entre items (escala compartida lib/layout). @default "sm" */
  gap?: Gap;
  /** Alineación transversal (vertical) de los items. @default "center" */
  align?: keyof typeof aligns;
  /** Distribución en el eje principal (horizontal). @default "start" */
  justify?: keyof typeof justifies;
  /** Si los items envuelven a varias líneas cuando no caben. @default true */
  wrap?: boolean;
  /** Etiqueta a renderizar (p.ej. "ul" para una lista de chips). @default "div" */
  as?: ElementType;
}

export function Cluster({
  gap = "sm",
  align = "center",
  justify = "start",
  wrap = true,
  as,
  className,
  ...props
}: ClusterProps) {
  const Comp = as ?? "div";
  return (
    <Comp
      className={cn(
        "flex",
        wrap ? "flex-wrap" : "flex-nowrap",
        GAP[gap],
        aligns[align],
        justifies[justify],
        className,
      )}
      {...props}
    />
  );
}

export default Cluster;
