import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync } from "node:fs";
import Button from "@/components/ui/Button";
import ButtonOld from "./fixtures/ButtonOld";

// ECO-163 — GUARDA DE FIDELIDAD del Button de referencia (contrato tv vs. la versión previa de mapas).
// NO se compara "a ojo": renderiza el Button VIEJO real (fixture desde git main) y el NUEVO (tv) para CADA
// caso, extrae los atributos que llegan al DOM (tag, clases, disabled, draggable, href) de cada elemento
// (root/label/spinner) y exige que sean IGUALES. Las clases se comparan como conjunto ordenado (el orden en
// el atributo class NO afecta al render). Emite además una tabla viejo-vs-nuevo para revisión humana.

const VARIANTS = ["primary", "secondary", "outline", "danger", "link", "link-underline"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const CIRCLE = "h-9! w-9! min-w-0! rounded-full! px-0!";

type Props = Record<string, unknown>;
const cases: { name: string; props: Props }[] = [];
for (const variant of VARIANTS)
  for (const size of SIZES)
    for (const fullWidth of [true, false])
      for (const loading of [false, true])
        cases.push({ name: `${variant} · ${size} · fw=${fullWidth} · loading=${loading}`, props: { variant, size, fullWidth, loading } });
for (const variant of ["primary", "secondary", "outline", "danger"] as const)
  cases.push({ name: `circular · ${variant}`, props: { variant, fullWidth: false, className: CIRCLE } });
cases.push({ name: `link como <a> (href)`, props: { variant: "link-underline", as: "a", href: "/x" } });
cases.push({ name: `control como <a> (href)`, props: { variant: "primary", as: "a", href: "/x" } });
cases.push({ name: `disabled`, props: { variant: "primary", disabled: true } });

const classSet = (el: Element | null) =>
  el ? (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort() : null;

function extract(container: HTMLElement) {
  const root = container.firstElementChild as Element;
  const spinner = root.querySelector('[role="status"]');
  // el label es el primer <span> que NO es el spinner
  const label = Array.from(root.querySelectorAll("span")).find((s) => s !== spinner) || null;
  return {
    tag: root.tagName.toLowerCase(),
    disabled: root.hasAttribute("disabled"),
    draggable: root.getAttribute("draggable"),
    href: root.getAttribute("href"),
    root: classSet(root),
    label: classSet(label),
    spinner: classSet(spinner),
  };
}

const rows: { name: string; ok: boolean; old: ReturnType<typeof extract>; neu: ReturnType<typeof extract> }[] = [];

describe("Button — fidelidad de atributos (viejo mapas vs nuevo tv), por caso", () => {
  for (const c of cases) {
    it(c.name, () => {
      const oldR = render(<ButtonOld {...c.props}>X</ButtonOld>);
      const old = extract(oldR.container);
      oldR.unmount();
      const newR = render(<Button {...c.props}>X</Button>);
      const neu = extract(newR.container);
      newR.unmount();

      const ok =
        old.tag === neu.tag &&
        old.disabled === neu.disabled &&
        old.draggable === neu.draggable &&
        old.href === neu.href &&
        JSON.stringify(old.root) === JSON.stringify(neu.root) &&
        JSON.stringify(old.label) === JSON.stringify(neu.label) &&
        JSON.stringify(old.spinner) === JSON.stringify(neu.spinner);
      rows.push({ name: c.name, ok, old, neu });

      // atributos no-clase: idénticos
      expect(neu.tag).toBe(old.tag);
      expect(neu.disabled).toBe(old.disabled);
      expect(neu.draggable).toBe(old.draggable);
      expect(neu.href).toBe(old.href);
      // clases (conjunto) de cada elemento: idénticas
      expect(neu.root).toEqual(old.root);
      expect(neu.label).toEqual(old.label);
      expect(neu.spinner).toEqual(old.spinner);
    });
  }

  it("emite la tabla viejo-vs-nuevo (JSON) para revisión", () => {
    const mism = rows.filter((r) => !r.ok);
    writeFileSync("/tmp/button-fidelity.json", JSON.stringify({ total: rows.length, mismatches: mism.length, rows }, null, 2));
    // eslint-disable-next-line no-console
    console.log(`\nFIDELIDAD Button: ${rows.length} casos comparados, ${mism.length} con diferencia.`);
    expect(mism.length).toBe(0);
  });
});
