// Gate de COMPLETITUD / LOSSLESS (FB0, ECO-63 / ADR-012). El fallo histórico fue la PÉRDIDA SILENCIOSA: páginas/
// imágenes/bloques que se caían sin avisar. Este gate lo hace IMPOSIBLE de ignorar: compara lo que la fuente
// CONTENÍA con lo que el IR CAPTURÓ, y FALLA si se perdió algo. Honestidad (ADR-012): "nada se pierde" está
// acotado a lo que el backup contiene — lo que la fuente NO podía dar (p.ej. contenido dinámico ausente) se
// DECLARA como `notInSource`, no se cuenta como pérdida ni se inventa.
//
// El adapter adjunta `ir.coverage = { source:{pages,blocks,media,...}, captured:{...}, dropped:[{what,why}],
//   notInSource:[...] }`. Aquí se evalúa y se reporta.
import { irStats } from "./ir.mjs";

// Dimensiones que el gate exige preservar (capturado >= fuente).
const DIMS = ["pages", "blocks", "media"];

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

  const dropped = cov.dropped || [];
  if (dropped.length) {
    problems.push(`${dropped.length} elemento(s) DESCARTADOS en silencio: ${dropped.slice(0, 5).map((d) => d.what).join(", ")}${dropped.length > 5 ? "…" : ""}`);
    for (const d of dropped.slice(0, 8)) lines.push(`  ✗ DROPPED ${d.what} — ${d.why}`);
  }

  const notInSource = cov.notInSource || [];
  if (notInSource.length) lines.push(`  ℹ no estaba en la fuente (declarado, no inventado): ${notInSource.join(", ")}`);

  return { ok: problems.length === 0, problems, lines, stats };
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
