// Gate de EMISIÓN — IR → sitio (FB2, ECO-63 · ADR-012). El SIMÉTRICO del gate de CAPTURA (fuente → IR, que vive
// en capture/capture-gate.mjs desde G1/ECO-73): cierra el ciclo de punta a punta — NADA del IR se cae en el
// satélite emitido. Mide del OUTPUT REAL (las page.tsx emitidas), no de lo que el emitter afirme. Genérico: sólo
// conoce el IR (model/ir.mjs) + las páginas Next emitidas.
//
// NOTA (roadmap): este gate es lado-EMISIÓN; G2 (esqueleto/estándar) lo re-hogará en standard/. G1 sólo separó
// el gate de CAPTURA (→ capture/capture-gate.mjs); aquí queda el de EMISIÓN intacto en comportamiento.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { irStats, walkBlocks } from "../model/ir.mjs";

function findPageFiles(appDir) {
  const out = [];
  const walk = (d) => {
    let ents; try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "page.tsx") out.push(p);
    }
  };
  walk(appDir);
  return out;
}
export function verifyEmit(ir, satDir) {
  const appDir = join(satDir, "src", "app");
  const files = existsSync(appDir) ? findPageFiles(appDir) : [];
  const all = files.map((f) => readFileSync(f, "utf8")).join("\n");
  // copy emitido = los literales {"…"} que el renderer puso en el <main> (el texto REAL del IR). Se decodifica
  // con JSON.parse para que los escapes (\n, \t, \") vuelvan a su carácter real — contar palabras de verdad.
  const texts = [...all.matchAll(/\{("(?:[^"\\]|\\.)*")\}/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return ""; } });
  // Palabras REALES (sin markup): se cuenta igual en ambos lados (IR y sitio) tras quitar tags/colapsar espacios
  // → robusto a `<br>`/`\n` (token-boundary), pero sigue cazando copy caído (si falta un bloque, faltan sus palabras).
  const words = (s) => (String(s).replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;
  let irWords = 0; for (const { block } of walkBlocks(ir)) irWords += words(block.text || "");
  const wordsEmitted = words(texts.join(" "));
  const imgRefs = new Set([...all.matchAll(/\/images\/[A-Za-z0-9._-]+/g)].map((m) => m[0]));
  const usedMedia = (ir.media || []).filter((m) => (m.usedBy || []).length).length;
  const stats = irStats(ir);

  const problems = [], lines = [];

  // Verificar por RUTA (no solo conteo): cada página del IR debe tener su page.tsx.
  // El emitter puede añadir páginas extra (p.ej. /contact del estándar pro) — eso está bien; lo que NO está
  // bien es que falte una ruta del IR aunque otra nueva haya inflado el conteo total.
  const fileToRoute = (f) => {
    const rel = f.substring(appDir.length).replace(/\\/g, "/").replace(/\/page\.tsx$/, "");
    return rel || "/";
  };
  const emittedRoutes = new Set(files.map(fileToRoute));
  const irRoutes = (ir.pages || []).map((p) => p.route);
  const missing = irRoutes.filter((r) => !emittedRoutes.has(r));
  if (missing.length) {
    problems.push(`páginas: rutas del IR que CAYERON del sitio (${missing.length}): ${missing.join(", ")}`);
    lines.push(`  ✗ páginas: IR ${irRoutes.length} rutas → sitio ${emittedRoutes.size} (faltan: ${missing.join(", ")})`);
  } else {
    lines.push(`  ✓ páginas: todas las ${irRoutes.length} rutas del IR presentes (+ ${emittedRoutes.size - irRoutes.length} extra del núcleo)`);
  }

  const chk = (name, inN, outN) => {
    const pass = outN >= inN;
    if (!pass) problems.push(`emisión ${name}: el IR tenía ${inN} pero el sitio solo ${outN} (SE CAYÓ ${inN - outN})`);
    lines.push(`  ${pass ? "✓" : "✗"} ${name}: IR ${inN} → sitio ${outN}`);
  };
  chk("palabras (copy)", irWords, wordsEmitted);
  chk("imágenes usadas", usedMedia, imgRefs.size);
  return { ok: problems.length === 0, problems, lines };
}
export function assertEmit(ir, satDir) {
  const r = verifyEmit(ir, satDir);
  if (!r.ok) { const e = new Error("gate de EMISIÓN FALLÓ — el sitio perdería contenido del IR:\n" + r.problems.map((p) => "  - " + p).join("\n")); e.report = r; throw e; }
  return r;
}
