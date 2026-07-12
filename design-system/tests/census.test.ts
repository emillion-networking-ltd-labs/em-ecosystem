import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — .mjs script has no types
import { classify } from "../scripts/census.mjs";

// ECO-196 — corpus census: mechanical classification (on-tv/Specs/axes) for the Phase-1 worklist.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("census (ECO-196)", () => {
  it("detects the tv idiom and <name>Specs", () => {
    expect(classify("X", `import { tv } from "tailwind-variants";`).onTv).toBe(
      true,
    );
    expect(classify("X", `const x = 1;`).onTv).toBe(false);
    expect(classify("X", `export const xSpecs = {};`).hasSpecs).toBe(true);
  });

  it("detects the axes (variant/size/shape) declared as props", () => {
    expect(classify("X", `  size?: "sm" | "md";`).axes).toEqual(["size"]);
    expect(classify("X", `  variant?: "a";\n  size?: "sm";`).axes).toEqual([
      "variant",
      "size",
    ]);
    expect(classify("X", `const size = 4;`).axes).toEqual([]); // not a prop
  });

  it("flags tvCandidate = has axes and is NOT on tv", () => {
    expect(classify("X", `  size?: "sm";`).tvCandidate).toBe(true);
    expect(
      classify("X", `import { tv } from "tailwind-variants";\n  size?: "sm";`)
        .tvCandidate,
    ).toBe(false); // already on tv
    expect(classify("X", `const x = 1;`).tvCandidate).toBe(false); // no axes
  });

  it("runs without throwing (repeatable detector)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "census.mjs")], { cwd: DS }),
    ).not.toThrow();
  });

  it("detects the declared role (@ds-role)", () => {
    expect(classify("X", `// @ds-role: primitive\n`).role).toBe("primitive");
    expect(classify("X", `// @ds-role: composite\n`).role).toBe("composite");
    expect(classify("X", `const x = 1;`).role).toBe(null);
  });

  it("census.json is fresh (== census --json) — never stale", () => {
    const onDisk = JSON.parse(readFileSync(join(DS, "census.json"), "utf8"));
    const fresh = JSON.parse(
      execFileSync("node", [join(DS, "scripts", "census.mjs"), "--json"], {
        cwd: DS,
      }).toString(),
    );
    expect(onDisk).toEqual(fresh);
  });
});
