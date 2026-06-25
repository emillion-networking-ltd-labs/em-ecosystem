// SPEC DE DISEÑO (`page.design`) — el ARTEFACTO que la IA-diseñador (R4) AUTORA y se persiste en el IR (G3,
// ECO-75 · ADR-015 §5). Es un ÁRBOL DE COMPOSICIÓN sobre PRIMITIVAS DE LAYOUT — **NO** un menú/enum role→shell.
// Las hojas referencian bloques del IR por ÍNDICE: el contenido vive en el IR, el spec NO lleva copy → LOSSLESS
// POR REFS (nada se pierde, nada se inventa). El compilador (compileFromSpec) es un TIPÓGRAFO TONTO: traduce
// campos del spec → clases, CERO decisión por contenido. Toda la decisión de diseño la tomó la IA y vive AQUÍ.
//
//   design = { designVersion, variant:int, blocks:int, tree: Node[] }
//   Node   = { layout, bg?, pad?, maxWidth?, align?, cols?, gap?, emphasis?, children:(Node|Leaf)[] }
//   Leaf   = { ref:int (índice de bloque del IR), as? }

export const DESIGN_VERSION = "1.0.0";
// Primitivas de LAYOUT (compositional, NO semánticas). El compilador las emite como estructura Tailwind + tokens.
export const LAYOUTS = new Set(["section", "band", "grid", "columns", "stack", "spacer"]);
// Presentación de una hoja (envoltura fija; el compilador NO mira el kind del bloque).
export const AS_KINDS = new Set(["auto", "prose", "card", "figure", "quote", "cta", "stat"]);
// Caja de un nodo de layout (envuelve un GRUPO como tarjeta/panel). Token-like → el compilador lo traduce.
export const BOX_KINDS = new Set(["card", "panel", "none"]);
// Claves PROHIBIDAS en cualquier nodo: reintroducirían el role→shell (un "tipo de sección" semántico) o copy
// inventado (texto fuera del IR). validateDesign las caza → anti-relapse + anti-invención por construcción.
const FORBIDDEN_KEYS = ["role", "component", "shell", "kind", "sectionType", "text", "copy", "html", "content"];

// Valida el spec contra el contrato + LOSSLESS (todo bloque con contenido referenciado). Devuelve [] o problemas.
export function validateDesign(design, page) {
  const probs = [];
  if (!design || typeof design !== "object") return ["design no es un objeto"];
  if (design.designVersion !== DESIGN_VERSION) probs.push(`designVersion debe ser ${DESIGN_VERSION}`);
  if (!Array.isArray(design.tree)) { probs.push("design.tree debe ser un array"); return probs; }
  const blocks = (page && page.blocks) || [];
  const n = blocks.length;
  if (Number.isInteger(design.blocks) && design.blocks !== n)
    probs.push(`design.blocks=${design.blocks} pero la página tiene ${n} bloques — el IR cambió desde la autoría (re-autora)`);

  const refs = new Set();
  const walk = (node, depth) => {
    if (!node || typeof node !== "object") { probs.push("nodo no-objeto en el árbol"); return; }
    for (const k of FORBIDDEN_KEYS) if (k in node) probs.push(`clave prohibida '${k}' en un nodo (el contenido vive en el IR por ref; sin role→shell)`);
    if (depth > 6) { probs.push("anidamiento excesivo (>6)"); return; }
    if ("ref" in node) {                                            // HOJA → un bloque del IR
      if (!Number.isInteger(node.ref) || node.ref < 0 || node.ref >= n) probs.push(`ref fuera de rango: ${JSON.stringify(node.ref)} (0..${n - 1})`);
      else refs.add(node.ref);
      if (node.as != null && !AS_KINDS.has(node.as)) probs.push(`'as' desconocido: ${node.as} (sólo ${[...AS_KINDS].join("/")})`);
      return;
    }
    if (!LAYOUTS.has(node.layout)) probs.push(`layout desconocido: ${JSON.stringify(node.layout)} (sólo ${[...LAYOUTS].join("/")})`);
    if (node.box != null && !BOX_KINDS.has(node.box)) probs.push(`'box' desconocido: ${node.box} (sólo ${[...BOX_KINDS].join("/")})`);
    if (node.layout === "spacer") return;                           // spacer no lleva hijos
    if (!Array.isArray(node.children) || !node.children.length) probs.push(`layout '${node.layout}' requiere children no vacíos`);
    else for (const c of node.children) walk(c, depth + 1);
  };
  for (const node of design.tree) walk(node, 0);

  // LOSSLESS POR REFS: todo bloque con CONTENIDO real (texto o media) debe estar referenciado → nada se cae.
  for (let i = 0; i < n; i++) {
    const b = blocks[i];
    const hasContent = (typeof b.text === "string" && b.text.trim()) || (Array.isArray(b.media) && b.media.length > 0);
    if (hasContent && !refs.has(i)) probs.push(`bloque ${i} (${b.kind}) con contenido NO referenciado — se perdería (lossless por refs)`);
  }
  return probs;
}

export function assertDesign(design, page) {
  const probs = validateDesign(design, page);
  if (probs.length) { const e = new Error("page.design INVÁLIDO:\n" + probs.map((p) => "  - " + p).join("\n")); e.problems = probs; throw e; }
  return true;
}
