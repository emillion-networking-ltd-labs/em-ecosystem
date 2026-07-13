// @ds-tier: decorative — efecto cosechado — fondo de gradiente decorativo
// GradientBackdrop — slot decorativo del design-system (ECO-86, fase 1 de satellite-design).
// Atmósfera de marca: pinta el gradiente multi-stop (tokens `--gradient-brand[-radial]` de ECO-83)
// como fondo posicionado DETRÁS del contenido. Es DECORACIÓN pura — `aria-hidden`, sin eventos,
// jamás contenido ni un hecho del cliente. Tematizable por satélite vía `--color-accent/-2` (no se
// edita el componente). Colócalo dentro de un `<Section isolateDecoration>`.
import type { ComponentPropsWithoutRef } from "react";
import { tv } from "tailwind-variants";

// Un solo elemento decorativo con ejes de variante → `base`. Raw-map previo (cn) → twMerge:false (conserva
// el conjunto de clases idéntico: no reordena ni dedupe).
export const gradientBackdrop = tv(
  {
    base: "pointer-events-none absolute inset-0 -z-10",
    variants: {
      variant: {
        linear: "[background-image:var(--gradient-brand)]",
        radial: "[background-image:var(--gradient-brand-radial)]",
      },
      intensity: {
        subtle: "opacity-10",
        soft: "opacity-20",
        bold: "opacity-40",
      },
      blur: {
        true: "blur-3xl",
        false: "",
      },
    },
    defaultVariants: { variant: "radial", intensity: "soft", blur: true },
  },
  { twMerge: false },
);

// Superficie de docs (single-source): ejes + valores (las clases viven en el tv).
export const gradientBackdropSpecs = {
  variants: ["linear", "radial"],
  intensities: ["subtle", "soft", "bold"],
} as const;

export interface GradientBackdropProps extends ComponentPropsWithoutRef<"div"> {
  /** Forma del gradiente de marca. @default "radial" */
  variant?: "linear" | "radial";
  /** Presencia de la atmósfera (opacidad gobernada). @default "soft" */
  intensity?: "subtle" | "soft" | "bold";
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
      className={gradientBackdrop({ variant, intensity, blur, className })}
      {...props}
    />
  );
}

export default GradientBackdrop;
