// ECO-126 — tests de la lógica pura de la guardia anti-deriva. Corren en el job `Gate self-tests`
// (node --test .github/scripts/*.test.mjs) SIN red ni token: prueban `findDrift`/`extractContexts`
// contra fixtures, que es lo que puede romperse por un cambio de código.
import { test } from "node:test";
import assert from "node:assert/strict";
import { findDrift, extractContexts, EXPECTED } from "./check-branch-protection.mjs";

// Config correcta (shape nuevo `checks[].context`) → sin deriva.
const OK = {
  required_status_checks: {
    strict: true,
    checks: EXPECTED.contexts.map((context) => ({ context })),
  },
};

test("config correcta → sin problemas", () => {
  assert.deepEqual(findDrift(OK), []);
});

test("shape viejo `contexts` también se acepta", () => {
  const old = { required_status_checks: { strict: true, contexts: EXPECTED.contexts } };
  assert.deepEqual(findDrift(old), []);
});

test("contexts extra NO se marcan como deriva", () => {
  const hardened = {
    required_status_checks: {
      strict: true,
      checks: [...EXPECTED.contexts, "Extra Optional Check"].map((context) => ({ context })),
    },
  };
  assert.deepEqual(findDrift(hardened), []);
});

test("falta Security Gate → deriva (esto es lo que dejó pasar #515/#516)", () => {
  const drifted = {
    required_status_checks: {
      strict: true,
      // Todos los EXPECTED salvo Security Gate → solo ese debe faltar (robusto a añadir más contexts).
      checks: EXPECTED.contexts
        .filter((c) => c !== "Security Gate (All Checks)")
        .map((context) => ({ context })),
    },
  };
  const problems = findDrift(drifted);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Security Gate \(All Checks\)/);
});

test("strict:false → deriva (permite mergear sobre base desactualizada)", () => {
  const drifted = {
    required_status_checks: { strict: false, checks: EXPECTED.contexts.map((context) => ({ context })) },
  };
  const problems = findDrift(drifted);
  assert.ok(problems.some((p) => /strict/.test(p)));
});

test("solo `gates` (la config REAL que teníamos) → deriva por strict + todos los demás required", () => {
  const legacy = { required_status_checks: { strict: false, contexts: ["gates"] } };
  const problems = findDrift(legacy);
  // strict:false (1) + los (EXPECTED.contexts - "gates") que faltan.
  assert.equal(problems.length, 1 + (EXPECTED.contexts.length - 1));
});

test("sin required_status_checks → deriva", () => {
  assert.deepEqual(findDrift({}), [
    "required_status_checks no está configurado en la branch protection",
  ]);
});

test("extractContexts fusiona checks[] y contexts[]", () => {
  const p = {
    required_status_checks: { checks: [{ context: "a" }], contexts: ["b"] },
  };
  assert.deepEqual([...extractContexts(p)].sort(), ["a", "b"]);
});
