import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync } from "node:fs";
import SegmentedControl from "@/components/ui/SegmentedControl";
import SegmentedControlOld from "./fixtures/SegmentedControlOld";

// ECO-172 — GUARDA DE FIDELIDAD de SegmentedControl (contrato tv de 2 superficies vs. la composición previa).
// Compara, para cada variante × tamaño, el conjunto de clases del contenedor Y de las 2 opciones (opción 0 activa
// → cubre el estado activo por variante; opción 1 inactiva → estado fijo). Se retira al cerrar la pieza.

const VARIANTS = ["primary", "secondary", "outline"] as const;
const SIZES = ["sm", "md", "lg"] as const;

const OPTIONS = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];
const noop = () => {};

const classSet = (el: Element | null) =>
  el ? (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort() : null;

function extract(container: HTMLElement) {
  const root = container.firstElementChild as Element;
  const options = Array.from(root.querySelectorAll("button"));
  return { container: classSet(root), options: options.map((b) => classSet(b)) };
}

const rows: { name: string; ok: boolean; old: ReturnType<typeof extract>; neu: ReturnType<typeof extract> }[] = [];

describe("SegmentedControl — fidelidad de atributos (viejo raw/maps vs nuevo tv), por caso", () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      const name = `${variant} · ${size}`;
      it(name, () => {
        const props = { options: OPTIONS, value: "a", onChange: noop, variant, size };
        const oldR = render(<SegmentedControlOld {...props} />);
        const old = extract(oldR.container);
        oldR.unmount();
        const newR = render(<SegmentedControl {...props} />);
        const neu = extract(newR.container);
        newR.unmount();

        const ok = JSON.stringify(old) === JSON.stringify(neu);
        rows.push({ name, ok, old, neu });

        expect(neu.container).toEqual(old.container);
        expect(neu.options).toEqual(old.options);
      });
    }
  }

  it("emite la tabla viejo-vs-nuevo (JSON) para revisión", () => {
    const mism = rows.filter((r) => !r.ok);
    writeFileSync(
      "/tmp/segmentedcontrol-fidelity.json",
      JSON.stringify({ total: rows.length, mismatches: mism.length, rows }, null, 2),
    );
    expect(mism.length).toBe(0);
  });
});
