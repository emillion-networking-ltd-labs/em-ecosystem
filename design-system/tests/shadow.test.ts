import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { shadowHits } from "../scripts/check-shadow-usage.mjs";

// ECO-204 (design-tokens / ADR-033) — gate check-shadow-usage: la sombra sale del token canónico
// (shadow-card/hover/control), no de la escala genérica de Tailwind. TIER-AWARE (decorative exento).
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-shadow-usage (ECO-204)", () => {
  it("caza escala genérica en core; exime decorative, tokens y shadow-ok", () => {
    expect(
      shadowHits('// @ds-tier: core\nx = "shadow-md rounded"'),
    ).toHaveLength(1); // genérica en core
    expect(shadowHits('// @ds-tier: decorative\nx = "shadow-xl"')).toHaveLength(
      0,
    ); // efecto cosechado → exento
    expect(
      shadowHits('// @ds-tier: core\nx = "shadow-card shadow-control"'),
    ).toHaveLength(0); // tokens = OK
    expect(shadowHits('// @ds-tier: core\nx = "shadow-none"')).toHaveLength(0); // none = OK
    expect(
      shadowHits('// @ds-tier: core\nx = "shadow-sm" // shadow-ok: legacy'),
    ).toHaveLength(0); // escape declarado
  });

  it("las piezas core del DS están limpias de sombra genérica (guard)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-shadow-usage.mjs")], {
        cwd: DS,
      }),
    ).not.toThrow();
  });
});
