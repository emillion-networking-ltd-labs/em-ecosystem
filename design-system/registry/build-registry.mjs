#!/usr/bin/env node
// Generador del registry de em-ui (ECO-26). Escanea design-system/components/ y produce el grafo
// de dependencias COMPLETO: siblings UI via alias `@/components/ui/X` Y via ruta relativa `./X`,
// + deps internas (`@/hooks/X` -> hooks/X.ts, `@/lib/X` -> lib/X.ts). cli.mjs resuelve el
// cierre transitivo a partir de registryDependencies, asi que aqui basta capturar las DIRECTAS bien.
// No cambia componentes; solo (re)genera design-system/registry.json.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// build-registry vive en design-system/registry/ → la fuente (design-system/) es el directorio padre.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COMP = join(DS, "components");
const SECT = join(DS, "sections");   // nivel 2: secciones diseñadas que componen átomos (ECO-54)

// Rango de versión declarado por el DS para cada paquete npm (fuente de verdad de las versiones a propagar).
const DECLARED = JSON.parse(readFileSync(join(DS, "package.json"), "utf8")).dependencies || {};
// Peers que el consumidor (una app Next.js: dashboard, satélites) YA provee → NO se propagan como deps del DS.
const PEERS = new Set(["react", "react-dom", "next"]);

// Nombre del paquete npm de un specifier de import: `@scope/pkg/sub`→`@scope/pkg`; `pkg/sub`→`pkg`; `pkg`→`pkg`.
function pkgOf(spec) {
  return spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
}

export function componentNames() {
  return readdirSync(COMP).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4)).sort();
}

// Nombres de las secciones (nivel 2), si el directorio existe.
export function sectionNames() {
  return existsSync(SECT)
    ? readdirSync(SECT).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4)).sort()
    : [];
}

