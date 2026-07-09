# Strategy: design-distribution

Status: DRAFT
Strategy: design-distribution   <!-- feature specs reference this with a `Strategy: design-distribution` line -->
Impact: high   <!-- low | medium | high — `low` lets a trivial strategy pass critiqued with 1 lens; absent = high (full ≥3-lens panel) -->

## Goal
Decidir el modelo de **DISTRIBUCIÓN y PROPIEDAD** del design-system a los consumidores — **(a)** extender la copia
gobernada para que instale sus DEPENDENCIAS (estilo shadcn CLI, satélite autocontenido/portable) vs **(b)** paquete
compartido — garantizando la **PORTABILIDAD** (un cliente puede llevarse su satélite) y **coordinando** (no
poseyendo) el contrato de MODIFICABILIDAD por-elemento que vive en `design-propagation`. Investigado con el mercado.
Re-abre ADR-006/007/019; ACOPLADO con `design-system-quality` (ECO-160) y `design-propagation` (ADR-028).

## Context
<!-- grounded facts ONLY — cite file:line (repo) or a URL (market) for every claim -->

**Path (a) — copia+propiedad (shadcn) y el hueco que tenemos:**
- shadcn COPIA el código al repo del consumidor ("the code is now yours"), cero dependencia en runtime → la web se auto-hospeda sin atarse al proveedor (el registro solo se usa al add/update, no en runtime) — https://ui.shadcn.com/docs/registry.
- shadcn separa por-item `dependencies` (paquetes npm con versión pinneada `zod@^3.20.0`, que el CLI **instala** en package.json) y `registryDependencies` (hermanos que pulla por dirección) — https://ui.shadcn.com/docs/registry/registry-item-json.
- NUESTRO registry NO anota deps npm: las claves son exactamente [name,type,file,registryDependencies,internalDependencies]; cli.mjs solo copia ficheros (copyFileSync), sin `npm install` — design-system/registry.json, design-system/registry/cli.mjs:4,79,141,207.
- El hueco YA rompe la auto-contención: componentes importan lucide-react(29), motion/react(8), recharts(2), react-easy-crop(2), turnstile(2) que el registry no registra; el satélite mantiene su package.json a mano y le FALTAN varios → un `em-ui add` de una pieza que los use copia el .tsx pero deja el build roto — design-system/components/, satellites/sat-cristian-garcia/package.json:13-21.
- shadcn 3.0 soporta registros PRIVADOS, namespaced, autenticados (@namespace, credenciales por env nunca logueadas, Bearer/API-key) + resolución cross-registry con override — https://ui.shadcn.com/docs/registry/namespace. CAVEAT: las direcciones GitHub son solo repos PÚBLICOS; un registro privado no es resoluble por un cliente externo sin una ruta URL/proxy → la portabilidad vale para el CÓDIGO copiado (deps npm ordinarias), no para re-pullar de un origen privado — https://ui.shadcn.com/docs/registry/faq.
- Updates shadcn = pull deliberado + `diff`/merge (no bump automático) = el problema de reconciliación que YA construimos (ECO-158, git merge-file 3-way) — https://vercel.com/academy/shadcn-ui/updating-and-maintaining-components.

**Path (b) — paquete compartido: personaliza pero ATA:**
- npm privado ES la atadura: los paquetes scoped son privados por defecto, requieren cuenta de pago y solo acceden colaboradores/equipos concedidos → un satélite que instale un `@org/design-system` privado NO puede construir una vez revocado el acceso — https://docs.npmjs.com/about-private-packages.
- Theming de paquete (MUI/Ant/Mantine/Chakra): personalizas por la superficie EXPUESTA (theme tokens, styleOverrides, named parts) pero NO puedes reestructurar el DOM interno desde el theme; cambios profundos empujan a envolver/reemplazar — https://mui.com/material-ui/customization/theme-components/, https://mantine.dev/styles/styles-api/.
- El "eject" es una vía de UN SOLO SENTIDO que corta el canal de updates para siempre (CRA eject) — https://sebhastian.com/create-react-app-eject/.

**El contrato de personalización gobernada (el patrón del mercado):**
- Sin contrato, el white-label COLAPSA: de 12 tokens al lanzar a 200+ para el 15º cliente ("20 design-systems ligeramente distintos") — https://www.webmastered.com/blog/white-label-design-system-debt-theming-customization/.
- Referencia "soportado vs no-soportado": los styling-hooks de Salesforce SLDS (component `--slds-c-*` vs global `--slds-g-*`; override directo = NO soportado, porque los internos pueden cambiar entre releases) — https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css-custom-properties.html. Primitivo web versionado por-parte: CSS Shadow Parts `::part()`/`exportparts` (partes nombradas, internos encapsulados) — https://www.w3.org/TR/css-shadow-parts-1/.
- Arquitectura canónica: 3 capas de tokens ADITIVAS — Tier-1 primitivos BLOQUEADOS / Tier-2 semántico = punto PRIMARIO de override del cliente (re-marca re-apuntando) / Tier-3 de componente opcional; la lógica del componente nunca se duplica, solo varían las capas de token — https://designsystemproblems.com/token-management/token-tier-system/, https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems.

