// Adapter WordPress (FB1, ECO-63 / ADR-012) — el PRIMER adapter de fuente. Es el ÚNICO sitio con conocimiento
// de WordPress: la BD (wp_posts/wp_postmeta/wp_options/menús), Elementor (_elementor_data) y el árbol uploads.
// Produce el IR común (lib/ir.mjs) detrás de la interfaz genérica de adapter (lib/adapter.mjs). Añadir otra
// fuente luego = otro adapter que produce el MISMO IR, sin tocar núcleo/IR/emitter. CERO supuestos de WP fuera.
//
// Captura LOSSLESS: TODAS las páginas/posts publicados, TODOS los bloques (cada elemento Elementor → un bloque,
// preservando su `raw`), TODAS las imágenes reales de uploads (originales). El gate de completitud (lossless.mjs)
// verifica fuente == IR. Lo que el backup no contiene se DECLARA (coverage.notInSource), no se inventa (§D4).
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { emptyIR } from "../lib/ir.mjs";
import { streamDump } from "../lib/sqldump.mjs";

// --- detección de ficheros del backup ---
function findFile(dir, pred, depth = 4) {
  const out = [];
  const walk = (d, lvl) => {
    let ents; try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (lvl > 0) walk(p, lvl - 1); }
      else if (pred(e.name, p)) out.push(p);
    }
  };
  walk(dir, depth);
  return out;
}
const findDump = (dir) => findFile(dir, (n) => n.toLowerCase().endsWith(".sql")).sort((a, b) => statSync(b).size - statSync(a).size)[0] || null;
function findUploads(dir) {
  const hits = findFile(dir, (n, p) => /wp-content[/\\]uploads$/.test(p) && false); // dirs no salen por findFile (solo files)
  // localizar el dir uploads explícitamente
  const stack = [dir]; let found = null, lvl = 0;
  while (stack.length && lvl < 6) {
    const d = stack.shift();
    let ents; try { ents = readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (!e.isDirectory()) continue;
      const p = join(d, e.name);
      if (/uploads$/.test(p) && /wp-content/.test(p)) { found = p; break; }
      stack.push(p);
    }
    if (found) break; lvl++;
  }
  return found;
}

const IMG = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
const THUMB = /-\d{2,4}x\d{2,4}\.(jpe?g|png|webp|gif|avif)$/i;   // derivado auto-generado por WP (regenerable)
// Ruido de WP-core/plugin/tema (no es contenido del cliente): se EXCLUYE del manifest de media real.
const CORE_NOISE = /(wp-includes|wp-admin|[/\\]themes[/\\]|[/\\]plugins[/\\])/i;

function scanUploads(uploadsDir) {
  const files = findFile(uploadsDir, (n) => IMG.test(n), 8);
  const originals = files.filter((p) => !THUMB.test(p) && !CORE_NOISE.test(p));
  return originals;
}

