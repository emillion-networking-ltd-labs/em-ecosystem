import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { rawColorMatch } from "../scripts/check-raw-color.mjs";

// ECO-145 (design-propagation Fase 1 E2) — gate check-raw-color: prohíbe el color CRUDO fuera de los tokens.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-raw-color (ECO-145)", () => {
  it("detecta color crudo: hex, rgb/hsl, arbitrary Tailwind, paleta cruda", () => {
    expect(rawColorMatch("  background: #1c1c1c;")?.kind).toBe("hex");
    expect(rawColorMatch("  color: rgba(28, 28, 28, 0.5);")?.kind).toBe("rgb/hsl");
    // arbitrary Tailwind `bg-[#hex]`: se detecta (el hex interno matchea primero → kind "hex"; se caza igual).
    expect(rawColorMatch('className="bg-[#a0bce8]"')).not.toBeNull();
    expect(rawColorMatch('className="text-slate-500"')?.kind).toBe("paleta");
  });

  it("exime: definición de token, comentario, rgb(var(--token)) y raw-color-ok", () => {
    expect(rawColorMatch("  --paper: #f0e9d6;")).toBeNull(); // DEFINICIÓN = fuente del token
    expect(rawColorMatch("  /* Outer card = #fbfbfb */")).toBeNull(); // comentario (documenta)
    expect(rawColorMatch("  color: rgb(var(--content-primary) / 0.5);")).toBeNull(); // token con alpha
    expect(rawColorMatch('  fill="#8a1111" // raw-color-ok: crash page')).toBeNull(); // declarado
    expect(rawColorMatch("  background: var(--surface-primary);")).toBeNull(); // uso de token
    expect(rawColorMatch("  const x = 1;")).toBeNull(); // código sin color
  });

  it("el DS + consumidores están LIMPIOS de color crudo (guard permanente)", () => {
    // exit 0 = limpio; execFileSync lanza si el gate falla (un raw se coló en el corpus).
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-raw-color.mjs")], { cwd: DS }),
    ).not.toThrow();
  });
});
