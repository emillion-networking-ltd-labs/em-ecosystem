// Gate de COMPLETITUD / LOSSLESS (FB0, ECO-63 / ADR-012). El fallo histórico fue la PÉRDIDA SILENCIOSA: páginas/
// imágenes/bloques que se caían sin avisar. Este gate lo hace IMPOSIBLE de ignorar: compara lo que la fuente
// CONTENÍA con lo que el IR CAPTURÓ, y FALLA si se perdió algo. Honestidad (ADR-012): "nada se pierde" está
// acotado a lo que el backup contiene — lo que la fuente NO podía dar (p.ej. contenido dinámico ausente) se
// DECLARA como `notInSource`, no se cuenta como pérdida ni se inventa.
//
// El adapter adjunta `ir.coverage = { source:{pages,blocks,media,...}, captured:{...}, dropped:[{what,why}],
//   subfields:{ seo:{source:N} }, notInSource:[...] }`. Aquí se evalúa y se reporta.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { irStats, walkBlocks } from "./ir.mjs";

// Dimensiones (cantidades) que el gate exige preservar (capturado >= fuente).
const DIMS = ["pages", "blocks", "media"];
// SUB-CAMPOS que el gate verifica ADEMÁS de las cantidades — cierra el punto ciego: un sub-campo (p.ej. el SEO
// por-página) puede caerse SIN cambiar el nº de páginas/bloques/media. name → clave de irStats que lo MIDE del
// IR real (genérico: el gate no sabe de plugins/fuentes, solo del IR). Extensible a más sub-campos.
const SUBFIELD_STAT = { seo: "seoPages" };

// Evalúa el IR contra su coverage declarada. Devuelve { ok, problems, lines, stats }.
export function losslessReport(ir) {
  const cov = ir.coverage || {};
  const source = cov.source || {};
  const stats = irStats(ir);
  // "captured" = lo que el adapter dice que emitió; debe coincidir con la estadística REAL del IR (anti-mentira).
  const captured = cov.captured || {};
  const problems = [];
  const lines = [];

  for (const d of DIMS) {
    const inN = Number(source[d] ?? 0);
    const outN = Number(stats[d] ?? 0);          // se mide del IR REAL, no de lo que el adapter afirma
    const claim = Number(captured[d] ?? outN);
    const pass = outN >= inN && claim === outN;  // nada perdido Y el adapter no miente sobre lo emitido
    if (!pass) problems.push(
      outN < inN ? `${d}: la fuente tenía ${inN} pero el IR solo capturó ${outN} (PÉRDIDA de ${inN - outN})`
                 : `${d}: el adapter declaró ${claim} capturados pero el IR tiene ${outN} (incoherencia)`);
    lines.push(`  ${pass ? "✓" : "✗"} ${d}: fuente ${inN} → IR ${outN}`);
  }

  // SUB-CAMPOS: la fuente declara cuántas páginas TIENEN el sub-campo; el IR debe haberlo capturado en todas.
  // Se mide del IR real (irStats) → si el adapter dejó SEO caído en algunas páginas, captured < source = FALLA.
  const subfields = cov.subfields || {};
  for (const [name, decl] of Object.entries(subfields)) {
    const statKey = SUBFIELD_STAT[name];
    if (!statKey) continue;                       // sub-campo no medible aún → no se gatea (no se finge)
    const inN = Number(decl.source ?? 0);
    const outN = Number(stats[statKey] ?? 0);
    const pass = outN >= inN;
    if (!pass) problems.push(`sub-campo ${name}: la fuente lo tenía en ${inN} página(s) pero el IR solo en ${outN} (SE CAYÓ en ${inN - outN})`);
    lines.push(`  ${pass ? "✓" : "✗"} sub-campo ${name}: fuente ${inN} → IR ${outN} página(s)`);
  }

  const dropped = cov.dropped || [];
  if (dropped.length) {
    problems.push(`${dropped.length} elemento(s) DESCARTADOS en silencio: ${dropped.slice(0, 5).map((d) => d.what).join(", ")}${dropped.length > 5 ? "…" : ""}`);
    for (const d of dropped.slice(0, 8)) lines.push(`  ✗ DROPPED ${d.what} — ${d.why}`);
  }

  const notInSource = cov.notInSource || [];
  if (notInSource.length) lines.push(`  ℹ no estaba en la fuente (declarado, no inventado): ${notInSource.join(", ")}`);

  return { ok: problems.length === 0, problems, lines, stats };
}

// --- Gate de EMISIÓN (FB2): el SITIO emitido preserva el contenido del IR (IR → sitio). Cierra el ciclo con el
// gate de captura (fuente → IR): de punta a punta NADA se cae. Mide del OUTPUT real (las page.tsx), no de lo que
// el emitter afirme. Genérico: solo conoce el IR + las páginas Next emitidas.
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
  const chk = (name, inN, outN) => {
    const pass = outN >= inN;
    if (!pass) problems.push(`emisión ${name}: el IR tenía ${inN} pero el sitio solo ${outN} (SE CAYÓ ${inN - outN})`);
    lines.push(`  ${pass ? "✓" : "✗"} ${name}: IR ${inN} → sitio ${outN}`);
  };
  chk("páginas", stats.pages, files.length);
  chk("palabras (copy)", irWords, wordsEmitted);
  chk("imágenes usadas", usedMedia, imgRefs.size);
  return { ok: problems.length === 0, problems, lines };
}
export function assertEmit(ir, satDir) {
  const r = verifyEmit(ir, satDir);
  if (!r.ok) { const e = new Error("gate de EMISIÓN FALLÓ — el sitio perdería contenido del IR:\n" + r.problems.map((p) => "  - " + p).join("\n")); e.report = r; throw e; }
  return r;
}

// Lanza si el gate falla (uso desde el orquestador / CI del builder).
export function assertLossless(ir) {
  const r = losslessReport(ir);
  if (!r.ok) {
    const e = new Error("gate lossless FALLÓ — el output perdería información que la fuente tenía:\n" + r.problems.map((p) => "  - " + p).join("\n"));
    e.report = r;
    throw e;
  }
  return r;
}
