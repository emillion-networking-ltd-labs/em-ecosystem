// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
// Stack — layout primitive del design-system (ECO-86; API ampliada en ECO-131).
// Flujo VERTICAL con gap y alineación GOBERNADOS. El primitivo de composición más usado: agrupa
// eyebrow + titular + claim + CTA con ritmo consistente. Para una fila horizontal con wrap usa `Cluster`.
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";
import { GAP, type Gap } from "@/lib/layout";

// `align` acopla align-items + text-align: es el default ÚTIL para un stack de texto (centrar el bloque
// centra también su texto). `stretch` no fija text-align (deja el contenido a lo ancho).
const aligns = {
  start: "items-start text-left",
  center: "items-center text-center",
  end: "items-end text-right",
  stretch: "items-stretch",
} as const;
const justifies = {
  start: "justify-start",
  center: "justify-center",
  between: "justify-between",
  end: "justify-end",
} as const;

export interface StackProps extends ComponentPropsWithoutRef<"div"> {
  /** Separación vertical (escala compartida lib/layout). @default "sm" */
  gap?: Gap;
  /** Alineación transversal (+ text-align coherente). @default "start" */
  align?: keyof typeof aligns;
  /** Alineación en el eje principal (solo con altura fija: footers, columnas full-height). */
  justify?: keyof typeof justifies;
  /** Etiqueta a renderizar (p.ej. "ul" para una lista semántica). @default "div" */
  as?: ElementType;
}

export function Stack({
  gap = "sm",
  align = "start",
  justify,
  as,
  className,
  ...props
}: StackProps) {
  const Comp = as ?? "div";
  return (
    <Comp
      className={cn(
        "flex flex-col",
        GAP[gap],
        aligns[align],
        justify && justifies[justify],
        className,
      )}
      {...props}
    />
  );
}

export default Stack;
