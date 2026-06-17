# Strategy: satellites

Status: DRAFT
Strategy: satellites   <!-- feature specs reference this with a `Strategy: satellites` line -->

## Goal
Decidir el NORTE para lanzar satélites (sitios de cliente) de forma **recurrente, rápida y automatizada pero gobernada**: con qué se construyen, qué plataforma, qué estructura de sprints, qué baseline de seguridad obligatorio, qué significa "lanzado", **cuánta automatización vs. gobernanza**, y **dónde y cómo viven los aceleradores (kits)** — NO el cómo-paso-a-paso (eso es el runbook).

## Context
<!-- grounded facts ONLY — cite file:line (repo) o URL (mercado) for every claim -->

**Qué es HOY un satélite (A1 — realidad en el repo):**
- Un satélite real es una **app Next.js 16 + TypeScript + Tailwind + App Router**, no un sitio estático: `satellites/sat-cristian-garcia/package.json` (deps `next ^16.2.6`, `react ^19`, `@vercel/analytics`, `@vercel/speed-insights`; scripts `next dev/build/start`).
- Es **multi-ruta de marketing**: 7 rutas reales (`satellites/sat-cristian-garcia/src/app/page.tsx` + `sobre-mi/`, `servicios/`, `portfolio/`, `testimonios/`, `precios/`, `contacto/`).
- Vive **dentro del monorepo** y despliega a **Vercel** con el truco de monorepo (un proyecto Vercel por carpeta; *"every commit will issue a deployment for all connected projects"* → se acota con Ignored Build Step / skip-unaffected — https://vercel.com/docs/monorepos).
- Ya trae el **hardening S2**: 6 cabeceras de seguridad en `satellites/sat-cristian-garcia/next.config.mjs:15-26` (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control), `robots.ts` + `sitemap.ts` (`satellites/sat-cristian-garcia/src/app/`), y observabilidad Vercel en `satellites/sat-cristian-garcia/src/app/layout.tsx:68-69`.

**El "cómo" ya existe y funciona (A2 — el runbook SAT01):**
- El procedimiento end-to-end está capturado: `docs/archive/satellite-deployment-runbook.md` (450 líneas, destiladas de SAT01 Cristian García 2026-04-30→05-01).
- Estructura en **dos sprints**: **S1 Setup & Landing** (scaffold + landing a `*.vercel.app`, *"Estimated effort: 1-2 weeks"* — `docs/archive/satellite-deployment-runbook.md:90-95`) y **S2 Production Hardening** (cabeceras/SEO/observabilidad, *"MANDATORY before inviting real users"*, *"1.5h dev + 30min verify"* — `docs/archive/satellite-deployment-runbook.md:262-268`). Dominio propio es un S3 aparte (`docs/archive/satellite-deployment-runbook.md:357-359`).
- El **gotcha caro** está documentado: el Ignored Build Step `git diff HEAD^ HEAD --quiet ./` cancela en silencio el primer deploy → *"THIS IS THE MOST IMPORTANT GOTCHA IN THIS RUNBOOK"* (`docs/archive/satellite-deployment-runbook.md:193-243`).
- **Caveat de grounding:** el runbook apunta a tooling fuera de este árbol (`integrations/vercel-api/.env`, `integrations/jira-mcp-server/.env`, `templates/…` — `docs/archive/satellite-deployment-runbook.md:441`) — ni `integrations/` ni `templates/` existen hoy en el repo ⇒ el runbook es referencia histórica, no ejecutable tal cual.

**"Lanzado" significa (A3 — definido por el runbook):** no es el deploy técnico. S1 deja el sitio *"technically deployed"*; el umbral de lanzamiento es **S2 PASS** — *"production-grade … MANDATORY before inviting real users or the client to review"* (`docs/archive/satellite-deployment-runbook.md:262-266`), con Lighthouse Performance≥90/SEO≥95/BP≥95/A11y≥90 (`docs/archive/satellite-deployment-runbook.md:337`). Dominio propio (S3) es opcional y posterior.

**Baseline de seguridad / gobernanza — y sus HUECOS reales (A4):**
- Los **required checks** de `main` son `gates` y `Security Gate (All Checks)` (branch protection, verificado vía API).
- **HUECO 1 — el Security Pipeline NO audita satélites:** su matrix está fijada a `[nexacore-api, nexacore-dashboard]` (`.github/workflows/security.yml:64-65`) ⇒ un satélite no recibe dependency-audit ni SAST propios (sí lo cubre el secret-scan, que escanea todo el checkout).
- **HUECO 2 — el gate visual/a11y está hardcoded a SAT01:** `visual-regression.yml` dispara solo por paths `satellites/sat-cristian-garcia/**` (`.github/workflows/visual-regression.yml:31-35`) y el job "Satellite visual regression" trabaja sobre esa carpeta fija (`.github/workflows/visual-regression.yml:203`) ⇒ **un satélite nuevo no queda gateado** hasta editar el workflow. La recurrencia hoy NO es automática a nivel de gates.

**El acelerador (A5 — kits del operador, TOOLING EXTERNO, no artefactos del repo):**
- El operador dispone de "kits" de generación rápida (tipo *clone-and-improve*) que son **herramientas externas suyas**, NO código versionado de este repo. Para esta estrategia se aportaron dos como **ejemplo desechable** en la raíz (`kit-web-scrolling/`, `kit-instagram-web/`); su patrón se ha **destilado aquí y los directorios se BORRAN del árbol** (untracked, no entran al repo). Por tanto se citan como tooling externo (como una URL de mercado), nunca como `file:line` de repo.
- **Patrón destilado de esos kits (lo que hacen):** recogen **datos reales** del negocio o **scrapean un perfil de Instagram** (fotos, bio, seguidores multi-red) y generan **un único HTML autocontenido** (CSS/JS inline, sin build, sin deps salvo Google Fonts) que se publica arrastrándolo a **Netlify**. Es decir: **artefacto estático fuera del monorepo, de Vercel y de los gates.**
- **El mercado confirma el patrón clone-and-improve:** v0 by Vercel — *"You can iterate via chat, upload a screenshot of a UI to replicate, or describe a component"* (https://www.vibecodingacademy.ai/blog/best-ai-website-builder-2026); create-next-app sigue siendo el scaffold oficial Next.js (https://nextjs.org/docs/app/getting-started/installation).

**La tensión central (A6):** los kits resuelven el *blank-canvas* y el diseño en minutos, pero su **artefacto (HTML único → Netlify) NO es la forma gobernada del satélite** (Next.js multi-ruta en monorepo + Vercel + S2 hardening + gates). Recurrencia rápida y gobernanza tiran en direcciones distintas: o ganas velocidad fuera de gobierno (kits crudos), o ganas gobierno a coste de las 1-2 semanas de S1 (runbook). El norte tiene que **plegar la velocidad del kit dentro de la forma gobernada**, no elegir una u otra.

## Options
<!-- at least 2 real options; EVERY row MUST cite a Source que resuelva contra lo COMMITEADO (file:line o URL). `emkeel strategy check` lo exige. -->
> Cada celda **Source** es un único `file:line` de fichero **commiteado** que el gate resuelve; las citas de apoyo y el tooling externo (kits) van en Pros/Cons y en §Sources.

| # | Option | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Runbook manual (status quo SAT01)** — cada satélite se scaffolda con create-next-app y se sigue el runbook S1→S2→S3 a mano | docs/archive/satellite-deployment-runbook.md:90 | Probado en prod (SAT01); 100% gobernado (Next.js en monorepo, gates, S2 hardening `runbook:262-268`); cero artefacto huérfano | **Lento**: S1 son *"1-2 weeks"* (`runbook:95`); reproduce a mano gotchas caros (`runbook:193-243`); gates no auto-cubren satélites nuevos (HUECO 2) | Medio: el coste por satélite no baja → "recurrente y rápido" no se cumple; drift de gates si se olvida cablear el nuevo path |
| 2 | **Kit-first (clone-and-improve)** — generar el sitio con un kit externo del operador (datos reales/Instagram) y publicar el HTML tal cual | docs/archive/satellite-deployment-runbook.md:264 | **Rapidísimo** (minutos-horas), resuelve blank-canvas y diseño premium con datos reales; ideal para venta/prototipo | Artefacto = **HTML único → Netlify** (tooling externo, §Sources): **fuera** del monorepo, Vercel, S2 hardening y gates; salta el umbral *"MANDATORY"* S2 (`runbook:264`) ⇒ **ingobernado**; portar a Next.js es rework | **Alto en gobierno**: sitios cliente vivos sin baseline de seguridad ni gates; diverge del modelo NexaCore |
| 3 | **Híbrido: el kit scaffolda, el runbook+gates endurecen** — kit (externo) genera contenido/diseño → se **adapta** a la forma satélite (Next.js en monorepo) → S2 + gates obligatorios; los kits reutilizables viven **gobernados dentro del repo** y se **productiza** el gating (auto-discovery de satélites, no hardcode) | satellites/sat-cristian-garcia/next.config.mjs:15 | Velocidad del kit en lo creativo + gobierno del runbook/gates en lo que va a prod; cierra HUECO 1/2 (satélites bajo Security Pipeline `security.yml:64-65` + VRT auto-discovered `visual-regression.yml:31-35`) | Requiere un **paso de adaptación** kit-HTML→Next.js (no es copy-paste) y trabajo de tooling de CI + un hogar gobernado para kits (ECO de seguimiento) | Medio: si el adaptador/hogar no se productizan, el híbrido degenera en trabajo manual; mitigable con el ECO de tooling |

## Recommendation
<!-- which option + why — this is judgment; the human approves it at the gate -->
**Recomendación (sujeta al human gate — el operador decide): Opción 3 (Híbrido).** Es la única que honra las tres palabras del ticket a la vez — *recurrente, rápida y gobernada* — con tres reglas de norte:

- **(1) Rápida** donde el coste real está hoy (el blank-canvas y el diseño): un kit externo genera desde datos reales o un perfil de Instagram en minutos, no en las 1-2 semanas de S1 a mano (`docs/archive/satellite-deployment-runbook.md:95`).
- **(2) Gobernada** donde importa (lo que se sirve a un cliente): **un kit NUNCA se usa crudo.** Su salida (HTML único → Netlify, ver §Sources) es *fuente de diseño/contenido*, no entregable; se **adapta a la forma satélite** (Next.js multi-ruta en monorepo, como `satellites/sat-cristian-garcia/next.config.mjs:15-26`) y solo está "lanzado" tras **S2 PASS** (`docs/archive/satellite-deployment-runbook.md:262-266`).
- **(3) Recurrente de verdad** solo si: (a) los kits reutilizables viven **gobernados dentro del monorepo** (no en la raíz, no crudos) — el hogar propuesto es `satellites/_templates/` (co-ubicado con los satélites pero con prefijo `_` para que el auto-discovery de gates no lo trate como un satélite desplegable; antecedente: el `templates/` que el runbook ya asumía y que hoy no existe — `docs/archive/satellite-deployment-runbook.md:441`); y (b) se cierran los dos huecos de CI: satélites en la matrix del Security Pipeline (`.github/workflows/security.yml:64-65`) y VRT/a11y **auto-discovered** en vez de hardcoded a `sat-cristian-garcia` (`.github/workflows/visual-regression.yml:31-35`). Sin (a)+(b), "rápido" reintroduce drift.

**Frente a las alternativas:** la Opción 1 es segura pero incumple "rápida/recurrente" (coste plano por satélite). La Opción 2 es la más rápida pero **rompe el gobierno** (sitios cliente sin gates, fuera del monorepo, saltándose el S2 *MANDATORY*) — inaceptable como norte para un producto gobernado por Emkeel.

**Disposición de los kits de ejemplo:** `kit-web-scrolling/` y `kit-instagram-web/` de la raíz eran **ejemplos desechables**; su patrón queda destilado en esta estrategia y **se borran del árbol** (no se versionan). Los kits que se conserven en el futuro entran **adaptados y gobernados** en `satellites/_templates/` (lo concreta el ECO de seguimiento), nunca crudos en la raíz.

**No-decidido aquí (lo resuelve el operador en el gate):**
1. ¿La ubicación del hogar gobernado de kits es `satellites/_templates/` (propuesta) u otra (p.ej. `templates/` raíz, recuperando el antecedente del runbook)?
2. ¿El adaptador kit-HTML→satélite-Next.js se **productiza** (ECO de seguimiento) o se hace a mano las primeras N veces?
3. ¿Se promueve el runbook a `emkeel-governance/` (norte ejecutable) o se mantiene como referencia y la estrategia es el norte?

## Non-goals
- NO es el cómo-paso-a-paso (scaffold, curl a Vercel, gotchas): eso es el **runbook** (`docs/archive/satellite-deployment-runbook.md`), que esta estrategia referencia, no reemplaza.
- NO decide el diseño/branding de ningún satélite concreto (es per-cliente).
- NO versiona ni define el roadmap de los kits externos del operador; solo destila su patrón y fija dónde vivirían **adaptados** si se conservan.
- NO crea todavía `satellites/_templates/` ni toca los workflows de CI: eso es trabajo del ECO de seguimiento; aquí solo se fija el norte.
- NO promete backend/integración con la API NexaCore (un satélite es marketing estático salvo que un ticket diga lo contrario — fuera de alcance del runbook, `docs/archive/satellite-deployment-runbook.md:28`).

## Decisions
<!-- optional: link the chosen decision as an ADR, e.g. emkeel-governance/adr/006-<slug>.md -->
**PENDIENTE DE HUMAN GATE.** Al aprobar el operador: fijar `Status: APPROVED`, registrar como `emkeel-governance/adr/006-<slug>.md`, y —si se adopta la Opción 3— abrir un **ECO de seguimiento** que englobe: **(a)** el pipeline de adaptación kit→satélite (HTML del kit → Next.js multi-ruta + S2); **(b)** el directorio-hogar gobernado de kits reutilizables (`satellites/_templates/` u otra ubicación que se decida); **(c)** el cierre de los dos huecos de CI — meter satélites en la matrix de `.github/workflows/security.yml` y volver `.github/workflows/visual-regression.yml` auto-discovered en vez de hardcoded a `sat-cristian-garcia`. Los specs de features de satélite llevarán la línea `Strategy: satellites` (lo exige `check_strategy_link`).

## Sources (verificadas con tool — cada una abierta)
- Satélite real (Next.js en monorepo, COMMITEADO): `satellites/sat-cristian-garcia/package.json`; rutas `satellites/sat-cristian-garcia/src/app/page.tsx`; cabeceras `satellites/sat-cristian-garcia/next.config.mjs:15-26`; observabilidad `satellites/sat-cristian-garcia/src/app/layout.tsx:68-69`.
- Runbook SAT01 (COMMITEADO): `docs/archive/satellite-deployment-runbook.md` — S1 `:90-95`, S2 `:262-268`, "production-grade MANDATORY" `:264`, gotcha `:193-243`, "launched"/Lighthouse `:262-266,337`, S3 `:357-359`, antecedente `templates/` `:441`, out-of-scope backend `:28`.
- Gates / huecos (COMMITEADO): `.github/workflows/security.yml:64-65` (matrix api+dashboard); `.github/workflows/visual-regression.yml:31-35` (paths SAT01), `:203` (job satélite). Required checks de `main`: `gates`, `Security Gate (All Checks)` (branch protection, GitHub API).
- Kits del operador — **TOOLING EXTERNO, NO versionado** (ejemplos `kit-web-scrolling/`, `kit-instagram-web/` aportados en la raíz y borrados tras destilar el patrón): generadores *clone-and-improve* que producen un único HTML estático autocontenido publicable en Netlify, a partir de datos reales del negocio o del scraping de un perfil de Instagram. Se citan como herramienta externa, no como `file:line` del repo.
- Mercado: Vercel monorepos (deploy por proyecto / skip-unaffected / Ignored Build Step) — https://vercel.com/docs/monorepos ; create-next-app oficial — https://nextjs.org/docs/app/getting-started/installation ; clone-and-improve (v0 "upload a screenshot of a UI to replicate") — https://www.vibecodingacademy.ai/blog/best-ai-website-builder-2026 .
