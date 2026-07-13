import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { untiered } from "../scripts/check-tier.mjs";

// ECO-202 (design-tokens, modelo de 4 categorías) — gate check-tier: toda pieza declara su CLASE de
// modificabilidad `// @ds-tier: core|decorative`. PRESENCIA (cero-tolerancia): una pieza sin tier válido falla.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-tier (ECO-202)", () => {
  it("detecta pieza sin @ds-tier o con valor inválido; exime el tier válido", () => {
    const dir = mkdtempSync(join(tmpdir(), "tier-"));
    try {
      writeFileSync(join(dir, "Tiered.tsx"), '"use client";\n// @ds-tier: core — primitivo\nexport const Tiered = () => null;\n');
      writeFileSync(join(dir, "Bare.tsx"), '"use client";\nexport const Bare = () => null;\n');
      writeFileSync(join(dir, "BadValue.tsx"), '// @ds-tier: fancy — no válido\nexport const BadValue = () => null;\n');
      const missing = untiered(dir);
      expect(missing).toContain("Bare"); // sin anotar
      expect(missing).toContain("BadValue"); // valor fuera de core|decorative
      expect(missing).not.toContain("Tiered"); // anotado válido
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("el corpus del DS está COMPLETO de @ds-tier (guard permanente)", () => {
    // exit 0 = todas las piezas anotadas; execFileSync lanza si el gate falla.
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-tier.mjs")], { cwd: DS }),
    ).not.toThrow();
  });
});
