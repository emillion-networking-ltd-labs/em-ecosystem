# ECO-10 — Auditoría completa de em-ecosystem (adecuación · tooling · deps)

- **Ticket:** [ECO-10](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-10) (Sprint 3 — Auditoría)
- **Rama:** `chore/ECO-10-full-audit`
- **Fecha:** 2026-06-14
- **Alcance:** SOLO LECTURA. No se borró ni movió nada. Este informe es la única salida.
- **Por qué más profunda que ECO-1:** ECO-1 cazó *residuo de ficheros*; clasificó como
  "product CI (conservar)" varios workflows que son **tooling de PROCESO/MONITOREO** de la era
  del framework. Aquí se clasifica **cada** pieza de tooling con evidencia y un eje nuevo:
  **esencial-producto · re-home-bajo-Emkeel · residuo**.

---

## Resumen ejecutivo

**Adecuación (A):** las dos apps están sanas. `nexacore-api` (nest build ✓) y
`nexacore-dashboard` (next build ✓ exit 0) **buildean**; configs coherentes; `.env`/`.env.local`
**gitignored** (sin leak). Dos defectos menores: falta `nexacore-dashboard/.env.example` y el
script raíz `lint:dashboard` está roto (`next lint`, removido en Next 16).

**Tooling (B):** de 8 workflows + 2 hooks + configs, el grueso es **esencial-producto**, pero
**3 piezas son proceso/monitoreo de la era framework** que conviene **re-home bajo Emkeel** o
**retirar**: `weekly-audit.yml` (cron), `upgrade-baseline.yml` (dormido, nunca ejecutado) y, en
menor grado, el *framing* de `structural-probe.yml`. ECO-1 acertó en que `structural-probe` y
`visual-regression` prueban el producto (specs + baselines existen), pero su **propiedad/framing**
sigue atado a SCRUM/framework.

**Deps (C):** `liquidjs` (ya bumped en ECO-8) y `uuid` (ECO-9) son **ambos latentes** — el mailer
usa `HandlebarsAdapter` y nunca ejecuta liquid ni el preview (`preview-email`). **Veredicto ECO-9:
RE-SCOPE / cancelar como fix de seguridad** (ver §C).

| Lente | Hallazgos | Acción dominante |
|------|-----------|------------------|
| A — Adecuación | apps sanas; 2 defectos menores (env.example, lint script) | arreglar (2 tickets pequeños) |
| B — Tooling | 3 piezas proceso/monitoreo framework | re-home / retirar |
| C — Deps | liquidjs + uuid latentes | ECO-9 → re-scope/cancelar |

---

## A. ADECUACIÓN de las apps

| Ruta | Qué es | Evidencia | Acción propuesta |
|------|--------|-----------|------------------|
| `nexacore-api/` | Backend NestJS 11 | `nest build` exit 0 (verificado ECO-7/8). Configs coherentes: `tsconfig.{json,build,prod}`, `nest-cli.json`, `prisma/{schema,migrations,seed}`, `prisma.config.ts`, `eslint.config.mjs`. `.env.example` presente; `.env` gitignored y **no trackeado**. | **conservar** |
| `nexacore-dashboard/` | Frontend Next 16 | `next build` exit 0 (verificado en esta auditoría). Configs: `next.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`. `.env.local` gitignored y no trackeado. | **conservar** |
| `nexacore-dashboard/.env.example` | — (ausente) | Existe `.env.example` en raíz y en `nexacore-api/`, **pero no en el dashboard**; solo hay `.env.local` (gitignored). Hueco de onboarding. | **arreglar** (añadir `.env.example`) |
| `package.json` (raíz) → `lint:dashboard` | Script monorepo | `"lint:dashboard": "cd nexacore-dashboard && npx next lint"`. Next 16 **removió `next lint`** (CI ya usa `eslint` directo). Script roto/stale. | **arreglar** (usar `eslint` como CI) |
| `satellites/sat-cristian-garcia/` | Producto satélite (SAT01), Next.js | `@em-ecosystem/sat-cristian-garcia`, scripts dev/build/start/lint/test:e2e, README, deploys Vercel (visto en PRs). | **conservar** |
| raíz monorepo (`package.json`, husky, `.nvmrc`, `.gitignore`, `.gitattributes`) | Orquestación monorepo (husky/jscpd/lint-staged) + Emkeel | `@em-ecosystem/root`, devDeps husky/jscpd/lint-staged; `prepare: husky`. | **conservar** |
| `AGENTS.md`, `CLAUDE.md`, `emkeel.toml`, `.env.example`, `emkeel-governance/` | Gobierno Emkeel | — | **conservar** |
| `docs/` (10 specs) | Specs de producto re-homed en ECO-2 | Referenciado por `README.md` + 2 menciones cosméticas (ECO-3). Pero parte del **contenido es era-framework**: `freeze-status.md` describe un *freeze-gate* no implementado aquí; `product-roadmap.md`, `satellite-deployment-runbook.md`, `design-system-viewer.md` traen narrativa del framework. | **conservar** ficheros · **revisar/re-home** contenido stale (baja prioridad) |
| `logs/shadow-decisions.jsonl` | Telemetría ML "shadow-mode" | gitignored (`.gitignore:96`); generado por `online-ml-scorer.service.ts` (feature del producto). Artefacto local. | **conservar/ignorar** (no entra a git) |
| `.scarf-disable` (0 bytes) | Opt-out de telemetría Scarf (npm) | Fichero-señal intencional. | **conservar** |
| `nexacore-dashboard/tsconfig.tsbuildinfo` | Caché incremental de TS | Presente en disco; **no trackeado** ✓. | **conservar** (ya correcto) |

