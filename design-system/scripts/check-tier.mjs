#!/usr/bin/env node
// check-tier — MODIFIABILITY-TIER gate (ECO-202 / design-tokens, modelo de 4 categorías).
//
// Cada componente del DS declara su CLASE de modificabilidad con `// @ds-tier: core|decorative`; build-registry
// la escribe como `tier` en el registry (máquina-legible). core = primitivo del sistema que propaga a N satélites
// → estricto (usa el token); decorative = efecto cosechado (ShimmerButton, Meteors…) → valor arbitrario a menudo
// legítimo. Es la CLASE que necesitan los gates por dimensión (radius/shadow/border/spacing/atenuación) para ser
// estrictos-en-core y laxos-en-decorative sin falsos positivos.
//
// PRESENCIA (no ratchet): el tier es detectable en masa y se anota en TODAS las piezas de una (a diferencia de
// `@ds-role`, que es output de la certificación → ahí sí ratchet). Cero-tolerancia: una pieza registrada sin
// `@ds-tier` válido FALLA. La CORRECCIÓN del valor (p.ej. las dudosas) se confirma por-pieza en la certificación
// [H] del runbook — este gate solo exige PRESENCIA, no juzga si core/decorative es acertado.
//
// Uso, cwd = design-system/:  node scripts/check-tier.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(ds, "components");
const TIER_RE = /@ds-tier:\s*(core|decorative)\b/;

// Pura (lib): nombres de componentes SIN un `@ds-tier` válido. Exportada para test.
export function untiered(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".tsx"))
    .filter((f) => !TIER_RE.test(readFileSync(join(dir, f), "utf8")))
    .map((f) => f.replace(/\.tsx$/, ""));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const total = readdirSync(componentsDir).filter((f) => f.endsWith(".tsx")).length;
  const missing = untiered(componentsDir);
  if (missing.length) {
    console.error(
      `\n✗ check-tier FALLA — ${missing.length} componente(s) sin \`@ds-tier\` válido. Declara ` +
        `\`// @ds-tier: core|decorative — <razón>\` (core = primitivo del sistema que propaga → estricto; ` +
        `decorative = efecto cosechado → arbitrario legítimo). El valor se confirma en la certificación [H].`,
    );
    for (const n of missing) console.error(`  sin tier: ${n}`);
    process.exit(1);
  }
  console.log(`✓ check-tier OK — ${total}/${total} componentes con @ds-tier (core|decorative).`);
}
