// Tests del theming dark/light en satélites generados (ECO-48, paridad SAT01). Sin red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSatellite } from "../scripts/generate-satellite.mjs";
import { SCHEMA_VERSION, field, DEFAULT_COLOR_MODE } from "../scripts/lib/brief.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = readFileSync(join(HERE, "..", "SKILL.md"), "utf8");

const briefFor = (colorMode) => ({
  schemaVersion: SCHEMA_VERSION, intakeMode: "c-improve-site",
  identity: { name: field("Demo", "provided"), sector: field("x", "provided"), language: field("es", "provided") },
  fields: {},
  ...(colorMode ? { colorMode: { value: colorMode, provenance: "provided" } } : {}),
});

function gen(colorMode) {
  const dir = join(mkdtempSync(join(tmpdir(), "sat-theme-")), "d");
  const trace = generateSatellite(briefFor(colorMode), dir);
  const read = (p) => readFileSync(join(dir, p), "utf8");
  return { dir, trace, read, cleanup: () => { try { rmSync(dirname(dir), { recursive: true, force: true }); } catch {} } };
}

test("scaffolda la maquinaria de tema: ThemeContext + providers + useTheme nunca rompe (provider envuelve)", () => {
  const g = gen("dark");
  try {
    assert.ok(existsSync(join(g.dir, "src/context/ThemeContext.tsx")), "falta ThemeContext");
    assert.ok(existsSync(join(g.dir, "src/app/providers.tsx")), "falta providers.tsx");
    const ctx = g.read("src/context/ThemeContext.tsx");
    assert.match(ctx, /export const ThemeContext/);          // el que importa useTheme (@/context/ThemeContext)
    assert.match(ctx, /export default function ThemeProvider/);
    const providers = g.read("src/app/providers.tsx");
    assert.match(providers, /ThemeProvider/);
    const layout = g.read("src/app/layout.tsx");
    assert.match(layout, /import Providers from ".\/providers"/);
    assert.match(layout, /<Providers>\{children\}<\/Providers>/);   // envuelve la app → useTheme no rompe
    assert.match(layout, /THEME_INIT_SCRIPT/);                       // anti-FOUC presente
  } finally { g.cleanup(); }
});

test("el default lo PARAMETRIZA colorMode (no hardcodeado) — DEFAULT_MODE refleja el brief", () => {
  for (const mode of ["dark", "light", "system"]) {
    const g = gen(mode);
    try {
      assert.equal(g.trace.colorMode, mode);
      assert.match(g.read("src/context/ThemeContext.tsx"), new RegExp(`DEFAULT_MODE: ColorMode = "${mode}"`));
    } finally { g.cleanup(); }
  }
});

test("el init-script anti-FOUC refleja el colorMode (3 casos)", () => {
  const dark = gen("dark"); const light = gen("light"); const system = gen("system");
  try {
    const sd = dark.read("src/app/layout.tsx");
    const sl = light.read("src/app/layout.tsx");
    const ss = system.read("src/app/layout.tsx");
    // dark: default dark salvo 'light' guardado
    assert.match(sd, /t!=='light'/);
    // light: solo añade dark si 'dark' guardado (NO el patrón dark-default)
    assert.match(sl, /t==='dark'/);
    assert.doesNotMatch(sl, /t!=='light'/);
    // system: respeta prefers-color-scheme
    assert.match(ss, /prefers-color-scheme/);
  } finally { dark.cleanup(); light.cleanup(); system.cleanup(); }
});

test("colorMode ausente => default neutro (system), no rompe briefs previos", () => {
  const g = gen(null);
  try {
    assert.equal(DEFAULT_COLOR_MODE, "system");
    assert.equal(g.trace.colorMode, "system");
    assert.match(g.read("src/context/ThemeContext.tsx"), /DEFAULT_MODE: ColorMode = "system"/);
  } finally { g.cleanup(); }
});

test("onboarding (SKILL.md modo c) PREGUNTA el modo de color y no lo auto-elige", () => {
  // el skill debe instruir preguntar dark|light|system (no hardcodear)
  assert.match(SKILL, /dark/i);
  assert.match(SKILL, /light/i);
  assert.match(SKILL, /prefers-color-scheme|sistema/i);
  assert.match(SKILL, /PREGUNTA SIEMPRE el modo de color|modo de color.*por defecto/i);
});
