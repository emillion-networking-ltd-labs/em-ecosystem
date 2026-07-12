import { describe, it, expect } from "vitest";
import { gradientBackdrop } from "@/components/ui/GradientBackdrop";

// FIDELIDAD de la migración a tailwind-variants (base): el conjunto de clases del <div> decorativo debe ser
// IDÉNTICO viejo (cn(base, variants[v], intensities[i], blur && "blur-3xl")) vs nuevo (tv, twMerge:false),
// por variant×intensity×blur. Se retira al cerrar la pieza.
const OLD_BASE = "pointer-events-none absolute inset-0 -z-10";
const OLD_VARIANT = {
  linear: "[background-image:var(--gradient-brand)]",
  radial: "[background-image:var(--gradient-brand-radial)]",
} as const;
const OLD_INTENSITY = {
  subtle: "opacity-10",
  soft: "opacity-20",
  bold: "opacity-40",
} as const;
const set = (s: string) => s.split(/\s+/).filter(Boolean).sort();

const VARIANTS = ["linear", "radial"] as const;
const INTENSITIES = ["subtle", "soft", "bold"] as const;
const BLURS = [true, false] as const;

describe("GradientBackdrop — fidelidad (viejo cn vs nuevo tv), por variant×intensity×blur", () => {
  for (const variant of VARIANTS) {
    for (const intensity of INTENSITIES) {
      for (const blur of BLURS) {
        it(`${variant} · ${intensity} · blur=${blur}`, () => {
          const oldStr = [
            OLD_BASE,
            OLD_VARIANT[variant],
            OLD_INTENSITY[intensity],
            blur ? "blur-3xl" : "",
          ].join(" ");
          expect(set(gradientBackdrop({ variant, intensity, blur }))).toEqual(
            set(oldStr),
          );
        });
      }
    }
  }
});
