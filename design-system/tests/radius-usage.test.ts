import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — .mjs script without types
import { radiusHits } from "../scripts/check-radius-usage.mjs";

// ECO-208 (design-tokens / ADR-033) — check-radius-usage: a corner radius comes from the token scale (rounded-*
// mapped from --radius-*), not an arbitrary rounded-[Npx]. Tier-aware; keyword/var values are exempt.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-radius-usage (ECO-208)", () => {
  it("flags arbitrary radii in core; exempts token scale, var, keyword, decorative, escape", () => {
    expect(radiusHits('// @ds-tier: core\nx = "rounded-[3px]"')).toHaveLength(
      1,
    ); // arbitrary radius
    expect(
      radiusHits('// @ds-tier: core\nx = "rounded-tl-[6px]"'),
    ).toHaveLength(1); // arbitrary per-corner radius
    expect(radiusHits('// @ds-tier: core\nx = "rounded-xs"')).toHaveLength(0); // token scale
    expect(
      radiusHits('// @ds-tier: core\nx = "rounded-[var(--radius-sm)]"'),
    ).toHaveLength(0); // var token
    expect(
      radiusHits('// @ds-tier: core\nx = "rounded-[inherit]"'),
    ).toHaveLength(0); // keyword, not a magic length
    expect(
      radiusHits('// @ds-tier: decorative\nx = "rounded-[9999px]"'),
    ).toHaveLength(0); // decorative exempt
    expect(
      radiusHits('// @ds-tier: core\nx = "rounded-[3px]" // radius-ok: x'),
    ).toHaveLength(0); // escape
  });

  it("core DS pieces are clean of arbitrary radii (guard)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-radius-usage.mjs")], {
        cwd: DS,
      }),
    ).not.toThrow();
  });
});
