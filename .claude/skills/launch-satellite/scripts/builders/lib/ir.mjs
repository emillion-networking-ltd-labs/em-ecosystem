// IR — Intermediate Representation / MODELO NORMALIZADO de un sitio capturado (FB0, ECO-63 / ADR-012).
// AGNÓSTICO de la fuente: cualquier adapter de fuente (un backup, un export HTML, otro CMS) produce ESTE mismo
// modelo. El emitter (FB2) lo consume; el núcleo común garantiza los transversales sobre él. Es el INVERSO del
// brief escalar de hoy: primero CAPTURA todo (lossless), luego mapea. Cero supuestos de la fuente aquí.
//
// Forma del IR:
//   { source:{kind,backup}, site:{name,description,url,language,locale}, pages:[{...}], media:[{...}],
//     menus:[{...}], forms:[{...}] }
//   page  = { id, type, slug, route, title, parent, order, seo?, blocks:[block] }
//   block = { kind, text?, level?, href?, media:[mediaRef], raw }   // raw = el elemento original (lossless)
//   media = { id, file, src, usedBy:[pageId], alt?, mime? }         // file = ruta real en el backup
//
// "raw" preserva el elemento de la fuente TAL CUAL → garantía de que NADA se pierde aunque el normalizador no
// reconozca un widget. El gate de completitud (lossless.mjs) cuenta páginas/bloques/imágenes in == out.

export const IR_VERSION = "1.0.0";

export function emptyIR(source) {
  return { irVersion: IR_VERSION, source: source || { kind: "unknown" }, site: {}, pages: [], media: [], menus: [], forms: [] };
}

// Recorre todos los bloques de todas las páginas (incl. anidados vía block.children si los hubiera).
export function* walkBlocks(ir) {
  for (const p of ir.pages || []) {
    const stack = [...(p.blocks || [])];
    while (stack.length) {
      const b = stack.shift();
      yield { page: p, block: b };
      if (Array.isArray(b.children)) stack.unshift(...b.children);
    }
  }
}

const wordsOf = (s) => (typeof s === "string" ? (s.trim().match(/\S+/g) || []).length : 0);

// Estadística de cobertura del IR — la base del gate lossless (in == out).
export function irStats(ir) {
  let blocks = 0, words = 0, blockMediaRefs = 0;
  for (const { block } of walkBlocks(ir)) {
    blocks++;
    words += wordsOf(block.text);
    blockMediaRefs += (block.media || []).length;
  }
  return {
    pages: (ir.pages || []).length,
    blocks,
    media: (ir.media || []).length,
    menus: (ir.menus || []).length,
    menuItems: (ir.menus || []).reduce((n, m) => n + (m.items || []).length, 0),
    forms: (ir.forms || []).length,
    words,
    blockMediaRefs,
    // SUB-CAMPO: páginas con SEO real (title o description). El gate lo verifica para cazar SEO caído sin
    // que cambie el nº de páginas (el punto ciego de "contar solo cantidades").
    seoPages: (ir.pages || []).filter((p) => p.seo && (p.seo.title || p.seo.description)).length,
  };
}

// Validación estructural del IR (no semántica). Devuelve [] si OK, o lista de problemas.
export function validateIR(ir) {
  const p = [];
  if (!ir || typeof ir !== "object") return ["IR no es objeto"];
  if (ir.irVersion !== IR_VERSION) p.push(`irVersion debe ser ${IR_VERSION}`);
  if (!ir.source || !ir.source.kind) p.push("falta source.kind");
  if (!ir.site || typeof ir.site !== "object") p.push("falta site");
  if (!Array.isArray(ir.pages)) p.push("pages debe ser un array");
  if (!Array.isArray(ir.media)) p.push("media debe ser un array");
  const seenRoutes = new Set();
  for (const pg of ir.pages || []) {
    if (!pg.id && pg.id !== 0) p.push(`página sin id (${pg.title || pg.slug || "?"})`);
    if (typeof pg.route !== "string") p.push(`página ${pg.id}: route debe ser string`);
    else if (seenRoutes.has(pg.route)) p.push(`route duplicada: ${pg.route}`);
    else seenRoutes.add(pg.route);
    if (!Array.isArray(pg.blocks)) p.push(`página ${pg.id}: blocks debe ser un array`);
  }
  const ids = new Set();
  for (const m of ir.media || []) {
    if (!m.id) p.push("media sin id");
    else if (ids.has(m.id)) p.push(`media id duplicado: ${m.id}`);
    else ids.add(m.id);
    if (!m.file && !m.src) p.push(`media ${m.id}: sin file ni src`);
  }
  return p;
}
