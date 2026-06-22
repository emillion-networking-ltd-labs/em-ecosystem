# ECO-58 — Base i18n del generador de satélites (nivel 1): localización mono-idioma + chrome externalizado

Strategy: satellites

## Resumen
Deja la **BASE i18n correcta** y tapa el defecto de que hoy **todo el chrome sale en español** aunque el
cliente no lo sea. **NO** es el multi-idioma completo (routing `[locale]`, selector de idioma, catálogos de
contenido por locale = **skill posterior**): esto es **localización mono-idioma** — el satélite sale en UN
idioma (el del cliente), con el chrome externalizado a **una sola fuente de verdad** reutilizable.

## Contexto / base
- El brief ya capta `identity.language` (required), pero el generador lo **IGNORA**.
- `generate-satellite.mjs` hardcodea `<html lang="es">` y **todos** los labels de chrome inline y dispersos en
  los block builders ("Inicio", "Servicios", "Contacto", "Ver servicios", "Lo que ofrece {siteName}",
  "Trabajos destacados", "Principal", el breadcrumb "Inicio", etc.).

## Decisiones que resuelve

### D — Una sola fuente de verdad del chrome (`scripts/lib/i18n.mjs`)
Diccionario **keyed por código de idioma** con catálogos **ES** (los textos actuales **VERBATIM**) y **EN**.
"Chrome" = labels que pone el **generador** (nav, aria, eyebrows, CTAs, títulos de sección, breadcrumb), NO el
contenido del cliente. Cada label es un string o una función `(siteName)=>string` cuando interpola la marca.
Diseñada como **base reutilizable**: un futuro skill multi-idioma solo **añade catálogos/locale encima**, sin
volver a cazar strings inline.

### D — Fallback explícito: **inglés**
Si `identity.language` no tiene catálogo (p.ej. `fr`), el chrome cae a **EN** (lingua franca internacional —
mejor neutral que el español que salía hardcodeado). `chromeLang` normaliza `es-ES`/`ES` → `es`.

### D — `<html lang>` dinámico = idioma REAL del brief
El generador lee `identity.language` → emite `<html lang={language}>` con el **idioma real** (el arreglo
SEO/a11y). El `lang` **SIEMPRE** refleja el idioma real, **nunca** se fuerza al fallback; solo los **labels**
caen al fallback cuando no hay catálogo.

### D — SOLO chrome (guardrail §D4)
Se externaliza **solo** el chrome del generador. El **CONTENIDO del cliente** (servicios, negocio, testimonios)
viene del brief **en su idioma** y **JAMÁS se auto-traduce** — los hechos no se tocan.

## Scope
- `scripts/lib/i18n.mjs` (NUEVO): `CATALOGS` (es/en), `FALLBACK_LANG`, `CHROME_LANGS`, `chromeLang`, `chrome`.
- `scripts/generate-satellite.mjs`: lee `language` → `t = chrome(language)`; `<html lang>` dinámico; `navLabel`,
  LAYOUT (nav aria) y los block builders consumen `t`; breadcrumb/metadata vía `navLabel(route, t)`.
- Tests (sin red). **NO** toca las secciones, el SEO, ni el modelo de procedencia. **NO** es multi-idioma.

## Acceptance Criteria
1. **Una fuente de verdad**: todo el chrome del generador vive en `lib/i18n.mjs` keyed por idioma (cero strings
   de chrome inline en el generador).
2. **Catálogos ES (verbatim) + EN**; ES produce salida **byte-idéntica** a hoy.
3. **Fallback = EN**, documentado; idiomas sin catálogo caen al inglés.
4. **`<html lang>` dinámico** = idioma real del brief (refleja el real aunque el chrome caiga al fallback).
5. **Guardrail §D4**: solo se localiza el chrome; el contenido del cliente nunca se auto-traduce.
6. **Retrocompatible**: `language=es` → satélite **idéntico** a hoy.
7. **e2e**: `language=en` → chrome EN + `<html lang="en">`; `language=es` → idéntico al actual; `next build` verde.
8. **Gates verdes**: `gates` (`Strategy: satellites`, `check_ticket_link` ECO-58), Security Pipeline; tests skill+registry verdes.

## Out of scope (= el skill multi-idioma posterior)
- Routing `[locale]` / múltiples idiomas en un mismo satélite / selector de idioma.
- Catálogos de chrome más allá de es/en (se añaden encima de esta base).
- Traducción del contenido del cliente (prohibido por §D4).

## Alignment
Sirve al norte satellites (`strategy/satellites.md` — producto **profesional, SEO-ready y escalable**): el
`<html lang>` correcto es higiene **SEO/a11y**, y centralizar el chrome es la **base escalable** para
internacionalizar sin deuda. Honra el **split verdad/diseño** (§D4): el chrome es del generador (se localiza);
los **hechos del cliente** vienen del brief en su idioma y **nunca** se auto-traducen. Retrocompatible
(`language=es` idéntico). No abre el multi-idioma completo — eso es un ticket/skill posterior sobre esta base.
