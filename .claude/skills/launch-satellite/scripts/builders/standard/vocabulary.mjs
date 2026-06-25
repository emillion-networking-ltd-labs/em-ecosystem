// VOCABULARIO em-ui — el BINDING DE PRODUCTO (G2, ECO-74 · ADR-015 §6). El motor genérico (captura/IR/gates) NO
// sabe de em-ui; AQUÍ vive el catálogo del design system que el DISEÑADOR (R4, en G3) consultará para saber CON
// QUÉ puede componer: los COMPONENTES gobernados (primitivas + secciones) y la SUPERFICIE DE TOKENS (la marca).
// Sólo-lectura: lee design-system/registry.json + tokens.css (fuente de verdad). NO emite ni decide diseño — es
// el "qué hay disponible", no el "qué se usa" (eso lo decide R4 en G3).
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function findRepoRoot(start) {
  let d = start;
  for (let i = 0; i < 14; i++) {
    if (existsSync(join(d, "design-system", "registry.json"))) return d;
    const up = dirname(d);
    if (up === d) break;
    d = up;
  }
  return null;
}

// Nombres de token semánticos de tokens.css, agrupados — la superficie con la que R4 tematiza la marca (sin tocar
// los componentes: tematizar por tokens, no editar el fuente — ADR-014 §2).
function readTokens(repoRoot) {
  const p = join(repoRoot, "design-system", "tokens", "tokens.css");
  let css = ""; try { css = readFileSync(p, "utf8"); } catch { return { colors: [], typography: [], radius: [], all: [] }; }
  const names = [...new Set([...css.matchAll(/--([a-z0-9-]+)\s*:/gi)].map((m) => m[1].toLowerCase()))];
  const group = (re) => names.filter((n) => re.test(n));
  return { colors: group(/^color-/), typography: group(/^(text|font)-/), radius: group(/^radius-/), all: names };
}

// El CATÁLOGO consultable por R4. { ok, components, sections, primitives, tokens }. repoRoot opcional (autodetecta).
export function vocabulary(repoRoot) {
  const root = repoRoot || findRepoRoot(dirname(fileURLToPath(import.meta.url)));
  if (!root) return { ok: false, reason: "design-system/registry.json no encontrado", components: [], sections: [], primitives: [], tokens: { all: [] } };
  const reg = JSON.parse(readFileSync(join(root, "design-system", "registry.json"), "utf8"));
  const items = reg.items || [];
  const map = (x) => ({ name: x.name, type: x.type, file: x.file });
  const sections = items.filter((x) => x.type === "registry:section").map(map);   // piezas SEMÁNTICAS de página
  const primitives = items.filter((x) => x.type !== "registry:section").map(map); // primitivas UI
  return { ok: true, components: items.map(map), sections, primitives, tokens: readTokens(root) };
}

// Resumen legible (para inspección / el prompt de R4 en G3).
export function vocabularySummary(repoRoot) {
  const v = vocabulary(repoRoot);
  if (!v.ok) return v.reason;
  return `em-ui: ${v.sections.length} secciones (${v.sections.map((s) => s.name).join(", ")}) · `
    + `${v.primitives.length} primitivas · ${v.tokens.all.length} tokens `
    + `(${v.tokens.colors.length} color, ${v.tokens.typography.length} tipografía, ${v.tokens.radius.length} radius)`;
}
