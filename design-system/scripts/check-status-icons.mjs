#!/usr/bin/env node
// check-status-icons — GATE: los iconos de ESTADO (warning/error/success/info) salen de la FUENTE ÚNICA
// `STATUS_ICONS` (components/statusIcons.ts), no de un mapa a mano por componente (ECO-199, ADR-032).
//
// Decidido una vez, en un sitio: ⚠ TriangleAlert = warning · ⊗ CircleX = error · ✓ CircleCheck = success ·
// ⓘ Info = info. Un componente que importa un glyph de ALERTA de lucide (TriangleAlert / AlertTriangle /
// CircleAlert / CircleX) está re-mapeando el estado a mano → debe usar `STATUS_ICONS[...]`. (Info y CircleCheck
// NO se gatean: tienen usos genéricos —un botón de info, un check cualquiera— fuera del semáforo de estado.)
//
// Uso: node scripts/check-status-icons.mjs   (cwd = design-system/)

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(ds, "components");

// Glyphs de alerta INEQUÍVOCOS: si un componente los importa de lucide, está mapeando estado a mano.
const STATUS_GLYPHS = ["TriangleAlert", "AlertTriangle", "CircleAlert", "CircleX"];
// Excepciones declaradas (un componente que de verdad necesita un glyph de alerta fuera del semáforo). Ninguna hoy.
const ALLOWLIST = {}; // p.ej. { "Foo.tsx": ["CircleX"] }

// Nombres importados de lucide-react en un fichero.
function lucideImports(src) {
  const set = new Set();
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']lucide-react["']/g))
    for (const name of m[1].split(",").map((s) => s.trim()).filter(Boolean)) set.add(name);
  return set;
}

export function offenders(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".tsx")) continue; // la fuente statusIcons.ts es .ts → exenta por construcción
    const imported = lucideImports(readFileSync(join(dir, f), "utf8"));
    const allow = new Set(ALLOWLIST[f] || []);
    const hits = STATUS_GLYPHS.filter((g) => imported.has(g) && !allow.has(g));
    if (hits.length) out.push({ file: f, hits });
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const bad = offenders(componentsDir);
  if (bad.length) {
    console.error(
      "✗ check-status-icons — icono(s) de estado mapeado(s) a mano (usa STATUS_ICONS de components/statusIcons.ts):\n  " +
        bad.map((b) => `${b.file}: ${b.hits.join(", ")}`).join("\n  "),
    );
    process.exit(1);
  }
  console.log(
    "✓ check-status-icons OK — los iconos de estado salen de STATUS_ICONS (fuente única); ningún mapa a mano.",
  );
}
