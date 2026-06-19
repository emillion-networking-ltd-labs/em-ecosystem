#!/usr/bin/env node
// Modos (c) mejorar-sitio y (e) inspiración del onboarding /satellite (ECO-24).
// (c) fetchea la URL del cliente y EXTRAE su contenido/colores reales (provenance=extracted, source=url).
// (e) la URL es solo REFERENCIA estética: NO se extraen datos al brief (no se copia contenido ajeno).
// Best-effort: sin red o ante fallo, se DEGRADA a preguntar. fetcher inyectable para tests offline.
import { field } from "./lib/brief.mjs";

const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;
const META_DESC_RE = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i;
const HEX_RE = /#[0-9a-fA-F]{6}\b/g;

export async function fetchSiteContent(url, { fetcher = globalThis.fetch, mode = "c-improve-site" } = {}) {
  if (!/^https?:\/\//i.test(url)) throw new Error("url debe ser http(s)");

  if (mode === "e-inspiration") {
    // Solo referencia estética: registramos la URL, NO extraemos datos al brief.
    return { fields: { inspirationRef: field(url, "provided") }, asks: [], reference: url };
  }

  let html = null;
  try {
    const res = await fetcher(url);
    if (res && res.ok) html = await res.text();
  } catch { html = null; }

  if (!html) {
    // degradar a preguntar — nunca inventar el contenido del sitio
    return {
      fields: {
        siteTitle: field(null, "missing"),
        siteDescription: field(null, "missing"),
        brandColors: field(null, "missing"),
      },
      asks: ["no se pudo leer el sitio; pedir título, descripción y colores al cliente"],
      reference: url,
    };
  }

  const title = (html.match(TITLE_RE) || [])[1]?.trim();
  const desc = (html.match(META_DESC_RE) || [])[1]?.trim();
  const colors = [...new Set(html.match(HEX_RE) || [])].slice(0, 8);

  const fields = {};
  fields.siteTitle = title ? field(title, "extracted", url) : field(null, "missing");
  fields.siteDescription = desc ? field(desc, "extracted", url) : field(null, "missing");
  fields.brandColors = colors.length ? field(colors, "extracted", url) : field(null, "missing");

  const asks = Object.entries(fields)
    .filter(([, f]) => f.provenance === "missing")
    .map(([k]) => `pedir ${k} (no extraído de ${url})`);

  return { fields, asks, reference: url };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2];
  if (!url) { console.error("uso: fetch-url.mjs <url>"); process.exit(2); }
  fetchSiteContent(url, { mode: process.argv[3] || "c-improve-site" }).then((r) => console.log(JSON.stringify(r, null, 2)));
}
