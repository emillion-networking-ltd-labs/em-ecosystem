// Split — layout primitive del design-system (ECO-86, fase 1 de satellite-design).
// Dos paneles (contenido + media) que apilan en móvil y se reparten en escritorio con RATIO
// gobernado. `reverse` alterna el orden visual sin cambiar el DOM (a11y/SEO: el contenido va
// primero en el markup). Es el riel del Hero split y de las bandas "texto + imagen real" — da
// variedad de composición (eje estructural) sin plantillar.
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

const ratios = {
  "1-1": "lg:grid-cols-2",
  "5-7": "lg:grid-cols-[5fr_7fr]",
  "7-5": "lg:grid-cols-[7fr_5fr]",
} as const;

const gaps = {
  md: "gap-8",
  lg: "gap-12",
  xl: "gap-16",
} as const;

const aligns = {
  start: "items-start",
  center: "items-center",
  stretch: "items-stretch",
} as const;

export interface SplitProps extends ComponentPropsWithoutRef<"div"> {
  /** Panel de media (imagen/ilustración). Si falta, el contenido ocupa todo (omit-if-absent). */
  media?: ReactNode;
  /** Proporción contenido-media en escritorio. @default "1-1" */
  ratio?: keyof typeof ratios;
  /** Separación entre paneles. @default "lg" */
  gap?: keyof typeof gaps;
  /** Alineación vertical de los paneles. @default "center" */
  align?: keyof typeof aligns;
  /** Coloca la media a la izquierda (solo visual; el DOM mantiene contenido→media). */
  reverse?: boolean;
}

export function Split({
  media,
  ratio = "1-1",
  gap = "lg",
  align = "center",
  reverse = false,
  className,
  children,
  ...props
}: SplitProps) {
  if (!media) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }
  return (
    <div
      className={cn("grid grid-cols-1", ratios[ratio], gaps[gap], aligns[align], className)}
      {...props}
    >
      <div className={cn(reverse && "lg:order-2")}>{children}</div>
      <div className={cn(reverse && "lg:order-1")}>{media}</div>
    </div>
  );
}

export default Split;
