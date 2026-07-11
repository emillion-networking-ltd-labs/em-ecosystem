"use client";

import type { LucideIcon, LucideProps } from "lucide-react";

// Escala ÚNICA de tamaño de icono — la FUENTE del sistema (registrada y documentada en `Foundations › Icons`).
// Semántica en vez de números mágicos: `md` (16px) es el estándar; el resto para casos concretos. Cambiar un
// valor AQUÍ propaga a TODO `<Icon>` del producto → sin tener que tocar cada `size={16}` a mano.
// Progresión regular: +2 en el rango pequeño (12/14/16), +8 en el grande (24/32/40). Fuente única del TAMAÑO
// de icono; `<Icon size="md">` la aplica. Cambiar un valor aquí propaga a todo Icon (ECO-184, reabre ECO-178).
export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
} as const;
export type IconSize = keyof typeof ICON_SIZES;

interface IconProps extends Omit<LucideProps, "size"> {
  /** El glyph de lucide-react (p.ej. `Eye`). */
  icon: LucideIcon;
  /** Tamaño semántico de la escala. @default "md" (16px) */
  size?: IconSize;
}

// <Icon icon={Eye} size="md" /> — aplica la escala. El COLOR se hereda (currentColor → tokens `text-*`), así que
// se colorea desde el contenedor con `text-content-*`, nunca con hex. Reemplaza el `<Eye size={16} />` a pelo.
export default function Icon({
  icon: Glyph,
  size = "md",
  ...props
}: IconProps) {
  return <Glyph size={ICON_SIZES[size]} {...props} />;
}
