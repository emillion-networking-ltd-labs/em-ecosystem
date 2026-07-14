import { describe, it, expect } from "vitest";
import { emptyState } from "@/components/ui/EmptyState";

// FIDELIDAD de la migración a tv (slots): el conjunto de clases de cada slot debe ser IDÉNTICO viejo (concat/
// ternario inline) vs nuevo (tv, twMerge:false), por variant. Se retira al cerrar la pieza.
const OLD = {
  container: "flex flex-col items-center gap-3 py-12",
  title: "text-body font-semibold text-content-primary",
  description: "text-caption text-content-secondary text-center",
  icon: {
    default: "text-content-placeholder",
    error: "text-error",
  },
} as const;
const set = (s: string) => s.split(/\s+/).filter(Boolean).sort();

const VARIANTS = ["default", "error"] as const;

describe("EmptyState — fidelidad de slots (viejo inline vs nuevo tv)", () => {
  for (const variant of VARIANTS) {
    it(variant, () => {
      const s = emptyState({ variant });
      expect(set(s.container())).toEqual(set(OLD.container));
      expect(set(s.icon())).toEqual(set(OLD.icon[variant]));
      expect(set(s.title())).toEqual(set(OLD.title));
      expect(set(s.description())).toEqual(set(OLD.description));
    });
  }

  it("container concatena className extra (como el `${className}` viejo)", () => {
    const s = emptyState({ variant: "default" });
    expect(set(s.container({ class: "mt-4" }))).toEqual(
      set(`${OLD.container} mt-4`),
    );
  });

  it("default es el valor por defecto", () => {
    expect(set(emptyState({}).icon())).toEqual(
      set(emptyState({ variant: "default" }).icon()),
    );
  });
});
