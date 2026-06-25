# ADR-013 — Satélites: estándar profesional COMPLETO del núcleo común + GATE de launch-readiness

- Status: accepted
- Date: 2026-06-22
- Ticket: [ECO-64](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-64) (decisión) · seguimiento [ECO-65](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-65) (FB5, implementación)
- Strategy: satellite-builders
- Deciders: Operador (human gate, 2026-06-22)
- Contexto de gobierno: repo gobernado por Emkeel (ver `AGENTS.md`). Materializa el **refinamiento ECO-64**
  del norte [`strategy/satellite-builders.md` §«Refinamiento ECO-64» + D](../strategy/satellite-builders.md).
  **Reutiliza — no re-litiga —** ECO-56 (SEO), ECO-58 (i18n), [ADR-010](010-satellite-design-generation.md)
  (diseño/CWV), [ADR-011](011-satellite-image-assets.md) (imágenes), [ADR-012](012-satellite-builders-architecture.md)
  (builders→IR→emitter). Proceso `/strategy satellite-builders` re-corrido con research real → `approved`.

## Contexto
La estrategia fijó el **mecanismo** (builders → IR → emitter) pero **no un estándar COMPLETO** de "sitio
profesional óptimo" → los indispensables (formulario, favicon, 404, GDPR, a11y) aparecían **a parches**. Se fija
el estándar COMPLETO **de una vez** en el **núcleo común** + un **gate** que lo verifica, para que nada salga a
medias.

## Decisión

### 1. El estándar profesional COMPLETO vive en el NÚCLEO COMÚN (cross-cutting)
Lo impone el núcleo → **lo hereda TODO builder** (desde-archivo, desde-URL, los que vengan); **no por builder**.
- **Codificado de lo ya cubierto:** SEO de fábrica (ECO-56), i18n idioma real (ECO-58), rendimiento/CWV-lab S2,
  responsive, HECHOS-vs-DISEÑO/no-inventar (§D4), imágenes reales + decorativas (ADR-011), código propio + em-ui
  (ownership), seguridad/headers HTTPS, analytics respetuoso, páginas legales, firma **"Powered by EM Ecosystem"**.
- **NUEVO:** formulario de contacto/lead **funcional**; **favicon + iconos + web manifest** derivados del **logo
  real** (≥512² → favicon.ico/svg + apple-touch 180² + 192²/512² + `site.webmanifest`, vía sharp, nunca inventado);
  **404 de marca**; **GDPR Cookiebot**; **a11y WCAG AA con axe-core**; **SEO ampliado** (Twitter Cards + structured
  data por tipo).
- **NUEVO (ECO-68):** **toggle de tema MANUAL en el header/nav** — el núcleo ya genera AMBOS temas (`ThemeContext`,
  default parametrizable + `prefers-color-scheme`), pero faltaba el **control para que el visitante cambie a mano**
  light↔dark; la elección **persiste** (`localStorage`). Se monta el **`ThemeToggle` de em-ui** (vía registry, no
  copia local — `design-system/components/ThemeToggle.tsx`, usa `useTheme`/`toggleTheme`), DENTRO del `ThemeProvider`.
  Primer indispensable añadido **vía el mecanismo de lista viva (§7)** tras el estándar inicial.

### 2. Formulario = opción 1 (Vercel Server Action + Resend + Turnstile) — APROBADA
Formulario **propio**: Vercel Server Action/function + **Resend** (email/deliverability) + **anti-spam PROPIO** con
el **`TurnstileWidget` de em-ui** (Cloudflare Turnstile, `design-system/components/TurnstileWidget.tsx`, en el
registry) — sin dependencia externa en runtime, consistente con "código en nuestro control". **Pluggable** a un
form-service por cliente cuando se prefiera cero mantenimiento. **Descartada (2)** Formspree (dep externa por satélite).

### 3. GDPR = Cookiebot (free, pluggable) — DECIDIDO
Script CMP + **Consent Mode v2** (incluido en el plan gratis) → **bloquea cookies/scripts hasta el consentimiento**;
el **analytics se condiciona al consentimiento**. **Pluggable** hasta tener el nuestro (mismo patrón que el gateway
de imágenes, ADR-011). El free = un default global (sin geo) — declarado.

