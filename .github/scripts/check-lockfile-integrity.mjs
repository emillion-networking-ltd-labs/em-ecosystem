#!/usr/bin/env node
// ECO-125 — verifica que cada paquete del lockfile npm tenga `integrity`, EXCEPTO deps OPCIONALES
// de plataforma. npm registra legítimamente ciertas deps opcionales SIN hash en las plataformas donde
// no se descargan (p.ej. `@tailwindcss/oxide-wasm32-wasi/*` en linux: `optional: true`). El check debe
// tolerar esas y seguir ESTRICTO para las deps normales (riesgo de cadena de suministro).
//
// Uso: node check-lockfile-integrity.mjs <ruta/package-lock.json>
import { readFileSync } from "node:fs";

const lockPath = process.argv[2] || "package-lock.json";
const lock = JSON.parse(readFileSync(lockPath, "utf8"));

const missing = [];
function check(deps, path) {
  for (const [name, info] of Object.entries(deps || {})) {
    // La entrada raíz (nombre vacío en la raíz) es el propio workspace: nunca lleva integrity.
    if (name === "" && path === "") continue;
    if (!info.integrity && !info.link) {
      // Tolerar deps opcionales: npm omite el hash cuando la dep no se resuelve para la plataforma
      // actual (`optional: true`, típicamente también con os/cpu/libc que excluyen al runner).
      if (!info.optional) missing.push(path + name);
    }
    if (info.dependencies) check(info.dependencies, path + name + "/");
  }
}
check(lock.packages, "");

if (missing.length > 0) {
  console.error(`Packages missing integrity hash (non-optional): ${missing.length}`);
  missing.slice(0, 10).forEach((p) => console.error("  - " + p));
  process.exit(1);
}
console.log("All non-optional packages have integrity hashes");
