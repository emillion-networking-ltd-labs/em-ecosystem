// Núcleo del PREVIEW LOCAL del satélite (ECO-59): selección de puerto + detección de deps + comando de
// `next dev`. Puro y testeable (no spawnea nada); el shell `preview-satellite.mjs` orquesta los side-effects.
// El preview es un paso por DEFECTO tras F2b (generación) y ANTES de F3 (rama/provisión): local y reversible.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "node:net";

// Default sensato = el mismo puerto que el dev script del satélite generado (`next dev -p 3100`).
export const DEFAULT_PORT = 3100;

// ¿El satélite ya tiene deps instaladas? (node_modules presente → no reinstalar).
export function hasDeps(satDir) {
  return existsSync(join(satDir, "node_modules"));
}

// El binario local de next (deps ya instaladas). Lo spawneamos DIRECTO en vez de `npm run dev` para tener
// control total del puerto: el dev script del satélite hardcodea `-p 3100`, y así podemos reubicar si está ocupado.
export function nextBin(satDir) {
  return join(satDir, "node_modules", ".bin", "next");
}
export function devArgs(port) {
  return ["dev", "--port", String(port)];
}
export const previewUrl = (port) => `http://localhost:${port}`;

// ¿Puerto libre? Promesa<boolean>: intenta escuchar; EADDRINUSE (u otro error) → ocupado.
export function isPortFree(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, host);
  });
}

// Primer puerto libre desde `start` (default sensato 3100). Si está ocupado, elige otro (incrementando).
export async function pickPort(start = DEFAULT_PORT, tries = 50) {
  for (let p = start; p < start + tries; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new Error(`preview: no hay puerto libre en [${start}, ${start + tries}).`);
}
