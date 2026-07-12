#!/usr/bin/env node
// check-classification — CLASSIFICATION gate (axis B of the per-piece DoD, ADR-029 / ECO-197).
//
// Every DS component declares its construction ROLE with `// @ds-role: primitive|composite`; build-registry
// writes it as `role` in the registry (machine-legible). Without it the piece is NOT classified → not done-done
// (part 3 of the DEFINITION-OF-DONE). The role is JUDGMENT (Button composes SpinnerInfinity yet is a primitive)
// → it is DECLARED by hand, not inferred from the graph.
//
// ratchet MODE: baseline = number of unclassified components today; it only DECREASES (classifying in batches
// lowers it with --update); at zero → enforce. So the corpus starts being gated without a big-bang.
//
// Usage, cwd = design-system/:  node scripts/check-classification.mjs   [--update]

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ratchetCheck, nextBaseline } from "./_ratchet.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(ds, "components");
const BASELINE_FILE = join(ds, "enforcement", "ratchet-baseline.json");
const GATE_ID = "classification";
const ROLE_RE = /@ds-role:\s*(primitive|composite)\b/;

// Pure (lib): names of components WITHOUT a declared `@ds-role`.
export function unclassified(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".tsx"))
    .filter((f) => !ROLE_RE.test(readFileSync(join(dir, f), "utf8")))
    .map((f) => f.replace(/\.tsx$/, ""));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const total = readdirSync(componentsDir).filter((f) =>
    f.endsWith(".tsx"),
  ).length;
  const missing = unclassified(componentsDir);
  const current = missing.length;
  const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));

  if (process.argv.includes("--update")) {
    const nb = nextBaseline(baseline, GATE_ID, current);
    writeFileSync(BASELINE_FILE, JSON.stringify(nb, null, 2) + "\n");
    console.log(
      `ratchet-baseline actualizado: ${GATE_ID} = ${nb[GATE_ID]} sin clasificar.`,
    );
    process.exit(0);
  }

  const { fail, allowed, exceeded } = ratchetCheck(baseline, GATE_ID, current);
  if (fail) {
    console.error(
      `\n✗ check-classification FALLA (ratchet) — ${current} componente(s) sin \`@ds-role\` > baseline ${allowed} (+${exceeded} nuevo/s). Declara \`// @ds-role: primitive|composite\` en el componente, o clasifica y baja el baseline con --update.`,
    );
    for (const n of missing) console.error(`  sin clasificar: ${n}`);
    process.exit(1);
  }
  console.log(
    `✓ check-classification OK (ratchet) — ${total - current}/${total} con rol B; ${current} sin clasificar ≤ baseline ${allowed}.`,
  );
}
