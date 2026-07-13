// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
// Section — layout primitive del design-system (ECO-86; niquelado en ECO-131).
// Banda vertical semántica (`<section>`) con RITMO vertical gobernado (escala de spacing, rejilla 8pt) y
// superficie por TOKEN (nunca hex). `isolateDecoration` la convierte en lienzo para los slots decorativos
// posicionados (relative + overflow-hidden + isolate) — el panel marcó la falta de variedad estructural como
// la "anemia" real del DS. El contenido entra por children.
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

// Escala de ritmo vertical (padding-block), rejilla 8pt. `md` (DEFAULT) = la banda estándar de marketing
// (80→96, el patrón de facto del catálogo) → `<Section>` sin prop reproduce ese spacing. Cada paso escala por
// breakpoint (se corrigió que `sm` no escalaba). `lg`/`xl` para bandas más generosas (feature/hero).
const spacing = {
  none: "",
  sm: "py-16 sm:py-20", // 64→80
  md: "py-20 sm:py-24", // 80→96 (default, banda de marketing)
  lg: "py-24 sm:py-28 lg:py-32", // 96→112→128
  xl: "py-28 sm:py-36 lg:py-44", // 112→144→176
} as const;

// `inverse` abre un SCOPE DE TEMA OSCURO (clase `dark`): así TODOS los tokens de los hijos (Card, Badge,
// text-content-*, bg-surface-*) se resuelven en oscuro → sin trampas de contraste (texto oscuro sobre fondo
// oscuro). Antes eran solo dos clases (bg+text) y cualquier hijo con otro token rompía; por eso CTA usaba
// `.dark` a mano. Con esto CTA puede migrar a `surface="inverse"` (ECO-131).
const surfaces = {
  none: "",
  primary: "bg-surface-primary",
  secondary: "bg-surface-secondary",
  subtle: "bg-surface-subtle",
  inverse: "dark bg-surface-primary text-content-primary",
} as const;

export interface SectionProps extends ComponentPropsWithoutRef<"section"> {
  /** Ritmo vertical (padding-block) desde la escala. `md` = banda estándar de marketing. @default "md" */
  spacing?: keyof typeof spacing;
  /** Superficie de fondo por token. `inverse` abre un scope de tema oscuro (invierte los tokens hijos). @default "none" */
  surface?: keyof typeof surfaces;
  /** Aísla los slots decorativos posicionados dentro (relative + overflow-hidden + isolate). */
  isolateDecoration?: boolean;
  /** Etiqueta a renderizar. @default "section" */
  as?: ElementType;
}

export function Section({
  spacing: spacingProp = "md",
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
