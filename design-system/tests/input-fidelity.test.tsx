import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync } from "node:fs";
import Input from "@/components/ui/Input";
import InputOld from "./fixtures/InputOld";

// ECO-177 — GUARDA DE FIDELIDAD de Input (la CAJA a tv vs. la composición raw previa). Compara el conjunto de
// clases del <div> caja (el padre del <input>) para cada variant × size × error × disabled. Se retira al cerrar.

const VARIANTS = ["default", "filled"] as const;
const SIZES = ["sm", "md"] as const;
const BOOLS = [false, true] as const;

const classSet = (el: Element | null) =>
  el ? (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort() : null;

const box = (container: HTMLElement) =>
  classSet(container.querySelector("input")!.parentElement);

const rows: { name: string; ok: boolean; old: string[] | null; neu: string[] | null }[] = [];

describe("Input — fidelidad de la caja (viejo raw vs nuevo tv), por caso", () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const error of BOOLS) {
        for (const disabled of BOOLS) {
          const name = `${variant} · ${size} · error=${error} · disabled=${disabled}`;
          it(name, () => {
            const props = {
              variant,
              size,
              error: error ? "err" : undefined,
              disabled,
            };
            const oldR = render(<InputOld {...props} />);
            const old = box(oldR.container);
            oldR.unmount();
            const newR = render(<Input {...props} />);
            const neu = box(newR.container);
            newR.unmount();

            const ok = JSON.stringify(old) === JSON.stringify(neu);
            rows.push({ name, ok, old, neu });
            expect(neu).toEqual(old);
          });
        }
      }
    }
  }

  it("emite la tabla viejo-vs-nuevo (JSON) para revisión", () => {
    const mism = rows.filter((r) => !r.ok);
    writeFileSync(
      "/tmp/input-fidelity.json",
      JSON.stringify({ total: rows.length, mismatches: mism.length, rows }, null, 2),
    );
    expect(mism.length).toBe(0);
  });
});
