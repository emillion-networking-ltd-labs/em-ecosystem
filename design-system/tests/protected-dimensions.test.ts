import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — scripts .mjs sin tipos
import { checkManifest } from "../scripts/check-protected-dimensions.mjs";
// @ts-expect-error
import { ratchetCheck, nextBaseline } from "../scripts/_ratchet.mjs";

// ECO-190 — meta-gate del manifiesto de dimensiones protegidas + ratchet (estrategia design-enforcement).
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const GATES = [
  "check-icon-usage.mjs",
  "check-raw-color.mjs",
  "check-spinner-usage.mjs",
];
const COV =
  "node scripts/check-icon-usage.mjs && node scripts/check-raw-color.mjs";
const okDim = {
  dimension: "icon",
  piece: "<Icon>",
  gate: "check-icon-usage.mjs",
  scope: "ds",
  escape: "icon-ok",
  mode: "enforce",
};

describe("check-protected-dimensions (ECO-190) — meta-gate manifiesto <-> gates", () => {
  it("manifiesto válido: 0 errores", () => {
    // gateFiles sin ningún `check-*-usage` sin registrar (si no, el reverse lo marcaría).
    const cleanGates = ["check-icon-usage.mjs", "check-raw-color.mjs"];
    expect(checkManifest({ dimensions: [okDim] }, cleanGates, COV)).toEqual([]);
  });

  it("FORWARD: falla si el gate de una dimensión no existe o no está cableado", () => {
    const noFile = checkManifest(
      { dimensions: [{ ...okDim, gate: "check-ghost.mjs" }] },
      GATES,
      COV,
    );
    expect(noFile.some((e) => e.includes("no existe"))).toBe(true);
    const notWired = checkManifest(
      { dimensions: [{ ...okDim, gate: "check-spinner-usage.mjs" }] },
      GATES,
      COV,
    );
    expect(notWired.some((e) => e.includes("no está cableado"))).toBe(true);
  });

  it("REVERSE: falla si un gate check-*-usage no está registrado en el manifiesto", () => {
    // check-spinner-usage.mjs existe pero NO está en el manifiesto → debe fallar.
    const errs = checkManifest(
      { dimensions: [okDim] },
      GATES,
      COV + " && node scripts/check-spinner-usage.mjs",
    );
    expect(
      errs.some(
        (e) =>
          e.includes("check-spinner-usage.mjs") && e.includes("no registrado"),
      ),
    ).toBe(true);
  });

  it("valida campos requeridos + scope/mode", () => {
    expect(
      checkManifest(
        { dimensions: [{ ...okDim, escape: undefined }] },
        GATES,
        COV,
      ).some((e) => e.includes("escape")),
    ).toBe(true);
    expect(
      checkManifest(
        { dimensions: [{ ...okDim, scope: "planet" }] },
        GATES,
        COV,
      ).some((e) => e.includes("scope")),
    ).toBe(true);
    expect(
      checkManifest(
        { dimensions: [{ ...okDim, mode: "yolo" }] },
        GATES,
        COV,
      ).some((e) => e.includes("mode")),
    ).toBe(true);
  });

  it("el manifiesto REAL está sano (guard permanente)", () => {
    expect(() =>
      execFileSync(
        "node",
        [join(DS, "scripts", "check-protected-dimensions.mjs")],
        { cwd: DS },
      ),
    ).not.toThrow();
  });
});

describe("_ratchet — el baseline solo decrece", () => {
  it("ratchetCheck: falla si current > baseline permitido, pasa si <=", () => {
    expect(ratchetCheck({ g: 3 }, "g", 5).fail).toBe(true);
    expect(ratchetCheck({ g: 3 }, "g", 3).fail).toBe(false);
    expect(ratchetCheck({ g: 3 }, "g", 1).fail).toBe(false);
    expect(ratchetCheck({}, "nuevo", 1).fail).toBe(true); // sin baseline = 0 permitido
  });

  it("nextBaseline: nunca sube (min de actual y previo)", () => {
    expect(nextBaseline({}, "nuevo", 5).nuevo).toBe(5); // sin baseline previo → INICIALIZA a current
    expect(nextBaseline({ g: 3 }, "g", 1).g).toBe(1); // baja al arreglar
    expect(nextBaseline({ g: 3 }, "g", 5).g).toBe(3); // no sube aunque current sea mayor
  });
});
