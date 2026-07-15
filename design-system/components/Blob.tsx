// @ds-tier: decorative — efecto cosechado — forma orgánica de fondo (SVG)
// Blob — slot decorativo del design-system (ECO-86, fase 1 de satellite-design).
// Mancha orgánica difuminada (halo de marca) como acento posicionado. DECORACIÓN pura
// — `aria-hidden`, sin eventos. Usa el gradiente radial de marca (token `--gradient-brand-radial`)
// → tematizable por satélite vía `--color-accent/-2`. Da profundidad/atmósfera a un Hero o CTA.
// Colócalo dentro de un `<Section isolateDecoration>` y posiciónalo con utilidades (top/left/...).
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-48 w-48",
  md: "h-72 w-72",
  lg: "h-96 w-96",
  xl: "h-[32rem] w-[32rem]",
} as const;

const intensities = {
  subtle: "opacity-20",
  soft: "opacity-30",
  bold: "opacity-50",
} as const;

export interface BlobProps extends ComponentPropsWithoutRef<"div"> {
  /** Diámetro del halo desde la escala. @default "lg" */
  size?: keyof typeof sizes;
  /** Presencia del halo (opacidad gobernada). @default "soft" */
  intensity?: keyof typeof intensities;
}

export function Blob({
  size = "lg",
  intensity = "soft",
  className,
  ...props
}: BlobProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -z-10 rounded-full blur-3xl",
        "[background-image:var(--gradient-brand-radial)]",
        sizes[size],
        intensities[intensity],
        className,
      )}
      {...props}
    />
  );
}

export default Blob;
