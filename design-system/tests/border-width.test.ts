import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { borderWidthHits } from "../scripts/check-border-width-usage.mjs";

// ECO-205 (design-tokens / ADR-033) — gate check-border-width-usage: el grosor de borde sale de token
// (`border` 1px base o border-[var(--border-width-sm|md|lg)]), no de un border-[Npx] crudo ni border-2/4/8.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-border-width-usage (ECO-205)", () => {
  it("caza border-[Npx] crudo y border-2/4/8 en core; exime token, base, decorative y color", () => {
    expect(
      borderWidthHits('// @ds-tier: core\nx = "border-[1.5px]"'),
    ).toHaveLength(1); // crudo
    expect(borderWidthHits('// @ds-tier: core\nx = "border-2"')).toHaveLength(
      1,
    ); // escala genérica de Tailwind
    expect(
      borderWidthHits(
        '// @ds-tier: core\nx = "border-[var(--border-width-sm)]"',
      ),
    ).toHaveLength(0); // token
    expect(
      borderWidthHits('// @ds-tier: core\nx = "border border-b"'),
    ).toHaveLength(0); // 1px base (border / border-b)
    expect(
      borderWidthHits('// @ds-tier: decorative\nx = "border-[4px]"'),
    ).toHaveLength(0); // efecto → exento
    expect(
      borderWidthHits('// @ds-tier: core\nx = "border-line-default"'),
    ).toHaveLength(0); // color, no grosor
  });

  it("las piezas core del DS están limpias de grosor ad-hoc (guard)", () => {
    expect(() =>
      execFileSync(
        "node",
        [join(DS, "scripts", "check-border-width-usage.mjs")],
        { cwd: DS },
      ),
    ).not.toThrow();
  });
});
