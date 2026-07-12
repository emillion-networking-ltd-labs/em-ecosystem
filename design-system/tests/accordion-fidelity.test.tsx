import { describe, it, expect } from "vitest";
import { accordionTrigger } from "@/components/ui/Accordion";

// FIDELIDAD de la migración a tv: el conjunto de clases del trigger debe ser IDÉNTICO viejo (concat inline con
// `triggerStyles[variant]`) vs nuevo (tv, twMerge:false), por variant. Se retira al cerrar la pieza.
const OLD_TRIGGER = {
  default: "text-body font-normal text-content-primary",
  uppercase: "text-body font-normal uppercase text-content-primary",
} as const;
const set = (s: string) => s.split(/\s+/).filter(Boolean).sort();

const VARIANTS = ["default", "uppercase"] as const;

describe("Accordion trigger — fidelidad (viejo concat inline vs nuevo tv)", () => {
  for (const variant of VARIANTS) {
    it(variant, () => {
      expect(set(accordionTrigger({ variant }))).toEqual(
        set(
          `flex w-full items-center justify-between px-4 py-3 ${OLD_TRIGGER[variant]} transition-colors hover:bg-surface-subtle`,
        ),
      );
    });
  }

  it("default es el valor por defecto", () => {
    expect(set(accordionTrigger({}))).toEqual(
      set(accordionTrigger({ variant: "default" })),
    );
  });
});
