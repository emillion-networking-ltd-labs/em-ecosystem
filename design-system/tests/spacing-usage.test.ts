import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — .mjs script without types
import { spacingHits } from "../scripts/check-spacing-usage.mjs";

// ECO-208 (design-tokens / ADR-033) — check-spacing-usage: padding/margin/gap come from the spacing scale
// (mapped from --spacing-*), not an arbitrary p-[Npx]/m-[Npx]/gap-[Npx]. ESTRUCTURA-DS (universal, no tier exemption).
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-spacing-usage (ECO-208)", () => {
  it("flags arbitrary padding/margin/gap; exempts scale, named 1px, var, w/h, escape", () => {
    expect(spacingHits('x = "px-[50px]"')).toHaveLength(1); // arbitrary padding
    expect(spacingHits('x = "gap-[8px]"')).toHaveLength(1); // arbitrary gap
    expect(spacingHits('x = "space-y-[12px]"')).toHaveLength(1); // arbitrary space-y
    expect(spacingHits('x = "px-8 gap-2"')).toHaveLength(0); // scale
    expect(spacingHits('x = "gap-px mx-px"')).toHaveLength(0); // named 1px, on-scale (no brackets)
    expect(spacingHits('x = "p-[var(--spacing-4)]"')).toHaveLength(0); // var token
    expect(spacingHits('x = "w-[350px] max-w-[400px]"')).toHaveLength(0); // width, not spacing
    expect(spacingHits('x = "px-[50px]" // spacing-ok: x')).toHaveLength(0); // escape
  });

  it("core DS pieces are clean of arbitrary padding/margin/gap (guard)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-spacing-usage.mjs")], {
        cwd: DS,
      }),
    ).not.toThrow();
  });
});