// Deps DIRECTAS de un fichero (componente o sección), recomputadas de su fuente:
//  - átomos UI: `@/components/ui/X` o relativo `./X` (X debe existir como componente).
//  - internas: `@/hooks/X` (.ts) y `@/lib/X` (si existen en design-system/).
export function directDeps(name, dir = COMP) {
  const src = readFileSync(join(dir, `${name}.tsx`), "utf8");
  const comps = new Set(componentNames());

  const ui = new Set();
  for (const m of src.matchAll(/from\s+["']@\/components\/ui\/([A-Za-z][A-Za-z0-9]*)["']/g)) ui.add(m[1]);
  for (const m of src.matchAll(/from\s+["']\.\/([A-Za-z][A-Za-z0-9]*)["']/g)) if (comps.has(m[1])) ui.add(m[1]);
  ui.delete(name); // por si acaso

  const internal = [];
  for (const m of src.matchAll(/from\s+["']@\/hooks\/([A-Za-z][A-Za-z0-9]*)["']/g)) {
    if (existsSync(join(DS, "hooks", `${m[1]}.ts`))) internal.push(`hooks/${m[1]}.ts`);
  }
  for (const m of src.matchAll(/from\s+["']@\/lib\/([A-Za-z][A-Za-z0-9-]*)["']/g)) {
    if (existsSync(join(DS, "lib", `${m[1]}.ts`))) internal.push(`lib/${m[1]}.ts`);
  }
  return {
    registryDependencies: [...ui].sort(),
    internalDependencies: [...new Set(internal)].sort(),
  };
}

// Rol de construcción DECLARADO por el componente: `// @ds-role: primitive|composite` (ADR-029 / eje B, ECO-197).
// Es JUICIO, no inferible del grafo (Button compone SpinnerInfinity y es primitive) → se declara en el fichero.
// Devuelve null si no está anotado (lo caza check-classification en ratchet).
export function roleOf(name, dir = COMP) {
  const m = readFileSync(join(dir, `${name}.tsx`), "utf8").match(
    /@ds-role:\s*(primitive|composite)\b/,
  );
  return m ? m[1] : null;
}

// Deps npm EXTERNAS de un item (ECO-164): paquetes que importa SU fichero + sus ficheros internos
// (lib/hooks — p.ej. lib/utils.ts arrastra clsx + tailwind-merge). Excluye alias `@/`, relativos y peers.
// La versión sale del package.json del DS (fuente única). Devuelve { pkg: rango } ordenado.
// Las deps de los siblings (registryDependencies) NO se incluyen aquí: el cierre transitivo de cli.mjs
// las une porque cada sibling ya carga su propio `dependencies`.
export function externalDeps(name, dir = COMP, internalDependencies = []) {
  const files = [join(dir, `${name}.tsx`), ...internalDependencies.map((rel) => join(DS, rel))];
  const deps = {};
  for (const file of files) {
    if (!existsSync(file)) continue;
    const src = readFileSync(file, "utf8");
    const specs = [
      ...[...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]),   // import estático
      ...[...src.matchAll(/import\(\s*["']([^"']+)["']/g)].map((m) => m[1]), // import dinámico (p.ej. qrcode)
    ];
    for (const spec of specs) {
      if (spec.startsWith(".") || spec.startsWith("@/")) continue; // relativo / alias interno
      const pkg = pkgOf(spec);
      if (PEERS.has(pkg)) continue;
      if (!DECLARED[pkg]) {
        throw new Error(`${name}: importa "${pkg}" (via ${spec}) que NO está en design-system/package.json → añádelo o corrige el import`);
      }
      deps[pkg] = DECLARED[pkg];
    }
  }
  return Object.fromEntries(Object.keys(deps).sort().map((k) => [k, deps[k]]));
}

export function buildRegistry() {
  const items = componentNames().map((name) => {
    const { registryDependencies, internalDependencies } = directDeps(name, COMP);
    const dependencies = externalDeps(name, COMP, internalDependencies);
    const role = roleOf(name, COMP); // eje B (ADR-029): primitive|composite declarado, o null si sin anotar
    return { name, type: "registry:ui", ...(role ? { role } : {}), file: `components/${name}.tsx`, registryDependencies, internalDependencies, dependencies };
  });
  // Secciones (nivel 2): componen átomos. `em-ui add <Section>` jala la sección + su cierre de átomos/hooks.
  for (const name of sectionNames()) {
    const { registryDependencies, internalDependencies } = directDeps(name, SECT);
    const dependencies = externalDeps(name, SECT, internalDependencies);
    items.push({ name, type: "registry:section", file: `sections/${name}.tsx`, registryDependencies, internalDependencies, dependencies });
  }
  return {
    name: "em-ui",
    $comment: "Registry interno del design system NexaCore (ECO-23; grafo completo ECO-26). Fuente unica: design-system/. em-ui lee de aqui, NUNCA de nexacore-dashboard/. Generado por design-system/registry/build-registry.mjs.",
    source: "design-system",
    tokens: "tokens/tokens.css",
    brandTemplate: "tokens/brand.template.css",
    aliasAssumed: "@/ -> <consumer>/src (igual que dashboard y satelites; sin reescritura de imports)",
    items,
  };
}

// Cierre transitivo (espejo de cli.mjs) — para tests/verificacion.
export function closure(name, reg = buildRegistry(), seen = new Set()) {
  if (seen.has(name)) return seen;
  const it = reg.items.find((i) => i.name === name);
  if (!it) throw new Error(`componente desconocido: ${name}`);
  seen.add(name);
  for (const d of it.registryDependencies) closure(d, reg, seen);
  return seen;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const reg = buildRegistry();
  writeFileSync(join(DS, "registry.json"), JSON.stringify(reg, null, 2) + "\n");
  const withDeps = reg.items.filter((i) => i.registryDependencies.length || i.internalDependencies.length).length;
  console.log(`registry.json regenerado: ${reg.items.length} items, ${withDeps} con deps.`);
}
