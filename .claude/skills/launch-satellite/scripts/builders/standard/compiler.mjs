// CONTRATO del COMPILADOR de diseño (G2 DEFINE; G3 IMPLEMENTA el real) — la FRONTERA diseño→validación
// (ADR-015 §6). Un compilador convierte el SPEC de diseño — la DECISIÓN que la IA-diseñador (R4) PERSISTE en el
// IR (ADR-015 §5) — en el JSX del <main>. CONTRATO:
//
//     compile(page, ctx) -> string        // el JSX interior del <main> de la página
//
// donde la decisión de diseño vive en `page.design` (el SPEC EXPRESIVO que G3 definirá y persistirá). El
// compilador es un TIPÓGRAFO TONTO: NO decide diseño (eso es R4, la IA), sólo RINDE lo que el spec dice, con los
// componentes em-ui INMUTABLES (sin drift). El determinismo vive AQUÍ (mismo spec → mismo JSX); la creatividad,
// ARRIBA (R4). Es la pieza que G3 REEMPLAZA — esqueleto (determinista) vs belleza (la IA).
//
// G2 ship `compileMinimal`: el SUELO. IGNORA `page.design` (aún no hay spec) y emite un <main> LOSSLESS SIN
// composición — apila cada bloque (renderBlock) + las imágenes usadas que ningún bloque colocó. CERO diseño:
// correcto y lossless, NO bonito (la web "fea pero íntegra" de G2). G3 sustituye este compilador por uno que
// CONSUME `page.design` → diseño real (MISMO contrato, MISMOS gates, MISMOS componentes inmutables).
import { renderBlock } from "../lib/emit-blocks.mjs";

const j = (v) => JSON.stringify(v == null ? "" : v);
const wrap = (inner, max = "max-w-3xl") =>
  `      <section className="bg-surface-primary">\n        <div className="mx-auto ${max} px-6 py-8 space-y-4">\n${inner}\n        </div>\n      </section>`;

// SUELO mínimo lossless (G2). Contrato del compilador: (page, ctx) -> JSX del <main>.
// NO compone (ni hero, ni bandas, ni agrupado, ni jerarquía) — eso es DISEÑO y lo trae G3. Sólo garantiza que
// NADA del contenido real (copy + imágenes usadas) se caiga, para que el gate de emisión pase.
export function compileMinimal(page, ctx) {
  const out = [];
  for (const b of page.blocks || []) {
    const jsx = renderBlock(b, ctx);
    if (jsx) out.push(wrap(`          ${jsx}`));
  }
  // LOSSLESS: imágenes REALES usadas por la página que ningún bloque colocó (p.ej. fondos de sección de Elementor)
  // → galería plana al final. El gate de emisión exige que ninguna imagen usada se caiga (renderMain hacía igual).
  const placed = new Set([...out.join("\n").matchAll(/\/images\/[A-Za-z0-9._-]+/g)].map((m) => m[0]));
  const leftover = (ctx.pageImages || []).filter((src) => !placed.has(src));
  if (leftover.length) {
    const tiles = leftover.map((src) =>
      `          <div className="relative aspect-[4/3] overflow-hidden rounded-xl"><Image src=${j(src)} alt=${j(ctx.siteName)} fill sizes="(min-width:1024px) 22rem, 50vw" className="object-cover" /></div>`).join("\n");
    out.push(`      <section className="bg-surface-primary">\n        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 py-8 sm:grid-cols-3">\n${tiles}\n        </div>\n      </section>`);
  }
  return out.join("\n");
}
