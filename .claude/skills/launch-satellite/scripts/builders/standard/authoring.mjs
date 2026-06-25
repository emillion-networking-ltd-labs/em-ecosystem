// PROCESO DE AUTORÍA (G3, ECO-75 · ADR-015 §5) — la MITAD CREATIVA. Pone a la IA en rol de DISEÑADOR SENIOR y le
// da el brief para AUTORAR `page.design` (el árbol de composición). NO es un generador determinista (eso sería el
// motor que recae en plantillas): es el PROMPT/estructura que habilita a la IA a DISEÑAR. La IA lee el brief →
// escribe el spec → validateDesign lo verifica → se persiste en el IR → compileFromSpec lo rinde.
//
// Tres pilares en el brief:
//  1. SIN MENÚ de secciones: NO se elige "hero/services"; se COMPONE con primitivas de layout (arbitrario, §5).
//  2. DISEÑA DESDE LA ESTRUCTURA capturada (sesgo FUERTE a preservar agrupación+orden — es la arquitectura de
//     información del cliente). Reordenar/reagrupar SÓLO con razón de diseño GENUINA, NUNCA a ciegas ni al azar.
//  3. LOSSLESS / §D4: referencia TODO bloque con contenido por su índice; jamás inventa ni descarta copy.
import { LAYOUTS, AS_KINDS, DESIGN_VERSION } from "./design-spec.mjs";

// Las SECCIONES capturadas de una página (heading agrupa; el primer grupo arranca aunque no sea heading) — la
// arquitectura de información del cliente que la IA debe RESPETAR. Cada bloque con su ÍNDICE (la hoja `ref`).
export function pageSections(page) {
  const groups = [];
  (page.blocks || []).forEach((b, i) => {
    if (b.kind === "heading" || groups.length === 0) groups.push([]);
    groups[groups.length - 1].push({ i, kind: b.kind, words: wordsOf(b.text), media: (b.media || []).length, text: snippet(b.text) });
  });
  return groups.map((g) => ({
    heading: g[0] && g[0].text ? g[0].text : null,
    blocks: g,
  }));
}
const wordsOf = (s) => (typeof s === "string" ? (s.trim().match(/\S+/g) || []).length : 0);
const snippet = (s) => (typeof s === "string" ? s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) : "");

// Ensambla el BRIEF para R4. `vocab` = vocabulary() de standard/vocabulary.mjs. Devuelve el prompt (string).
export function designBrief(page, { vocab, brand = null, siteName = "" } = {}) {
  const sections = pageSections(page);
  const secLines = sections.map((s, si) => {
    const head = s.heading ? `“${s.heading}”` : "(sin encabezado)";
    const blocks = s.blocks.map((b) => `      [${b.i}] ${b.kind}${b.media ? ` img×${b.media}` : ""}${b.words ? ` ${b.words}w` : ""}${b.text ? ` — ${b.text}` : ""}`).join("\n");
    return `  Sección ${si + 1}: ${head}\n${blocks}`;
  }).join("\n");
  const tokens = vocab && vocab.ok ? vocab.tokens : { colors: [], typography: [], radius: [] };
  const prims = vocab && vocab.ok ? vocab.primitives.map((p) => p.name).join(", ") : "";

  return `Eres un DISEÑADOR DE PRODUCTO SENIOR. Diseña una página WEB BELLA y de marca para "${siteName}" A PARTIR DE
ESTE CONTENIDO REAL (capturado del sitio del cliente, lossless). Tu salida es un SPEC DE DISEÑO (page.design): un
ÁRBOL DE COMPOSICIÓN. Tú decides el diseño; un compilador tonto lo rinde tal cual.

⛔ REGLAS INNEGOCIABLES (§5/ADR-015):
1. NO hay un menú de "tipos de sección". NO eliges "hero" o "services". COMPONES con PRIMITIVAS DE LAYOUT
   (${[...LAYOUTS].join(", ")}) — decides agrupación, columnas, anidado, jerarquía, énfasis, ritmo y fondos.
   Composición ARBITRARIA, como un diseñador con un design system. (Si recaes en "una sección fija por bloque",
   has fallado.)
2. DISEÑA DESDE LA ESTRUCTURA capturada (abajo). Es la arquitectura de información del cliente: por DEFECTO
   PRESERVA su AGRUPACIÓN y su ORDEN. Reordenar o reagrupar es la EXCEPCIÓN, sólo con una razón de diseño
   GENUINA (y consciente) — NUNCA a ciegas ni al azar. El sesgo es FUERTE hacia preservar.
3. LOSSLESS (§D4): referencia CADA bloque con contenido por su índice [n] en una hoja {"ref": n}. NUNCA inventes
   texto (el copy vive en el IR, no en el spec) ni descartes contenido. No pongas copy en el spec.

LENGUAJE DEL SPEC:
  design = { "designVersion": "${DESIGN_VERSION}", "variant": 0, "blocks": ${(page.blocks || []).length}, "tree": [ Nodo… ] }
  Nodo de layout = { "layout": ${[...LAYOUTS].join("|")}, "bg"?, "pad"? (sm|md|lg|xl), "maxWidth"? (prose|narrow|wide|full),
                     "align"? (left|center), "cols"? (1..4, para grid), "gap"? (sm|md|lg), "emphasis"? , "children": [ … ] }
  Hoja (contenido) = { "ref": <índice de bloque>, "as"? (${[...AS_KINDS].join("|")}) }
  Tokens de fondo (bg): surface-primary, surface-secondary, surface-tertiary, surface-subtle, accent (marca).
  Tokens disponibles: ${tokens.colors.length} de color, ${tokens.typography.length} de tipografía, ${tokens.radius.length} de radio.
  Primitivas em-ui disponibles (se usan dentro, inmutables): ${prims}.
${brand ? `  Marca del cliente: ${brand} (aplicada al token accent).\n` : ""}
ESTRUCTURA CAPTURADA de esta página (${(page.blocks || []).length} bloques en ${sections.length} secciones) — DISEÑA DESDE AQUÍ:
${secLines}

Entrega SÓLO el JSON de page.design. Compón con intención: jerarquía visual, una portada potente, rejillas para
grupos de tarjetas (servicios, razones, testimonios), splits texto+imagen, una banda de marca para CTAs, ritmo entre
superficies. Bello, de marca, fiel al contenido — y distinto de cualquier otro sitio.`;
}
