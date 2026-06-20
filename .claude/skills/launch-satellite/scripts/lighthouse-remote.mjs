#!/usr/bin/env node
// Gate S2 REMOTO del skill /launch-satellite (ECO-28, F3b; hardening ECO-41): Lighthouse contra la URL
// DESPLEGADA = "lanzado", comparando la MEDIANA de N corridas a los umbrales S2 (Perf>=90, SEO>=95,
// Best-Practices>=95, A11y>=90) — misma absorción de varianza que el gate local.
// Uso: node lighthouse-remote.mjs <url-desplegada>   (LH_RUNS=N cambia N, default 5).
// NO falsea: si no hay URL (sin deploy real) o no hay chromium → sale con código 3 reportando el GAP.
import { RUNS, hasChromeInPath, measureMedians, reportMedians } from "./lib/lighthouse.mjs";

const url = process.argv[2];

if (!url || !/^https?:\/\//i.test(url)) {
  console.error("lighthouse-remote: GAP — sin URL desplegada (no hay deploy real todavía).");
  console.error("  El 'lanzado' formal requiere la URL del deploy (F3b --apply, operación humana). No se falsea.");
  process.exit(3);
}
if (!hasChromeInPath() && !process.env.CHROME_PATH) {
  console.error("lighthouse-remote: GAP — no hay chromium para Lighthouse (define CHROME_PATH o instala chrome).");
  process.exit(3);
}

let result;
try {
  result = measureMedians(url);
} catch (e) {
  console.error(`lighthouse-remote: no se pudo ejecutar: ${e.message}`); process.exit(3);
}

console.log(`lighthouse-remote: mediana de ${RUNS} corrida(s) vs umbrales S2 (${url}):`);
if (!reportMedians(result)) {
  console.error("lighthouse-remote: S2 remoto NO alcanzado (mediana) — reportar gap (no falsear)."); process.exit(1);
}
console.log(`lighthouse-remote: S2 remoto PASS — LANZADO (${url}).`);
