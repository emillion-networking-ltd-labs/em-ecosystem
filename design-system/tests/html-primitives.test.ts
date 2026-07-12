import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { htmlHits } from "../scripts/check-html-primitives.mjs";

// ECO-192 — gate de dimensión primitivos HTML (scope consumidor-menos-primitivos, modo ratchet).
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-html-primitives (ECO-192)", () => {
  it("caza button/input/select/textarea crudos", () => {
    expect(
      htmlHits(`<button onClick={x} className="c">Go</button>`),
    ).toHaveLength(1);
    expect(htmlHits(`<input type="text" />`)).toHaveLength(1);
    expect(htmlHits(`  <textarea rows={4} />`)).toHaveLength(1);
  });

  it("NO caza un componente que empieza igual (<ButtonGroup>)", () => {
    expect(htmlHits(`<ButtonGroup>`)).toHaveLength(0);
  });

  it("respeta `html-ok` en la línea o en la anterior (JSX multi-línea)", () => {
    expect(htmlHits(`<button /> {/* html-ok: x */}`)).toHaveLength(0);
    expect(htmlHits(`{/* html-ok: crash */}\n<button>`)).toHaveLength(0);
  });

  it("el corpus consumidor no supera el baseline (guard permanente, modo ratchet)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-html-primitives.mjs")], {
        cwd: DS,
      }),
    ).not.toThrow();
  });
});
