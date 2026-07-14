#!/usr/bin/env node
// check-shadow-usage — gate de dimensión SHADOW (ECO-204 / design-tokens, ADR-033: shadow ∈ MARCA).
//
// La norma: la sombra sale del TOKEN canónico (shadow-card / shadow-card-hover / shadow-control), no de la escala
// genérica de Tailwind (shadow-sm/md/lg/xl/2xl/inner). Una sombra genérica no sigue la escala del sistema ni es
// theme-aware (en dark la elevación viene del surface-lift + la sombra tokenizada, no de un shadow-md suelto).
//
// TIER-AWARE: las piezas `@ds-tier: decorative` (efectos cosechados — Ripple, ShimmerButton, Meteors…) usan sombra
// propia intrínseca al efecto (exentas). El COLOR crudo dentro de un `shadow-[…rgba…]` lo caza check-raw-color
// (fleet, enforce); este gate caza las sombras de ESCALA GENÉRICA en piezas CORE, que no llevan color crudo.
//
// SCOPE = ds (components/). MODO enforce (0 en core tras la reconciliación de ECO-204 → lock preventivo). Escape
// por-línea (o la anterior): `shadow-ok: <razón>`.
//
// Uso, cwd = design-system/:  node scripts/check-shadow-usage.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(ds, "components");
const TIER_RE = /@ds-tier:\s*(core|decorative)\b/;
const GENERIC_SHADOW = /\bshadow-(sm|md|lg|xl|2xl|inner)\b/;

// Pura (lib): sombras de escala genérica en una pieza NO-decorative. Exportada para test.
export function shadowHits(src) {
  if (src.match(TIER_RE)?.[1] === "decorative") return []; // efecto cosechado → sombra propia, exento
  const hits = [];
  src.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return; // comentario
    if (line.includes("shadow-ok")) return;
    if (i > 0 && src.split("\n")[i - 1].includes("shadow-ok")) return;
    const m = line.match(GENERIC_SHADOW);
    if (m)
      hits.push({ line: i + 1, text: m[0], ctx: line.trim().slice(0, 80) });
  });
  return hits;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = readdirSync(componentsDir).filter((f) => f.endsWith(".tsx"));
  const hits = [];
  for (const f of files) {
    for (const h of shadowHits(readFileSync(join(componentsDir, f), "utf8")))
      hits.push({ file: `components/${f}`, ...h });
  }
  if (hits.length) {
    console.error(
      `\n✗ check-shadow-usage FALLA — ${hits.length} sombra(s) de escala genérica en pieza(s) core. Usa un token ` +
        `(shadow-card / shadow-card-hover / shadow-control) o declara \`shadow-ok: <razón>\`. Los efectos ` +
        `\`@ds-tier: decorative\` están exentos.`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} ${h.text}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    `✓ check-shadow-usage OK — ninguna sombra de escala genérica en piezas core (sombra desde token).`,
  );
}
