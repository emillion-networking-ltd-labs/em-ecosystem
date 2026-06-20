#!/usr/bin/env node
// Gate S2 REMOTO del skill /launch-satellite (ECO-28, F3b): Lighthouse contra la URL DESPLEGADA = "lanzado".
// Umbrales runbook S2: Perf>=90, SEO>=95, Best-Practices>=95, A11y>=90.
// Uso: node lighthouse-remote.mjs <url-desplegada>
// NO falsea: si no hay URL (sin deploy real) o no hay chromium → sale con código 3 reportando el GAP.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const THRESHOLDS = { performance: 90, seo: 95, "best-practices": 95, accessibility: 90 };
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

const out = "/tmp/lh-remote.json";
try {
  execFileSync("npx", ["--yes", "lighthouse@12", url,
    "--only-categories=performance,seo,best-practices,accessibility",
    "--chrome-flags=--headless --no-sandbox", "--output=json", `--output-path=${out}`, "--quiet"],
    { stdio: "inherit" });
} catch (e) { console.error(`lighthouse-remote: no se pudo ejecutar: ${e.message}`); process.exit(3); }

const cats = JSON.parse(readFileSync(out, "utf8")).categories;
let failed = false;
for (const [cat, min] of Object.entries(THRESHOLDS)) {
  const score = Math.round((cats[cat]?.score ?? 0) * 100);
  const ok = score >= min;
  console.log(`  ${ok ? "✓" : "✗"} ${cat}: ${score} (mín ${min})`);
  if (!ok) failed = true;
}
if (failed) { console.error("lighthouse-remote: S2 remoto NO alcanzado — reportar gap (no falsear)."); process.exit(1); }
console.log(`lighthouse-remote: S2 remoto PASS — LANZADO (${url}).`);

function hasChromeInPath() {
  for (const b of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) {
    try { execFileSync("which", [b], { stdio: "ignore" }); return true; } catch {}
  }
  return false;
}
