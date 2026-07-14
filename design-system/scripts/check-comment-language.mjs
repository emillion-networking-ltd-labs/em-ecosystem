#!/usr/bin/env node
// check-comment-language — code AND code documentation (comments, JSDoc, Specs docstrings) must be in ENGLISH
// (operator rule; DEFINITION-OF-DONE step 1). Spanish is ONLY for conversation + governance docs (specs/ADRs/
// records) + the orchestrator pointer/memory — never inside code files.
//
// DETECTION: a line containing a Spanish-specific character (inverted ? and !, n-tilde, accented vowels, any case)
// is Spanish content — English has none of them, so it is precise. The character class is written with \u escapes
// so this gate does not flag its own source. Per-line escape: `lang-ok` (a legitimate accented proper noun, a data
// value, a URL, etc.).
//
// SCOPE = ds code (components/ sections/ scripts/ stories/ tests/ registry/ + tokens/*.css). MODE ratchet: the
// baseline is the existing Spanish debt (many comments accumulated over time); it only decreases. A NEW Spanish
// line fails the gate. Draining = translate old comments to English and lower the baseline with --update.
//
// Usage, cwd = design-system/:  node scripts/check-comment-language.mjs [--update]
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ratchetCheck, nextBaseline } from "./_ratchet.mjs";

const ds = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UPDATE = process.argv.includes("--update");
const GATE_ID = "comment-language";
const BASELINE_PATH = join(ds, "enforcement", "ratchet-baseline.json");

const ROOTS = [
  "components",
  "sections",
  "scripts",
  "stories",
  "tests",
  "registry",
  "tokens",
];
const CODE_EXT = /\.(tsx?|jsx?|mjs|css|scss)$/;
// Inverted ?/! + n-tilde + accented vowels (any case) — Spanish-only characters, written as \u escapes so this
// gate never flags its own source.
// prettier-ignore
const SPANISH = /[¿¡ñÑáéíóúüÁÉÍÓÚÜ]/; // lang-ok: this is the Spanish detection set itself

// Pure (lib): number of lines with a Spanish character (excluding `lang-ok` lines) in a source. Exported for test.
export function spanishLineCount(src) {
  return src
    .split("\n")
    .filter((l) => SPANISH.test(l) && !l.includes("lang-ok")).length;
}

function walk(dir, hits) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name !== "node_modules") walk(join(dir, e.name), hits);
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
    src.split("\n").forEach((line, i) => {
      if (SPANISH.test(line) && !line.includes("lang-ok"))
        hits.push({
          file: p.replace(ds + "/", ""),
          line: i + 1,
          ctx: line.trim().slice(0, 70),
        });
    });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hits = [];
  for (const r of ROOTS) walk(join(ds, r), hits);
  const baseline = existsSync(BASELINE_PATH)
    ? JSON.parse(readFileSync(BASELINE_PATH, "utf8"))
    : {};

  if (UPDATE) {
    const nb = nextBaseline(baseline, GATE_ID, hits.length);
    writeFileSync(BASELINE_PATH, JSON.stringify(nb, null, 2) + "\n");
    console.log(
      `↧ ratchet-baseline updated: ${GATE_ID} = ${nb[GATE_ID]} (only decreases).`,
    );
    process.exit(0);
  }

  const r = ratchetCheck(baseline, GATE_ID, hits.length);
  if (r.fail) {
    console.error(
      `\n✗ check-comment-language FAILS (ratchet) — ${r.current} line(s) with Spanish in code > baseline ` +
        `${r.allowed} (+${r.exceeded} new). Code and code comments must be ENGLISH; declare \`lang-ok\` for a ` +
        `legitimate accented value. (--update lowers the baseline when you translate old comments.)`,
    );
    for (const h of hits.slice(0, 30))
      console.error(`  ${h.file}:${h.line} ${h.ctx}`);
    if (hits.length > 30) console.error(`  ... +${hits.length - 30} more`);
    process.exit(1);
  }
  console.log(
    `✓ check-comment-language OK (ratchet) — ${hits.length} Spanish line(s) <= baseline ${baseline[GATE_ID] ?? 0}; no new.`,
  );
}
