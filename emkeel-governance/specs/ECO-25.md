# ECO-25 — Satélites F2b: `/satellite` generación (brief → satélite S2-ready)

Strategy: satellites

## Resumen
Fase 2b de la estrategia [`satellites`](../strategy/satellites.md) (APPROVED). Construye el **motor de generación** del skill `/satellite`: consume el **brief estructurado** de F2a (ECO-24) y produce un satélite `satellites/sat-<x>/` en **forma satélite** (Next.js multi-ruta en monorepo, como SAT01), **reutilizando componentes vía `em-ui add`** desde `design-system/` — nunca copia manual ni del dashboard. **Depende de ECO-24.** NO despliega (F3).

## Contexto / base
- F1 (ECO-23, MERGED): `design-system/` + `em-ui/cli.mjs` (`add`/`init`/…) + `registry.json`.
- F2a (ECO-24): produce `brief.json` (schema versionado, con procedencia por campo).
- SAT01 (`satellites/sat-cristian-garcia/`): referencia de forma satélite (rutas, `next.config.mjs` con hardening S2, `layout.tsx` con observabilidad).
- "Lanzado" = **S2 PASS** (Lighthouse Perf≥90/SEO≥95/BP≥95/A11y≥90) — `docs/satellite-deployment-runbook.md:262-268,337`.

## Decisiones que resuelve

### D-D — Motor de generación (brief → satélite)
Pipeline determinista, **no greenfield**:
1. **Scaffold forma-satélite** a partir de la **estructura SAT01** (create-next-app-equivalente + rutas/hardening S2 como plantilla): `satellites/sat-<x>/` con `package.json`, `next.config.mjs` (6 cabeceras), `robots.ts`/`sitemap.ts`, `layout.tsx` (observabilidad), rutas marketing.
2. **Reuse de componentes vía `em-ui add <C> --dest satellites/sat-<x>/src`** (cierre transitivo + `em-ui init` para la capa de tokens). **Único** mecanismo de obtención de UI; jamás copia manual ni leer del dashboard.
3. **Relleno de contenido** desde el brief: textos/servicios/precios/contacto reales; tokens de marca aplicados sobre la capa de tokens; assets reales o placeholders marcados (los `missing`/`placeholder` del brief se rinden como placeholders visibles, no se inventan).

### D-E — Qué significa "hasta S2" en F2 (deploy es F3)
F2b entrega un satélite **S2-READY** + **validación local**, NO el lanzamiento remoto:
- **S2-ready:** trae los 6 deliverables de hardening S2 (cabeceras, robots, sitemap, metadata por ruta, `metadataBase` env-driven, observabilidad) por scaffold.
- **Validación local:** `next build` verde + **Lighthouse local** (headless) cumpliendo los umbrales como *gate local*.
- **Diferido a F3:** provisión Vercel, deploy, dominio, y **Lighthouse remoto** sobre la URL desplegada (el "lanzado" formal). El spec lo acota explícitamente.

## Scope
- Motor de generación (scripts) invocado por el skill `/satellite`: scaffold + `em-ui add`/`init` + relleno desde brief.
- Plantilla de forma-satélite derivada de SAT01 (S2-ready).
- Validación local (build + Lighthouse local) como criterio de "S2-ready".
- **NO** despliega, **NO** toca `design-system/`/`em-ui/`, **NO** automatiza Jira/GitHub/Vercel (F3).

## Acceptance Criteria
1. **Dado un `brief.json` de prueba**, el motor genera `satellites/sat-<demo>/` en forma satélite (Next.js multi-ruta, estructura SAT01).
2. **Reuse verificable:** los componentes UI del satélite provienen de **`em-ui add`** (trazable: mismas que `design-system/`, `em-ui diff` sin drift), + `em-ui init` instaló la capa de tokens. **Cero** copia manual; **cero** referencia a `nexacore-dashboard/`.
3. **Contenido real / no inventar:** el satélite generado refleja los datos `provided`/`extracted` del brief; los `missing` salen como **placeholders visibles**, no como datos fabricados.
4. **S2-ready:** el satélite trae los 6 deliverables de hardening S2; **`next build` verde**; **Lighthouse local** cumple Perf≥90/SEO≥95/BP≥95/A11y≥90 (o se reporta el gap).
5. **Frontera F3 respetada:** no hay deploy ni provisión remota; el spec documenta que el "lanzado" remoto es F3.
6. **Gates verdes:** `gates` (incl. `check_strategy_link` con `Strategy: satellites`, `check_ticket_link` ECO-25), Security Pipeline / Security Gate, build + tests de lo afectado. El **satélite demo de prueba es EFÍMERO** (se genera en test/CI, se asserta y se descarta); **NO se commitea ningún `satellites/sat-demo/`** al repo.

## Out of scope
- Onboarding y brief (ECO-24, F2a — dependencia).
- Deploy/provisión Vercel, dominio, Lighthouse remoto, automatización Jira/GitHub (F3).
- Cambios en `design-system/`/`em-ui/` (F1).

## Alignment
Implementa el punto **2 (generación que reutiliza componentes, no greenfield, hasta S2)** del sistema `/satellite` del norte (`strategy/satellites.md` §Recommendation). Garantiza el invariante de reuse de ADR-006/ADR-007: **`em-ui add` desde `design-system/` como única vía**, drift reconciliable, jamás dashboard. Acota "hasta S2" para no invadir F3. Enfoque registrado en [ADR-008](../adr/008-satellite-onboarding-generation.md).
</content>
