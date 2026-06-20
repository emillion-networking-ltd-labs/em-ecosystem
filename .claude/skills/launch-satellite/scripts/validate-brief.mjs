#!/usr/bin/env node
// Valida un brief.json del onboarding /launch-satellite contra el schema versionado + la regla "no inventar".
// Uso: node validate-brief.mjs <ruta-brief.json>   (exit 0 = valido; 1 = problemas; 2 = error de uso)
import { readFileSync } from "node:fs";
import { validateBrief } from "./lib/brief.mjs";

const path = process.argv[2];
if (!path) { console.error("uso: validate-brief.mjs <brief.json>"); process.exit(2); }

let brief;
try { brief = JSON.parse(readFileSync(path, "utf8")); }
catch (e) { console.error(`no se pudo leer/parsear ${path}: ${e.message}`); process.exit(2); }

const { ok, problems } = validateBrief(brief);
if (ok) { console.log(`brief válido (${path}) — schema ${brief.schemaVersion}, modo ${brief.intakeMode}`); process.exit(0); }
console.error(`brief INVÁLIDO (${path}):`);
problems.forEach((p) => console.error(`  - ${p}`));
process.exit(1);
