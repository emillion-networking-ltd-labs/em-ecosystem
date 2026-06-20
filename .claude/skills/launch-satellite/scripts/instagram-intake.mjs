#!/usr/bin/env node
// Modo (d) Instagram del onboarding /launch-satellite (ECO-24).
// VÍA PRIMARIA Y FIABLE: el cliente aporta su handle y confirma/pega su contenido (es su cuenta).
// El scrape es BEST-EFFORT (datos PÚBLICOS de la cuenta PROPIA, sin saltar auth-walls — ToS):
// si funciona, pre-rellena lo que el cliente confirma; si falla/ausente, se DEGRADA a preguntar.
// NUNCA fabrica seguidores/bio: lo no confirmado queda 'missing'.
import { field } from "./lib/brief.mjs";

// clientProvided: { bio?, photos?, followers?, name? } — lo que el cliente pegó/confirmó (vía primaria).
// scraper?: async (handle) => { bio?, photos?, followers?, name? } | null  (best-effort, inyectable).
// Devuelve { fields, asks } : fields para el brief (con procedencia) + lista de datos a PEDIR al cliente.
export async function instagramIntake({ handle, clientProvided = {}, scraper = null } = {}) {
  if (!handle || typeof handle !== "string") throw new Error("handle requerido (la cuenta del cliente)");

  // 1) best-effort scrape (puede no estar o fallar — nunca bloquea ni fabrica)
  let scraped = null;
  if (typeof scraper === "function") {
    try { scraped = await scraper(handle); } catch { scraped = null; }
  }

  const fields = { instagramHandle: field(handle, "provided") };
  const asks = [];
  const KEYS = ["name", "bio", "followers", "photos"];

  for (const k of KEYS) {
    const provided = clientProvided[k];
    if (provided != null && provided !== "" && !(Array.isArray(provided) && provided.length === 0)) {
      // vía primaria: lo confirmó el cliente
      fields[`ig_${k}`] = field(provided, "provided");
    } else if (scraped && scraped[k] != null && scraped[k] !== "") {
      // mejora best-effort: extraído de su cuenta pública -> PROPONER, pendiente de confirmar
      fields[`ig_${k}`] = field(scraped[k], "proposed");
      asks.push(`confirmar ${k} (pre-rellenado desde @${handle}, sin verificar)`);
    } else {
      // degradar a preguntar: NUNCA inventar
      fields[`ig_${k}`] = field(null, "missing");
      asks.push(`pedir ${k} al cliente`);
    }
  }
  return { fields, asks };
}

// CLI fino (sin scraper por defecto => degrada a preguntar todo lo no aportado).
if (import.meta.url === `file://${process.argv[1]}`) {
  const handle = process.argv[2] || "demo_handle";
  instagramIntake({ handle }).then((r) => console.log(JSON.stringify(r, null, 2)));
}
