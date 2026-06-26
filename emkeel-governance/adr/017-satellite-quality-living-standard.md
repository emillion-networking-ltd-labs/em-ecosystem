# ADR-017 — Estándar VIVO de calidad de satélite (pilar A técnico/profesional): rúbrica de evaluación en CI + versionado + migración

- Status: accepted
- Date: 2026-06-26
- Ticket: [ECO-78](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-78)
- Strategy: satellite-quality
- Deciders: Operador (human gate vía review + merge del PR #477 de la lane strategy, 2026-06-26)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Materializa la estrategia aprobada [`strategy/satellite-quality.md`](../strategy/satellite-quality.md), conducida por el motor `/strategy` (scaffolded→…→presented; el merge = aprobación, KEEL-104) con un **panel adversarial de 4 lentes** registrado en su `satellite-quality.process.json`. Llega tras el retiro de la línea fallida ([ADR-016](016-satellite-design-line-retirement.md)).

## Contexto
Retirada la línea de diseño fallida (ADR-016), el producto satélite sigue vivo pero sin un cimiento técnico explícito. Lo que SÍ era sólido en la línea vieja era el **estándar** (ADR-010 4 pilares + ADR-013 launch-readiness de ~16 checks); lo que falló fue el generador de diseño. Se necesita un cimiento que separe ambas cosas: **qué hace a un satélite óptimo** (pilar A, este ADR) vs **cómo se diseña la belleza** (pilar B, estrategia posterior que servirá a éste).

## Decisión
Adoptar un **ESTÁNDAR VIVO y versionado** de calidad de satélite sobre nuestro stack (Next.js + `design-system/`), como **Opción 2** de la estrategia:

1. **Evaluar en CI** — un gate de conformidad que recupera los ~16 checks del `launch-ready` retirado + **Lighthouse CI** (rendimiento/budgets) + **axe** (a11y), corrido por carpeta-satélite.
2. **Versionar** — el estándar lleva **semver + changelog**; añadir/quitar regla = breaking = major.
3. **Migrar** — **manual y ticketeada** mientras los satélites sean pocos; la capa de **codemods** (Opción 3) queda como ruta de escalado nombrada, no construida.

Principios innegociables (del panel adversarial):
- Cada requisito etiquetado **[M]** (máquina, al gate) o **[H]** (juicio humano). **Verde ≠ conformidad**: el gate se auto-rotula "piso pasado, revisión humana NO hecha"; la certificación real es un required-check humano separado.
- **Gate version-aware** contra la deriva (cada satélite declara su versión; falla si queda >1 major atrás) + baseline en deuda antes de imponer.
- **Requisitos por PERFIL** de satélite (estático/backend, mono/multi-idioma, en/fuera de EAA, con/sin trackers-cookie): form-backend/CSP/CMP/hreflang/EAA son **condicionales**, no universales.

## Cobertura técnica (qué evalúa el cimiento)
SEO técnico · structured data (Organization/LocalBusiness) · descubrimiento local (GBP/NAP/Search Console) · i18n · redacción SEO · a11y WCAG 2.1 AA · Core Web Vitals · seguridad en profundidad (headers + vulns + rate-limit + check que verifica) · GDPR/legal **por contenido** (Art. 13/base jurídica/derechos/DPA/transferencias, aviso legal LSSI-CE, fuentes AEPD/EUR-Lex/BOE) · formularios + deliverability (SPF/DKIM/DMARC) · operacional (analítica/conversión, uptime, dominio, error monitoring) · assets (favicon/manifest/404-500/OG). Detalle y fuentes en el doc de estrategia.

## Consecuencias
- Los specs de features de satélite declaran `Strategy: satellite-quality` (lo exige el gate `check_strategy_link`).
- Implementación en tickets feat posteriores (código producto em-ecosystem): el gate de conformidad, el **contrato del campo-versión**, y el **baseline** (alta de `sat-cristian-garcia` en deuda ticketeada ANTES de hacer el gate `required`, o bloquearía al único satélite vivo).
- El **pilar B** (estrategia de diseño/belleza) se construirá SIRVIENDO a este estándar, no al revés.
- Decisiones que el estándar deja por-caso (no son huecos; son por-perfil): alcance EAA por cliente, perfil por defecto, ubicación exacta del campo-versión.
