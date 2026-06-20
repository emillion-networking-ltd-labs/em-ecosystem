// Núcleo compartido del gate Lighthouse S2 (ECO-41). Corre Lighthouse N veces y compara la MEDIANA
// por categoría a los umbrales — un single-run cruza 90 por azar (la varianza del runner se amplifica
// con el throttle 4x CPU de Lighthouse); la mediana de N la absorbe y vuelve el gate un guard FIABLE.
// NO falsea: si una corrida no produce score, el caller lo trata como GAP (no inventa números).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const THRESHOLDS = { performance: 90, seo: 95, "best-practices": 95, accessibility: 90 };
// N corridas (impar → la mediana es una muestra central real). Override con LH_RUNS; mín 1.
export const RUNS = Math.max(1, Number(process.env.LH_RUNS) || 5);

export function hasChromeInPath() {
  for (const b of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) {
    try { execFileSync("which", [b], { stdio: "ignore" }); return true; } catch {}
  }
  return false;
}

export function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

// Métricas crudas de Performance (audits) para DIAGNÓSTICO — no son el gate, pero dicen DÓNDE se va el
// tiempo (TBT domina el score con 30% de peso; LCP/CLS 25% cada uno). Útiles para decidir qué optimizar.
const METRICS = {
  "total-blocking-time": "TBT(ms)",
  "largest-contentful-paint": "LCP(ms)",
  "first-contentful-paint": "FCP(ms)",
  "speed-index": "SI(ms)",
  "cumulative-layout-shift": "CLS",
};

// Corre Lighthouse `runs` veces contra `url`; devuelve { samples, medians, metricSamples, metricMedians }.
// Propaga el error de execFileSync si una corrida falla (el caller lo reporta como GAP → exit 3).
export function measureMedians(url, { runs = RUNS, env = process.env } = {}) {
  const samples = { performance: [], seo: [], "best-practices": [], accessibility: [] };
  const metricSamples = Object.fromEntries(Object.keys(METRICS).map((k) => [k, []]));
  for (let i = 0; i < runs; i++) {
    const out = `/tmp/lh-run-${i}.json`;
    execFileSync("npx", ["--yes", "lighthouse@12", url,
      "--only-categories=performance,seo,best-practices,accessibility",
      "--chrome-flags=--headless --no-sandbox", "--output=json", `--output-path=${out}`, "--quiet"],
      { stdio: "inherit", env });
    const lhr = JSON.parse(readFileSync(out, "utf8"));
    for (const cat of Object.keys(samples)) samples[cat].push(Math.round((lhr.categories[cat]?.score ?? 0) * 100));
    for (const id of Object.keys(METRICS)) metricSamples[id].push(lhr.audits?.[id]?.numericValue ?? NaN);
  }
  const medians = {};
  for (const cat of Object.keys(samples)) medians[cat] = median(samples[cat]);
  const metricMedians = {};
  for (const id of Object.keys(metricSamples)) metricMedians[id] = median(metricSamples[id].filter((n) => !Number.isNaN(n)));
  return { samples, medians, metricSamples, metricMedians };
}

// Imprime la tabla mediana + muestras y devuelve true si TODA categoría cumple su umbral (sobre la MEDIANA).
export function reportMedians({ samples, medians }) {
  let ok = true;
  for (const [cat, min] of Object.entries(THRESHOLDS)) {
    const med = medians[cat];
    const pass = med >= min;
    if (!pass) ok = false;
    console.log(`  ${pass ? "✓" : "✗"} ${cat}: mediana ${med} (mín ${min})  ·  ${samples[cat].length} corridas [${samples[cat].join(", ")}]`);
  }
  return ok;
}

// Diagnóstico (no gate): medianas de las métricas crudas de Performance, para saber qué optimizar.
export function reportMetrics({ metricMedians }) {
  const fmt = (id, v) => (id === "cumulative-layout-shift" ? v.toFixed(3) : Math.round(v));
  const line = Object.entries(METRICS).map(([id, label]) => `${label}=${fmt(id, metricMedians[id])}`).join("  ");
  console.log(`  métricas (mediana, diagnóstico): ${line}`);
}
