import { describe, it, expect } from "vitest";
import { toast } from "@/components/ui/Toast";

// FIDELIDAD de la migración a tailwind-variants (base): el conjunto de clases del icono debe ser IDÉNTICO
// viejo (concat `self-center shrink-0 ${variantClass}`) vs nuevo (tv, twMerge:false), por variante. El glyph
// lucide NO va al tv (dato no-clase) → aquí sólo se compara la clase de color. Se retira al cerrar la pieza.
const OLD_BASE = "self-center shrink-0";
const OLD_VARIANT = {
  error: "text-error",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
} as const;
const set = (s: string) => s.split(/\s+/).filter(Boolean).sort();

const VARIANTS = ["error", "success", "warning", "info"] as const;

describe("Toast — fidelidad del icono (viejo concat vs nuevo tv), por variante", () => {
  for (const variant of VARIANTS) {
    it(`${variant}`, () => {
      expect(set(toast({ variant }))).toEqual(
        set(`${OLD_BASE} ${OLD_VARIANT[variant]}`),
      );
    });
  }
});
