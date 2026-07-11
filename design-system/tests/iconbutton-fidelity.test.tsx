import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync } from "node:fs";
import { Pencil } from "lucide-react";
import IconButton, { type IconButtonVariant } from "@/components/ui/IconButton";
import IconButtonOld from "./fixtures/IconButtonOld";

// ECO-169 — GUARDA DE FIDELIDAD de IconButton (contrato tv vs. la versión previa de mapas + cn/twMerge).
// IconButton usaba cn() (twMerge), no raw concat → su tv va con twMerge ON: este test EXIGE que el conjunto
// de clases del <button> sea IDÉNTICO viejo-vs-nuevo para cada combinación de ejes. Se retira al cerrar la pieza.

const VARIANTS = [
  "default",
  "inside input",
  "danger",
  "boxed",
  "boxed-hover",
] as const;
const SIZES = ["sm", "md"] as const;
const SHAPES = ["square", "circle"] as const;

const Icon = () => <svg width="16" height="16" aria-hidden="true" />;

const classSet = (el: Element | null) =>
  el
    ? (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort()
    : null;

function extract(container: HTMLElement) {
  const btn = container.querySelector("button")!;
  return { tag: btn.tagName.toLowerCase(), root: classSet(btn) };
}

const rows: {
  name: string;
  ok: boolean;
  old: ReturnType<typeof extract>;
  neu: ReturnType<typeof extract>;
}[] = [];

describe("IconButton — fidelidad de atributos (viejo cn/maps vs nuevo tv), por caso", () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const shape of SHAPES) {
        it(`${variant} · ${size} · ${shape}`, () => {
          const v = variant as IconButtonVariant;
          const oldR = render(
            <IconButtonOld variant={v} size={size} shape={shape} aria-label="x">
              <Icon />
            </IconButtonOld>,
          );
          const old = extract(oldR.container);
          oldR.unmount();
          const newR = render(
            <IconButton variant={v} size={size} shape={shape} aria-label="x">
              <Icon />
            </IconButton>,
          );
          const neu = extract(newR.container);
          newR.unmount();

          const ok =
            neu.tag === old.tag &&
            JSON.stringify(neu.root) === JSON.stringify(old.root);
          rows.push({ name: `${variant} · ${size} · ${shape}`, ok, old, neu });

          expect(neu.tag).toBe(old.tag);
          expect(neu.root).toEqual(old.root);
        });
      }
    }
  }

  it("emite la tabla viejo-vs-nuevo (JSON) para revisión", () => {
    const mism = rows.filter((r) => !r.ok);
    writeFileSync(
      "/tmp/iconbutton-fidelity.json",
      JSON.stringify(
        { total: rows.length, mismatches: mism.length, rows },
        null,
        2,
      ),
    );
    expect(mism.length).toBe(0);
  });
});

// ECO-182 — FIDELIDAD del prop `icon`: el contenedor impone el tamaño desde la escala (`<Icon size="md">` = 16px).
// El SVG que renderiza `<IconButton icon={Glyph}/>` debe ser EQUIVALENTE al viejo `<IconButton><Glyph size={16}/>`
// (mismo glyph, mismo 16px) — la migración de call-sites no cambia lo que se ve.
const svgSig = (c: HTMLElement) => {
  const svg = c.querySelector("svg")!;
  return {
    tag: svg.tagName.toLowerCase(),
    width: svg.getAttribute("width"),
    height: svg.getAttribute("height"),
    cls: (svg.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort(),
    parts: svg.querySelectorAll("path,line,circle,rect,polyline,polygon")
      .length,
  };
};

describe("IconButton — prop `icon` equivale al glyph dimensionado a mano (16px)", () => {
  it("icon={Pencil} == <Pencil size={16}/> como children", () => {
    const viaProp = render(<IconButton icon={Pencil} aria-label="x" />);
    const sigProp = svgSig(viaProp.container);
    viaProp.unmount();

    const viaChild = render(
      <IconButton aria-label="x">
        <Pencil size={16} />
      </IconButton>,
    );
    const sigChild = svgSig(viaChild.container);
    viaChild.unmount();

    expect(sigProp.width).toBe("16");
    expect(sigProp).toEqual(sigChild);
  });
});