**Lo que nuestros ADRs YA decidieron:**
- ADR-006 descartó los paquetes (workspace y npm publicado) porque "un paquete inmutable pelea con la divergencia per-cliente que un satélite necesita"; ADR-007 fija la fuente en design-system/; ADR-019 = shadcn upstream — emkeel-governance/adr/006-satellite-component-reuse.md:18,30-34.
- ADR-028 fijó el modelo de propagación y **gateó por nº de consumidores (hoy=2)** los marcadores por-elemento (@brand-locked/@ds-governed/@partial) — la deuda que el operador decide DES-gatear (construir ya) — emkeel-governance/adr/028-mecanismo-propagacion-gobernanza-diseno.md:29,37-42.

## Options
<!-- at least 2 real options; EVERY row MUST cite a Source (file:line or URL). `emkeel strategy check` enforces it. -->
| # | Option | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| a | **Extender la COPIA gobernada** (shadcn-isomorphic): el registry gana un campo `dependencies` (npm, name@version pinneado) y el CLI las INSTALA en el package.json del consumidor al add/update. El código se sigue copiando+poseyendo; la superficie npm (framer-motion, recharts, lucide-react…) pasa de espejo-a-mano a registrada+auto-instalada. | https://ui.shadcn.com/docs/registry/registry-item-json | Cierra el hueco verificado (copiar-sin-deps rompe el build); preserva el invariante PULL y la divergencia per-cliente de ADR-006; cliente portable (código propio + deps npm públicas, auto-hospedable, cero atadura en runtime); isomorfo a shadcn (ADR-019 sigue); la reconciliación (ECO-158) ya maneja updates; delta mínimo. | El consumidor posee su mantenimiento (no hay bump masivo de un comando); el install debe reconciliar versiones y no ocultar fallos. | Version-soup entre satélites si el registry no converge los pins; el install añade superficie de fallo (red/lockfile) a un flujo que era copia-pura. |
| b | **Paquete COMPARTIDO** + contrato de modificabilidad: publicar el DS como paquete (privado) versionado; personalización por superficie declarada (3-tier tokens + named parts + slots); update = un bump. | https://docs.npmjs.com/about-private-packages | Updates centrales limpios (un bump llega a todos, atómico); gobernanza por economía de escala; lógica nunca duplicada. | VIOLA la portabilidad: un paquete privado ES la atadura (npm privado = pago + colaboradores; sin acceso el cliente no compila); solo personalizas lo expuesto (no reestructuras el DOM interno); ADR-006 ya lo rechazó. | La portabilidad solo vuelve con mirror público o vendoring (re-copiar); el eject es de un-solo-sentido y corta updates. |
| c | **HÍBRIDA (RECOMENDADA)**: la COPIA+propiedad (a) como forma en runtime, y ENCIMA la GOBERNANZA de (b) como contrato de personalización (3-tier tokens + marcadores por-elemento @brand-locked/@ds-governed/@partial + slots). DS publicado desde UN registro gobernado; cada satélite su propio repo que pulla copia-in y aprueba updates por diff visual (ECO-158). | emkeel-governance/adr/028-mecanismo-propagacion-gobernanza-diseno.md:37 | Consigue AMBAS: portabilidad/auto-hospedaje del cliente Y personalización gobernada sin forkear; nativa al invariante pull + aprobación por diff visual ya elegidos; respeta ADR-006/019 en vez de re-litigarlos; ataja el colapso del white-label. | Más piezas que (a) pura: hay que construir el install de deps Y el contrato de tokens+marcadores; disciplina de gobernanza para que los overrides no se filtren a CSS ad-hoc. | Que el contrato de tokens colapse si no lo fuerza un gate (dirección de $tier + pares de contraste). |

## Recommendation
**Opción (c) HÍBRIDA — copia+propiedad como base, con gobernanza de personalización encima.** Da las DOS propiedades
que el operador exige (portabilidad del cliente + personalización sin caos) y respeta ADR-006/019. **Reencuadrada
tras el panel (6 must-fix):** esta estrategia posee **LA FORMA de distribución/propiedad**; NO reclama los marcadores
por-elemento (son de `design-propagation`). Su carril limpio, verificado:

