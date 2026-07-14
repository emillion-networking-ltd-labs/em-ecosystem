import { describe, it, expect } from "vitest";
import { countdownTimer } from "@/components/ui/CountdownTimer";

// ECO-188 — FIDELIDAD de la migración a tv (slots): el conjunto de clases de cada slot (root/digit/sep) debe ser
// IDÉNTICO viejo (concat de mapas) vs nuevo (tv, twMerge:false), por variant×size. Se retira al cerrar la pieza.
const OLD_V = {
  error: {
    digitBg: "bg-error-bg",
    digitText: "text-error",
    sepText: "text-error",
  },
  warning: {
    digitBg: "bg-warning-bg",
    digitText: "text-warning",
    sepText: "text-warning",
  },
} as const;
const OLD_S = {
  sm: {
    digit: "w-[1.25em] h-[1.5em] text-caption rounded-[3px]",
    sep: "text-caption mx-px",
    gap: "gap-px",
  },
  md: {
    digit: "w-6 h-8 text-h3 rounded-md",
    sep: "text-h3 mx-0.5",
    gap: "gap-0.5",
  },
  lg: {
    digit: "w-8 h-10 text-h1 rounded-lg",
    sep: "text-h1 mx-1",
    gap: "gap-1",
  },
} as const;
const DIGIT_BASE =
  "inline-flex items-center justify-center overflow-hidden font-normal tabular-nums";
const set = (s: string) => s.split(/\s+/).filter(Boolean).sort();

const VARIANTS = ["error", "warning"] as const;
const SIZES = ["sm", "md", "lg"] as const;

describe("CountdownTimer — fidelidad de slots (viejo concat vs nuevo tv)", () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      it(`${variant} · ${size}`, () => {
        const { root, digit, sep } = countdownTimer({ variant, size });
        const v = OLD_V[variant];
        const s = OLD_S[size];
        expect(set(root())).toEqual(
          set(`inline-flex shrink-0 items-center ${s.gap}`),
        );
        expect(set(digit())).toEqual(
          set(`${DIGIT_BASE} ${v.digitBg} ${v.digitText} ${s.digit}`),
        );
        expect(set(sep())).toEqual(set(`${v.sepText} ${s.sep} font-semibold`));
      });
    }
  }
});
