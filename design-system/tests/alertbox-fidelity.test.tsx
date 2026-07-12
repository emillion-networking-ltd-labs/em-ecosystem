import { describe, it, expect } from "vitest";
import { alertBox } from "@/components/ui/AlertBox";

// FIDELIDAD de la migración a tailwind-variants (slots): el conjunto de clases de cada slot (container/icon/text)
// debe ser IDÉNTICO viejo (concat de mapas) vs nuevo (tv, twMerge:false), por variante. El glyph lucide NO va al
// tv (dato no-clase). Se retira al cerrar la pieza.
const OLD = {
  warning: {
    border: "border-warning-border",
    bg: "bg-warning-bg",
    iconColor: "text-warning",
  },
  error: {
    border: "border-error-border",
    bg: "bg-error-bg",
    iconColor: "text-error",
  },
  info: {
    border: "border-info-border",
    bg: "bg-info-bg",
    iconColor: "text-info",
  },
  success: {
    border: "border-success-border",
    bg: "bg-success-bg",
    iconColor: "text-success",
  },
} as const;
const OLD_TEXT = "select-text text-caption text-content-primary";
const set = (s: string) => s.split(/\s+/).filter(Boolean).sort();

const VARIANTS = ["warning", "error", "info", "success"] as const;

describe("AlertBox — fidelidad de slots (viejo concat vs nuevo tv), por variante", () => {
  for (const variant of VARIANTS) {
    it(`${variant}`, () => {
      const { container, icon, text } = alertBox({ variant });
      const o = OLD[variant];
      expect(set(container())).toEqual(
        set(
          `inline-flex items-start gap-2 rounded-lg border ${o.border} ${o.bg} p-3`,
        ),
      );
      expect(set(icon())).toEqual(set(`mt-0.5 shrink-0 ${o.iconColor}`));
      expect(set(text())).toEqual(set(OLD_TEXT));
    });
  }
});
