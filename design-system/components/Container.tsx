// Container — layout primitive del design-system (ECO-86, fase 1 de satellite-design).
// Restringe el ancho de la línea de medida y centra, con padding horizontal responsive
// GOBERNADO por la escala (sin valores crudos). Es el riel horizontal sobre el que componen
// las secciones — da ritmo consistente a cualquier preset sin plantillar el contenido.
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

const widths = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const;

export interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  /** Ancho máximo de la medida. @default "lg" */
  size?: keyof typeof widths;
  /** Etiqueta a renderizar (p.ej. `"main"`). @default "div" */
  as?: ElementType;
}

export function Container({ size = "lg", as, className, ...props }: ContainerProps) {
  const Comp = as ?? "div";
  return (
    <Comp
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", widths[size], className)}
      {...props}
    />
  );
}

export default Container;
