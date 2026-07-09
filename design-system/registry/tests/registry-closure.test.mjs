import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRegistry, directDeps, closure, componentNames } from "../build-registry.mjs";

// el test vive en design-system/registry/tests/ → ../.. es design-system/ (la fuente).
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const committed = JSON.parse(readFileSync(join(DS, "registry.json"), "utf8"));
const itemOf = (reg, n) => reg.items.find((i) => i.name === n);

// REGRESSION GUARD (ECO-26): el cierre de Button DEBE incluir SpinnerInfinity.
// Hoy (registry incompleto) falla; tras regenerar, pasa — y no puede volver a romperse.
test("regresión: closure(Button) incluye SpinnerInfinity", () => {
  const c = closure("Button", committed);
  assert.ok(c.has("SpinnerInfinity"), "Button debe arrastrar SpinnerInfinity (import ./SpinnerInfinity)");
});

test("regresión directa: registry de Button declara SpinnerInfinity", () => {
  const it = itemOf(committed, "Button");
  assert.ok(it && it.registryDependencies.includes("SpinnerInfinity"),
    `Button.registryDependencies = ${JSON.stringify(it?.registryDependencies)} — falta SpinnerInfinity`);
});

// ANTI-DRIFT (estilo KEEL-85): el registry COMMITEADO debe coincidir EXACTAMENTE con el grafo
// recomputado de los imports reales (alias @/components/ui/ + relativos ./Sibling) para los 47.
// Si alguien añade/quita un import sin regenerar, este test lo caza.
test("anti-drift: registry commiteado == grafo recomputado (47 componentes)", () => {
  const fresh = buildRegistry();
  assert.equal(committed.items.length, fresh.items.length, "nº de items difiere");
  for (const f of fresh.items) {
    const c = itemOf(committed, f.name);
    assert.ok(c, `falta ${f.name} en el registry commiteado`);
    assert.deepEqual(c.registryDependencies, f.registryDependencies,
      `${f.name}.registryDependencies desincronizado (commiteado ${JSON.stringify(c.registryDependencies)} vs real ${JSON.stringify(f.registryDependencies)})`);
    assert.deepEqual(c.internalDependencies, f.internalDependencies,
      `${f.name}.internalDependencies desincronizado`);
    // ANTI-DRIFT deps npm (ECO-164): el mapa `dependencies` commiteado debe casar con el recomputado de los
    // imports externos reales (excluidos peers). Añadir/quitar un import npm sin regenerar → este test lo caza.
    assert.deepEqual(c.dependencies ?? {}, f.dependencies,
      `${f.name}.dependencies desincronizado (commiteado ${JSON.stringify(c.dependencies)} vs real ${JSON.stringify(f.dependencies)})`);
  }
});

// Toda dep declarada existe como componente del registry (sin punteros colgantes, p.ej. a CommandPalette excluido).
test("integridad: ninguna registryDependency apunta a un componente inexistente", () => {
  const names = new Set(componentNames());
  for (const it of committed.items) {
    for (const d of it.registryDependencies) {
      assert.ok(names.has(d), `${it.name} -> ${d} no existe en design-system/components/`);
    }
  }
});

// El cierre transitivo resuelve para los 47 sin ciclos rotos / desconocidos.
test("cierre transitivo resuelve para los 47", () => {
  for (const n of componentNames()) assert.doesNotThrow(() => closure(n, committed));
});
