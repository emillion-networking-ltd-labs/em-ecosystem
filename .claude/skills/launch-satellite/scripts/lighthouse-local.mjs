#!/usr/bin/env node
// Gate S2 LOCAL del skill /launch-satellite (ECO-25, hardening ECO-41): Lighthouse contra el build
// servido en local, comparando la MEDIANA de N corridas a los umbrales S2 (Perf>=90, SEO>=95,
// Best-Practices>=95, A11y>=90) — absorbe la varianza del runner (un single-run cruza 90 por azar).
// Uso: node lighthouse-local.mjs <url>   (p.ej. http://localhost:3100; LH_RUNS=N cambia N, default 5).
// Requiere chromium (CHROME_PATH o uno en PATH) + `npx lighthouse`. NO falsea: si no hay chromium,
// sale con código 3 reportando el GAP (no inventa scores). Deploy/Lighthouse REMOTO = F3.
import { RUNS, hasChromeInPath, measureMedians, reportMedians, reportMetrics, reportSeoAudits, validateSeoHtml } from "./lib/lighthouse.mjs";

const url = process.argv[2] || "http://localhost:3100";
const chrome = process.env.CHROME_PATH;

if (!chrome && !hasChromeInPath()) {
  console.error("lighthouse-local: GAP — no hay chromium disponible (define CHROME_PATH o instala chrome).");
  console.error("  El build pasó; el score S2 local debe correrse donde haya chromium (CI/dev). No se falsean scores.");
  process.exit(3);
}

let result;
try {
  result = measureMedians(url, { env: { ...process.env, ...(chrome ? { CHROME_PATH: chrome } : {}) } });
} catch (e) {
  console.error(`lighthouse-local: no se pudo ejecutar Lighthouse: ${e.message}`); process.exit(3);
}

console.log(`lighthouse-local: mediana de ${RUNS} corrida(s) vs umbrales S2 (absorbe la varianza del runner):`);
const mediansPass = reportMedians(result);
reportMetrics(result);

// Gate de lanzamiento ELEVADO (F5): además del agregado, audits SEO nombrados + OG/JSON-LD presentes y válidos.
console.log("lighthouse-local: SEO de fábrica (F5):");
const auditsPass = reportSeoAudits(result);
const og = await validateSeoHtml(url);
og.ok ? console.log("  ✓ Open Graph + JSON-LD presentes y válidos en el HTML servido")
      : og.problems.forEach((p) => console.log(`  ✗ ${p}`));

if (!mediansPass) { console.error("lighthouse-local: S2 local NO alcanzado (mediana) — reportar el gap (no falsear)."); process.exit(1); }
if (!auditsPass || !og.ok) { console.error("lighthouse-local: SEO de fábrica NO cumplido (audits/OG/JSON-LD) — gate F5."); process.exit(1); }
console.log("lighthouse-local: S2 local PASS (mediana ≥ umbrales + SEO de fábrica OK).");