### 4. a11y WCAG AA con axe-core
Verificada con **axe-core** (@axe-core/playwright, MPL-2.0 libre, ~90 reglas WCAG A/AA/AAA + ARIA) en el gate.
**Honestidad:** axe-core caza ~57% de los criterios automatizables; lo no automatizable (alt significativo, orden
de foco) queda marcado `incomplete` para **revisión humana** — no se finge AA total.

### 5. SEO ampliado
**Twitter Cards** (`summary_large_image`) + **structured data POR TIPO** (FAQPage para FAQ, Service/Offer para
servicios), sobre el OG/JSON-LD de ECO-56. Aplicable **según el contenido**; ausente → se **omite, nunca se
inventa** (§D4).

### 6. GATE de launch-readiness (extiende S2 a un gate profesional COMPLETO)
El núcleo común **NO declara "lanzado"** hasta cumplir TODO el estándar. Igual que el gate lossless (ECO-63) caza
un sub-campo caído, este caza **cualquier indispensable que falte → nada sale a medias**. Verifica (lab, por
construcción): Lighthouse S2 + audits SEO + OG/JSON-LD + Twitter Cards + structured-data-por-tipo válido · **a11y
AA axe-core sin violations** (incomplete → humano) · **formulario** presente, endpoint responde, lleva Turnstile ·
**favicon/manifest/apple-touch** · **404 de marca** · **Cookiebot CMP** + **analytics condicionado** · **headers
HTTPS S2** · **legales** + **"Powered by EM"** · **toggle de tema en el header** cableado al `ThemeContext` y
montado DENTRO del `ThemeProvider` (ECO-68). Falla cualquiera ⇒ NO "lanzado". (CWV de **campo** = objetivo
post-lanzamiento, NO gate — ADR-010.)

### 7. El estándar es una LISTA VIVA / EXTENSIBLE
El estándar **no es cerrado**: es el **mecanismo de extensión**. Un indispensable futuro entra **vía un
refinamiento gobernado de `/strategy`** (como ECO-64) → al **estándar** + al **gate** → lo **heredan TODOS los
builders sin reescribir nada por builder** (el núcleo común es el único punto de cambio). Así el estándar **crece
con el producto** sin re-litigar el norte ni tocar los adapters.

**Primera extensión aplicada — ECO-68 (toggle de tema):** ejercita el mecanismo de punta a punta. El indispensable
se añadió en **un solo punto del núcleo común** (`generate-satellite.mjs` LAYOUT + `emit.mjs` jala el `ThemeToggle`
del registry) y **un check** en el gate (`launch-ready.mjs`) → lo heredan TODOS los builders (desde-archivo y los
que vengan) sin tocar adapters. El refinamiento del **norte** (`strategy/satellite-builders.md` §estándar) se
tramita en su **propio lane `/strategy`** (acto deliberado, aprobado por humano) — esta ADR registra la decisión
técnica; el norte la consagra por separado.

## Consecuencias
- **Fasificación FB5** (con/sobre FB2, [ECO-65](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-65)):
  implementar los indispensables nuevos en el núcleo común + el gate de launch-readiness que los verifica.
- **"Lanzado" sube de listón:** del S2/Lighthouse a un gate profesional completo; ningún satélite sale sin todos
  los indispensables.
- **Reconcilia, no re-litiga:** ECO-56/58, ADR-010/011/012 quedan intactos; el estándar/gate se construye encima
  y los reutiliza.
- **Honestidad preservada (§D4):** structured-data/Twitter Cards solo donde hay contenido real del tipo; a11y AA
  no se finge (incomplete → humano); Cookiebot/form son pluggables (ownership progresivo).

## Notas
- Aprobada por el operador en el human gate de `/strategy satellite-builders` (ECO-64, 2026-06-22, con un ajuste
  que añadió anti-spam Turnstile propio + SEO ampliado + el estándar como lista viva), conducido por el motor
  (`emkeel strategy` → `approved`) con provenance de research real (Cookiebot/Resend/Formspree/axe-core/favicon +
  el `TurnstileWidget` del repo). El "cómo" detallado vive en FB5 (ECO-65); el procedimiento operativo, en el runbook.
