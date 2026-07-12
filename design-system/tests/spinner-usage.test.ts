import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { spinnerHits } from "../scripts/check-spinner-usage.mjs";

// ECO-191 — gate de dimensión spinner: no `animate-spin` a mano (usa SpinnerCircle/Ring/Infinity).
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-spinner-usage (ECO-191)", () => {
  it("caza `animate-spin` a mano (clase completa)", () => {
    expect(
      spinnerHits(
        `<div className="h-4 w-4 animate-spin rounded-full border-2" />`,
      ),
    ).toHaveLength(1);
  });

  it("NO caza `animate-spin-around` (ShimmerButton, otra animación) — precisión por-dimensión", () => {
    expect(
      spinnerHits(
        `<div className="animate-spin-around absolute -inset-full" />`,
      ),
    ).toHaveLength(0);
  });

  it("respeta el escape `spinner-ok`", () => {
    expect(
      spinnerHits(`<div className="animate-spin" /> // spinner-ok: caso raro`),
    ).toHaveLength(0);
  });

  it("el DS (components/ + sections/) está LIMPIO de spinner a mano (guard permanente)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-spinner-usage.mjs")], {
        cwd: DS,
      }),
    ).not.toThrow();
  });
});
