#!/usr/bin/env node
// PREVIEW LOCAL del satélite generado (ECO-59) — paso por DEFECTO tras F2b (generación) y ANTES de F3
// (rama/provisión/cualquier acción externa). Local y REVERSIBLE: no toca nada externo.
//   1. instala deps si faltan (npm install),
//   2. arranca `next dev` en BACKGROUND (detached) en un puerto libre,
//   3. imprime la URL (http://localhost:PUERTO) + cómo pararlo.
// El flujo ESPERA el OK visual del operador antes de seguir a F3 (gate humano, documentado en SKILL.md).
// Uso: node preview-satellite.mjs <satDir> [puerto]   (PREVIEW_PORT=N también; default 3100, reubica si ocupado).
import { spawn, execFileSync } from "node:child_process";
import { existsSync, openSync } from "node:fs";
import { join, resolve } from "node:path";
import { hasDeps, nextBin, devArgs, previewUrl, pickPort, DEFAULT_PORT } from "./lib/preview.mjs";

const satDir = resolve(process.argv[2] || ".");
if (!existsSync(join(satDir, "package.json"))) {
  console.error(`preview: "${satDir}" no parece un satélite (falta package.json).`);
  process.exit(2);
}

// 1. Deps (solo si faltan → preview rápido en reruns).
if (!hasDeps(satDir)) {
  console.log("preview: instalando deps del satélite (npm install)…");
  execFileSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: satDir, stdio: "inherit" });
} else {
  console.log("preview: deps ya presentes (no reinstala).");
}

// 2. Puerto: default sensato 3100; si está ocupado, elige otro.
const start = Number(process.argv[3] || process.env.PREVIEW_PORT) || DEFAULT_PORT;
const port = await pickPort(start);

// 3. `next dev` en BACKGROUND (detached + unref → no bloquea el flujo); logs a archivo.
const logFile = join(satDir, ".preview.log");
const out = openSync(logFile, "a");
const child = spawn(nextBin(satDir), devArgs(port), { cwd: satDir, stdio: ["ignore", out, out], detached: true });
child.unref();

// 4. Reporta la URL + cómo pararlo. (next dev tarda unos segundos en estar listo.)
const url = previewUrl(port);
console.log("");
console.log(`preview: ▶ ${url}   (pid ${child.pid}; arranca en unos segundos)`);
console.log(`  logs:   ${logFile}`);
console.log(`  parar:  kill ${child.pid}`);
console.log("");
console.log("GATE VISUAL — revisa el satélite renderizado en el navegador. El flujo ESPERA tu OK");
console.log('("se ve bien" / "ajusta X") antes de F3 (rama/provisión). Puedes saltarte el preview si quieres.');
