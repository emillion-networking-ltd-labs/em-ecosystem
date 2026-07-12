import { describe, it, expect } from "vitest";
import { selectOption } from "@/components/ui/Select";

// FIDELIDAD de la migración a tv: el conjunto de clases de la OPCIÓN debe ser IDÉNTICO viejo (cadena de
// ternarios inline) vs nuevo (tv, twMerge:false), por estado excluyente. Se retira al cerrar la pieza.
const OLD_BASE =
  "flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg text-body font-normal cursor-pointer transition-colors";
const OLD_STATE = {
  selected: "bg-surface-inverse text-content-inverse",
  danger: "text-error hover:bg-error-bg",
  focused: "bg-surface-subtle text-content-primary",
  default: "text-content-primary hover:bg-surface-subtle",
} as const;
const set = (s: string) => s.split(/\s+/).filter(Boolean).sort();

// Réplica de la fórmula vieja: prioridad selected → danger → focused → default.
const oldFormula = (
  isSelected: boolean,
  isDanger: boolean,
  isFocused: boolean,
) =>
  `${OLD_BASE} ${
    isSelected
      ? OLD_STATE.selected
      : isDanger
        ? OLD_STATE.danger
        : isFocused
          ? OLD_STATE.focused
          : OLD_STATE.default
  }`;

const STATES = ["selected", "danger", "focused", "default"] as const;

describe("Select option — fidelidad (viejo ternario inline vs nuevo tv)", () => {
  for (const state of STATES) {
    it(state, () => {
      expect(set(selectOption({ state }))).toEqual(
        set(`${OLD_BASE} ${OLD_STATE[state]}`),
      );
    });
  }

  // La prioridad excluyente del original debe mapear al mismo `state` en cada combinación de flags.
  it("prioridad selected > danger > focused > default coincide con la fórmula vieja", () => {
    for (const isSelected of [true, false]) {
      for (const isDanger of [true, false]) {
        for (const isFocused of [true, false]) {
          const state = isSelected
            ? "selected"
            : isDanger
              ? "danger"
              : isFocused
                ? "focused"
                : "default";
          expect(set(selectOption({ state }))).toEqual(
            set(oldFormula(isSelected, isDanger, isFocused)),
          );
        }
      }
    }
  });

  it("default es el valor por defecto", () => {
    expect(set(selectOption({}))).toEqual(
      set(selectOption({ state: "default" })),
    );
  });
});
