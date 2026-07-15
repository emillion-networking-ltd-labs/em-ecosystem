// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
// Container — layout primitive del design-system (ECO-86, fase 1 de satellite-design).
// Restringe el ancho de la línea de medida y centra, con padding horizontal responsive
// GOBERNADO por la escala (sin valores crudos). Es el riel horizontal sobre el que componen
// las secciones — da ritmo consistente a cualquier preset sin plantillar el contenido.
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

// Escala de ancho de medida (niquelada ECO-131). `prose` = medida de LECTURA real (65ch ≈ 45–75 car., para
// secciones de texto tipo FAQ/CTA). `xl` es el ANCHO CANÓNICO de marketing, tokenizado en `--content-max`
// (tokens.css) → fuente única compartida. `lg` (default) es una medida cómoda de propósito general (≈1152,
// alineada con MUI/Radix); usa `xl` explícito para la anchura de la casa. El resto son puntos de la escala.
const widths = {
  prose: "max-w-prose", // 65ch — medida de lectura
  sm: "max-w-2xl", // 672
  md: "max-w-4xl", // 896
  lg: "max-w-6xl", // 1152 (default, propósito general)
  xl: "max-w-[var(--content-max)]", // 1280 — canónico de marketing (--content-max)
  full: "max-w-none",
} as const;

export interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  /** Ancho máximo de la medida. `xl` = ancho canónico de marketing; `prose` = medida de lectura. @default "lg" */
  size?: keyof typeof widths;
  /** Etiqueta a renderizar (p.ej. `"main"`). @default "div" */
  as?: ElementType;
}

export function Container({
  size = "lg",
  as,
  className,
  ...props
}: ContainerProps) {
  const Comp = as ?? "div";
  return (
    <Comp
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        widths[size],
        className,
      )}
      {...props}
    />
  );
}

export default Container;