**Negativos confirmados (sin riesgo):** ningún `.env`/`.env.local` ni `tsbuildinfo` trackeado por error (sin leak de secretos).

---

## B. TOOLING / RESIDUO DEL FRAMEWORK — clasificación pieza por pieza

Eje: **ESENCIAL-producto** (el producto lo necesita) · **RE-HOME** (útil, pero proceso/monitoreo
de la era framework — debe pasar a propiedad consciente de Emkeel) · **RESIDUO** (muerto/dormido).

| Pieza | Qué hace | Disparador | ¿Producto depende? | Clase | Acción |
|-------|----------|-----------|--------------------|-------|--------|
| `.github/workflows/emkeel-ci.yml` (`gates`) | El **único** gate requerido por branch protection | push + PR | **Sí** | **ESENCIAL** (Emkeel) | conservar |
| `.github/workflows/security.yml` | 5 capas: secrets (gitleaks, arreglado ECO-6) · deps · SAST · tests · build · gate | push + PR | **Sí** | **ESENCIAL** | conservar |
| `.husky/pre-commit` | lint-staged + gitleaks + jscpd sobre staged | commit local | Sí (calidad dev) | **ESENCIAL** | conservar |
| `.husky/pre-push` | CI-parity local (npm ci/build/test/audit ambos paquetes, ~3-5 min) | push local | Parcial (conveniencia) | **ESENCIAL (pesado)** | conservar (bypass `--no-verify` legítimo en ramas solo-docs) |
| `.jscpd.json` | Config jscpd (umbral duplicación) | pre-commit + `dup:check` | Sí | **ESENCIAL** | conservar |
| `.gitleaks.toml` | Config gitleaks (reglas secretos) | security.yml + pre-commit | Sí | **ESENCIAL** | conservar |
| `.github/dependabot.yml` | PRs automáticos de deps (npm api+dashboard, actions) | schedule | Sí | **ESENCIAL** | conservar |
| `.nvmrc` | Pin de versión Node | tooling | Sí | **ESENCIAL** | conservar |
| `.github/workflows/jira-transition.yml` | Mueve el ticket a Done al mergear | PR closed | No (proceso) | **RE-HOME** (ya Emkeel) | conservar (propiedad Emkeel) |
| `.github/workflows/visual-regression.yml` | VRT pixel dashboard+satélite vs baseline | PR(paths)+dispatch | **Sí** (calidad UI) | **ESENCIAL-producto** | conservar · **re-home** framing (cabeceras SCRUM-379/380/384/386) |
| `.github/workflows/structural-probe.yml` | Guard estructural de design-tokens (regresiones TW3→TW4) | PR(paths)+dispatch | **Sí** (design system) | **ESENCIAL-producto (estrecho)** | conservar · **re-home** framing (atado a SCRUM-396/373) |
| `.github/workflows/dast.yml` | OWASP ZAP (baseline/full/api) | **dispatch only** | No (seguridad on-demand) | **RE-HOME** (seguridad) | conservar · re-home propiedad |
| `.github/zap-rules.tsv` | Reglas ZAP | con dast.yml | con dast | **RE-HOME** | conservar (con dast) |
| `nexacore-api/scripts/security-smoke-test.sh` | Smoke test de seguridad contra server vivo | **manual** (sin caller CI) | No | **RE-HOME** (herramienta manual) | conservar · documentar/poseer bajo Emkeel |
| `.github/workflows/weekly-audit.yml` | **Cron lunes 06:00**: audit deps + supply-chain + licencias + branch-hygiene (abre issues) | **schedule** + dispatch | No (monitoreo/gobernanza) | **RE-HOME** | re-home bajo Emkeel (decouple del framing framework; es monitoreo, no build de producto) |
| `.github/workflows/upgrade-baseline.yml` | Captura baseline visual/a11y **antes de una "major framework migration"** | **dispatch only** | No | **RESIDUO-dormido / RE-HOME** | **decisión humana**: retirar (nunca ejecutado) o re-home si las migraciones mayores siguen siendo práctica |

