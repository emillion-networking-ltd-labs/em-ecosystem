#!/usr/bin/env node
// check-spacing-usage — SPACING gate (ECO-208 / design-tokens, ADR-033: spacing ∈ ESTRUCTURA-DS).
//
// Padding / margin / gap come from the spacing token scale (p-4, mx-2, gap-3, ... mapped from --spacing-* in
// @theme) or from a var (p-[var(--spacing-*)]), never from an arbitrary p-[Npx] / m-[Npx] / gap-[Npx]. The named
// 1px utilities (gap-px, mx-px) are on the scale, not arbitrary (they carry no brackets → no match). ESTRUCTURA-DS
// (blocked, NOT [data-brand]): spacing is a system constant, identical across satellites.
//
// SCOPE = ds (components/). MODE enforce (0 after ECO-208 → preventive lock). Escape: `spacing-ok: <reason>`.
// NOTE: this gate covers ONLY padding/margin/gap; intrinsic element sizes (w/h) and container widths (max-w/min-w,
// check-piece-measure-usage) are other dimensions.
//
// Usage, cwd = design-system/:  node scripts/check-spacing-usage.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(ds, "components");
// Arbitrary padding/margin/gap length (p-[16px], mx-[10px], gap-[8px], space-y-[12px]). var(--…) does NOT match.
const RE =
  /\b(?:p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy])-\[[0-9.]+(?:px|rem|em)\]/;

// Pure (lib): arbitrary padding/margin/gap in a source. Exported for the test.
export function spacingHits(src) {
  const hits = [];
  src.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return; // comment
    if (line.includes("spacing-ok")) return;
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
    for (const h of spacingHits(readFileSync(join(componentsDir, f), "utf8")))
      hits.push({ file: `components/${f}`, ...h });
  if (hits.length) {
    console.error(
      `\n✗ check-spacing-usage FAILS — ${hits.length} arbitrary padding/margin/gap value(s) in core piece(s). Use ` +
        `the spacing scale (p-4, mx-2, gap-3, ...) or p-[var(--spacing-*)], or declare \`spacing-ok: <reason>\`.`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} ${h.text}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    `✓ check-spacing-usage OK — padding/margin/gap come from the spacing scale in core pieces.`,
  );
}
