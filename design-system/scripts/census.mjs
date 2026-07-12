#!/usr/bin/env node
// census — DETECTOR del corpus del DS (design-system-quality Pilar 1.4, ECO-196).
//
// REPORT-mode (no bloquea): clasifica cada componente del DS contra el estándar de construcción y produce el
// WORKLIST de reconstrucción (Fase 1). Repetible — re-córrelo cuando quieras el estado del corpus, para que NO
// dependa de que alguien lo recuerde.
//
// Clasifica MECÁNICAMENTE lo que es determinable:
//   - idioma A (variante): ¿importa `tailwind-variants`? ¿exporta `<name>Specs`?
//   - ejes: ¿declara props variant/size/shape? (si tiene ejes y NO está en tv → candidato a migrar)
//   - composición: `registryDependencies` = hermanos que renderiza (factual, del registry)
//   - primitivos que faltan: Popover/Menu/Skeleton/ChartTooltip
// Lo que NINGUNA máquina caza fiable (la panel: ~90% falsos positivos) queda como REVISIÓN MANUAL, no veredicto:
//   - primitive vs composite (Button compone SpinnerInfinity y es primitivo → es JUICIO, el campo de Fase 1)
//   - copiar-en-vez-de-componer (superficie hardcodeada) → lista de sospechas conocidas, no auto-detección
//
// Uso, cwd = design-system/:  node scripts/census.mjs   [--json]

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(ds, "components");

// registry: name -> registryDependencies (hermanos que compone)
const registry = JSON.parse(readFileSync(join(ds, "registry.json"), "utf8"));
const items = Array.isArray(registry) ? registry : registry.items || [];
const regDeps = new Map(
  items.map((i) => [i.name, i.registryDependencies || []]),
);

const TV_RE = /from "tailwind-variants"/;
const SPECS_RE = /export const \w+Specs\b/;

// Primitivos que la estrategia (design-system-quality.md:72) nombra como FALTANTES (clusters de duplicación).
const EXPECTED_PRIMITIVES = ["Popover", "Menu", "Skeleton", "ChartTooltip"];
// Sospechas conocidas de copiar-en-vez-de-componer (design-system-quality.md:29-30) — REVISIÓN MANUAL, no auto.
const COMPOSE_SUSPECTS = ["ChartCard", "MetricCard"];

export function classify(name, src) {
  const onTv = TV_RE.test(src);
  const hasSpecs = SPECS_RE.test(src);
  const axes = ["variant", "size", "shape"].filter((a) =>
    new RegExp(`^\\s*${a}\\?:`, "m").test(src),
  );
  return {
    name,
    onTv,
    hasSpecs,
    axes,
    composes: regDeps.get(name) || [],
    // candidato a migrar a tv: tiene ejes y NO está en tv (el humano decide si de verdad lo necesita)
    tvCandidate: axes.length > 0 && !onTv,
  };
}

function run() {
  const files = readdirSync(componentsDir).filter((f) => f.endsWith(".tsx"));
  const rows = files.map((f) =>
    classify(
      f.replace(/\.tsx$/, ""),
      readFileSync(join(componentsDir, f), "utf8"),
    ),
  );
  rows.sort((a, b) => a.name.localeCompare(b.name));

  const onIdiom = rows.filter((r) => r.onTv);
  const specsOldIdiom = rows.filter((r) => !r.onTv && r.hasSpecs);
  const tvCandidates = rows.filter((r) => r.tvCandidate);
  const existing = new Set(files.map((f) => f.replace(/\.tsx$/, "")));
  const missingPrimitives = EXPECTED_PRIMITIVES.filter((p) => !existing.has(p));

  if (process.argv.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          total: rows.length,
          onIdiom: onIdiom.length,
          tvCandidates,
          missingPrimitives,
          rows,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    `\nCENSO del corpus DS — ${rows.length} componentes (design-system-quality Pilar 1.4)\n`,
  );
  console.log(`Idioma de variante (eje A):`);
  console.log(`  ✓ en tv+Specs (idioma completo):        ${onIdiom.length}`);
  console.log(
    `  ~ con Specs pero idioma viejo (sin tv): ${specsOldIdiom.length}`,
  );
  console.log(
    `  · resto:                                ${rows.length - onIdiom.length - specsOldIdiom.length}\n`,
  );

  console.log(
    `WORKLIST Fase 1 — candidatos a migrar a tv (tienen ejes, no están en tv): ${tvCandidates.length}`,
  );
  console.log(
    `  ${tvCandidates.map((r) => `${r.name}[${r.axes.join(",")}]`).join("  ") || "(ninguno)"}\n`,
  );
  console.log(
    `Primitivos que FALTAN (clusters de duplicación → extraer): ${missingPrimitives.length}`,
  );
  console.log(`  ${missingPrimitives.join("  ") || "(ninguno)"}\n`);
  console.log(
    `Copiar-en-vez-de-componer — SOSPECHAS (revisión MANUAL, no auto-detección):`,
  );
  console.log(
    `  ${COMPOSE_SUSPECTS.map((s) => `${s} (¿compone Card? → ${(regDeps.get(s) || []).includes("Card") ? "sí" : "NO, hardcodea"})`).join("  ")}\n`,
  );
  console.log(
    `(nota: primitive/composite NO se auto-decide — es juicio; el censo reporta 'composes', la decisión es el campo de Fase 1.)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) run();
