// check-freeze.mjs — anti-freeze guard for the design-tokens (ECO-135).
//
// Fails if a Tailwind `@theme` color token `--color-X` is FROZEN at :root while its raw
// source `--X` FLIPS per theme (light ≠ dark). That is exactly the class of bug that slipped
// past Fase 0 (accent): `@theme { --color-X: var(--X) }` resolves ONCE at :root and freezes,
// so if `--X` is re-declared with a different value in `.dark`, `var(--X)` consumers flip but
// `var(--color-X)` / `text-X` / `bg-X` consumers stay light-valued → split-brain in dark.
//
// The contrast gate CANNOT catch this: it reads the raw `:root`/`.dark` values, never the
// frozen `--color-*` utilities. This guard closes that blind spot.
//
// Rule: for every `--color-X` declared only in `@theme` (not re-declared in BOTH `.dark` and
// `.light`), its raw `--X` must NOT differ between the light block and the dark block. Either
// re-declare `--color-X` per theme (so it follows), or keep `--X` brand-fixed (one value).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
// Optional path arg lets the guard be self-tested against a synthetic "frozen" copy.
const tokensPath = process.argv[2] || join(dir, "../tokens/tokens.css");
const css = readFileSync(tokensPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

// Flat blocks only — the token blocks (:root / .light / .dark / @theme) have no nested braces.
// Bucket each block's declarations by scope. `--X` (raws) and `--color-X` (utilities) both land here.
const theme = {}, light = {}, dark = {};
const blockRe = /([^{}]*?)\{([^{}]*)\}/g;
let m;
while ((m = blockRe.exec(css))) {
  const header = m[1].split(";").pop().trim(); // drop `@custom-variant … ;` etc. before the selector
  const body = m[2];
  let bucket = null;
  // Match each class/pseudo as a COMPLETE selector token — `(?![\w-])` so a future `.dark-toggle`
  // utility is NOT mis-bucketed as the dark theme. NOTE: assumes flat token blocks (no rule nested
  // inside :root/.dark/.light); the token blocks are flat by construction — if that ever changes,
  // this attribution must move to a real CSS parser.
  if (/^@theme$/.test(header)) bucket = theme; // plain @theme (the frozen layer); NOT `@theme inline`
  else if (/\.dark(?![\w-])/.test(header)) bucket = dark;
  else if (/:root\b/.test(header) || /\.light(?![\w-])/.test(header)) bucket = light;
  if (!bucket) continue;
  for (const d of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) bucket[d[1]] = d[2].trim();
}

const bugs = [];
const warns = [];
let checked = 0;
for (const name of Object.keys(theme)) {
  if (!name.startsWith("--color-")) continue;
  checked++;
  const raw = "--" + name.slice("--color-".length); // --color-accent → --accent
  const lightRaw = light[raw];
  const darkRaw = dark[raw];
  const reDark = name in dark; // --color-X re-declared in .dark
  const reLight = name in light; // --color-X re-declared in .light/:root
  if (reDark && reLight) continue; // re-declared per theme → follows its source correctly

  if (lightRaw !== undefined && darkRaw !== undefined && lightRaw !== darkRaw) {
    bugs.push(
      `${name}: su crudo ${raw} FLIPA (${lightRaw} → ${darkRaw}) pero ${name} solo vive en @theme (congelado). ` +
        `Re-declara ${name} en .dark y .light (p.ej. \`${name}: var(${raw})\`), o haz ${raw} brand-fixed (un solo valor).`,
    );
  } else if (reDark !== reLight) {
    warns.push(`${name}: re-declarado solo en ${reDark ? ".dark" : ".light"} (asimétrico).`);
  }
}

if (bugs.length) {
  console.error(`✗ check-freeze: ${bugs.length} token(s) CONGELADO(s) con una fuente que flipa por tema:`);
  for (const b of bugs) console.error("  - " + b);
  console.error("  (El gate de contraste NO ve esta clase de bug — lee los crudos, no los --color-* congelados.)");
  process.exit(1);
}

console.log(`✓ check-freeze OK — ${checked} tokens --color-* revisados; ninguno congelado sobre una fuente que flipa.`);
for (const w of warns) console.log("  · aviso: " + w);
