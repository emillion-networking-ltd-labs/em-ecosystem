#!/usr/bin/env node
// check-piece-measure-usage — PIECE-MEASURE gate (ECO-206 / design-tokens, ADR-033: piece measures ∈ ESTRUCTURA-DS).
//
// A piece's CONTAINER width (dialog / dropdown / popover / toast) comes from a token
// (max-w-[var(--dialog-sm|md|lg)], min-w-[var(--dropdown-min)], ...), never from an arbitrary max-w-[Npx] /
// min-w-[Npx]. TIER-AWARE: `@ds-tier: decorative` pieces use their own sizes (exempt). Text truncation (a max-w
// paired with `truncate`) is an intrinsic element width, not a piece measure → exempt. Intrinsic element sizes
// (w-[Npx]/h-[Npx]) are NOT gated (many are legitimate); only container widths (max-w/min-w) are.
//
// SCOPE = ds (components/). MODE enforce. Escape per-line: `piece-measure-ok: <reason>`.
//
// Usage, cwd = design-system/:  node scripts/check-piece-measure-usage.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = join(ds, "components");
const TIER_RE = /@ds-tier:\s*(core|decorative)\b/;
const RE = /\b(?:max-w|min-w)-\[[0-9.]+(?:px|rem|em)\]/; // arbitrary container width (var(--…) does NOT match)

// Pure (lib): arbitrary container widths in a NON-decorative piece. Exported for the test.
export function pieceMeasureHits(src) {
  if (src.match(TIER_RE)?.[1] === "decorative") return []; // harvested effect → exempt
  const hits = [];
  src.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return; // comment
    if (line.includes("piece-measure-ok")) return;
    if (line.includes("truncate")) return; // text truncation = intrinsic element width, not a piece measure
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
    for (const h of pieceMeasureHits(
      readFileSync(join(componentsDir, f), "utf8"),
    ))
      hits.push({ file: `components/${f}`, ...h });
  if (hits.length) {
    console.error(
      `\n✗ check-piece-measure-usage FAILS — ${hits.length} arbitrary container width(s) in core piece(s). Use a ` +
        `token (max-w-[var(--dialog-sm|md|lg)], min-w-[var(--dropdown-min)], ...) or declare ` +
        `\`piece-measure-ok: <reason>\`. Decorative pieces and text truncation are exempt.`,
    );
    for (const h of hits)
      console.error(`  ${h.file}:${h.line} ${h.text}  ${h.ctx}`);
    process.exit(1);
  }
  console.log(
    `✓ check-piece-measure-usage OK — piece container widths come from tokens in core pieces.`,
  );
}
