// Split — layout primitive del design-system (ECO-86; API ampliada en ECO-131).
// Dos paneles (contenido + media) que APILAN en móvil y se reparten en escritorio con RATIO gobernado.
// `stackAt` elige el breakpoint del reparto (un hero puede partir en `md` o aguantar apilado hasta `xl`).
// `reverse` alterna el orden VISUAL sin cambiar el DOM (a11y/SEO: el contenido va primero en el markup).
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GAP, type Gap } from "@/lib/layout";

type Ratio = "1-1" | "4-8" | "8-4" | "5-7" | "7-5";
type StackAt = "md" | "lg" | "xl";

// Clases ESTÁTICAS por breakpoint de reparto (Tailwind escanea literales — no se construyen dinámicamente).
const RATIO: Record<StackAt, Record<Ratio, string>> = {
  md: { "1-1": "md:grid-cols-2", "4-8": "md:grid-cols-[4fr_8fr]", "8-4": "md:grid-cols-[8fr_4fr]", "5-7": "md:grid-cols-[5fr_7fr]", "7-5": "md:grid-cols-[7fr_5fr]" },
  lg: { "1-1": "lg:grid-cols-2", "4-8": "lg:grid-cols-[4fr_8fr]", "8-4": "lg:grid-cols-[8fr_4fr]", "5-7": "lg:grid-cols-[5fr_7fr]", "7-5": "lg:grid-cols-[7fr_5fr]" },
  xl: { "1-1": "xl:grid-cols-2", "4-8": "xl:grid-cols-[4fr_8fr]", "8-4": "xl:grid-cols-[8fr_4fr]", "5-7": "xl:grid-cols-[5fr_7fr]", "7-5": "xl:grid-cols-[7fr_5fr]" },
};
const ORDER: Record<StackAt, { content: string; media: string }> = {
  md: { content: "md:order-2", media: "md:order-1" },
  lg: { content: "lg:order-2", media: "lg:order-1" },
  xl: { content: "xl:order-2", media: "xl:order-1" },
};

const aligns = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

export interface SplitProps extends ComponentPropsWithoutRef<"div"> {
  /** Panel de media (imagen/ilustración). Si falta, el contenido ocupa todo (omit-if-absent: se ignoran ratio/gap/align). */
  media?: ReactNode;
  /** Proporción contenido-media en escritorio. @default "1-1" */
  ratio?: Ratio;
  /** Separación entre paneles (escala compartida lib/layout). @default "xl" */
  gap?: Gap;
  /** Alineación vertical de los paneles. @default "center" */
  align?: keyof typeof aligns;
  /** Breakpoint a partir del cual se reparte en columnas (antes: apilado). @default "lg" */
  stackAt?: StackAt;
  /** Coloca la media a la izquierda (solo visual; el DOM mantiene contenido→media). */
  reverse?: boolean;
  /** Etiqueta a renderizar. @default "div" */
  as?: ElementType;
}

export function Split({
  media,
  ratio = "1-1",
  gap = "xl",
  align = "center",
  stackAt = "lg",
  reverse = false,
  as,
  className,
  children,
  ...props
}: SplitProps) {
  const Comp = as ?? "div";
  if (!media) {
    return (
      <Comp className={className} {...props}>
        {children}
      </Comp>
    );
  }
  return (
    <Comp
      className={cn("grid grid-cols-1", RATIO[stackAt][ratio], GAP[gap], aligns[align], className)}
      {...props}
    >
      <div className={cn(reverse && ORDER[stackAt].content)}>{children}</div>
      <div className={cn(reverse && ORDER[stackAt].media)}>{media}</div>
    </Comp>
  );
}

export default Split;
