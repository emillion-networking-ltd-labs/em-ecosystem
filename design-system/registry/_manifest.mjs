// _manifest.mjs — estado por-consumidor de em-ui (ECO-152, design-propagation Fase 1 E4a).
// El CLI copia el design-system a los consumidores por COPIA literal, pero era STATELESS: nada registraba
// de QUÉ revisión de la fuente venía cada copia. Este módulo añade el manifiesto por-consumidor
// (`<src>/em-ui.manifest.json`) que registra, por fichero gobernado, la fuente del DS (`from`) y el git blob
// SHA-1 de esa fuente al copiarse (`sha`) — la BASE para el reconcile asistido de una fase futura — más un
// `hold` opcional (freeze de rollout).
//
// Ethos lib+shell, igual que _reconcile.mjs: el NÚCLEO es puro (blobSha, destRelFor, governedSources,
// predicados); readManifest/writeManifest/validateManifest son los helpers con IO, COMPARTIDOS por cli.mjs y
// check-manifest.mjs para que el CLI y el gate NUNCA discrepen sobre la forma/clave/sha del manifest.
//
// ECO-155 (E4b) añade el NÚCLEO DE ESTADO DE FLOTA (discoverConsumers, classifyEntry, statusForConsumer,
// worstStatus, isRedStatus) — pull-only (solo lee) — que comparten el verbo `em-ui report` y el gate
// check-fleet-report, para que reporter y gate tampoco discrepen sobre el estado de sync de la flota.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { isAdapted, hasConflictMarkers } from "./_reconcile.mjs";

export const MANIFEST_NAME = "em-ui.manifest.json";
export const MANIFEST_VERSION = 1;
// ECO-158 (reconcile): almacén de bases por-consumidor, content-addressed por git blob sha. Guarda los BYTES de
// la versión del DS de la que salió cada copia (la BASE del merge a 3 bandas), que el manifest NO guarda (solo
// el sha). Path FUERA de src/ → invisible a check-conflict-markers/check-component-drift (escanean por extensión
// de código bajo src/). `git merge-file` necesita el CONTENIDO de la base, no solo su sha.
export const BASE_STORE = ".em-ui/base";
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

// --- almacén de bases (ECO-158, reconcile) ---

export function baseStorePath(destSrc, sha) {
  return join(destSrc, BASE_STORE, sha);
}

// Persiste los bytes de la base bajo su sha (content-addressed → idempotente, auto-dedup). No hace IO si ya está.
export function storeBase(destSrc, sha, buf) {
  const p = baseStorePath(destSrc, sha);
  if (existsSync(p)) return;
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, buf);
}

// Materializa los BYTES de la base para un merge a 3 bandas. Cadena: (1) store → (2) si la base sigue siendo la
// fuente DS actual (`blobSha(DS)===sha`) usa el DS → (3) null (irrecuperable → el caller REHÚSA, degrada a SKIP;
// nunca adivina una base). Pull-only, solo lee.
export function materializeBase(destSrc, sha, absFrom) {
  const p = baseStorePath(destSrc, sha);
  if (existsSync(p)) return readFileSync(p);
  if (absFrom && existsSync(absFrom) && blobSha(readFileSync(absFrom)) === sha) return readFileSync(absFrom);
  return null;
}

