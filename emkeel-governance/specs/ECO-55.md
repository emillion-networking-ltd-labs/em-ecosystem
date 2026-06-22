# ECO-55 — Satélites F4 Batch 2: +4 secciones nivel-2 (Testimonials/Pricing/Portfolio/FAQ)

Strategy: satellites

## Resumen
Continúa la **Fase 4** ([ADR-010](../adr/010-satellite-design-generation.md), opción 3 híbrida) con el **mismo
patrón que ECO-54 (Batch 1)**: añade 4 secciones nivel-2 a `design-system/sections/`, distribuidas por el
registry, y el generador **compone** la página desde ellas **cuando el brief trae sus datos** y las **omite**
cuando faltan. **Guardrail §D4 crítico aquí:** jamás inventar testimonios ni precios — sin datos reales, no hay
sección.

## Contexto / base
- Batch 1 (ECO-54, en main): Hero/Services/CTA/Contact + el mecanismo (registry escanea `sections/`, `em-ui add
  <Section>` jala el cierre de átomos/hooks, generador compone). Batch 2 reutiliza ese mecanismo intacto.
- Fuentes SAT01: `TestimonialsPreview.tsx` (+`SocialProofSection.tsx`), `PricingSection.tsx`, `PortfolioPreview.tsx`.

## Decisiones que resuelve

### D — 4 secciones nivel-2 parametrizadas (token-safe, autosuficientes)
- **Testimonials** ← TestimonialsPreview: tarjetas con testimonios reales (name/quote/result); iniciales en
  círculo de marca **sin** el átomo Avatar (acoplado a la API del dashboard). Atoms: Badge/Button.
- **Pricing** ← PricingSection: planes con **precios verbatim** del brief, plan destacado en marca, features
  con check `accent`. Atoms: Badge/Button. (sin `card-flat`/tamaños ad-hoc; `useFadeInOnView`→`useReveal`).
- **Portfolio** ← genérico (el "recorte de periódico" de SAT01 es bespoke con hex hardcodeados): galería de
  items; imagen **opcional** como `background-image` (sin `<img>`/next-image → sin config de dominios ni dep
  de assets); tile de marca con el título si no hay imagen. Atoms: Badge/Button.
- **FAQ** ← **nuevo** (sin equivalente en SAT01): `<details>/<summary>` nativo (a11y por defecto, sin JS,
  contenido en el DOM = bueno para SEO). Atom: Badge.
- Todas: contenido por props del brief, **marca de primera clase** (token `accent`), **≥1 variante**,
  a11y/responsive, autosuficientes (capa de tokens + Tailwind estándar + `useReveal` propio).

### D — Generador: composición condicional + em-ui add dinámico (no-inventar)
El generador normaliza los datos del brief (testimonials/pricing/portfolio/faqs) — solo `provided`/`extracted`
(proposed fuera de réplica); ausentes → `null`. **em-ui add DINÁMICO:** solo añade las secciones que tienen
datos para componer. `PAGE` compone cada sección **solo si hay datos** (home + rutas dedicadas /precios,
/portfolio, etc.); lo que falta se **omite** — nunca placeholder feo, nunca fabricado.

## Scope
- `design-system/sections/{Testimonials,Pricing,Portfolio,FAQ}.tsx`; `registry.json` regenerado (55 items).
- `generate-satellite.mjs`: normalizadores + ctx + composición condicional + em-ui add dinámico.
- Tests (sin red): e2e en los dos sentidos + guardrail. **NO** toca F1 (átomos/tokens), el reorg ni Batch 1.

## Acceptance Criteria
1. **4 secciones nivel-2** en `design-system/sections/`, parametrizadas, token-safe, con ≥1 variante y a11y;
   en el registry como `registry:section` con su cierre de átomos/hooks.
2. **Distribución:** `em-ui add <Section>` jala la sección + átomos (Badge/Button) + hook; `em-ui diff` sin drift.
3. **Compone CON datos:** un satélite cuyo brief trae testimonios/precios/portfolio/faqs renderiza esas
   secciones con su **contenido real** y marca aplicada; `next build` verde y **Lighthouse S2 verde**.
4. **Omite SIN datos:** un satélite cuyo brief no los trae **no añade ni compone** esas secciones; **cero
   placeholders, cero contenido inventado**.
5. **Guardrail §D4:** sin testimonios reales no hay Testimonials; sin precios no hay Pricing. Test que lo verifica.
6. **Gates verdes:** `gates` (`Strategy: satellites`, `check_ticket_link` ECO-55), Security Pipeline / Security Gate; tests del registry + skill verdes.

## Out of scope
- Las secciones restantes (SocialProof como sección propia, etc.) — batches posteriores.
- Cambios en F1, en el reorg (ECO-53) o en Batch 1 (ECO-54).
- El SEO técnico de fábrica (OG/JSON-LD) — es F5 (ECO-Fase5), no este ticket.

## Alignment
Continúa la **Fase 4** del norte (`strategy/satellites.md` §Fasificación F4, ADR-010 opción 3): crece la
**biblioteca de secciones gobernada** (sustrato del híbrido). Honra el **split verdad/diseño** (§D4: solo
hechos `extracted`/`provided`; lo ausente omitido, **jamás fabricado** — especialmente testimonios/precios), el
**reuse vía em-ui** (secciones distribuidas por el registry, fuente única `design-system/`) y la forma-SAT01.
Sube el listón de calidad de diseño (P3). No adelanta F5/F6 ni toca F1.
