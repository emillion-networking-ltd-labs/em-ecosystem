// Section — layout primitive del design-system (ECO-86, fase 1 de satellite-design).
// Banda vertical semántica (`<section>`) con RITMO vertical gobernado (escala de spacing) y
// superficie por TOKEN (nunca hex). `isolateDecoration` la convierte en lienzo para los slots
// decorativos posicionados (relative + overflow-hidden) — el panel marcó la falta de variedad
// estructural/atmósfera como la "anemia" real del DS. El contenido entra por children.
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

const spacing = {
  none: "",
  sm: "py-12",
  md: "py-16 sm:py-20",
  lg: "py-24 sm:py-28",
  xl: "py-28 sm:py-36 lg:py-44",
} as const;

const surfaces = {
  none: "",
  primary: "bg-surface-primary",
  secondary: "bg-surface-secondary",
  subtle: "bg-surface-subtle",
  inverse: "bg-surface-inverse text-content-inverse",
} as const;

export interface SectionProps extends ComponentPropsWithoutRef<"section"> {
  /** Ritmo vertical (padding-block) desde la escala. @default "lg" */
  spacing?: keyof typeof spacing;
  /** Superficie de fondo por token semántico. @default "none" */
  surface?: keyof typeof surfaces;
  /** Aísla los slots decorativos posicionados dentro (relative + overflow-hidden). */
  isolateDecoration?: boolean;
  /** Etiqueta a renderizar. @default "section" */
  as?: ElementType;
}

export function Section({
  spacing: spacingProp = "lg",
  surface = "none",
  isolateDecoration = false,
  as,
  className,
  ...props
}: SectionProps) {
  const Comp = as ?? "section";
  return (
    <Comp
      className={cn(
        spacing[spacingProp],
        surfaces[surface],
        isolateDecoration && "relative overflow-hidden isolate",
        className,
      )}
      {...props}
    />
  );
}

export default Section;
