// Test del guardrail de licencias (ECO-81). node --test scripts/check-licenses.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { classifyLicense, scanDir } from "./check-licenses.mjs";

test("classifyLicense: permisivas", () => {
  for (const l of ["MIT", "Apache-2.0", "BSD-3-Clause", "BSD-2-Clause", "ISC", "0BSD", "CC0-1.0", "OFL-1.1", "MIT-0"]) {
    assert.equal(classifyLicense(l), "permissive", l);
  }
});

test("classifyLicense: copyleft", () => {
  for (const l of ["GPL-3.0", "GPL-2.0-only", "AGPL-3.0", "LGPL-3.0", "MPL-2.0", "EUPL-1.2"]) {
    assert.equal(classifyLicense(l), "copyleft", l);
  }
});

test("classifyLicense: unknown", () => {
  for (const l of ["", "UNLICENSED", "SEE LICENSE IN LICENSE.md", "Custom", "Frobnicate-9000"]) {
    assert.equal(classifyLicense(l), "unknown", JSON.stringify(l));
  }
});

test("classifyLicense: expresiones OR/AND", () => {
  assert.equal(classifyLicense("(MIT OR GPL-3.0)"), "permissive"); // puedes elegir MIT
  assert.equal(classifyLicense("(Apache-2.0 OR LGPL-2.1)"), "permissive");
  assert.equal(classifyLicense("MIT AND GPL-3.0"), "copyleft");    // necesitas cumplir ambas
  assert.equal(classifyLicense("(MIT OR Custom)"), "permissive");
});

test("scanDir: detecta licencia por paquete (incl. scoped y nested)", () => {
  const root = mkdtempSync(join(tmpdir(), "lic-"));
  const mk = (rel, pkg) => {
    const dir = join(root, rel);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
  };
  mk("node_modules/alpha", { name: "alpha", version: "1.0.0", license: "MIT" });
  mk("node_modules/beta", { name: "beta", version: "2.1.0", license: "GPL-3.0" });
  mk("node_modules/@scope/gamma", { name: "@scope/gamma", version: "0.3.0", license: { type: "Apache-2.0" } });
  mk("node_modules/alpha/node_modules/delta", { name: "delta", version: "9.9.9", license: "ISC" });
  try {
    const found = scanDir(root);
    const byName = Object.fromEntries(found.map((p) => [p.name, p.license]));
    assert.equal(byName["alpha"], "MIT");
    assert.equal(byName["beta"], "GPL-3.0");
    assert.equal(byName["@scope/gamma"], "Apache-2.0"); // objeto {type} resuelto
    assert.equal(byName["delta"], "ISC");               // nested resuelto
    assert.equal(found.length, 4);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("scanDir: sin node_modules → vacío", () => {
  const root = mkdtempSync(join(tmpdir(), "lic-empty-"));
  try { assert.deepEqual(scanDir(root), []); } finally { rmSync(root, { recursive: true, force: true }); }
});
