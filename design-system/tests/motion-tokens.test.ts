import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { motionHits } from "../scripts/check-motion-tokens.mjs";

// ECO-194 — gate de dimensión movimiento: duración desde token/escala, no `duration-[Nms]` arbitrario.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-motion-tokens (ECO-194)", () => {
  it("caza duración arbitraria (ms/s)", () => {
    expect(motionHits(`className="transition duration-[250ms]"`)).toHaveLength(
      1,
    );
    expect(motionHits(`className="duration-[0.3s]"`)).toHaveLength(1);
  });

  it("NO caza token ni escala ni def de var (precisión)", () => {
    expect(
      motionHits(`className="duration-[var(--duration-fast)]"`),
    ).toHaveLength(0);
    expect(motionHits(`className="duration-200"`)).toHaveLength(0);
    expect(motionHits(`className="[--duration:40s]"`)).toHaveLength(0); // def de var local (Marquee)
  });

  it("respeta `motion-ok` (línea o anterior)", () => {
    expect(
      motionHits(`className="duration-[250ms]" /* motion-ok: x */`),
    ).toHaveLength(0);
  });

  it("la flota está LIMPIA de duración arbitraria (guard permanente, enforce)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-motion-tokens.mjs")], {
        cwd: DS,
      }),
    ).not.toThrow();
  });
});
