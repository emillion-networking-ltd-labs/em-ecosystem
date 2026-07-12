#!/usr/bin/env node
// check-protected-dimensions — META-GATE de la estrategia design-enforcement (ADR-031, ECO-190).
//
// El manifiesto `enforcement/protected-dimensions.json` es el registro de las dimensiones de fuente única que
// NO deben escribirse a mano. Este meta-gate lo hace MECÁNICO (no aspiracional): verifica manifiesto <-> gates
// en AMBOS sentidos, de modo que...
//   · No puedes AÑADIR una dimensión al manifiesto sin su gate vivo (fichero existe) y CABLEADO (en `coverage`).
//   · No puedes AÑADIR un gate `check-*-usage.mjs` (la convención de nombre de un gate-de-dimensión) sin
//     REGISTRARLO en el manifiesto.
// Así, cuando llegue una dimensión NUEVA, nace con su gate como definition-of-done — y el manifiesto no puede
// driftar de los gates reales. Corta el ciclo de reconstrucción.
//
// Uso, cwd = design-system/:  node scripts/check-protected-dimensions.mjs

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCOPES = new Set(["ds", "consumer-minus-primitives", "fleet"]);
const MODES = new Set(["report", "ratchet", "enforce"]);
const REQUIRED = ["dimension", "piece", "gate", "scope", "escape", "mode"];

// Pura (lib): valida el manifiesto contra la realidad. Devuelve lista de errores (vacía = OK). Exportada para test.
//   gateFiles      = nombres de ficheros en scripts/ (p.ej. ["check-icon-usage.mjs", ...])
//   coverageStr    = el valor del script `coverage` de package.json (para comprobar cableado)
//   usageGateNames = gates que siguen la convención de dimensión (`check-*-usage.mjs`) → deben estar en el manifiesto
export function checkManifest(manifest, gateFiles, coverageStr) {
  const errors = [];
  const dims = manifest?.dimensions;
  if (!Array.isArray(dims)) return ["manifiesto sin array `dimensions`"];

  const registered = new Set();
  for (const d of dims) {
    const id = d?.dimension ?? "(sin nombre)";
    for (const f of REQUIRED)
      if (d?.[f] === undefined || d?.[f] === "")
        errors.push(`dimensión '${id}': falta el campo requerido '${f}'`);
    if (d?.scope && !SCOPES.has(d.scope))
      errors.push(
        `dimensión '${id}': scope '${d.scope}' inválido (usa ${[...SCOPES].join("|")})`,
      );
    if (d?.mode && !MODES.has(d.mode))
      errors.push(
        `dimensión '${id}': mode '${d.mode}' inválido (usa ${[...MODES].join("|")})`,
      );
    if (d?.gate) {
      registered.add(d.gate);
      // FORWARD: el gate existe + está cableado en coverage.
      if (!gateFiles.includes(d.gate))
        errors.push(
          `dimensión '${id}': su gate '${d.gate}' no existe en scripts/`,
        );
      else if (!coverageStr.includes(d.gate))
        errors.push(
          `dimensión '${id}': su gate '${d.gate}' no está cableado en el script 'coverage'`,
        );
    }
  }

  // REVERSE: todo gate `check-*-usage.mjs` (convención de gate-de-dimensión) debe estar registrado.
  for (const g of gateFiles)
    if (/^check-.+-usage\.mjs$/.test(g) && !registered.has(g))
      errors.push(
        `gate de dimensión '${g}' no registrado en el manifiesto (añádelo con su piece/scope/escape/mode)`,
      );

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(
    readFileSync(join(ds, "enforcement", "protected-dimensions.json"), "utf8"),
  );
  const gateFiles = readdirSync(join(ds, "scripts")).filter((f) =>
    f.endsWith(".mjs"),
  );
  const pkg = JSON.parse(readFileSync(join(ds, "package.json"), "utf8"));
  const coverageStr = pkg.scripts?.coverage ?? "";

  const errors = checkManifest(manifest, gateFiles, coverageStr);
  if (errors.length) {
    console.error("✗ check-protected-dimensions:\n  " + errors.join("\n  "));
    process.exit(1);
  }
  console.log(
    `✓ check-protected-dimensions OK — ${manifest.dimensions.length} dimensión(es) protegida(s), cada una con su gate vivo y cableado; ningún gate de dimensión sin registrar.`,
  );
}
