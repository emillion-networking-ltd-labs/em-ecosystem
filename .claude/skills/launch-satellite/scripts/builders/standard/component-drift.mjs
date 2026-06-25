// Gate de DRIFT de COMPONENTES (G2, ECO-74 · ADR-014 §2 / ADR-015 esqueleto). Los componentes de em-ui que el
// satélite COPIA (`em-ui add` → copia verbatim del design-system) deben COMPONERSE, no MODIFICARSE. La marca
// (tamaño/color) se aplica FUERA del componente: tokens en globals.css (variables CSS) + props/className en el
// SITIO DE USO — el fichero del componente queda INTACTO. Por eso cualquier diferencia estructural en el fichero
// copiado = el componente fue editado (justo lo que §2 prohíbe) → DRIFT → falla. (El emit recién hecho pasa por
// construcción: em-ui add copia idéntico; el gate sólo se enciende si alguien edita la copia.)
//
// Build-time, acotado al satélite emitido (igual que verifyEmit / verifyLaunchReady) — NO un gate de CI sobre todo
// el repo (no rompe satélites antiguos pre-gobernanza). Fuente de verdad: design-system/registry.json + los
// ficheros de design-system/. Contrato { ok, problems, lines }.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

// Normaliza para comparar sólo lo ESTRUCTURAL: CRLF→LF, recorta espacios al final de línea, normaliza el salto
// final. (No tolera cambios de contenido: el theming va por tokens/uso, no editando el componente.)
const norm = (s) => s.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n+$/, "\n");

// Sube directorios desde `start` hasta encontrar la raíz del repo (la que tiene design-system/registry.json).
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

// nombre de fichero (basename) → ruta fuente absoluta en design-system/, leído del registry (única fuente).
function registrySources(repoRoot) {
  const reg = JSON.parse(readFileSync(join(repoRoot, "design-system", "registry.json"), "utf8"));
  const map = new Map();
  for (const item of reg.items || []) {
    for (const f of [item.file, ...(item.internalDependencies || [])]) {
      if (typeof f === "string") map.set(basename(f), join(repoRoot, "design-system", f));
    }
  }
  return map;
}

export function verifyComponentDrift(satDir, repoRoot) {
  const root = repoRoot || findRepoRoot(dirname(fileURLToPath(import.meta.url))) || findRepoRoot(satDir);
  const problems = [], lines = [];
  if (!root) { lines.push("  ℹ registry no encontrado — drift no verificado"); return { ok: true, problems, lines }; }
  const sources = registrySources(root);
  const dirs = [join(satDir, "src/components/ui"), join(satDir, "src/components/sections")];
  let checked = 0;
  for (const dir of dirs) {
    let ents; try { ents = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (!e.isFile() || !e.name.endsWith(".tsx")) continue;
      const src = sources.get(e.name);
      if (!src || !existsSync(src)) continue;   // componente local del satélite sin contraparte em-ui → no se gatea
      checked++;
      let a, b;
      try { a = norm(readFileSync(src, "utf8")); b = norm(readFileSync(join(dir, e.name), "utf8")); } catch { continue; }
      if (a !== b) {
        problems.push(`${e.name}: difiere de em-ui (design-system) — componente MODIFICADO (ADR-014 §2: compón, no modifiques; tematiza por tokens, no editando el componente)`);
        lines.push(`  ✗ ${e.name}: DRIFT vs registry`);
      } else {
        lines.push(`  ✓ ${e.name}: idéntico al registry`);
      }
    }
  }
  if (!checked) lines.push("  ℹ ningún componente em-ui copiado encontrado en el satélite");
  return { ok: problems.length === 0, problems, lines };
}

export function assertNoDrift(satDir, repoRoot) {
  const r = verifyComponentDrift(satDir, repoRoot);
  if (!r.ok) {
    const e = new Error("gate de DRIFT de componentes FALLÓ — un componente em-ui fue modificado en el satélite:\n" + r.problems.map((p) => "  - " + p).join("\n"));
    e.report = r;
    throw e;
  }
  return r;
}
