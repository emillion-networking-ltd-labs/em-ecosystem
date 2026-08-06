import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ECO/#668 — the fleet comment-language check generalizes the design-system Piece-1 rule to any package.
// It REUSES the DS detector (spanishLineCount) and scans a target dir; declared per-package in code-health.toml
// and enforced by check_code_health. This guards the --count contract (a pure integer, last stdout line, run
// from the repo root — what the gate reads) and the detection itself, against a deterministic fixture.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRIPT = "scripts/check-comment-language.mjs";
// Spanish inputs built from char codes so this test file stays clean (it is scanned by the DS check itself).
const N = String.fromCharCode(0xf1); // n-tilde

let fixture: string;
beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), "cl-fleet-"));
  writeFileSync(join(fixture, "a.ts"), `// a${N}o de creacion\nexport const x = 1; // year\n`);
  writeFileSync(join(fixture, "b.ts"), `// clean english comment\nexport const y = 2;\n`);
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

describe("comment-language fleet check (#668)", () => {
  it("--count prints ONLY the integer count (last stdout line) for a target, from the repo root", () => {
    const out = execFileSync("node", [SCRIPT, "--count", "nexacore-api/src"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const last = out.trim().split("\n").filter(Boolean).at(-1);
    expect(last).toMatch(/^\d+$/); // a pure integer — what check_code_health._parse_count reads
  });

  it("reuses the DS detector: counts exactly the Spanish code lines under the target (fixture)", () => {
    const out = execFileSync("node", [SCRIPT, "--count", fixture], { cwd: ROOT, encoding: "utf8" });
    // One Spanish line (a.ts line 1); the English comment and clean file do not count.
    expect(out.trim().split("\n").filter(Boolean).at(-1)).toBe("1");
  });
});
