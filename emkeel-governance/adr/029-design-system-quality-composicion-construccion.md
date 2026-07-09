# ADR-029 — design-system-quality: modelo de construcción+composición del DS (contrato de variante único + extracción de primitivos + listón de calidad + migración limpia/revisable), con la DISTRIBUCIÓN re-abierta como prerequisito acoplado

- Status: accepted
- Date: 2026-07-09
- Ticket: [ECO-160](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-160) (estrategia)
- Strategy: design-system-quality
- Deciders: Operador (human gate = aprobación + merge del PR de estrategia #556)
- Contexto de gobierno: registra la decisión de `emkeel-governance/strategy/design-system-quality.md`
  (aprobada por merge de #556). Es el ESPEJO de `satellite-quality` (ADR-017) para la FUENTE del DS (una pieza)
  en vez del RESULTADO (una web). **NO supersede** ADR-006/007/019/027/028; **FLAGS ADR-006/019 para re-apertura
  ACOPLADA** (decisión de distribución propia, futura).

## Contexto

El DS sigue con problemas pese a muchos tickets de refactor. Hallazgos grounded (research + panel adversarial de
6 lentes, 5 must-fix): (1) la composición YA funciona en gran parte (24 de 83 componentes se componen por
referencia; propaga a profundidad 3), pero unas pocas piezas **copian en vez de componer** y producen drift de
token (ChartCard/MetricCard hardcodean su superficie, no importan Card); (2) la duplicación se concentra donde
**no hay primitivo** que componer (panel de dropdown copiado en 5 controles, tooltips de chart, skeletons) → el
fix es CREAR el primitivo; (3) "lo fijo vs lo que varía por uso" está codificado de **4 formas incompatibles** (no
hay cva/tailwind-variants); (4) el registry NO distingue primitivo vs composite máquina-legiblemente; (5) la
estrategia se llama *quality* pero no había **listón de calidad** (a11y/tests/docs/VRT); (6) hallazgo capital: el
modelo moderno (tailwind-variants/Radix) mete **dependencias npm** en los primitivos y em-ui **solo copia
ficheros** (`copyFileSync`, cli.mjs:79) → un satélite recibiría un fichero que importa un paquete que no tiene =
build roto → **composición y distribución están ACOPLADAS**.

## Decisión

**Opción C-ACOPLADA de la estrategia: un programa de 4 pilares, apuntando a la mejor versión completa/escalable
(no el mínimo), con los límites previos DEBATIBLES (re-abrir lo que bloquee, no parchear alrededor).**

1. **Construcción+composición:** un **contrato de variante ÚNICO** (tailwind-variants: base/variants/
   compoundVariants + `VariantProps`) con **slots** multi-parte, colapsando los 4 idiomas; **extraer los
   primitivos que faltan** (Popover/Menu, ChartTooltip, Skeleton) y que MetricCard/ChartCard **compongan** Card;
   **campo primitivo/composite** en el registry; **CENSO = el DETECTOR** (auditoría + worklist de reconstrucción).
2. **Listón de CALIDAD por componente:** a11y AA (axe + teclado/foco/ARIA), tests, docs de estados, **encender los
   baselines VRT** (hoy cableados-pero-apagados) + **required-check HUMANO [H]** (verde ≠ excelente).
3. **Distribución RE-ABIERTA (acoplada):** re-abrir **ADR-006** (copy-by-value) + **ADR-019** (shadcn/Tailwind) —
   o se extiende em-ui para propagar deps npm, o se va a un modelo de paquete.
4. **Migración limpia y revisable** ("las máquinas sudan, el humano juzga"): censo-worklist (no un doc extenso),
   3 carriles (A mecánico→codemod AST test-first / B cambio visual→VRT-driven review de solo-deltas / C juicio),
   la máquina prueba lo mecánico (VRT/tests/byte-SHA/gates), **auto-merge del subconjunto seguro** vía
   `gh pr merge --auto`, **ratchet** (la deuda solo decrece), **DoD todo-o-nada** por componente, higiene con
   nombre propio (sin borrados a ciegas, mecánico/visual separados, árbol limpio antes del codemod).

**El gate es un RATCHET post-rebuild** (impide regresar a copiar), **NO el detector** (el detector es el censo; el
grafo del registry está vacío donde vive el drift y la superficie está en template-literals hostiles al AST).

## Consecuencias

- **Re-abre ADR-006/019** como prerequisito ACOPLADO — decisión de distribución propia (ADR futuro cuando se fije).
- **2 decisiones de scope quedan ABIERTAS** (no bloquean esta aprobación de la dirección): (a) re-abrir la
  distribución ADR-006/019 ahora; (b) el etiquetado por-ELEMENTO de modificabilidad (@brand-locked/@ds-governed/
  @partial, hoy scale-gated en ADR-028) — build-now (re-abrir la fase de ADR-028) vs dominio de `design-propagation`.
- Reality outcome de la estrategia = **mixed** (verificado por código: cli.mjs:79 copyFileSync no propaga deps npm):
  el diagnóstico se sostiene y revela un programa grande y acoplado, no un fix autocontenido.
- No toca los VALORES de color/token (`design-tokens`); la capa 3-tier se coordina con ella si el debate la re-abre.