**Evidencia clave (live vs roto):**
- `visual-regression` y `structural-probe` son **funcionales**: sus specs existen
  (`tests/e2e/{visual,a11y,structural-tokens}.spec.ts`) y hay **baselines commiteados**
  (dashboard **22** PNG, satélite **18** PNG). No son residuo — prueban el producto de verdad.
- `upgrade-baseline.yml` **nunca se ha ejecutado**: no existe ningún directorio
  `tests/e2e/upgrade-baselines/` en el árbol. Está **dormido**.
- `weekly-audit` y `upgrade-baseline` referenciaban `workflow-standards.mdc` (doc del framework
  inexistente); esas menciones colgantes ya se limpiaron en **ECO-3**.

**Matiz sobre la corrección a ECO-1:** la tesis "ECO-1 se quedó corta" es **correcta para
`weekly-audit` y `upgrade-baseline`** (proceso/monitoreo, no product-CI). Para `structural-probe`
y `visual-regression`, ECO-1 acertó en que son CI del producto — lo que falta es **re-home de
propiedad/framing** (decouplar de SCRUM/framework), no reclasificarlos como residuo.

---

## C. DEPS — cadena del mailer (liquidjs + uuid) y veredicto ECO-9

**Contexto compartido:** ambas vulns entran por `@nestjs-modules/mailer@2.3.4`, que soporta varios
motores de plantilla como **peerDependencies** (`ejs, handlebars, liquidjs, pug`). El mailer de
NexaCore (`src/mail/mail.module.ts`) usa **`new HandlebarsAdapter()`** (`strict: true`) con 16
plantillas `.hbs` — **no instancia liquid ni activa el preview**.

| Dep | Ruta | Estado | Evidencia | Acción |
|-----|------|--------|-----------|--------|
| `liquidjs` | `@nestjs-modules/mailer` → `liquidjs` (peer/engine) | **Latente** (ya parcheada en ECO-8 → 10.27.0) | El mailer usa Handlebars; liquid nunca corre. Es un *engine* opcional del paquete. | **conservar** (ya bumped). Cleanup (quitar el engine) requeriría re-empaquetar el mailer → **no** ahora |
| `uuid@9.0.1` | `@nestjs-modules/mailer` → `preview-email@3.1.3` → `uuid` | **Latente y no-aplicable** | `preview-email` solo se ejecuta si el mailer tiene `preview: true` — **mail.module.ts NO lo activa**. Además la vuln (GHSA-w5hq-g745-h8pq) solo aplica a `uuid` v3/v5/v6 **con `buf`**, que `preview-email` no usa. | ver veredicto ↓ |

### 🔑 Veredicto explícito sobre ECO-9 (uuid moderate): **RE-SCOPE / cancelar como fix de seguridad**

- **Razón:** la vuln **no es alcanzable** (el preview nunca corre) y **no es aplicable** (path
  v3/v5/v6-con-buf que `preview-email` no ejercita). El riesgo de seguridad real es **nulo**.
- **Coste del "fix":** bump `uuid` 9→**11** (major) a través de una transitiva (`preview-email`)
  fijada por el mailer → cambio **arriesgado/no trivial** para **cero** ganancia de seguridad.
- **Único coste de no hacerlo:** mantiene en rojo el paso *production-moderate* del audit
  (`Layer 2`), que **no bloquea** (solo `gates` es requerido).
- **Recomendación:** **cerrar ECO-9 como "won't-fix (no aplicable)"** o **re-scope a higiene de
  CI**: (a) documentar y aceptar el aviso en la config de audit, o (b) bump oportunista cuando
  `preview-email`/el mailer publiquen `uuid ≥ 11.1.1`. No hacer el major bump ahora.

---

## Tickets de limpieza propuestos (de aquí salen; nada se ejecuta en este PR)

1. **Re-home de tooling de proceso/monitoreo bajo Emkeel** (Lente B): poseer conscientemente
   `weekly-audit.yml`, `dast.yml` (+ `zap-rules.tsv`), `security-smoke-test.sh`, y decouplar el
   *framing* SCRUM/framework de `visual-regression` y `structural-probe`. Un ticket (o uno por pieza).
2. **Retirar o re-home `upgrade-baseline.yml`** (Lente B): dormido, nunca ejecutado, atado a la
   migración del framework viejo → **decisión humana** (retirar vs re-home).
3. **Adecuación menor** (Lente A): añadir `nexacore-dashboard/.env.example` + arreglar el script
   raíz `lint:dashboard` (`next lint` → `eslint`).
4. **Revisión de `docs/` era-framework** (Lente A): `freeze-status.md` (freeze-gate inexistente),
   `product-roadmap.md`, `satellite-deployment-runbook.md`, `design-system-viewer.md` — re-home o
   actualizar narrativa. Baja prioridad.
5. **ECO-9 → won't-fix / re-scope** (Lente C): cerrar como no-aplicable o convertir en tarea de
   higiene de CI (no el major bump).

**Recordatorio:** este PR solo añade este informe. Cada cambio irá por su propia rama/PR/ticket
con visto bueno humano.
