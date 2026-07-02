# ADR-021 — El auto-merge de Dependabot exige el gate completo: required checks + strict en branch protection

- Status: accepted
- Date: 2026-07-02
- Ticket: [ECO-126](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-126)
- Strategy: none (endurecimiento de CI/gobernanza, no un área de producto)
- Deciders: Operador (human gate vía review + merge del PR, 2026-07-02)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Las reglas de gobierno de código
  viven en "GitHub branch protection + CI config" — este ADR fija cuál es esa config y por qué.

## Contexto

El bump mensual de Dependabot (minor+patch agrupado por ecosistema) tiene auto-merge cuando pasa en
verde (`dependabot-auto-merge.yml`, ECO-33): `gh pr merge --auto` delega en la branch protection y mergea
en cuanto pasan los **required checks**.

En julio de 2026 dos bumps se auto-mergearon **EN ROJO** a `main`:

- **#515** (prettier 3.8→3.9): el eslint de la API corre `prettier/prettier` como error
  (`eslint-plugin-prettier`), así que "Layer 3: SAST (Backend)" se puso rojo… pero mergeó igual.
- **#516** (grupo del dashboard): metió sub-paquetes WASM opcionales de `@tailwindcss/oxide` sin `integrity`
  → "Layer 2: Dependency Audit (dashboard)" rojo… y mergeó igual.

La rotura quedó **latente en main** y afloró en el siguiente PR de cualquiera (la CI de PR corre sobre el
merge-result PR+main), no en quien la introdujo. Costó dos fixes de rescate (ECO-124 reformat, ECO-125
integrity tolerante) para volver a verde.

**Causa raíz:** la branch protection de `main` tenía como **único required check `gates`** (gobernanza
emkeel). El agregador `Security Gate (All Checks)` del pipeline de seguridad **no estaba marcado required**,
`strict: false` y `reviews: 0`. La config de GitHub había **derivado** del intent — el propio
`dependabot-auto-merge.yml` afirma en su comentario que "la branch protection dispara solo cuando gates +
Security Gate pasan", pero eso no era cierto. Un gate que no es required no bloquea nada.

Gaps secundarios encontrados:

- El **formato del dashboard no se validaba en CI**: su `eslint.config.mjs` no incluye `eslint-plugin-prettier`
  (a diferencia de la API), así que prettier solo lo veía el pre-push **local**, que Dependabot no ejecuta.
- **Nada verificaba la propia branch protection** → la deriva podía repetirse en silencio.

## Decisión

### 1. Required checks + strict en la branch protection de `main`

Marcar como **required status checks** (además de mantener `gates`):

- `gates` — gobernanza emkeel (corre en cada PR).
- `Security Gate (All Checks)` — agregador de `security.yml`; su `needs:` + los result-checks propagan
  cualquier capa (secrets, dependency-audit, SAST, tests, build, gate-selftests) en rojo → **un solo
  required cubre las 5 capas** y resiste renombres de las capas internas.
- `Dashboard visual regression` — `visual-regression.yml` corre **sin paths-filter** a propósito (ECO-38):
  reporta en CADA PR (verde por skip si el dashboard no cambió) → seguro de requerir sin bloquear PRs ajenos.

Y `strict: true` (rama al día con `main` antes de mergear) → un PR no puede mergear sobre base
desactualizada: su pipeline corre sobre el merge-result real y la rotura aflora **antes** del merge.

**Storybook (`design-system-storybook.yml`) queda deliberadamente FUERA de los required:** tiene
paths-filter `design-system/**` y `design-system` **no está** en `dependabot.yml` → requerirlo con
`strict:true` bloquearía para siempre justo los PRs de Dependabot (el check nunca correría → nunca verde).
Su cobertura visual sigue viva como check informativo y como gate de los PRs que sí tocan el design-system.

`enforce_admins` se deja en **false** (un admin puede forzar un merge de emergencia); `reviews` no se toca
(la aprobación humana sigue siendo norma de proceso, ver `AGENTS.md`).

### 2. Prettier del dashboard en CI

`security.yml` (`Layer 3: SAST (Frontend)`) añade un paso `prettier --check` para el dashboard, con el mismo
comando que el pre-commit/pre-push (`package.json` lint-staged) → una sola fuente de norma de formato, ahora
también visible para los PRs de Dependabot.

### 3. Guardia anti-deriva

`.github/scripts/check-branch-protection.mjs` codifica el intent (los 3 required checks + `strict:true`) y
falla si la config viva derivó. La lógica de comparación es **pura** (`findDrift`) y se testea con fixtures
en el job `Gate self-tests` (`.github/scripts/check-branch-protection.test.mjs`, sin red). El modo CLI la
corre contra la config viva desde `weekly-audit.yml` (job `Branch Protection Audit`): leer la protección
necesita permiso **admin**, así que con solo `GITHUB_TOKEN` sale 2 (warn); con el secret `ADMIN_TOKEN`
(PAT admin:repo) la guardia es exigente y abre un issue de seguimiento al detectar deriva.

## Consecuencias

- Un bump (o cualquier PR) que ponga en rojo el Security Gate o el VRT del dashboard **ya no puede
  auto-mergear** — Dependabot esperará a verde o quedará bloqueado para revisión humana.
- El drift de formato del dashboard se caza en CI, no solo en el pre-push local.
- La propia config de branch protection tiene ahora una regresión-guard (test de lógica + auditoría
  semanal) y un registro (este ADR): cambiarla vuelve a ser un acto consciente, no una deriva silenciosa.
- Coste: los PRs deben mantenerse al día con `main` (`strict:true`) — un rebase/merge extra cuando main
  avanza durante la vida del PR. Es el precio de que la rotura aflore antes del merge, no después.
