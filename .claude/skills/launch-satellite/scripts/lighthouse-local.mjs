#!/usr/bin/env node
// Gate S2 LOCAL del skill /launch-satellite (ECO-25): Lighthouse contra el build servido en local.
// Umbrales (runbook S2): Perf>=90, SEO>=95, Best-Practices>=95, A11y>=90.
// Uso: node lighthouse-local.mjs <url>   (p.ej. http://localhost:3100, con el satélite ya servido)
// Requiere chromium (CHROME_PATH o uno en PATH) + `npx lighthouse`. NO falsea: si no hay chromium,
// sale con código 3 reportando el GAP (no inventa scores). Deploy/Lighthouse REMOTO = F3.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const THRESHOLDS = { performance: 90, seo: 95, "best-practices": 95, accessibility: 90 };
const url = process.argv[2] || "http://localhost:3100";
const chrome = process.env.CHROME_PATH;

if (!chrome && !hasChromeInPath()) {
  console.error("lighthouse-local: GAP — no hay chromium disponible (define CHROME_PATH o instala chrome).");
  console.error("  El build pasó; el score S2 local debe correrse donde haya chromium (CI/dev). No se falsean scores.");
  process.exit(3);
}

const out = "/tmp/lh-satellite.json";
try {
  execFileSync("npx", ["--yes", "lighthouse@12", url,
    "--only-categories=performance,seo,best-practices,accessibility",
    "--chrome-flags=--headless --no-sandbox", "--output=json", `--output-path=${out}`, "--quiet"],
    { stdio: "inherit", env: { ...process.env, ...(chrome ? { CHROME_PATH: chrome } : {}) } });
} catch (e) {
  console.error(`lighthouse-local: no se pudo ejecutar Lighthouse: ${e.message}`); process.exit(3);
}

const cats = JSON.parse(readFileSync(out, "utf8")).categories;
let failed = false;
for (const [cat, min] of Object.entries(THRESHOLDS)) {
  const score = Math.round((cats[cat]?.score ?? 0) * 100);
  const ok = score >= min;
  console.log(`  ${ok ? "✓" : "✗"} ${cat}: ${score} (mín ${min})`);
  if (!ok) failed = true;
}
if (failed) { console.error("lighthouse-local: S2 local NO alcanzado — reportar el gap (no falsear)."); process.exit(1); }
console.log("lighthouse-local: S2 local PASS.");

function hasChromeInPath() {
  for (const b of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) {
    try { execFileSync("which", [b], { stdio: "ignore" }); return true; } catch {}
  }
  return false;
}
