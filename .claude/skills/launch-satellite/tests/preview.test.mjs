// ECO-59: preview local por defecto — núcleo testeable (selección de puerto + deps + comando next dev).
// El shell preview-satellite.mjs (spawn de next dev) se prueba e2e manual; aquí, las piezas puras + el puerto.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { hasDeps, nextBin, devArgs, previewUrl, isPortFree, pickPort, DEFAULT_PORT } from "../scripts/lib/preview.mjs";

const occupy = (port) => new Promise((res) => { const s = createServer(); s.listen(port, "127.0.0.1", () => res(s)); });

test("DEFAULT_PORT = 3100 (= el dev script del satélite generado)", () => {
  assert.equal(DEFAULT_PORT, 3100);
});

test("hasDeps: detecta node_modules presente/ausente", () => {
  const d = mkdtempSync(join(tmpdir(), "prev-"));
  try {
    assert.equal(hasDeps(d), false);
    mkdirSync(join(d, "node_modules"));
    assert.equal(hasDeps(d), true);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("nextBin / devArgs / previewUrl", () => {
  assert.match(nextBin("/x/sat"), /\/x\/sat\/node_modules\/\.bin\/next$/);
  assert.deepEqual(devArgs(3100), ["dev", "--port", "3100"]);
  assert.equal(previewUrl(3100), "http://localhost:3100");
});

test("isPortFree: libre antes de escuchar, ocupado después", async () => {
  const free = await pickPort(46000);
  assert.equal(await isPortFree(free), true);
  const srv = await occupy(free);
  try { assert.equal(await isPortFree(free), false, "ocupado tras ponerse a escuchar"); }
  finally { await new Promise((r) => srv.close(r)); }
});

test("pickPort: si el puerto de inicio está ocupado, REUBICA a otro libre", async () => {
  const base = await pickPort(46100);
  const srv = await occupy(base);
  try {
    const chosen = await pickPort(base);
    assert.notEqual(chosen, base, "no devuelve el puerto ocupado");
    assert.ok(chosen > base);
    assert.equal(await isPortFree(chosen), true);
  } finally { await new Promise((r) => srv.close(r)); }
});
