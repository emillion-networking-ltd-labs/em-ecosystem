# ECO-81 — Fase 1.1: guardrail de licencias del design-system (check no-copyleft + THIRD-PARTY-NOTICES)

Strategy: satellite-design

## Resumen
Primer incremento de la **fase 1** de [`satellite-design`](../strategy/satellite-design.md) ([ADR-018](../adr/018-satellite-design-generator.md), [ADR-019](../adr/019-design-system-upstream-shadcn.md)): el **guardrail de licencias** que debe existir **antes** de adoptar componentes de terceros (shadcn/Magic UI/Aceternity). Materializa la condición "línea de cumplimiento de licencias (gateable)" de la estrategia: por defecto **solo permisivas** (MIT/Apache-2.0/BSD/ISC/OFL/CC0…); **copyleft (GPL/AGPL/LGPL) → FALLA**; y un generador de **`THIRD-PARTY-NOTICES`**. Self-contained (sin dependencias nuevas), aditivo, **no toca el dashboard**.

## Decisiones que resuelve

### D — Check de licencias self-contained (sin deps nuevas)
`scripts/check-licenses.mjs`: clasifica un identificador SPDX en `permissive | copyleft | unknown` y escanea el `node_modules` de un target (lee el campo `license`/`licenses` de cada `package.json`). Sin añadir `license-checker` u otra dependencia — stdlib de Node.

### D — Allowlist = la línea verde de la estrategia; copyleft y desconocido → FAIL
Allowlist permisiva: `MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, 0BSD, ISC, CC0-1.0, Unlicense, OFL-1.1, Zlib, Python-2.0` (+ expresiones SPDX `OR` que contengan una permisiva). **Copyleft** (`GPL-*`, `AGPL-*`, `LGPL-*`, `MPL-*`, `EUPL-*`) → exit≠0. **Desconocido / sin licencia** → exit≠0 (revisión humana), salvo allowlist explícita por paquete.

### D — Generador de THIRD-PARTY-NOTICES
`--notices <out>`: agrega los avisos (paquete, versión, licencia) de las deps permisivas en un `THIRD-PARTY-NOTICES.md` — la forma estándar de cumplir "conservar el aviso" sin ensuciar la UI.

## Scope
- `scripts/check-licenses.mjs` (clasificador + escáner + generador de notices; CLI).
- `scripts/check-licenses.test.mjs` (`node:test`): clasificador (MIT/Apache→permissive, GPL/AGPL→copyleft, raros→unknown) + escáner sobre un fixture.
- `package.json` (root): script `lic:check`.

## Acceptance Criteria
1. **Clasificador correcto:** MIT/Apache-2.0/BSD/ISC/OFL/CC0 → `permissive`; GPL-3.0/AGPL-3.0/LGPL-3.0 → `copyleft`; vacío/raro → `unknown`. Expresión `(MIT OR GPL-3.0)` → `permissive` (hay una opción permisiva).
2. **Escáner:** sobre un fixture con licencias mixtas, lista cada dep con su licencia y clasificación; **exit≠0** si hay copyleft o unknown.
3. **Notices:** `--notices` produce un `THIRD-PARTY-NOTICES.md` con paquete+versión+licencia de las permisivas.
4. **Prueba sobre target real:** `npm run lic:check -- <target>` corre contra un satélite real y reporta (verde si todo permisivo).
5. **Tests verdes:** `node --test scripts/check-licenses.test.mjs`; `gates` (`Strategy: satellite-design`, ticket ECO-81), Security Pipeline, **Dashboard-VRT verde = prueba de aislamiento** (no se tocó el dashboard).

## Out of scope
- **Cablear el check en CI** (cambio cross-cutting → ticket aparte con su test de integración, AGENTS.md).
- **Adoptar los componentes** de shadcn/Magic UI/Aceternity + crecer tokens — **fase 1.2** (ticket siguiente).
- Cualquier cambio a componentes-app o valores de token existentes (ADR-019: aditivo, no mutar).

## Alignment
Implementa la condición **"línea de cumplimiento de licencias (gateable)"** de [`satellite-design`](../strategy/satellite-design.md) / [ADR-018](../adr/018-satellite-design-generator.md) §Condiciones y [ADR-019](../adr/019-design-system-upstream-shadcn.md) §Decisión (solo permisivas MIT/Apache/BSD/ISC/OFL/CC0; veta copyleft; `THIRD-PARTY-NOTICES`). Es el **guardrail previo** a adoptar la base abierta (fase 1). Honra el principio **ADITIVO y AISLADO** (no toca el dashboard ni sus tokens; Dashboard-VRT lo prueba). No re-litiga el estándar del pilar A.
