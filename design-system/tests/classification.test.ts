import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
// @ts-expect-error — .mjs script has no types
import { unclassified } from "../scripts/check-classification.mjs";

// ECO-197 — classification gate (axis B of the DoD): every component declares `// @ds-role: primitive|composite`.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-classification (ECO-197)", () => {
  it("unclassified() lists ONLY components without @ds-role", () => {
    const dir = mkdtempSync(join(tmpdir(), "cls-"));
    writeFileSync(
      join(dir, "A.tsx"),
      "// @ds-role: primitive\nexport default 1;",
    );
    writeFileSync(
      join(dir, "B.tsx"),
      "// @ds-role: composite\nexport default 1;",
    );
    writeFileSync(join(dir, "C.tsx"), "export default 1;"); // no role
    expect(unclassified(dir).sort()).toEqual(["C"]);
    rmSync(dir, { recursive: true });
  });

  it("does not match an invented role (only primitive|composite)", () => {
    const dir = mkdtempSync(join(tmpdir(), "cls-"));
    writeFileSync(join(dir, "D.tsx"), "// @ds-role: atom\nexport default 1;"); // invalid → unclassified
    expect(unclassified(dir)).toEqual(["D"]);
    rmSync(dir, { recursive: true });
  });

  it("the gate passes (ratchet: unclassified ≤ baseline)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-classification.mjs")], {
        cwd: DS,
      }),
    ).not.toThrow();
  });
});
