# ADR-010 — Generación de diseño de satélites: enfoque HÍBRIDO + producto profesional SEO-ready

- **Estado:** Aceptada
- **Fecha:** 2026-06-22
- **Ticket:** [ECO-52](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-52)
- **Strategy:** satellites
- **Decisor:** Operador (human gate, 2026-06-22)
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`). Materializa el **refinamiento ECO-52**
  del norte ([`strategy/satellites.md` §«Refinamiento ECO-52» + D6](../strategy/satellites.md)). Absorbe y
  **supera** la decisión abierta del PR #435 (1/2/3), cerrado como superado.

## Contexto
El norte fijaba el **intent** (remodel con valor, §D4) pero no **cómo** un brief se convierte en una web
**diseñada, marcada y SEO-ready**. Dos hechos medidos: (1) el generador emite `robots`/`sitemap`/`metadata`/6
cabeceras pero **NO Open Graph, NI datos estructurados (Schema.org/JSON-LD), NI breadcrumbs**, con listón solo
**lab** (`docs/satellite-deployment-runbook.md:337`); (2) el output de diseño es un **esqueleto** (subpáginas
en stub) frente al vocabulario de secciones que SAT01 tiene **solo hecho a mano**
(`satellites/sat-cristian-garcia/src/components/sections/HeroSection.tsx:1`). El **piloto Grupo Atis** lo
expuso: el remodel (c) salió *más feo que el original*. El norte se eleva de *"genera un sitio"* a
**"genera un PRODUCTO profesional, SEO-ready y escalable"**.

## Decisión

1. **Enfoque de diseño = HÍBRIDO (opción 3).** Una **biblioteca de secciones determinista** (hero, features,
   pricing, testimonios, CTA, FAQ, contacto, footer — el vocabulario estándar del sector, p.ej. Tailwind UI
   Marketing, https://tailwindcss.com/plus/ui-blocks/marketing) es el **sustrato gobernado** (S2/a11y/SEO por
   construcción, **reproducible** desde el brief — §D5); sobre él, el agente **propone** tipo/secciones/
   composición/redacción como **`proposed`**, **confirmable en el loop** (§D4). Es lo que hace **todo builder
   con IA**: proponen estructura de secciones y el usuario refina (Lovable construye sección a sección y
   pregunta antes, https://docs.lovable.dev/prompting/prompting-one; v0 genera variaciones,
   https://vercel.com/blog/how-to-prompt-v0).

2. **Producto profesional, SEO-ready (P1).** SEO técnico **de fábrica**: meta por página, **Open Graph**
   (https://ogp.me/), **JSON-LD** Organization/LocalBusiness/BreadcrumbList (Google recomienda JSON-LD,
   https://developers.google.com/search/docs/appearance/structured-data/local-business), HTML semántico
   (https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML). El **gate de
   lanzamiento** sube por encima del S2-lab con los **audits SEO nombrados** de Lighthouse + OG/JSON-LD
   válidos; los **Core Web Vitals de campo p75** (LCP≤2.5s/INP≤200ms/CLS≤0.1, https://web.dev/articles/vitals)
   son **objetivo post-lanzamiento monitorizado, NO gate de lanzamiento** (sin tráfico no hay datos de campo).

3. **Onboarding por tipo de sitio + secciones sugeridas (P2).** Antes de generar, preguntar el **tipo**
   (multipágina / landing / portfolio / otros — taxonomía estándar, https://webflow.com/templates/categories);
   según tipo + negocio la IA **propone** las secciones del catálogo y el usuario confirma. Se acopla a los
   modos a/b/c/e; tipo y secciones entran al brief como `proposed`.

4. **Calidad de diseño — "remodel siempre mejor que el original" (P3).** Regla dura para el modo (c): nunca
   peor. Operacionalmente: composición desde la biblioteca gobernada + marca aplicada (`brandTokens`→tokens
   em-ui) + criterio verificable en el loop (preview + el listón P1 + revisión humana en el gate de fidelidad).

5. **Válvula "la IA recomienda / sorpréndeme" (P4).** En cada menú (tipo, secciones, diseño), última opción
   "que la IA elija la mejor configuración según el negocio". **Guardrail (heredado de §D4):** aplica a la capa
   **`proposed`** (diseño/estructura/secciones), **NUNCA a los HECHOS** (negocio/servicios/precios/contacto =
   `extracted`/`provided`, jamás inventados).

## Alternativas descartadas
- **(2) Bespoke por IA en tiempo de generación.** Máxima libertad, pero **NO reproducible** → rompe el loop
  §D4 y el brief-como-fuente §D5; S2/a11y/SEO no garantizados por construcción; difícil de gobernar. Descartada.
- **(1) Biblioteca determinista como techo.** Es el **sustrato** del híbrido (válido, más simple), pero el
  output queda **acotado al catálogo** sin la capa creativa `proposed`. Se adopta como base de (3), no como
  enfoque final.

## Consecuencias
- **Fasificación (F4–F6, sobre F1/F2):** F4 biblioteca de secciones gobernada; F5 producto SEO-ready
  (OG/JSON-LD/semántico/audits); F6 onboarding tipo-de-sitio + secciones sugeridas + válvula IA.
- **Sube el listón de "lanzado":** el gate de fábrica deja de ser solo Lighthouse-lab; añade SEO técnico
  verificable. El campo (CWV p75) se **monitoriza**, no se gatea al lanzar.
- **Reconcilia, no re-litiga:** §D4 (intent/split verdad-diseño), §D5 (brief persistido) y el reuse vía em-ui
  (ADR-006/007) quedan intactos; la capa de diseño se construye encima.
- **Honestidad sobre hechos preservada:** la creatividad ampliada vive en `proposed`; los hechos del cliente
  nunca se fabrican (§D4, `.claude/skills/launch-satellite/schema/brief.schema.json:49`).

## Notas
- Aprobada por el operador en el human gate del refinamiento `/strategy satellites` (ECO-52, 2026-06-22),
  conducido por el motor (`emkeel strategy` → `approved`) con provenance de investigación real (web + repo).
  El "cómo" detallado vive en los ECO de seguimiento F4–F6; el procedimiento operativo, en el runbook.
