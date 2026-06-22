import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { generateSatellite, DEFAULT_COMPONENTS } from "../scripts/generate-satellite.mjs";
import { SCHEMA_VERSION, field } from "../scripts/lib/brief.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../../..");
const DS = join(REPO_ROOT, "design-system");
const EM_UI = join(REPO_ROOT, "design-system", "registry", "cli.mjs");

// Brief de prueba: contactPhone provided, contactEmail AUSENTE (=> placeholder), services provided.
const brief = {
  schemaVersion: SCHEMA_VERSION,
  intakeMode: "a-no-design",
  identity: {
    name: field("Peluquería Lúmen", "provided"),
    sector: field("peluquería", "provided"),
    language: field("es", "provided"),
  },
  fields: {
    contactPhone: field("+34 600 000 000", "provided"),
    services: field(["Corte 18€", "Color 45€"], "provided"),
  },
  targetRoutes: ["/", "/servicios", "/contacto"],
};

let dir, trace;
before(() => {
  dir = join(mkdtempSync(join(tmpdir(), "sat-gen-")), "sat-demo");   // EFÍMERO (AC#6): tmp, se descarta
  trace = generateSatellite(brief, dir);
});
after(() => { try { rmSync(dirname(dir), { recursive: true, force: true }); } catch {} });

// AC#1: brief -> satélite forma-SAT01 (Next.js multi-ruta).
test("AC#1: genera estructura forma-SAT01 (config + multi-ruta)", () => {
  for (const f of ["package.json", "next.config.mjs", "tsconfig.json", "postcss.config.mjs", "src/app/layout.tsx", "src/app/page.tsx"]) {
    assert.ok(existsSync(join(dir, f)), `falta ${f}`);
  }
  assert.ok(existsSync(join(dir, "src/app/servicios/page.tsx")), "ruta /servicios");
  assert.ok(existsSync(join(dir, "src/app/contacto/page.tsx")), "ruta /contacto");
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  assert.match(pkg.name, /^@em-ecosystem\/sat-/);
  assert.ok(pkg.dependencies.next, "es Next.js");
});

// AC#2: las SECCIONES (nivel 2) y sus átomos/hook vienen SOLO via em-ui add; diff sin drift; cero dashboard.
test("AC#2: secciones+átomos provienen de em-ui (diff sin drift) y cero dashboard", () => {
  // las 4 secciones nivel-2 llegaron a components/sections/ y son idénticas a la fuente
  for (const s of ["Hero", "Services", "CTA", "Contact"]) {
    const f = join(dir, "src/components/sections", `${s}.tsx`);
    assert.ok(existsSync(f), `falta la sección ${s} (debió venir por em-ui add)`);
    const out = execFileSync("node", [EM_UI, "diff", s, "--target", f], { cwd: REPO_ROOT, encoding: "utf8" });
    assert.match(out, /SIN DRIFT/, `${s} debería ser idéntico a design-system`);
  }
  // los átomos del CIERRE transitivo (Button/Badge) también, en components/ui/
  for (const c of ["Button", "Badge"]) {
    const f = join(dir, "src/components/ui", `${c}.tsx`);
    assert.ok(existsSync(f), `falta el átomo ${c} (cierre de las secciones)`);
    const out = execFileSync("node", [EM_UI, "diff", c, "--target", f], { cwd: REPO_ROOT, encoding: "utf8" });
    assert.match(out, /SIN DRIFT/, `${c} debería ser idéntico a design-system`);
  }
  // el hook de reveal (internalDependency de las secciones) también llegó
  assert.ok(existsSync(join(dir, "src/hooks/useReveal.ts")), "falta el hook useReveal (internalDependency de las secciones)");
  // tokens instalados por em-ui init
  assert.ok(existsSync(join(dir, "src/styles/em-ui-tokens.css")), "em-ui init no instaló tokens");
  // cero ACOPLAMIENTO al dashboard en el CÓDIGO generado (.ts/.tsx): ningún import/lectura del dashboard.
  // (la capa de tokens .css es artefacto verbatim de F1 con un comentario de procedencia — no es código.)
  const stack = [join(dir, "src")];
  while (stack.length) {
    const p = stack.pop();
    for (const e of readdirSync(p, { withFileTypes: true })) {
      const full = join(p, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (/\.tsx?$/.test(e.name)) {
        assert.ok(!readFileSync(full, "utf8").includes("nexacore-dashboard"), `${full} referencia el dashboard`);
      }
    }
  }
});

// AC#3: lo ausente NO se inventa. En el producto diseñado, un `missing` se OMITE (no se rinde placeholder
// feo ni se fabrica); queda trazado en trace.placeholders. Los hechos `provided` sí se renderizan.
test("AC#3: lo ausente se omite (nunca inventado); los hechos provided se renderizan", () => {
  assert.ok(trace.placeholders.includes("contactEmail"), "contactEmail (ausente) debía quedar en trace.placeholders");
  const contacto = readFileSync(join(dir, "src/app/contacto/page.tsx"), "utf8");
  const home = readFileSync(join(dir, "src/app/page.tsx"), "utf8");
  // el teléfono provided aparece (sección Contact de /contacto)
  assert.match(contacto, /\+34 600 000 000/, "el teléfono provided debe aparecer en /contacto");
  // el email ausente NO se fabrica
  assert.doesNotMatch(home + contacto, /@(gmail|demo|example)\.[a-z]+/i, "no debe inventar un email");
  // el producto diseñado OMITE lo ausente (no rinde [FALTA] al cliente)
  assert.doesNotMatch(home + contacto, /\[FALTA/, "el diseño omite lo ausente; no rinde [FALTA] en el producto");
});

// AC#4: S2-ready -> los 6 deliverables de hardening presentes.
test("AC#4: S2-ready (6 cabeceras + robots + sitemap + metadata + metadataBase + observabilidad)", () => {
  const nc = readFileSync(join(dir, "next.config.mjs"), "utf8");
  for (const h of ["Strict-Transport-Security", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-DNS-Prefetch-Control"]) {
    assert.match(nc, new RegExp(h), `falta cabecera ${h}`);
  }
  assert.ok(existsSync(join(dir, "src/app/robots.ts")), "robots.ts");
  assert.ok(existsSync(join(dir, "src/app/sitemap.ts")), "sitemap.ts");
  const layout = readFileSync(join(dir, "src/app/layout.tsx"), "utf8");
  assert.match(layout, /metadataBase/, "metadataBase env-driven");
  // ECO-39: observabilidad DIFERIDA (on-idle) → en DeferredAnalytics, no inline en el layout (S2 Performance).
  assert.match(layout, /DeferredAnalytics/, "layout monta la observabilidad diferida");
  const deferred = readFileSync(join(dir, "src/components/DeferredAnalytics.tsx"), "utf8");
  assert.match(deferred, /SpeedInsights/, "observabilidad SpeedInsights (diferida)");
  assert.match(deferred, /Analytics/, "observabilidad Analytics (diferida)");
  assert.match(deferred, /requestIdleCallback|setTimeout/, "se monta on-idle, no bloquea el main-thread");
  const home = readFileSync(join(dir, "src/app/page.tsx"), "utf8");
  assert.match(home, /alternates:\s*\{\s*canonical/, "metadata por ruta (canonical)");
});
