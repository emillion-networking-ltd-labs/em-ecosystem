import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync } from "node:fs";
import Tabs from "@/components/ui/Tabs";
import TabsOld from "./fixtures/TabsOld";

// ECO-171 — GUARDA DE FIDELIDAD de Tabs (contrato tv de DOS superficies vs. la composición imperativa previa).
// Compara, para cada variante × tamaño × fullWidth × wrap, el conjunto de clases del tablist (contenedor) Y de
// los 3 items (item 0 activo → cubre active/inactive Y el border-r posicional). Se retira al cerrar la pieza.

const VARIANTS = ["subtle", "nav", "nav-horizontal"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const BOOLS = [false, true] as const;

const TABS = [
  { label: "One", value: "one" },
  { label: "Two", value: "two" },
  { label: "Three", value: "three" },
];
const noop = () => {};

// El Tabs VIEJO volcaba un token basura literal "false" en el contenedor nav/nav-horizontal
// (`${!isNav && "…"}` → con nav, `false && "…"` = false → el template escribe "false"). No es una clase
// real (ningún CSS la matchea) — el tv la elimina. Se filtra aquí: comparamos clases EFECTIVAS, no el token inerte.
const classSet = (el: Element | null) =>
  el
    ? (el.getAttribute("class") || "")
        .split(/\s+/)
        .filter((c) => c && c !== "false" && c !== "true")
        .sort()
    : null;

function extract(container: HTMLElement) {
  const list = container.querySelector('[role="tablist"]')!;
  const items = Array.from(list.querySelectorAll('[role="tab"]'));
  return {
    container: classSet(list),
    items: items.map((b) => classSet(b)),
  };
}

const rows: {
  name: string;
  ok: boolean;
  old: ReturnType<typeof extract>;
  neu: ReturnType<typeof extract>;
}[] = [];

describe("Tabs — fidelidad de atributos (viejo raw/imperativo vs nuevo tv), por caso", () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const fullWidth of BOOLS) {
        for (const wrap of BOOLS) {
          const name = `${variant} · ${size} · fw=${fullWidth} · wrap=${wrap}`;
          it(name, () => {
            const props = {
              tabs: TABS,
              activeTab: "one",
              onChange: noop,
              variant,
              size,
              fullWidth,
              wrap,
            };
            const oldR = render(<TabsOld {...props} />);
            const old = extract(oldR.container);
            oldR.unmount();
            const newR = render(<Tabs {...props} />);
            const neu = extract(newR.container);
            newR.unmount();

            const ok = JSON.stringify(old) === JSON.stringify(neu);
            rows.push({ name, ok, old, neu });

            expect(neu.container).toEqual(old.container);
            expect(neu.items).toEqual(old.items);
          });
        }
      }
    }
  }

  it("emite la tabla viejo-vs-nuevo (JSON) para revisión", () => {
    const mism = rows.filter((r) => !r.ok);
    writeFileSync(
      "/tmp/tabs-fidelity.json",
      JSON.stringify(
        { total: rows.length, mismatches: mism.length, rows },
        null,
        2,
      ),
    );
    expect(mism.length).toBe(0);
  });
});