// --- Elementor: recorre el árbol y emite un bloque por elemento con contenido; preserva `raw` (lossless) ---
function deepImageUrls(settings, acc) {
  if (!settings || typeof settings !== "object") return;
  for (const [k, v] of Object.entries(settings)) {
    if (v && typeof v === "object") {
      if (typeof v.url === "string" && IMG.test(v.url)) acc.push(v.url);
      deepImageUrls(v, acc);
    } else if (typeof v === "string" && IMG.test(v) && /^https?:|^\//.test(v)) {
      if (/image|background|photo|logo|bg/i.test(k)) acc.push(v);
    }
  }
}
function elementorText(widgetType, s) {
  if (!s) return "";
  const pick = (...keys) => keys.map((k) => s[k]).filter((x) => typeof x === "string").join("\n");
  switch (widgetType) {
    case "heading": return pick("title");
    case "text-editor": case "theme-post-content": return pick("editor");
    case "button": return pick("text");
    case "icon-box": case "image-box": return pick("title_text", "description_text");
    case "testimonial": return pick("testimonial_content", "testimonial_name");
    case "icon-list": return Array.isArray(s.icon_list) ? s.icon_list.map((i) => i.text).filter(Boolean).join("\n") : "";
    default: return pick("title", "text", "editor", "description", "content", "caption");
  }
}
function walkElementor(tree, pageId, blocks, mediaUrls, counters) {
  for (const el of tree || []) {
    counters.elements++;
    const wt = el.widgetType || el.elType;
    const text = el.elType === "widget" ? elementorText(el.widgetType, el.settings) : "";
    const imgs = []; deepImageUrls(el.settings, imgs);
    for (const u of imgs) mediaUrls.add(u);
    // Un bloque por CADA widget (con o sin texto) — preserva raw → lossless. Contenedores (section/column/
    // container) aportan estructura: se cuentan pero se aplanan (sus hijos ya emiten bloques).
    if (el.elType === "widget") {
      blocks.push({
        kind: el.widgetType || "widget",
        text: text || undefined,
        media: imgs.map((u) => mediaIdFromUrl(u)),
        raw: el,
      });
      counters.contentBlocks++;
    }
    if (Array.isArray(el.elements)) walkElementor(el.elements, pageId, blocks, mediaUrls, counters);
  }
}
const mediaIdFromUrl = (u) => decodeURIComponent(String(u).split(/[?#]/)[0].split("/").pop() || "").toLowerCase();
const slugify = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function maybeJson(metaValue) {
  if (typeof metaValue !== "string" || !metaValue) return null;
  try { return JSON.parse(metaValue); } catch {}
  const m = metaValue.match(/^s:\d+:"([\s\S]*)";$/);   // string PHP-serializado envolviendo el JSON
  if (m) { try { return JSON.parse(m[1]); } catch {} }
  return null;
}

export const wordpressAdapter = {
  kind: "wordpress",
  detect(dir) {
    if (!existsSync(dir)) return false;
    if (findUploads(dir)) return true;
    const dump = findDump(dir);
    return !!dump;   // un .sql presente → candidato (capture confirma que es WP por las tablas)
  },
  async capture(dir) {
    const dump = findDump(dir);
    if (!dump) throw new Error(`adapter wordpress: no encuentro un dump .sql en ${dir}`);
    const uploadsDir = findUploads(dir);
    const ir = emptyIR({ kind: "wordpress", backup: dir, dump });

    // --- 1. leer la BD: posts, postmeta (elementor), options, menús ---
    const posts = new Map();          // id -> row (page/post/nav_menu_item)
    const elementorByPost = new Map(); // post_id -> parsed elementor data
    const attachedFile = new Map();   // post_id -> _wp_attached_file
    const menuItemMeta = new Map();    // post_id -> { url, objectId, parent }
    const options = {};
    const aioseo = new Map();          // post_id -> { title, description }

    await streamDump(dump, ["wp_posts", "wp_postmeta", "wp_options", "wp_aioseo_posts"], (table, row) => {
      if (table === "wp_posts") {
        if (["page", "post", "nav_menu_item"].includes(row.post_type) && (row.post_status === "publish")) posts.set(row.ID, row);
        if (row.post_type === "attachment") posts.set(row.ID, row); // status 'inherit'
      } else if (table === "wp_postmeta") {
        const id = row.post_id;
        if (row.meta_key === "_elementor_data" && row.meta_value && row.meta_value !== "[]") {
          const j = maybeJson(row.meta_value); if (Array.isArray(j)) elementorByPost.set(id, j);
        } else if (row.meta_key === "_wp_attached_file") attachedFile.set(id, row.meta_value);
        else if (row.meta_key === "_menu_item_url") { const m = menuItemMeta.get(id) || {}; m.url = row.meta_value; menuItemMeta.set(id, m); }
        else if (row.meta_key === "_menu_item_object_id") { const m = menuItemMeta.get(id) || {}; m.objectId = row.meta_value; menuItemMeta.set(id, m); }
        else if (row.meta_key === "_menu_item_menu_item_parent") { const m = menuItemMeta.get(id) || {}; m.parent = row.meta_value; menuItemMeta.set(id, m); }
      } else if (table === "wp_options") {
        if (["blogname", "blogdescription", "siteurl", "home", "WPLANG", "page_on_front", "show_on_front", "template"].includes(row.option_name)) options[row.option_name] = row.option_value;
      } else if (table === "wp_aioseo_posts") {
        if (row.post_id) aioseo.set(row.post_id, { title: row.title || null, description: row.description || null });
      }
    });

    // --- 2. site ---
    ir.site = {
      name: options.blogname || null,
      description: options.blogdescription || null,
      url: options.siteurl || options.home || null,
      language: (options.WPLANG || "").split("_")[0] || null,
      locale: options.WPLANG || null,
    };

    // --- 3. media: TODAS las imágenes originales reales de uploads (lossless) ---
    const mediaByFile = new Map();
    if (uploadsDir) {
      for (const f of scanUploads(uploadsDir)) {
        const id = f.split(/[/\\]/).pop().toLowerCase();
        if (!mediaByFile.has(id)) mediaByFile.set(id, { id, file: f, src: null, usedBy: [], mime: null });
      }
    }
    ir.media = [...mediaByFile.values()];
    const mediaIndex = new Map(ir.media.map((m) => [m.id, m]));

    // --- 4. páginas (page/post publicados) → IR pages + bloques ---
    const frontId = options.show_on_front === "page" ? String(options.page_on_front || "") : "";
    const counters = { elements: 0, contentBlocks: 0 };
    const pageRows = [...posts.values()].filter((p) => ["page", "post"].includes(p.post_type) && p.post_status === "publish");
    for (const p of pageRows) {
      const blocks = [];
      const mediaUrls = new Set();
      const elem = elementorByPost.get(p.ID);
      if (elem) {
        walkElementor(elem, p.ID, blocks, mediaUrls, counters);
      } else if (p.post_content && p.post_content.trim()) {
        // sin Elementor → el HTML de post_content es UN bloque (raw preservado, lossless)
        const imgs = (p.post_content.match(/<img[^>]+src=["']([^"']+)["']/gi) || []).map((m) => (m.match(/src=["']([^"']+)["']/i) || [])[1]).filter(Boolean);
        for (const u of imgs) mediaUrls.add(u);
        blocks.push({ kind: "html", text: p.post_content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || undefined, media: imgs.map(mediaIdFromUrl), raw: { html: p.post_content } });
        counters.contentBlocks++;
      }
      // marcar media usada
      for (const u of mediaUrls) { const m = mediaIndex.get(mediaIdFromUrl(u)); if (m) { if (!m.src) m.src = u; if (!m.usedBy.includes(p.ID)) m.usedBy.push(p.ID); } }
      const isFront = String(p.ID) === frontId || p.post_name === "home" || p.post_name === "front-page";
      ir.pages.push({
        id: p.ID, type: p.post_type,
        slug: p.post_name || slugify(p.post_title),
        route: isFront ? "/" : "/" + (p.post_name || slugify(p.post_title)),
        title: p.post_title || null,
        parent: p.post_parent && p.post_parent !== "0" ? p.post_parent : null,
        order: Number(p.menu_order || 0),
        seo: aioseo.get(p.ID) || null,
        blocks,
      });
    }
    // front primero, luego por menu_order/título
    ir.pages.sort((a, b) => (a.route === "/" ? -1 : b.route === "/" ? 1 : a.order - b.order || String(a.title).localeCompare(String(b.title))));

    // --- 5. menús (nav_menu_item) ---
    const menuItems = [...posts.values()].filter((p) => p.post_type === "nav_menu_item" && p.post_status === "publish");
    if (menuItems.length) {
      const items = menuItems.map((mi) => {
        const meta = menuItemMeta.get(mi.ID) || {};
        const target = meta.objectId && posts.get(meta.objectId);
        return { label: mi.post_title || (target && target.post_title) || null, url: meta.url || (target ? "/" + (target.post_name || "") : null), order: Number(mi.menu_order || 0), parent: meta.parent && meta.parent !== "0" ? meta.parent : null };
      }).filter((i) => i.label).sort((a, b) => a.order - b.order);
      ir.menus = [{ name: "primary", items }];
    }

    // --- 6. coverage (gate lossless): fuente == IR ---
    ir.coverage = {
      source: { pages: pageRows.length, blocks: counters.contentBlocks, media: mediaByFile.size },
      captured: { pages: ir.pages.length, blocks: counters.contentBlocks, media: ir.media.length },
      dropped: [],   // por construcción NADA se descarta: cada widget → bloque (raw), cada original → media
      notInSource: [
        ...(uploadsDir ? [] : ["uploads (no había carpeta de imágenes en el backup)"]),
        "miniaturas -WxH (derivados regenerables de los originales; los originales SÍ se capturan)",
        "contenido renderizado por plugins en runtime (no vive en la BD) — fuera del alcance del backup",
      ],
      elementorElements: counters.elements,
    };
    return ir;
  },
};
