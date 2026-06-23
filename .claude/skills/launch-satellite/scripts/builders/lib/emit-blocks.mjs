// Renderizador de BLOQUES del IR → JSX tokenizado (FB2, ECO-66 / ADR-012). FIEL: TODO bloque con contenido se
// renderiza (nada de copy/imágenes se cae); el texto va ESCAPADO. CREATIVO: estilos frescos con los tokens de
// em-ui (text-h*/content-*/surface-*/accent), no el markup ajeno del original. Agnóstico de la fuente: consume
// el IR común. El "mapeo IR→secciones" que la IA PROPONE (capa proposed, F6) se apoya en este renderer base.
const j = (v) => JSON.stringify(v == null ? "" : v);

// El IR a veces trae HTML inline del original (p.ej. <br>, <p>, <strong>). Para un diseño FRESCO no inyectamos
// ese markup crudo: lo limpiamos a texto (los tags de bloque → saltos de párrafo). El COPY se preserva (las
// mismas palabras); el gate de emisión cuenta palabras reales (sin tags) en ambos lados → sigue verde.
const cleanInline = (s) => String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const toParas = (s) => String(s).replace(/<\/(p|div|li|h[1-6]|tr)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
  .split(/\n+/).map((p) => p.replace(/[ \t]+/g, " ").trim()).filter(Boolean);

// Texto (posible HTML) → párrafos JSX escapados, limpios (preserva el copy del IR, sin markup ajeno).
function paragraphs(text) {
  return toParas(text).map((p) => `        <p>{${j(p)}}</p>`).join("\n");
}
const mediaWeb = (ref, ctx) => ctx.media.get(String(ref || "").toLowerCase()) || null;
const firstImg = (b, ctx) => (b.media || []).map((m) => mediaWeb(m, ctx)).find(Boolean) || null;
const hrefOf = (b) => {
  const s = b.raw && b.raw.settings;
  const link = s && (s.link || s.button_link || s.url);
  const u = typeof link === "string" ? link : (link && link.url);
  return typeof u === "string" && u ? u : null;
};
const imageEl = (src, alt) =>
  `<div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src=${j(src)} alt=${j(alt || "")} fill sizes="(min-width:1024px) 60rem, 100vw" className="object-cover" />
        </div>`;

// Un bloque del IR → markup. Devuelve "" si el bloque no aporta contenido visible (p.ej. shortcode dinámico).
export function renderBlock(b, ctx) {
  const text = b.text;
  const img = firstImg(b, ctx);
  switch (b.kind) {
    case "heading": {
      const h = cleanInline(text);
      return h ? `<h2 className="text-h2 font-bold text-content-primary">{${j(h)}}</h2>` : "";
    }
    case "text-editor": case "html": case "theme-post-content": case "text":
      return text ? `<div className="max-w-3xl space-y-3 text-body leading-relaxed text-content-secondary">\n${paragraphs(text)}\n      </div>` : "";
    case "image": {
      const cap = cleanInline(text);
      const parts = [];
      if (img) parts.push(imageEl(img, cap || ctx.siteName));
      if (cap) parts.push(`<p className="text-caption text-content-tertiary">{${j(cap)}}</p>`);   // caption real (no se pierde)
      return parts.length ? parts.join("\n        ") : "";
    }
    case "button": {
      const href = hrefOf(b) || ctx.contactHref;
      const label = cleanInline(text);
      return label ? `<div><Button as="a" href=${j(href)} variant="primary" size="md">{${j(label)}}</Button></div>` : "";
    }
    case "icon-box": case "image-box": {
      // tarjeta de característica (título + descripción + imagen real si la hay)
      const parts = [];
      if (img) parts.push(imageEl(img, ctx.siteName));
      if (text) parts.push(`<div className="space-y-2">\n${paragraphs(text)}\n        </div>`);
      return parts.length ? `<div className="rounded-2xl border border-border-default bg-surface-primary p-6 space-y-4">\n        ${parts.join("\n        ")}\n      </div>` : "";
    }
    case "testimonial": {
      const q = cleanInline(text);
      return q ? `<figure className="rounded-2xl border border-border-default bg-surface-primary p-6"><blockquote className="text-body italic text-content-secondary"><p>{${j(q)}}</p></blockquote></figure>` : "";
    }
    case "icon-list": {
      const items = toParas(text);
      return items.length ? `<ul className="space-y-2 text-body text-content-secondary">${items.map((li) => `<li className="flex gap-2"><span className="text-accent">•</span><span>{${j(li)}}</span></li>`).join("")}</ul>` : "";
    }
    case "divider":
      // un divider puede llevar texto (etiqueta/sub-título real, p.ej. "Main Office") → no se pierde
      return cleanInline(text)
        ? `<div className="flex items-center gap-3"><span className="text-h3 font-semibold text-content-primary">{${j(cleanInline(text))}}</span><hr className="flex-1 border-border-default" /></div>`
        : `<hr className="border-border-default" />`;
    default: {
      // shortcode / widget desconocido: si trae texto real, prosa limpia; si no (dinámico), se omite limpio.
      const p = cleanInline(text);
      return p ? `<p className="text-body text-content-secondary">{${j(p)}}</p>` : "";
    }
  }
}

// Página del IR → contenido del <main>. Agrupa los bloques en <section>s (nueva sección en cada heading) con
// fondos alternos para ritmo; el primer heading de la HOME recibe trato de Hero (titular grande sobre marca).
export function renderMain(page, ctx) {
  const blocks = (page.blocks || []);
  // particiona en grupos: cada grupo empieza en un heading (o el primero).
  const groups = [];
  for (const b of blocks) {
    if (b.kind === "heading" || groups.length === 0) groups.push([b]);
    else groups[groups.length - 1].push(b);
  }
  const out = [];
  groups.forEach((g, gi) => {
    const rendered = g.map((b) => renderBlock(b, ctx)).filter(Boolean);
    if (!rendered.length) return;
    const heroLead = ctx.isHome && gi === 0;
    if (heroLead) {
      // Hero: titular de marca + (imagen real del grupo si la hay) en el primer bloque.
      out.push(`      <section className="bg-gradient-to-br from-accent to-accent-dark text-white">\n        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-28 space-y-6">\n          ${rendered.join("\n          ")}\n        </div>\n      </section>`);
    } else {
      const surface = gi % 2 ? "bg-surface-secondary" : "bg-surface-primary";
      out.push(`      <section className="${surface}">\n        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20 space-y-6">\n          ${rendered.join("\n          ")}\n        </div>\n      </section>`);
    }
  });

  // FIEL: imágenes REALES usadas por la página que NO quedaron colocadas por un bloque (p.ej. fondos de sección/
  // contenedor de Elementor, que no son widgets) → galería al final. Ninguna imagen real se pierde (gate emisión).
  const placed = new Set([...out.join("\n").matchAll(/\/images\/[A-Za-z0-9._-]+/g)].map((m) => m[0]));
  const leftover = (ctx.pageImages || []).filter((src) => !placed.has(src));
  if (leftover.length) {
    const tiles = leftover.map((src) =>
      `          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src=${j(src)} alt=${j(ctx.siteName)} fill sizes="(min-width:1024px) 22rem, 50vw" className="object-cover" /></div>`).join("\n");
    out.push(`      <section className="bg-surface-secondary">\n        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">\n${tiles}\n        </div>\n      </section>`);
  }
  return out.join("\n");
}