// Upsert de una entrada: registra `from` + el blob-sha de la fuente ACTUAL, preservando `hold` si estaba, y
// PERSISTE los bytes de la base en el store del consumidor (para el merge a 3 bandas de ECO-158). `absFrom` es
// la ruta absoluta a la fuente del DS; `destSrc` es la raíz del consumidor (si se pasa, se puebla el store).
export function recordEntry(manifest, key, srcRel, absFrom, destSrc) {
  const buf = readFileSync(absFrom);
  const sha = blobSha(buf);
  const prevHold = isHeld(manifest.files[key]);
  manifest.files[key] = prevHold ? { from: srcRel, sha, hold: true } : { from: srcRel, sha };
  // Store la base SOLO para copias @em-ui-adapted — son las únicas que pueden ir a un merge a 3 bandas. Las
  // no-adaptadas tienen base==DS (materializeBase las recupera del DS) → no gastar bytes duplicando la fuente.
  if (destSrc && key) {
    const copyPath = join(destSrc, key);
    if (existsSync(copyPath) && isAdapted(readFileSync(copyPath, "utf8"))) storeBase(destSrc, sha, buf);
  }
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

// --- núcleo de estado de flota (ECO-155, E4b): el reporter pull-only + halt-on-red lo comparte con el gate ---
// PULL-only: TODO aquí es de LECTURA — jamás escribe bytes en un consumidor (invariante ADR-006/007/027).

// Descubre los consumidores del DS: dashboard + cada dir bajo satellites/ (orden determinista). Única fuente de
// verdad de "qué es un consumidor" — la comparten el reporter, el gate de flota y (re-apuntados) los gates de
// manifest/drift, para que ninguno discrepe sobre el conjunto de la flota.
export function discoverConsumers(repo) {
  const consumers = [join(repo, "nexacore-dashboard")];
  const satRoot = join(repo, "satellites");
  if (existsSync(satRoot)) {
    for (const s of readdirSync(satRoot).sort()) {
      const r = join(satRoot, s);
      try {
        if (statSync(r).isDirectory()) consumers.push(r);
      } catch {
        /* ignore */
      }
    }
  }
  return consumers;
}

// blob-sha de la fuente del DS AHORA (para comparar contra la base registrada en el manifest). Lee bytes.
export function currentShaFor(dsRoot, from) {
  return blobSha(readFileSync(join(dsRoot, from)));
}

// Estados de sync de una copia gobernada. Rojos = corrupt/drifted (piden acción/rompen); stale = ámbar (update
// disponible, la copia es fiel a su base y el DS avanzó); held/adapted = divergencia INTENCIONAL (nunca rojo).
export const STATUS = Object.freeze({
  UP_TO_DATE: "up-to-date",
  STALE: "stale",
  DRIFTED: "drifted",
  ADAPTED: "adapted",
  HELD: "held",
  CONFLICT: "conflict",
});
export const RED_STATUSES = new Set([STATUS.CONFLICT, STATUS.DRIFTED]);
export function isRedStatus(s) {
  return RED_STATUSES.has(s);
}
// Severidad para el rollup "peor estado" del consumidor (mayor = más atención). stale (ámbar) por encima de las
// divergencias intencionales; los rojos arriba.
const SEVERITY = {
  [STATUS.CONFLICT]: 5,
  [STATUS.DRIFTED]: 4,
  [STATUS.STALE]: 2,
  [STATUS.ADAPTED]: 1,
  [STATUS.HELD]: 1,
  [STATUS.UP_TO_DATE]: 0,
};
export function worstStatus(statuses) {
  let worst = STATUS.UP_TO_DATE;
  for (const s of statuses) if ((SEVERITY[s] ?? 0) > (SEVERITY[worst] ?? 0)) worst = s;
  return worst;
}

// Clasifica UNA copia contra su base (manifest) y la fuente actual del DS. El discriminador clave (lo que E4a
// desbloqueó): `blobSha(copyBytes) === entry.sha` = la copia es FIEL A SU BASE → si además la base == DS actual
// es up-to-date, si no es STALE (el DS avanzó, no es un edit del consumidor). Si NO casa la base → divergió: si
// lo DECLARA (@em-ui-adapted) es adapted, si no es DRIFTED (edit no declarado, rojo). Los marcadores de
// conflicto rompen el build → rojo ANTES de toda exención (igual que check-component-drift). Puro.
export function classifyEntry(entry, currentDsSha, copyBytes) {
  const copyStr = copyBytes.toString("utf8");
  if (hasConflictMarkers(copyStr)) return STATUS.CONFLICT;
  if (isHeld(entry)) return STATUS.HELD;
  const copySha = blobSha(copyBytes);
  if (copySha === entry.sha) {
    return entry.sha === currentDsSha ? STATUS.UP_TO_DATE : STATUS.STALE;
  }
  return isAdapted(copyStr) ? STATUS.ADAPTED : STATUS.DRIFTED;
}

// Estado de sync de UN consumidor (pull-only, solo lee). Corre validateManifest (un manifest corrupto/incompleto
// es rojo ANTES de calcular staleness) y clasifica cada copia gobernada PRESENTE con entrada. Devuelve
// { violations, entries: [{key, from, status}], worst, red }. La comparten el verbo `em-ui report` y el gate
// check-fleet-report para que CLI y gate NUNCA discrepen sobre el estado de la flota.
export function statusForConsumer(sources, dsRoot, destSrc, manifest) {
  const violations = validateManifest(sources, destSrc, manifest);
  const entries = [];
  for (const s of sources) {
    const copyPath = join(destSrc, s.key);
    if (!existsSync(copyPath)) continue; // no es una copia gobernada de este consumidor
    const entry = manifest.files?.[s.key];
    if (!entry) continue; // presente sin entrada → ya lo reporta validateManifest (INCOMPLETO)
    const status = classifyEntry(entry, currentShaFor(dsRoot, s.from), readFileSync(copyPath));
    entries.push({ key: s.key, from: s.from, status });
  }
  const worst = worstStatus(entries.map((e) => e.status));
  const red = violations.length > 0 || entries.some((e) => isRedStatus(e.status));
  return { violations, entries, worst, red };
}

// Estado de TODA la flota (pull-only). Recorre `consumers` (roots), calcula statusForConsumer de cada uno, y
// devuelve el resultado de CADA consumidor con copias — SIEMPRE todos (norma run-all-then-fail: no para en el
// 1er rojo, para no cegar al operador sobre el resto). El caller decide el exit code (rojo si `.some(c=>c.red)`).
// Compartida por el verbo `em-ui report` y el gate check-fleet-report para que no discrepen.
export function fleetStatus(sources, dsRoot, consumers) {
  const out = [];
  for (const root of consumers) {
    const destSrc = join(root, "src");
    const s = statusForConsumer(sources, dsRoot, destSrc, readManifest(destSrc));
    if (s.entries.length === 0 && s.violations.length === 0) continue; // sin copias em-ui → no es un consumidor
    out.push({ root, destSrc, ...s });
  }
  return out;
}
