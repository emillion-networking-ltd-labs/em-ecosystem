import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Badge from "@/components/ui/Badge";
import BadgeOld from "./fixtures/BadgeOld";

// ECO-168 — GUARDA DE FIDELIDAD de Badge (contrato tv vs. la versión previa de mapas). Renderiza el Badge
// VIEJO real (fixture desde git) y el NUEVO (tv) para CADA caso (7 variantes × 3 tamaños), extrae los atributos
// del DOM (tag + clases como conjunto) y exige que sean IGUALES. NO se compara "a ojo". Se retira al cerrar la pieza.

const VARIANTS = ["default", "success", "warning", "error", "info", "kbd", "overlay"] as const;
const SIZES = ["sm", "md", "lg"] as const;

const classSet = (el: Element | null) =>
  el ? (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort() : null;

function extract(container: HTMLElement) {
  const root = container.firstElementChild as Element;
  return { tag: root.tagName.toLowerCase(), root: classSet(root) };
}

describe("Badge — fidelidad de atributos (viejo mapas vs nuevo tv), por caso", () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      it(`${variant} · ${size}`, () => {
        const oldR = render(
          <BadgeOld variant={variant} size={size}>
            X
          </BadgeOld>,
        );
        const old = extract(oldR.container);
        oldR.unmount();
        const newR = render(
          <Badge variant={variant} size={size}>
            X
          </Badge>,
        );
        const neu = extract(newR.container);
        newR.unmount();

        expect(neu.tag).toBe(old.tag);
        expect(neu.root).toEqual(old.root);
      });
    }
  }
});
