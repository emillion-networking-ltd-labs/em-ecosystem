#!/usr/bin/env node
// check-comment-language (fleet) — code AND code documentation must be ENGLISH across the whole fleet
// (code-health D1). Generalizes the design-system's Piece-1 check to any package: it REUSES the detector
// (`spanishLineCount`) from the design-system script and walks a given target directory. Declared once per
// package in the repo-root `code-health.toml`, each with its own baseline, and enforced by the repo's
// ratchet `scripts/code_health.py` (count <= baseline, baseline only decreases).
//
// Usage (from the repo root, as the ratchet runs it):
//   node scripts/check-comment-language.mjs --count <target-dir>   → prints the violation count (integer)
//   node scripts/check-comment-language.mjs <target-dir>           → lists the offending lines, exits 1 if any
//
// The design-system keeps its own Piece-1 script (with its internal ratchet); this is the fleet generalization.
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
// Reuse the detector — the meaningful logic (the Spanish-character line test) is NOT reimplemented here.
import { spanishLineCount } from "../design-system/scripts/check-comment-language.mjs";

const COUNT = process.argv.includes("--count");
const target = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!target) {
  console.error("usage: node scripts/check-comment-language.mjs [--count] <target-dir>");
  process.exit(2);
}
const root = resolve(target);

const CODE_EXT = /\.(tsx?|jsx?|mjs|css|scss)$/;
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", "coverage", "storybook-static"]);

// Walk `dir`, collecting { file, line } for every code line the reused detector flags as Spanish.
function walk(dir, hits) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name), hits);
      continue;
    }
    if (!e.isFile() || !CODE_EXT.test(e.name)) continue;
    const p = join(dir, e.name);
    let src;
    try {
      src = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    // spanishLineCount is per-source; walk line-by-line here only to report file:line for the human mode.
    src.split("\n").forEach((line, i) => {
      if (spanishLineCount(line) > 0) hits.push({ file: p.replace(root + "/", ""), line: i + 1, ctx: line.trim().slice(0, 70) });
    });
  }
}

const hits = [];
walk(root, hits);

if (COUNT) {
  // The gate reads the LAST stdout line as the integer count; print only that.
  console.log(hits.length);
  process.exit(0);
}

if (hits.length > 0) {
  console.error(`✗ comment-language (${target}) — ${hits.length} line(s) with Spanish in code:`);
  for (const h of hits.slice(0, 30)) console.error(`  ${h.file}:${h.line} ${h.ctx}`);
  if (hits.length > 30) console.error(`  ... +${hits.length - 30} more`);
  process.exit(1);
}
console.log(`✓ comment-language (${target}) — 0 Spanish line(s).`);
