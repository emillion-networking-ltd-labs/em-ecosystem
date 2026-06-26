#!/usr/bin/env node
// Guardrail de licencias del design-system (ECO-81, Strategy: satellite-design).
// Self-contained (stdlib de Node): clasifica un SPDX en permissive|copyleft|unknown y escanea el
// node_modules de un target. La línea verde de la estrategia: SOLO permisivas; copyleft → FALLA.
// Uso: node scripts/check-licenses.mjs [target] [--notices <out>] [--allow <pkg> ...]
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// SPDX permisivas seguras para sitios de cliente (MIT/Apache/BSD/ISC/OFL/CC0…).
const PERMISSIVE = new Set([
  "MIT", "MIT-0", "ISC", "0BSD", "BSD-2-CLAUSE", "BSD-3-CLAUSE", "APACHE-2.0",
  "CC0-1.0", "CC-BY-4.0", "UNLICENSE", "OFL-1.1", "ZLIB", "PYTHON-2.0",
  "BLUEOAK-1.0.0", "WTFPL", "BSD", "APACHE", "BSD-3-CLAUSE-CLEAR",
]);
// Familias copyleft (prefijo) — vetadas por defecto en trabajo de cliente propietario.
const COPYLEFT_PREFIX = ["GPL", "AGPL", "LGPL", "MPL", "EUPL", "OSL", "CDDL", "EPL", "CPL", "SSPL"];

const norm = (s) => String(s || "").trim().toUpperCase();

/** Clasifica UN token SPDX simple (sin operadores). */
function classifyAtom(tok) {
  const t = norm(tok).replace(/^\(|\)$/g, "");
  if (!t || t === "UNLICENSED" || t.startsWith("SEE LICENSE") || t === "CUSTOM") return "unknown";
  if (PERMISSIVE.has(t)) return "permissive";
  if (COPYLEFT_PREFIX.some((p) => t === p || t.startsWith(p + "-") || t.startsWith(p + "+"))) return "copyleft";
  return "unknown";
}

/** Clasifica una expresión SPDX. `OR` → la mejor opción (puedes elegir la permisiva);
 *  `AND` → la peor (necesitas cumplir todas). Sin operador = el átomo. */
export function classifyLicense(expr) {
  const s = String(expr || "").trim();
  if (!s) return "unknown";
  const rank = { permissive: 0, unknown: 1, copyleft: 2 };
  const unrank = ["permissive", "unknown", "copyleft"];
  if (/\bOR\b/i.test(s)) {
    const parts = s.split(/\bOR\b/i).map((p) => classifyLicense(p));
    return unrank[Math.min(...parts.map((p) => rank[p]))]; // mejor (mínimo)
  }
  if (/\bAND\b/i.test(s)) {
    const parts = s.split(/\bAND\b/i).map((p) => classifyLicense(p));
    return unrank[Math.max(...parts.map((p) => rank[p]))]; // peor (máximo)
  }
  return classifyAtom(s);
}

/** Lee el campo license de un package.json (string | {type} | licenses[]). */
function readLicense(pkg) {
  if (typeof pkg.license === "string") return pkg.license;
  if (pkg.license && typeof pkg.license === "object" && pkg.license.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses)) return pkg.licenses.map((l) => l.type || l).join(" OR ");
  return "";
}

/** Escanea recursivamente node_modules y devuelve [{name, version, license}] deduplicado. */
export function scanDir(target) {
  const root = join(target, "node_modules");
  if (!existsSync(root)) return [];
  const seen = new Map();
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      if (e === ".bin") continue;
      const p = join(dir, e);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (!st.isDirectory()) continue;
      if (e.startsWith("@")) { walk(p); continue; }        // scope → un nivel más
      const pj = join(p, "package.json");
      if (existsSync(pj)) {
        try {
          const pkg = JSON.parse(readFileSync(pj, "utf8"));
          if (pkg.name) seen.set(`${pkg.name}@${pkg.version}`, { name: pkg.name, version: pkg.version || "", license: readLicense(pkg) });
        } catch { /* ignora package.json corrupto */ }
      }
      const nested = join(p, "node_modules");
      if (existsSync(nested)) walk(nested);
    }
  };
  walk(root);
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function main(argv) {
  const args = argv.slice(2);
  let target = ".", notices = null;
  const allow = new Set();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--notices") notices = args[++i];
    else if (args[i] === "--allow") allow.add(args[++i]);
    else if (!args[i].startsWith("--")) target = args[i];
  }
  const pkgs = scanDir(target).map((p) => ({ ...p, cls: allow.has(p.name) ? "permissive" : classifyLicense(p.license) }));
  if (!pkgs.length) { console.log(`license-check: no node_modules en '${target}' (¿npm install?).`); return 0; }
  const copyleft = pkgs.filter((p) => p.cls === "copyleft");
  const unknown = pkgs.filter((p) => p.cls === "unknown");
  if (notices) {
    const body = pkgs.filter((p) => p.cls === "permissive")
      .map((p) => `- ${p.name}@${p.version} — ${p.license || "(sin campo license)"}`).join("\n");
    writeFileSync(notices, `# THIRD-PARTY-NOTICES\n\nDependencias de terceros (licencias permisivas) y sus avisos.\nGenerado por scripts/check-licenses.mjs.\n\n${body}\n`);
    console.log(`license-check: ${notices} generado (${pkgs.length} deps permisivas).`);
  }
  console.log(`license-check '${target}': ${pkgs.length} deps · ${copyleft.length} copyleft · ${unknown.length} unknown.`);
  for (const p of copyleft) console.error(`  COPYLEFT  ${p.name}@${p.version}  [${p.license}]`);
  for (const p of unknown) console.error(`  UNKNOWN   ${p.name}@${p.version}  [${p.license || "—"}]  (revisión humana o --allow)`);
  if (copyleft.length || unknown.length) {
    console.error("FAIL: licencias no permitidas. Solo MIT/Apache/BSD/ISC/OFL/CC0; copyleft vetado (ADR-019).");
    return 1;
  }
  console.log("OK: todas las dependencias son permisivas (línea verde de satellite-design).");
  return 0;
}

// Punto de entrada solo si se ejecuta directamente (no al importar en el test).
if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv));
