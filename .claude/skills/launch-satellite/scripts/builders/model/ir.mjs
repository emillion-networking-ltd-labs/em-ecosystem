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

// Las SECCIONES de una página, tal como el emitter las AGRUPA (renderMain: una sección nueva en cada heading;
// el primer grupo arranca aunque no empiece en heading). Es el "qué tiene el sitio" que el paso 4 del flujo
// INFORMA al operador antes de enriquecer. Sólo lectura del IR (no toca nada). Devuelve, por página:
//   { id, route, title, sections: [{ heading|null, kinds:[blockKind], blocks:N, words:N, hasMedia:bool }] }
export function sectionsOf(ir) {
  const wc = (b) => wordsOf(b.text);
  return (ir.pages || []).map((p) => {
    const groups = [];
    for (const b of p.blocks || []) {
      if (b.kind === "heading" || groups.length === 0) groups.push([b]);
      else groups[groups.length - 1].push(b);
    }
    return {
      id: p.id, route: p.route, title: p.title || null,
      sections: groups.map((g) => ({
        heading: g[0] && g[0].kind === "heading" ? (typeof g[0].text === "string" ? g[0].text.trim() : null) : null,
        kinds: g.map((b) => b.kind),
        blocks: g.length,
        words: g.reduce((n, b) => n + wc(b), 0),
        hasMedia: g.some((b) => (b.media || []).length > 0),
      })),
    };
  });
}

// ENRIQUECER el IR con una sección APORTADA por el cliente (paso 4 del flujo). Guardrail §D4: el contenido lo
// aporta el cliente — esta función SÓLO da forma a lo que se le pasa, NUNCA inventa. Una sección = un heading +
// contenido real (párrafos y/o bloques ya en forma IR). Rechaza secciones vacías (sin heading o sin contenido)
// → imposible añadir "ruido". Marca los bloques con raw.provenance para trazabilidad. Inserta en `index` (o al
// final). MUTA y devuelve el IR. La sección añadida sube palabras/bloques → el gate de EMISIÓN exige que el
// sitio la contenga (no se cae); el gate de CAPTURA ya pasó sobre el IR capturado (esto es contenido NUEVO,
// post-captura, no "de la fuente"). Lanza si la página/ruta no existe o la sección está vacía.
export function addSection(ir, spec = {}) {
  const { route, pageId, heading, paragraphs = [], blocks = [], index = null, provenance = "provided" } = spec;
  const page = (ir.pages || []).find((p) => (pageId != null && p.id === pageId) || (route != null && p.route === route));
  if (!page) throw new Error(`addSection: no existe página con ${pageId != null ? `id=${pageId}` : `route=${route}`} en el IR`);
  const h = typeof heading === "string" ? heading.trim() : "";
  if (!h) throw new Error("addSection: 'heading' es obligatorio (una sección sin título no se añade — §D4, nunca inventar)");
  const paras = (Array.isArray(paragraphs) ? paragraphs : [paragraphs]).map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
  const extra = (Array.isArray(blocks) ? blocks : []).filter((b) => b && typeof b.kind === "string");
  if (!paras.length && !extra.length) throw new Error("addSection: la sección no aporta contenido real (ni párrafos ni bloques) — no se añade contenido vacío (§D4)");

  const tag = { added: true, provenance };   // trazabilidad: el bloque es aportado, no de la fuente
  const newBlocks = [{ kind: "heading", text: h, raw: { ...tag } }];
  if (paras.length) newBlocks.push({ kind: "text-editor", text: paras.join("\n\n"), media: [], raw: { ...tag } });
  for (const b of extra) newBlocks.push({ ...b, raw: { ...(b.raw || {}), ...tag } });

  const at = Number.isInteger(index) ? Math.max(0, Math.min(index, (page.blocks || []).length)) : (page.blocks || []).length;
  page.blocks = page.blocks || [];
  page.blocks.splice(at, 0, ...newBlocks);
  return ir;
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
  if (ir.menus != null && !Array.isArray(ir.menus)) p.push("menus debe ser un array");
  if (ir.forms != null && !Array.isArray(ir.forms)) p.push("forms debe ser un array");
  const seenRoutes = new Set();
  for (const pg of ir.pages || []) {
    if (!pg.id && pg.id !== 0) p.push(`página sin id (${pg.title || pg.slug || "?"})`);
    if (typeof pg.route !== "string") p.push(`página ${pg.id}: route debe ser string`);
    else if (seenRoutes.has(pg.route)) p.push(`route duplicada: ${pg.route}`);
    else seenRoutes.add(pg.route);
    // `design` (page.design) — OPCIONAL, AÑADIDO en G3 (ECO-75): el SPEC de diseño que la IA (R4) autora y se
    // persiste aquí; lo valida en profundidad validateDesign (standard/). Aditivo + opcional → NO rompe IRs 1.0.0.
    if (pg.design != null && typeof pg.design !== "object") p.push(`página ${pg.id}: design debe ser un objeto`);
    if (!Array.isArray(pg.blocks)) p.push(`página ${pg.id}: blocks debe ser un array`);
    else {
      // Cada bloque (incl. anidados) DEBE tener un `kind` string — es el discriminante del modelo; sin él, el
      // emitter no sabe qué es. Recorre children para no dejar entrar bloques sin tipo por la puerta de atrás.
      const stack = [...pg.blocks];
      while (stack.length) {
        const b = stack.shift();
        if (!b || typeof b !== "object" || typeof b.kind !== "string" || !b.kind) {
          p.push(`página ${pg.id}: un bloque no tiene 'kind' string (discriminante obligatorio del modelo)`);
          continue;
        }
        if (Array.isArray(b.children)) stack.push(...b.children);
      }
    }
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
