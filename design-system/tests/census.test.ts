import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { classify } from "../scripts/census.mjs";

// ECO-196 — censo del corpus: clasificación mecánica (on-tv/Specs/axes) para el worklist de Fase 1.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("census (ECO-196)", () => {
  it("detecta el idioma tv y los <name>Specs", () => {
    expect(classify("X", `import { tv } from "tailwind-variants";`).onTv).toBe(
      true,
    );
    expect(classify("X", `const x = 1;`).onTv).toBe(false);
    expect(classify("X", `export const xSpecs = {};`).hasSpecs).toBe(true);
  });

  it("detecta los ejes (variant/size/shape) declarados como prop", () => {
    expect(classify("X", `  size?: "sm" | "md";`).axes).toEqual(["size"]);
    expect(classify("X", `  variant?: "a";\n  size?: "sm";`).axes).toEqual([
      "variant",
      "size",
    ]);
    expect(classify("X", `const size = 4;`).axes).toEqual([]); // no es prop
  });

  it("marca tvCandidate = tiene ejes y NO está en tv", () => {
    expect(classify("X", `  size?: "sm";`).tvCandidate).toBe(true);
    expect(
      classify("X", `import { tv } from "tailwind-variants";\n  size?: "sm";`)
        .tvCandidate,
    ).toBe(false); // ya en tv
    expect(classify("X", `const x = 1;`).tvCandidate).toBe(false); // sin ejes
  });

  it("el censo corre sin lanzar (detector repetible)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "census.mjs")], { cwd: DS }),
    ).not.toThrow();
  });
});
