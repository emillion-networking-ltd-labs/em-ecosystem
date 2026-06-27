// GradientBackdrop — slot decorativo del design-system (ECO-86, fase 1 de satellite-design).
// Atmósfera de marca: pinta el gradiente multi-stop (tokens `--gradient-brand[-radial]` de ECO-83)
// como fondo posicionado DETRÁS del contenido. Es DECORACIÓN pura — `aria-hidden`, sin eventos,
// jamás contenido ni un hecho del cliente. Tematizable por satélite vía `--color-accent/-2` (no se
// edita el componente). Colócalo dentro de un `<Section isolateDecoration>`.
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const variants = {
  linear: "[background-image:var(--gradient-brand)]",
  radial: "[background-image:var(--gradient-brand-radial)]",
} as const;

const intensities = {
  subtle: "opacity-10",
  soft: "opacity-20",
  bold: "opacity-40",
} as const;

export interface GradientBackdropProps extends ComponentPropsWithoutRef<"div"> {
  /** Forma del gradiente de marca. @default "radial" */
  variant?: keyof typeof variants;
  /** Presencia de la atmósfera (opacidad gobernada). @default "soft" */
  intensity?: keyof typeof intensities;
  /** Difumina el gradiente para un halo suave. @default true */
  blur?: boolean;
}

export function GradientBackdrop({
  variant = "radial",
  intensity = "soft",
  blur = true,
  className,
  ...props
}: GradientBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10",
        variants[variant],
        intensities[intensity],
        blur && "blur-3xl",
        className,
      )}
      {...props}
    />
  );
}

export default GradientBackdrop;
