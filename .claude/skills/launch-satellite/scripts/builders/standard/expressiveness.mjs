// MÉTRICA DE EXPRESIVIDAD (G3, ECO-75 · ADR-015 §5) — el guardarraíl anti-recaída-en-plantillas. Dado DOS
// page.design del MISMO contenido (mismos bloques del IR), mide si son GENUINAMENTE distintos en COMPOSICIÓN.
//
// ROBUSTA / NO gameable: la "firma de composición" se canonicaliza para IGNORAR (a) los TOKENS (bg/color/emphasis)
// y (b) el ORDEN de hermanos. Así, dos diseños que difieren SÓLO en color o en un reordenado trivial → firma
// idéntica → distancia 0 → NO pasan ("iguales salvo tokens/orden"). Para PASAR hay que cambiar ESTRUCTURA real:
//   · GROUPING   — qué bloques comparten contenedor (la partición del contenido). [peso 0.5]
//   · LAYOUT MIX — el multiset de primitivas usadas (grids vs splits vs stacks…).   [peso 0.3]
//   · PLACEMENT  — por bloque: (layout del contenedor, cols del padre, profundidad, as). [peso 0.2]
//
// DÓNDE corre (honestidad, no vender CI como ojo humano):
//   · El TEST de CI prueba que la MÉTRICA funciona (fixtures: idéntico/token-only/reorder fallan; genuino pasa).
//   · El no-relapse VIVO lo dan: el GATE VISUAL HUMANO (R5, Atis re-emitido) + la métrica VIVA en G4 (regenerar:
//     el nuevo variant debe ser genuinamente distinto del anterior). La métrica NO juzga BELLEZA (eso es el ojo).

// Umbral calibrado EMPÍRICAMENTE (datos reproducidos en tests/expressiveness.test.mjs):
//   · NO-genuinos → 0.000:  idéntico, sólo-tokens (mismo árbol, otro bg), sólo-reorden (misma partición, hijos
//     barajados). La firma ignora tokens y orden por diseño → distancia exactamente 0.
//   · GENUINOS → 0.54–0.90:  composiciones de distinta agrupación/layout/placement del MISMO contenido
//     (stack-plano vs hero+grid3+split = 0.87; 2-grids vs stack = 0.90; el par más PARECIDO medido, dos diseños
//     que comparten rejillas, = 0.54).
// ⇒ 0.34 separa con MARGEN AMPLIO por ambos lados (FP imposible: no-genuino=0; plantilla no pasa: genuino≥0.54).
// Es "≈ un tercio de las decisiones estructurales difieren". Documentado con datos, no inventado.
export const EXPRESSIVENESS_THRESHOLD = 0.34;

// Firma canónica de un design: { features:{ref->tuple}, grouping:{ref->containerKey}, layoutMultiset:{layout->n} }.
// containerKey es local al design (sólo se usa para comparar PARTICIONES por co-pertenencia, no para casar ids).
export function compositionSignature(design) {
  const features = {}, grouping = {}, layoutMultiset = {};
  let cid = 0;
  const walk = (node, depth, parentKey, parentLayout, parentCols) => {
    if (node && "ref" in node) {
      // PLACEMENT del bloque: contenedor + cols del padre + profundidad + presentación. SIN bg, SIN emphasis, SIN orden.
      features[node.ref] = `${parentLayout}|${parentCols || 0}|${depth}|${node.as || "auto"}`;
      grouping[node.ref] = parentKey;                       // co-pertenencia: qué bloques comparten contenedor
      return;
    }
    if (!node || node.layout === "spacer") return;
    layoutMultiset[node.layout] = (layoutMultiset[node.layout] || 0) + 1;
    const myKey = cid++;
    for (const c of node.children || []) walk(c, depth + 1, myKey, node.layout, node.cols);
  };
  for (const node of design.tree || []) walk(node, 0, cid++, "root", 0);
  return { features, grouping, layoutMultiset };
}

// Distancia de PARTICIÓN (estilo Rand): sobre TODOS los pares de refs, fracción donde la co-pertenencia difiere.
// Invariante al orden y a los ids de contenedor → un reordenado trivial NO cambia la partición → distancia 0.
function partitionDistance(gA, gB) {
  const refs = [...new Set([...Object.keys(gA), ...Object.keys(gB)])];
  let diff = 0, total = 0;
  for (let i = 0; i < refs.length; i++) for (let k = i + 1; k < refs.length; k++) {
    total++;
    const coA = gA[refs[i]] !== undefined && gA[refs[i]] === gA[refs[k]];
    const coB = gB[refs[i]] !== undefined && gB[refs[i]] === gB[refs[k]];
    if (coA !== coB) diff++;
  }
  return total ? diff / total : 0;
}

// Distancia de Jaccard sobre el MULTISET de layouts (cuenta repeticiones).
function multisetDistance(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let inter = 0, uni = 0;
  for (const k of keys) { const x = a[k] || 0, y = b[k] || 0; inter += Math.min(x, y); uni += Math.max(x, y); }
  return uni ? 1 - inter / uni : 0;
}

// Fracción de bloques cuyo PLACEMENT (tuple de features) difiere entre A y B.
function featureDistance(fA, fB) {
  const refs = [...new Set([...Object.keys(fA), ...Object.keys(fB)])];
  if (!refs.length) return 0;
  let diff = 0;
  for (const r of refs) if (fA[r] !== fB[r]) diff++;
  return diff / refs.length;
}

// Distancia de COMPOSICIÓN en [0,1] entre dos designs del mismo contenido. 0 = misma composición (salvo tokens/orden).
export function compositionDistance(designA, designB) {
  const a = compositionSignature(designA), b = compositionSignature(designB);
  const grouping = partitionDistance(a.grouping, b.grouping);
  const layout = multisetDistance(a.layoutMultiset, b.layoutMultiset);
  const placement = featureDistance(a.features, b.features);
  const score = 0.5 * grouping + 0.3 * layout + 0.2 * placement;
  return { score, grouping, layout, placement };
}

// ¿GENUINAMENTE distintos? score ≥ umbral. Devuelve el desglose para el reporte del gate (transparencia).
export function genuinelyDifferent(designA, designB, threshold = EXPRESSIVENESS_THRESHOLD) {
  const d = compositionDistance(designA, designB);
  return { ok: d.score >= threshold, threshold, ...d };
}
