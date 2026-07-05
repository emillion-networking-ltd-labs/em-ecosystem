# ADR-028 — Mecanismo de propagación/gobernanza de diseño: reconcile base-pinned + estándar de construcción + censo de normalización (fwd/bwd), pull-only

- Status: accepted
- Date: 2026-07-05
- Ticket: [ECO-142](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-142) (estrategia)
- Strategy: design-propagation
- Deciders: Operador (human gate = aprobación + merge del PR de estrategia #539)
- Contexto de gobierno: registra la decisión de `emkeel-governance/strategy/design-propagation.md`
  (aprobada por merge de #539). **Extiende ADR-006/007** (reutilización/distribución por copia) y
  **ADR-027** (arquitectura de tokens) a la capa de PROPAGACIÓN/GOBERNANZA — NO los supersede; preserva el
  invariante pull.

## Contexto

El modelo de distribución por copia gobernada (em-ui, ADR-006/007) resuelve "cómo un satélite recibe un
componente/token", pero no escala como sistema de propagación de "updates de diseño" a N consumidores. Problemas
reales verificados: (1) `em-ui update` es un overwrite ciego (`copyFileSync overwrite:true`,
design-system/registry/cli.mjs:52) que destruye la divergencia del satélite al re-pull, y no hay manifiesto de
versión ni base con la que reconciliar; (2) la cobertura es de fidelidad-de-copia y disparada-por-cambio (los
drift-checks sólo miran lo ya cambiado), así que un elemento legacy nunca se marca; (3) la válvula
`@em-ui-adapted` es de fichero y sin razón; (4) hay dos clases de error — valor crudo (grep-eable) y token
válido pero mal-usado (no grep-eable, sólo cazable con identidad conocida); (5) existe un corpus LEGACY hecho
antes del contrato de construcción (ECO-136 lo reconcilió a mano); (6) los manuales de estrategia
(satellite-quality/design/tokens) son estándares vivos que deben propagarse. La fiabilidad de la detección es
CONSECUENCIA de cómo se construye el elemento, no de escanear más fuerte.

## Decisión

**Opción 3 de la estrategia, calibrada (mínimo ahora, resto gated por nº de consumidores; hoy = 2).** Se
mantiene el modelo pull/copia (no re-plataformar).

- **Construir ahora:** (1) manifiesto por consumidor que fija el **git-SHA del DS por fichero** + **reconcile
  asistido base-pinned** (`git merge-file` contra esa base, marca conflictos, nunca auto-resuelve ni pisa una
  adaptación) que reemplaza el overwrite ciego; (2) `check-raw-color` + correr los drift-checks existentes como
  **barrido total** (no change-triggered); (3) **estándar de construcción** (investigado — cómo se construye
  bien y con organización: mapas ortogonales nombrados, borde = `border`+un solo `border-<token>`, token por
  ROL, anidamiento mínimo, sin redundancia real; extiende StoryConventions) + **censo de normalización (report)**
  que clasifica todo el corpus CONTRA ese estándar; (4) seguridad de rollout (pin/hold de versión,
  halt-on-red, VRT por consumidor).
- **Gated (≥N consumidores):** marcadores por-elemento (`@brand-locked`/`@ds-governed`/`@partial`); allow-list
  de tokens **por componente conocido** (no inferencia de rol); censo **auto-codemod** + advisory estructural;
  lock `@layer` (override en capa inferior); propagación versionada de los manuales.
- **Un motor, dos direcciones:** *forward* = autoría (contrato → Storybook → aprobación → registry) +
  propagación por token + reconcile; *backward* = el censo lleva el corpus legacy a la norma. Mismo clasificador
  → régimen permanente + retrofit, no migración única.
- **Frontera de gobernanza:** la flota es **pull-only** (reporta drift + abre PRs + dispara el update propio del
  consumidor; NUNCA escribe bytes en rutas de consumidor). Un pusher central violaría el invariante duro de
  em-ui (design-tokens.md:76, ADR-027:36).

## Consecuencias

- Se arregla el bug de escala real (el overwrite ciego destruye la marca) sin re-plataformar; validado sobre
  caso real (sat-cristian-garcia Button.tsx: el `copyFileSync` destruye la adaptación, `git merge-file`
  base-pinned la conserva Y aplica el update, 0 conflictos).
- El invariante pull se preserva (extiende, no supersede, ADR-006/007/027).
- Límites honestos: el caso "token válido pero mal-usado en algo que parece card" queda como REVISIÓN DE
  DISEÑO, no gate (Polaris/SLDS no lo cazan); la comprobación de higiene es CONSCIENTE del estándar, no un dedup
  ingenuo (`border border-<token>` = ancho+color, no redundancia).
- **NO-GOALS:** revivir el pipeline DTCG + generador ahora (diferido tras ≥3-4 consumidores, design-tokens.md:89);
  un actor central que EMPUJE a rutas de consumidor; re-plataformar em-ui a paquete npm compilado; un gate que
  infiera el ROL desde JSX; rediseñar la paleta de marca (satellite-design/ECO-128); el modelo de selección
  (ECO-141).
- Faseado como tickets ECO separados: los 4 "build now" primero; los items 5-9 gated por el trigger de
  nº de consumidores.
