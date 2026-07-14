import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { attenuationHits } from "../scripts/check-attenuation-usage.mjs";

// ECO-203 (design-tokens / ADR-033) — gate check-attenuation-usage: la atenuación sale de un TOKEN semántico,
// nunca de un modificador de opacidad `/NN` ad-hoc. UNIVERSAL (no tier-exenta). Exime currentColor + attenuation-ok.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-attenuation-usage (ECO-203)", () => {
  it("caza /NN ad-hoc sobre color; exime currentColor, attenuation-ok, comentario y no-color", () => {
    expect(attenuationHits('className="text-content-primary/75"')).toHaveLength(
      1,
    ); // token atenuado a mano
    expect(attenuationHits('className="bg-black/25"')).toHaveLength(1); // crudo atenuado
    expect(attenuationHits('className="border-current/20"')).toHaveLength(0); // currentColor heredado, no tokenizable
    expect(attenuationHits('className="text-content-secondary"')).toHaveLength(
      0,
    ); // token pleno = OK
    expect(attenuationHits('className="w-1/2 aspect-16/9"')).toHaveLength(0); // fracción/aspect, no es color
    expect(
      attenuationHits('className="bg-black/25" // attenuation-ok: scrim'),
    ).toHaveLength(0); // escape declarado
    expect(attenuationHits("// bg-black/25 en un comentario")).toHaveLength(0); // comentario (documenta)
  });

  it("el corpus del DS está DENTRO del baseline ratchet (guard: un /NN nuevo lo rompe)", () => {
    // exit 0 = ≤ baseline; execFileSync lanza si el gate falla (se coló un /NN nuevo sobre el baseline).
    expect(() =>
      execFileSync(
        "node",
        [join(DS, "scripts", "check-attenuation-usage.mjs")],
        { cwd: DS },
      ),
    ).not.toThrow();
  });
});
