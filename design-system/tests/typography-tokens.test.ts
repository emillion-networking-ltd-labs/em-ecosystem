import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { typographyHits } from "../scripts/check-typography-tokens.mjs";

// ECO-193 — gate de dimensión tipografía: tamaño de fuente desde tokens, no `text-[Npx]` arbitrario.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-typography-tokens (ECO-193)", () => {
  it("caza tamaño de fuente arbitrario (px/rem/em)", () => {
    expect(typographyHits(`<p className="text-[14px]" />`)).toHaveLength(1);
    expect(typographyHits(`className="text-[1.5rem] font-bold"`)).toHaveLength(
      1,
    );
  });

  it("NO caza token dentro de arbitrary, ni color, ni otros text-* (precisión)", () => {
    expect(typographyHits(`className="text-[var(--text-body)]"`)).toHaveLength(
      0,
    );
    expect(typographyHits(`className="text-[#a0bce8]"`)).toHaveLength(0); // color → raw-color
    expect(
      typographyHits(`className="text-body text-content-primary"`),
    ).toHaveLength(0);
  });

  it("respeta `type-ok` (línea o anterior)", () => {
    expect(
      typographyHits(`className="text-[14px]" /* type-ok: x */`),
    ).toHaveLength(0);
  });

  it("la flota no supera el baseline (guard permanente, ratchet)", () => {
    expect(() =>
      execFileSync(
        "node",
        [join(DS, "scripts", "check-typography-tokens.mjs")],
        { cwd: DS },
      ),
    ).not.toThrow();
  });
});
