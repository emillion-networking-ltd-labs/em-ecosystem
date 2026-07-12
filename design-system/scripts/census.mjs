#!/usr/bin/env node
// census — DETECTOR of the DS corpus (design-system-quality Pillar 1.4, ECO-196).
//
// REPORT-mode (non-blocking): classifies every DS component against the construction standard and produces the
// reconstruction WORKLIST (Phase 1). Repeatable — re-run it whenever you want the corpus state, so it does NOT
// depend on anyone remembering it.
//
// Classifies MECHANICALLY what is determinable:
//   - axis A (variant): does it import `tailwind-variants`? does it export `<name>Specs`?
//   - axes: does it declare variant/size/shape props? (has axes and NOT on tv → migration candidate)
//   - composition: `registryDependencies` = siblings it renders (factual, from the registry)
//   - missing primitives: Popover/Menu/Skeleton/ChartTooltip
// What NO machine catches reliably (the panel: ~90% false positives) stays MANUAL REVIEW, not a verdict:
//   - primitive vs composite (Button composes SpinnerInfinity yet is a primitive → JUDGMENT, the Phase-1 field)
//   - copy-instead-of-compose (hardcoded surface) → a list of known suspects, not auto-detection
//
// Usage, cwd = design-system/:  node scripts/census.mjs   [--json | --write]

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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

// Primitives the strategy (design-system-quality.md:72) names as MISSING (duplication clusters).
const EXPECTED_PRIMITIVES = ["Popover", "Menu", "Skeleton", "ChartTooltip"];
// Known copy-instead-of-compose suspects (design-system-quality.md:29-30) — MANUAL REVIEW, not auto-detection.
const COMPOSE_SUSPECTS = ["ChartCard", "MetricCard"];

export function classify(name, src) {
  const onTv = TV_RE.test(src);
  const hasSpecs = SPECS_RE.test(src);
  const roleM = src.match(/@ds-role:\s*(primitive|composite)\b/);
  const axes = ["variant", "size", "shape"].filter((a) =>
    new RegExp(`^\\s*${a}\\?:`, "m").test(src),
  );
  return {
    name,
    role: roleM ? roleM[1] : null,
    onTv,
    hasSpecs,
    axes,
    composes: regDeps.get(name) || [],
    // tv migration candidate: has axes and is NOT on tv (the human decides whether it truly needs it)
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
  const data = {
    total: rows.length,
    onIdiom: onIdiom.length,
    classified: rows.filter((r) => r.role).length,
    tvCandidates,
    missingPrimitives,
    rows,
  };

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  if (process.argv.includes("--write")) {
    writeFileSync(
      join(ds, "census.json"),
      JSON.stringify(data, null, 2) + "\n",
    );
    console.log("census.json escrito (dashboard de Storybook).");
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
