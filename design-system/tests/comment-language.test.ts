import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — .mjs script without types
import { spanishLineCount } from "../scripts/check-comment-language.mjs";

// ECO-207 — check-comment-language: code AND code comments must be English. Detects Spanish-specific characters.
// Spanish test inputs are built with String.fromCharCode so this file contains no literal Spanish (otherwise it
// would flag itself).
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const N = String.fromCharCode(0xf1); // n-tilde
const O = String.fromCharCode(0xf3); // accented o
const E = String.fromCharCode(0xe9); // accented e
const Q = String.fromCharCode(0xbf); // inverted question mark

describe("check-comment-language (ECO-207)", () => {
  it("counts lines with Spanish characters; English and lang-ok lines are clean", () => {
    expect(spanishLineCount("// a" + N + "o de creaci" + O + "n")).toBe(1);
    expect(spanishLineCount("// " + Q + "por qu" + E + "?")).toBe(1);
    expect(spanishLineCount("// year of creation")).toBe(0);
    expect(spanishLineCount("const x = 1; // token")).toBe(0);
    expect(spanishLineCount("// a" + N + "o // lang-ok: proper noun")).toBe(0);
    expect(spanishLineCount("line1\n// dise" + N + "o\nline3")).toBe(1);
  });

  it("the DS code stays within the ratchet baseline (guard: a new Spanish line breaks it)", () => {
    expect(() =>
      execFileSync(
        "node",
        [join(DS, "scripts", "check-comment-language.mjs")],
        { cwd: DS },
      ),
    ).not.toThrow();
  });
});
