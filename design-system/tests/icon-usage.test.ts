import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { lucideGlyphs, directGlyphHits } from "../scripts/check-icon-usage.mjs";

// ECO-186 — gate check-icon-usage: todo glyph de lucide se renderiza vía <Icon> (nunca directo).
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-icon-usage (ECO-186)", () => {
  it("lucideGlyphs: extrae los nombres locales; ignora `type`; resuelve `as`", () => {
    expect([
      ...lucideGlyphs(`import { Search, Bell } from "lucide-react";`),
    ]).toEqual(["Search", "Bell"]);
    // `type LucideIcon` no es renderizable → fuera.
    expect([
      ...lucideGlyphs(`import { Check, type LucideIcon } from "lucide-react";`),
    ]).toEqual(["Check"]);
    // `X as Y` → el nombre que aparece en el JSX es el alias Y.
    expect([
      ...lucideGlyphs(`import { Info as InfoIcon } from "lucide-react";`),
    ]).toEqual(["InfoIcon"]);
  });

  it("directGlyphHits: caza el render directo en 1 línea, multi-línea y `<Glyph>`", () => {
    const g = new Set(["Check"]);
    expect(directGlyphHits(`<Check size={16} />`, g)).toHaveLength(1); // 1 línea
    expect(directGlyphHits(`      <Check`, g)).toHaveLength(1); // nombre a final de línea (multi-línea)
    expect(directGlyphHits(`<Check>`, g)).toHaveLength(1);
    // NO debe confundir un componente que empieza igual.
    expect(directGlyphHits(`<CheckboxThing />`, g)).toHaveLength(0);
  });

  it("directGlyphHits: NO marca `icon={Glyph}` ni las líneas con `icon-ok`", () => {
    const g = new Set(["Search"]);
    expect(directGlyphHits(`<Icon icon={Search} size="md" />`, g)).toHaveLength(
      0,
    ); // pasar el componente ≠ render
    expect(
      directGlyphHits(`<Search className="anim" /> // icon-ok: animación`, g),
    ).toHaveLength(0); // escape
  });

  it("el DS (components/ + sections/) está LIMPIO: todo icono vía <Icon> (guard permanente)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-icon-usage.mjs")], {
        cwd: DS,
      }),
    ).not.toThrow();
  });
});
