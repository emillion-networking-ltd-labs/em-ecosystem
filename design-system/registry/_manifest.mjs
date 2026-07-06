// _manifest.mjs — estado por-consumidor de em-ui (ECO-152, design-propagation Fase 1 E4a).
// El CLI copia el design-system a los consumidores por COPIA literal, pero era STATELESS: nada registraba
// de QUÉ revisión de la fuente venía cada copia. Este módulo añade el manifiesto por-consumidor
// (`<src>/em-ui.manifest.json`) que registra, por fichero gobernado, la fuente del DS (`from`) y el git blob
// SHA-1 de esa fuente al copiarse (`sha`) — la BASE para el reconcile asistido de una fase futura — más un
// `hold` opcional (freeze de rollout).
//
// Ethos lib+shell, igual que _reconcile.mjs: el NÚCLEO es puro (blobSha, destRelFor, governedSources,
// predicados); readManifest/writeManifest/validateManifest son los ÚNICOS helpers con IO, COMPARTIDOS por
// cli.mjs y check-manifest.mjs para que el CLI y el gate NUNCA discrepen sobre la forma/clave/sha del manifest.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

export const MANIFEST_NAME = "em-ui.manifest.json";
export const MANIFEST_VERSION = 1;
// La capa de tokens (em-ui init) no pasa por destRelFor: init la escribe a mano a styles/em-ui-tokens.css.
export const TOKENS_DEST = "styles/em-ui-tokens.css";

// git blob SHA-1 del CONTENIDO. `buf` DEBE ser un Buffer → `buf.length` es la longitud en BYTES, idéntica a
// `git hash-object`. CRÍTICO: usar la longitud en bytes (no `String.length`, que cuenta CARACTERES): las
// fuentes del DS tienen multibyte (acentos), y un header `blob <chars>\0` produciría un sha que NO casa con
// git y desalinearía en silencio cada fichero acentuado. Puro.
export function blobSha(buf) {
  return createHash("sha1").update("blob " + buf.length + "\0").update(buf).digest("hex");
}

// Mapea una ruta FUENTE del DS a la ruta RELATIVA del consumidor (la CLAVE del manifest). Única fuente de
// verdad del mapeo: cli.destPathFor === join(destSrc, destRelFor(srcRel)). Devuelve null si no es mapeable
// (p.ej. tokens/ — se maneja aparte con TOKENS_DEST). Puro.
export function destRelFor(srcRel) {
  if (srcRel.startsWith("components/")) return "components/ui/" + basename(srcRel);
  if (srcRel.startsWith("sections/")) return "components/sections/" + basename(srcRel);
  if (srcRel.startsWith("hooks/")) return "hooks/" + basename(srcRel);
  if (srcRel.startsWith("lib/")) return "lib/" + basename(srcRel);
  return null;
}

// Enumera TODOS los ficheros-fuente gobernados del DS (componentes + sections + internalDependencies + la
// capa de tokens) como pares {key: <dest-rel>, from: <ds-rel>}, deduplicados por clave destino (lib/utils.ts
// lo tiran varios items pero aterriza una vez). Fuente de verdad compartida por cli (`pin all`) y el gate
// (completitud). No hace IO — el caller filtra por existencia. Puro (dado el registry).
export function governedSources(registry) {
  const out = [];
  const seen = new Set();
  for (const item of registry.items) {
    for (const f of [item.file, ...item.internalDependencies]) {
      const key = destRelFor(f);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ key, from: f });
    }
  }
  out.push({ key: TOKENS_DEST, from: registry.tokens });
  return out;
}

export function isHeld(entry) {
  return entry != null && entry.hold === true;
}

export function emptyManifest() {
  return { version: MANIFEST_VERSION, source: "design-system", files: {} };
}

export function manifestPath(destSrc) {
  return join(destSrc, MANIFEST_NAME);
}

// --- helpers con IO (shell-side, compartidos por CLI y gate) ---

// Lee el manifest del consumidor, o devuelve uno vacío si aún no existe (upsert-friendly).
export function readManifest(destSrc) {
  const p = manifestPath(destSrc);
  if (!existsSync(p)) return emptyManifest();
  return JSON.parse(readFileSync(p, "utf8"));
}

// Escribe el manifest con las claves ORDENADAS (salida determinista → sin diffs espurios al regenerar) y
// newline final. Se llama UNA vez al final de una operación (transaccional: se construye en memoria y se
// persiste al cierre, así un run abortado no deja el manifest describiendo ficheros no escritos).
export function writeManifest(destSrc, manifest) {
  const files = {};
  for (const k of Object.keys(manifest.files || {}).sort()) files[k] = manifest.files[k];
  const out = {
    version: manifest.version ?? MANIFEST_VERSION,
    source: manifest.source ?? "design-system",
    files,
  };
  writeFileSync(manifestPath(destSrc), JSON.stringify(out, null, 2) + "\n");
}

// Upsert de una entrada: registra `from` + el blob-sha de la fuente ACTUAL, preservando `hold` si estaba.
// `absFrom` es la ruta absoluta a la fuente del DS. Lee bytes (Buffer) para el sha byte-exacto.
export function recordEntry(manifest, key, srcRel, absFrom) {
  const sha = blobSha(readFileSync(absFrom));
  const prevHold = isHeld(manifest.files[key]);
  manifest.files[key] = prevHold ? { from: srcRel, sha, hold: true } : { from: srcRel, sha };
}

// Valida el manifest de UN consumidor contra las fuentes del DS. Devuelve una lista de violaciones (strings
// legibles). NO re-chequea drift de bytes (eso es check-component-drift). Shell helper (hace existsSync);
// compartido por el gate check-manifest.mjs y los tests para que ambos apliquen exactamente la misma regla.
export function validateManifest(sources, destSrc, manifest) {
  const v = [];
  const validFrom = new Set(sources.map((s) => s.from));
  const keyForFrom = new Map(sources.map((s) => [s.from, s.key]));
  const files = (manifest && manifest.files) || {};

  // Completitud: toda copia gobernada PRESENTE en el consumidor debe tener entrada (source-driven, no por
  // escaneo de ficheros arbitrarios del consumidor: solo cuentan las fuentes del registry cuyo destino existe).
  for (const s of sources) {
    if (existsSync(join(destSrc, s.key)) && !files[s.key]) {
      v.push(`INCOMPLETO: falta entrada para ${s.key} (fuente ${s.from})`);
    }
  }
  // Integridad de cada entrada.
  for (const [key, entry] of Object.entries(files)) {
    if (!entry || typeof entry.from !== "string" || typeof entry.sha !== "string") {
      v.push(`MALFORMADA: ${key} — falta from/sha`);
      continue;
    }
    if (!validFrom.has(entry.from)) {
      v.push(`FROM: ${key} — from="${entry.from}" no es una fuente del DS`);
      continue;
    }
    if (keyForFrom.get(entry.from) !== key) {
      v.push(`CLAVE: ${key} ≠ mapeo destino de ${entry.from} (${keyForFrom.get(entry.from)})`);
    }
    if (!/^[0-9a-f]{40}$/.test(entry.sha)) {
      v.push(`SHA: ${key} — sha inválido "${entry.sha}"`);
    }
    if (!existsSync(join(destSrc, key))) {
      v.push(`HUERFANA: ${key} — la entrada apunta a un fichero que no existe`);
    }
    if (entry.hold !== undefined && entry.hold !== true) {
      v.push(`HOLD: ${key} — hold debe ser true o ausente`);
    }
  }
  return v;
}
