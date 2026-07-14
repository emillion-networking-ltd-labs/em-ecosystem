import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — .mjs script without types
import { pieceMeasureHits } from "../scripts/check-piece-measure-usage.mjs";

// ECO-206 (design-tokens / ADR-033) — check-piece-measure-usage: a piece's container width comes from a token,
// not an arbitrary max-w-[Npx]/min-w-[Npx]. Tier-aware; text truncation + intrinsic element sizes are exempt.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-piece-measure-usage (ECO-206)", () => {
  it("flags arbitrary container widths in core; exempts token, decorative, truncate, intrinsic w/h, escape", () => {
    expect(
      pieceMeasureHits('// @ds-tier: core\nx = "max-w-[390px]"'),
    ).toHaveLength(1); // arbitrary dialog width
    expect(
      pieceMeasureHits('// @ds-tier: core\nx = "min-w-[180px]"'),
    ).toHaveLength(1); // arbitrary dropdown min
    expect(
      pieceMeasureHits('// @ds-tier: core\nx = "max-w-[var(--dialog-sm)]"'),
    ).toHaveLength(0); // token
    expect(
      pieceMeasureHits('// @ds-tier: core\nx = "max-w-[220px] truncate"'),
    ).toHaveLength(0); // text truncation
    expect(
      pieceMeasureHits('// @ds-tier: core\nx = "w-[350px] h-[120px]"'),
    ).toHaveLength(0); // intrinsic w/h, not gated
    expect(
      pieceMeasureHits('// @ds-tier: decorative\nx = "max-w-[999px]"'),
    ).toHaveLength(0); // decorative exempt
    expect(
      pieceMeasureHits(
        '// @ds-tier: core\nx = "min-w-[200px]" // piece-measure-ok: x',
      ),
    ).toHaveLength(0); // escape
  });

  it("core DS pieces are clean of arbitrary container widths (guard)", () => {
    expect(() =>
      execFileSync(
        "node",
        [join(DS, "scripts", "check-piece-measure-usage.mjs")],
        { cwd: DS },
      ),
    ).not.toThrow();
  });
});
