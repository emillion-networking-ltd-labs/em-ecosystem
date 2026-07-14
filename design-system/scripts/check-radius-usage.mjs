#!/usr/bin/env node
// check-radius-usage — RADIUS gate (ECO-208 / design-tokens, ADR-033: corner radius ∈ MARCA).
//
// A corner radius comes from the token scale (rounded-xs|sm|md|lg|xl|2xl|3xl|full, mapped from --radius-* in
// @theme) or from rounded-[var(--radius-*)], never from an arbitrary rounded-[Npx]. TIER-AWARE: `@ds-tier:
// decorative` pieces (harvested effects) use their own radii → exempt. Keyword values (rounded-[inherit]) are not
// magic lengths and do not match.
//
// SCOPE = ds (components/). MODE enforce (0 in core after ECO-208 → preventive lock). Escape: `radius-ok: <reason>`.
//
// Usage, cwd = design-system/:  node scripts/check-radius-usage.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(ds, "components");
const TIER_RE = /@ds-tier:\s*(core|decorative)\b/;
const RE = /\brounded(?:-[a-z]+)?-\[[0-9.]+(?:px|rem|em|%)\]/; // arbitrary radius (rounded-[var(--…)] / -[inherit] do NOT match)

// Pure (lib): arbitrary corner radii in a NON-decorative piece. Exported for the test.
export function radiusHits(src) {
  if (src.match(TIER_RE)?.[1] === "decorative") return []; // harvested effect → exempt
  const hits = [];
  src.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return; // comment
    if (line.includes("radius-ok")) return;
    const m = line.match(RE);
    if (m)
      hits.push({ line: i + 1, text: m[0], ctx: line.trim().slice(0, 80) });
  });
  return hits;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = readdirSync(componentsDir).filter((f) => f.endsWith(".tsx"));
  const hits = [];
  for (const f of files)
    for (const h of radiusHits(readFileSync(join(componentsDir, f), "utf8")))
      hits.push({ file: `components/${f}`, ...h });
  if (hits.length) {
    console.error(
      `\n✗ check-radius-usage FAILS — ${hits.length} arbitrary corner radius(es) in core piece(s). Use the token ` +
        `scale (rounded-xs|sm|md|lg|xl|2xl|3xl|full) or rounded-[var(--radius-*)], or declare \`radius-ok: <reason>\`. ` +
        `Decorative pieces are exempt.`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} ${h.text}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    `✓ check-radius-usage OK — corner radii come from the token scale in core pieces.`,
  );
}