1. **Cerrar el hueco de deps npm (path a) — build-now:** el registry gana un campo `dependencies` npm y el CLI las
   INSTALA en el consumidor al add/update (sin ocultar fallos de red/lockfile/peer-dep). Con 3 precisiones del panel:
   (a) un **resolver especificador→paquete** (`motion/react`→`motion`, `next/link`→`next`, scoped→sí mismo); (b)
   **normalizar primero el import de animación del propio DS** — hoy usa `motion/react` (8) Y `framer-motion` (2), la
   MISMA librería con dos nombres, y package.json trae ambos → version-soup de fábrica; ese saneamiento es un pase
   **acoplado a `design-system-quality`**; (c) **fuente de versión** = el package.json del DS filtrado a runtime (no
   los .tsx); convergencia = el registry DECLARA la versión y `em-ui update` reconcilia el package.json del satélite
   hacia ella + el **fleet-reporter marca el drift** (rangos `^` reconciliados hacia lo declarado, no divergencia
   silenciosa) — reusa ECO-158.
2. **Extraíbilidad del satélite — invariante build-now + GATE:** VERIFICADO que el satélite ES auto-contenido hoy
   (sin `tsconfig extends`, `turbopack.root` pinneado, su propio lockfile, sin workspaces, cero imports que escapen
   del dir) y `git subtree split` produce un repo standalone limpio con toda su historia. Se **añade un GATE** que
   mantiene la invariante (falla si un import del satélite escapa de su directorio). La HERRAMIENTA de extracción
   (subtree-split → repo standalone) queda APARCADA (event-driven, cuando un cliente se lleve su repo).
3. **LEGAL/IP en el hand-off — build-now (defecto de compliance a arreglar):** hoy el CLI copia código MIT adoptado
   (cn, Marquee, Meteors…) SIN su aviso MIT (el NOTICE vive solo en `design-system/`, que el CLI no envía) → un
   cliente portable recibe MIT **sin aviso** (ya pasa en sat-cristian `utils.ts`). El CLI **escribe LICENSE +
   THIRD-PARTY-NOTICES por-satélite al add/init**; y se **decide la licencia SALIENTE** (qué recibe el cliente sobre
   el código EM que ahora posee vs qué retiene EM).
4. **Canal de update ≠ hosting (mercado) — APARCADO con válvula prevista:** separar dónde-se-aloja de cómo-llegan
   updates. Hoy todos los satélites en Vercel (nuestro mecanismo de visualización) → control total. Si un cliente se
   auto-hospeda: el update viaja por el REPO (PRs/commits estilo Renovate/Dependabot, que actualizan repos que no
   despliegan) o corre `em-ui update` a su ritmo (shadcn). Se deja la VÁLVULA prevista (registro autenticado, o foto
   final); se construye el canal cuando haya un cliente auto-hospedado.

**Lo que esta estrategia NO posee (coordina, no reclama):**
- **Los marcadores por-elemento `@brand-locked`/`@ds-governed`/`@partial` son de `design-propagation`** (definidos en
  su item 5) y su fase está RATIFICADA por ADR-028 (gated por nº de consumidores). La decisión del operador de
  construirlos YA (des-gatear) es un **ADR que ENMIENDA ADR-028**, hecho en el carril de `design-propagation`,
  coordinado — NO reclamado aquí. **Mecanismo real** (el panel probó que `::part`/SLDS-hooks NO mapean: son
  web-components/shadow-DOM; los nuestros son React+Tailwind light-DOM): un atributo **`data-em-lock`** + **política
  de merge POR-REGIÓN en la reconciliación (ECO-158) al hacer pull** (brand-locked=gana el DS / ds-governed=solo
  re-apuntando un token semántico / partial=preserva la adaptación) + gate de dirección de token. Eso se especifica y
  construye en `design-propagation`.
- **La arquitectura de tokens en capas** (primitivos/semántico/componente) es de `design-tokens`/`design-system-quality`;
  esta estrategia la consume, no la define.

**Descartadas:** (b) pura viola la portabilidad (atadura de paquete privado, ADR-006); (a) pura sin el contrato de
personalización de design-propagation → colapso white-label (12→200 tokens).

## Non-goals
- NO paquete compartido privado como forma de runtime (viola portabilidad; ADR-006 ya lo rechazó) — la gobernanza se toma como CONTRATO, no como paquete.
- NO reclamar ni definir los marcadores por-elemento aquí — son de `design-propagation`; el des-gatearlos (build-now, decisión del operador) es un ADR que enmienda ADR-028 en ESE carril, coordinado.
- NO usar `::part`/SLDS-hooks como mecanismo (son web-components; no mapean a React+Tailwind+copia) — el mecanismo real es `data-em-lock` + merge-policy-por-región en ECO-158.
- NO construir el canal de update ni el tooling de extracción para clientes auto-hospedados AHORA (aparcado: todos en Vercel con nosotros) — pero la invariante de auto-contención + su gate SÍ se construyen ya.
- NO tocar los VALORES de token ni la arquitectura de construcción (`design-tokens` / `design-system-quality`) — esta estrategia decide DISTRIBUCIÓN/PROPIEDAD, se coordina.

## Decisions
<!-- optional: link the chosen decision as an ADR, e.g. emkeel-governance/adr/007-<slug>.md -->
