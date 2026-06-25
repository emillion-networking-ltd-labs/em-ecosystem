// COMPILADOR de diseño (G2 definió el contrato; G3 implementa el real) — la FRONTERA diseño→validación (ADR-015 §6).
// Contrato: `compile(page, ctx) -> string` (JSX interior del <main>). La decisión de diseño vive en `page.design`
// (el SPEC EXPRESIVO que la IA-diseñador, R4, autora y persiste — ADR-015 §5).
//
// DOS implementaciones del MISMO contrato:
//   · compileMinimal  — el SUELO (G2): IGNORA page.design, apila bloques (renderBlock) sin composición. LOSSLESS, feo.
//   · compileFromSpec — el CORAZÓN (G3): TIPÓGRAFO TONTO que RINDE el árbol de page.design con componentes inmutables.
//
// ⛔ ANTI-RELAPSE (ADR-015 §5): el compilador NO decide diseño. NO hay clasificador, ni tabla de layouts, ni
// heurística por CONTENIDO (cero `if (block.kind …)`). Sólo TRADUCE campos del spec → clases (lookup fijo). La
// creatividad la puso la IA en el spec; aquí sólo se RINDE. Mismo spec → MISMO JSX (determinista, reproducible).
import { renderBlock } from "../lib/emit-blocks.mjs";

const j = (v) => JSON.stringify(v == null ? "" : v);

// --- LOOKUPS FIJOS token→clase (TRADUCCIÓN, no decisión). La IA elige el token; el compilador sólo lo mapea. ---
const BG = {
  "surface-primary": "bg-surface-primary", "surface-secondary": "bg-surface-secondary",
  "surface-tertiary": "bg-surface-tertiary", "surface-subtle": "bg-surface-subtle",
  accent: "bg-gradient-to-br from-accent to-accent-dark text-white",
};
const PAD = { sm: "py-8", md: "py-12 sm:py-14", lg: "py-16 sm:py-20", xl: "py-20 sm:py-28" };
const MAXW = { prose: "max-w-3xl", narrow: "max-w-4xl", wide: "max-w-6xl", full: "max-w-none" };
const GAP = { sm: "gap-4", md: "gap-6", lg: "gap-8 sm:gap-10" };
const COLS = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-2 lg:grid-cols-4" };
const ALIGN = { left: "", center: "text-center" };
// `box` envuelve un GRUPO como tarjeta/panel (el AI elige; el compilador traduce). none = sin caja.
const BOX = { card: "rounded-2xl border border-border-default bg-surface-primary p-6 shadow-sm", panel: "rounded-2xl bg-surface-secondary p-6", none: "" };
// Envoltura de presentación por `as` (FIJA; el compilador no inspecciona el bloque). `auto` = sin envoltura.
const AS_WRAP = {
  card: (x) => `<div className="h-full rounded-2xl border border-border-default bg-surface-primary p-6 shadow-sm space-y-3">${x}</div>`,
  quote: (x) => `<figure className="rounded-2xl border border-border-default bg-surface-secondary p-6 space-y-3">${x}</figure>`,
  stat: (x) => `<div className="text-center space-y-1">${x}</div>`,
  figure: (x) => x, cta: (x) => x, prose: (x) => x, auto: (x) => x,
};

// --- LOSSLESS: imágenes REALES usadas que ningún bloque colocó (fondos de sección de Elementor) → galería plana.
// El gate de emisión exige que ninguna imagen usada se caiga. Compartido por ambos compiladores.
function leftoverGallery(composed, ctx) {
  const placed = new Set([...composed.matchAll(/\/images\/[A-Za-z0-9._-]+/g)].map((m) => m[0]));
  const leftover = (ctx.pageImages || []).filter((src) => !placed.has(src));
  if (!leftover.length) return "";
  const tiles = leftover.map((src) =>
    `          <div className="relative aspect-[4/3] overflow-hidden rounded-xl"><Image src=${j(src)} alt=${j(ctx.siteName)} fill sizes="(min-width:1024px) 22rem, 50vw" className="object-cover" /></div>`).join("\n");
  return `      <section className="bg-surface-primary">\n        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 py-8 sm:grid-cols-3">\n${tiles}\n        </div>\n      </section>`;
}

// ───────────────────────── SUELO (G2): sin composición ─────────────────────────
const wrapMin = (inner, max = "max-w-3xl") =>
  `      <section className="bg-surface-primary">\n        <div className="mx-auto ${max} px-6 py-8 space-y-4">\n${inner}\n        </div>\n      </section>`;

export function compileMinimal(page, ctx) {
  const out = [];
  for (const b of page.blocks || []) {
    const jsx = renderBlock(b, ctx);
    if (jsx) out.push(wrapMin(`          ${jsx}`));
  }
  const composed = out.join("\n");
  const lo = leftoverGallery(composed, ctx);
  return lo ? (composed ? composed + "\n" + lo : lo) : composed;
}

// ───────────────────────── CORAZÓN (G3): rinde el spec de la IA ─────────────────────────
const innerClasses = (node) =>
  node.layout === "grid" ? `grid ${COLS[node.cols] || COLS[3]} ${GAP[node.gap] || GAP.md}`
  : node.layout === "columns" ? `grid grid-cols-1 items-center ${GAP[node.gap] || GAP.lg} lg:grid-cols-2`
  : node.layout === "stack" ? "space-y-4"
  : "space-y-6";   // section | band

// Rinde un nodo. depth 0 = sección de página (superficie + ancho + padding); depth>0 = <div> de layout anidado.
function renderNode(node, ctx, depth) {
  if (node && "ref" in node) {                                   // HOJA → bloque del IR vía renderBlock (lossless)
    const b = (ctx.blocks || [])[node.ref];
    const jsx = b ? renderBlock(b, ctx) : "";
    if (!jsx) return "";
    return `          ${(AS_WRAP[node.as] || AS_WRAP.auto)(jsx)}`;
  }
  if (node.layout === "spacer") return `      <div className="${PAD[node.pad] || "py-8"}" />`;
  const inner = (node.children || []).map((c) => renderNode(c, ctx, depth + 1)).filter(Boolean).join("\n");
  if (!inner) return "";
  const cls = `${BOX[node.box] || ""} ${innerClasses(node)}`.trim();
  if (depth === 0) {
    const bg = BG[node.bg] || "bg-surface-primary", pad = PAD[node.pad] || PAD.lg;
    const mw = MAXW[node.maxWidth] || "max-w-5xl", al = ALIGN[node.align] || "";
    return `      <section className="${bg}">\n        <div className="mx-auto ${mw} px-6 ${pad} ${al}">\n          <div className="${cls}">\n${inner}\n          </div>\n        </div>\n      </section>`;
  }
  return `          <div className="${cls}">\n${inner}\n          </div>`;   // anidado
}

// Rinde page.design (el spec de la IA). Sin spec → cae al SUELO (compileMinimal) para no romper el pipeline.
export function compileFromSpec(page, ctx) {
  const design = page && page.design;
  if (!design || !Array.isArray(design.tree)) return compileMinimal(page, ctx);
  const c = { ...ctx, blocks: page.blocks || [] };
  const composed = design.tree.map((n) => renderNode(n, c, 0)).filter(Boolean).join("\n");
  const lo = leftoverGallery(composed, ctx);   // lossless: imágenes usadas no colocadas por el spec
  return lo ? (composed ? composed + "\n" + lo : lo) : composed;
}
