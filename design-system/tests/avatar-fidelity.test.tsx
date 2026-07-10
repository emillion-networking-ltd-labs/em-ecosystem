import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync } from "node:fs";
import Avatar from "@/components/ui/Avatar";
import AvatarOld from "./fixtures/AvatarOld";

// ECO-170 — GUARDA DE FIDELIDAD de Avatar (contrato tv vs. la versión previa de raw-concat + mapas).
// Avatar solo tiene eje `size` y tres modos de CONTENIDO (image → initials → icon). Se compara, para cada
// tamaño × modo, el tag + las clases del <div> raíz Y del hijo (img/span/svg). Se retira al cerrar la pieza.

const SIZES = ["sm", "md", "lg"] as const;
const MODES = [
  { key: "image", props: { name: "Ada Lovelace", src: "/uploads/a.png" } },
  { key: "initials", props: { name: "Ada Lovelace" } },
  { key: "icon", props: {} as Record<string, never> },
] as const;

const classSet = (el: Element | null) =>
  el ? (el.getAttribute("class") || "").split(/\s+/).filter(Boolean).sort() : null;

function extract(container: HTMLElement) {
  const root = container.firstElementChild as Element;
  const child = root.firstElementChild;
  return {
    tag: root.tagName.toLowerCase(),
    root: classSet(root),
    childTag: child ? child.tagName.toLowerCase() : null,
    child: classSet(child),
  };
}

const rows: { name: string; ok: boolean; old: ReturnType<typeof extract>; neu: ReturnType<typeof extract> }[] = [];

describe("Avatar — fidelidad de atributos (viejo raw/maps vs nuevo tv), por caso", () => {
  for (const size of SIZES) {
    for (const mode of MODES) {
      it(`${size} · ${mode.key}`, () => {
        const oldR = render(<AvatarOld size={size} {...mode.props} />);
        const old = extract(oldR.container);
        oldR.unmount();
        const newR = render(<Avatar size={size} {...mode.props} />);
        const neu = extract(newR.container);
        newR.unmount();

        const ok =
          neu.tag === old.tag &&
          neu.childTag === old.childTag &&
          JSON.stringify(neu.root) === JSON.stringify(old.root) &&
          JSON.stringify(neu.child) === JSON.stringify(old.child);
        rows.push({ name: `${size} · ${mode.key}`, ok, old, neu });

        expect(neu.tag).toBe(old.tag);
        expect(neu.childTag).toBe(old.childTag);
        expect(neu.root).toEqual(old.root);
        expect(neu.child).toEqual(old.child);
      });
    }
  }

  it("emite la tabla viejo-vs-nuevo (JSON) para revisión", () => {
    const mism = rows.filter((r) => !r.ok);
    writeFileSync(
      "/tmp/avatar-fidelity.json",
      JSON.stringify({ total: rows.length, mismatches: mism.length, rows }, null, 2),
    );
    expect(mism.length).toBe(0);
  });
});
