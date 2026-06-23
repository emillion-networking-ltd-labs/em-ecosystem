# ECO-65 — FB5: Estándar profesional COMPLETO + gate de launch-readiness

Strategy: satellite-builders

## Resumen
Implementa **FB5** de [`satellite-builders`](../strategy/satellite-builders.md) ([ADR-013](../adr/013-satellite-launch-readiness-standard.md)):
el **estándar profesional COMPLETO** del núcleo común + el **gate de launch-readiness** que lo verifica. Construido
**SOBRE** FB2 ([ECO-66](./ECO-66.md)) — el emitter. El núcleo común lo hereda **TODO builder** (desde-archivo,
desde-URL, los que vengan); **no por builder**. El gate de launch-readiness cierra el ciclo de calidad: ningún
satélite sale a medias. Fasificado: `emit.mjs` (núcleo emitter) + `lib/launch-ready.mjs` (gate) + `lib/emit-professional.mjs`
(templates) + `generate-satellite.mjs` (LAYOUT extendido).

## Decisiones que resuelve

### D — Formulario de contacto/lead funcional SIEMPRE en la ruta de contacto REAL (ADR-013 §2: Vercel Server Action + Resend + TurnstileWidget)
`CONTACT_FORM_COMPONENT` (client component `ContactForm` aislado) + `CONTACT_ACTION` + `CONTACT_PAGE` en el
núcleo. Vercel Server Action (code propio, `"use server"`) → Resend (email/deliverability) → anti-spam
**TurnstileWidget** de em-ui (`@marsidev/react-turnstile`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`). Env vars:
`RESEND_API_KEY`, `LEAD_EMAIL`, `TURNSTILE_SECRET_KEY`. Pluggable a un form-service por cliente.

El formulario funcional se monta **SIEMPRE** en la página de contacto del satélite, sea cual sea su ruta:
- Si el cliente YA trae página de contacto (cualquier variante: `/contact`, `/contact-us`, `/contacto`…), su
  contenido REAL se reconstruye fiel del IR (el gate de emisión lo sigue verificando — lossless) y se le AÑADE
  `<ContactForm />` como sección. Contenido real + formulario que funciona.
- Si no trae ninguna, se crea `/contact` sintética (server component) que renderiza `<ContactForm />`.
- El form va aislado como client component → la página de contacto sigue siendo **server component** (metadata
  válida; un client component no puede exportar `metadata`).
- El gate de launch-readiness verifica el formulario en la ruta de contacto REAL (no hardcodea `/contact`):
  detecta la página de contacto, que monte `<ContactForm />`, y que `ContactForm.tsx` cablee TurnstileWidget +
  `sendLead`.

### D — Favicon + iconos + web manifest desde el LOGO REAL (ADR-013 §1, sharp)
`generateFavicons(logoFile, pubDir)` (async, em-professional.mjs): genera `favicon.png` (32×32),
`apple-touch-icon.png` (180×180), `android-chrome-192x192.png`, `android-chrome-512x512.png` vía **sharp**
(instalado en el skill). `favicon.svg` pass-through si el logo es SVG. `site.webmanifest` siempre emitido
(icons + brand color + nombre). Sharp requerido en el host — si no está disponible, el gate falla
(`"sharp not installed"`) y el operator lo instala + re-corre el emitter.

### D — 404 de marca (ADR-013 §1)
`NOT_FOUND_PAGE(siteName, t)` emitido como `src/app/not-found.tsx`. Usa tokens em-ui (accent, surface-primary),
texto internacionalizado (vía `t`), enlace de vuelta a `/`. Siempre presente; el operator no tiene que crearlo.

### D — GDPR Cookiebot CMP (ADR-013 §3, Consent Mode v2, pluggable)
Script Cookiebot añadido al `<head>` del LAYOUT cuando `opts.cookiebot = true` (el emitter lo activa siempre).
`NEXT_PUBLIC_COOKIEBOT_ID` env var controla si el script se monta en runtime. Analytics (`DeferredAnalytics`)
condicionado: solo si Cookiebot no está configurado → sin Cookiebot = analytics directo; con Cookiebot = el
operador configura el Consent Mode. Pluggable: el operator puede sustituirlo por su CMP propio.

### D — SEO ampliado: Twitter Cards + structured data por tipo (ADR-013 §5)
**Twitter Cards** (`summary_large_image`) añadidas a nivel site (layout.tsx) y por página (PAGE_FROM_IR):
`twitter: { card: "summary_large_image", title, description }`. **FAQPage JSON-LD** emitido automáticamente si
la página tiene ruta `/faq*` o bloques con `?`. **Service JSON-LD** si la ruta es `/services*` con icon-boxes.
Ausente si no hay contenido del tipo → **nunca se inventa** (§D4). Sobre el OG/JSON-LD de ECO-56.

### D — Test de a11y WCAG AA con axe-core (ADR-013 §4, @axe-core/playwright)
`A11Y_TEST(routes)` emitido como `tests/accessibility.spec.ts`. Tags `wcag2a, wcag2aa, wcag21a, wcag21aa`.
`violations` → falla el test; `incomplete` → se lista como advertencia (revisión humana) — **honesto, no finge
AA total** (~57% automatizable). `playwright.config.ts` generado con `webServer`. `@axe-core/playwright` +
`@playwright/test` en devDependencies del satélite.

### D — GATE de launch-readiness (`lib/launch-ready.mjs` `verifyLaunchReady`)
Verifica por construcción: favicon (svg|png|ico), apple-touch-icon, android-chrome 192/512, site.webmanifest,
favicon links en layout.tsx, not-found.tsx, **formulario funcional en la ruta de contacto REAL** (localiza la
página de contacto del satélite — `/contact`, `/contact-us`, `/contacto`… — verifica que monte `<ContactForm />`
y que `ContactForm.tsx` cablee TurnstileWidget), actions/send-lead.ts cableado, Cookiebot en layout.tsx,
Twitter Cards (summary_large_image) en layout.tsx, tests/accessibility.spec.ts, security headers S2 en
next.config.mjs, "Powered by EM Ecosystem" en layout.tsx. **Falla cualquiera → NO "lanzado"**. Mismo contrato
que `verifyEmit` (`{ ok, problems, lines }`). `buildFromFile` lo corre después de `verifyEmit` → tres gates
encadenados: captura + emisión + launch-readiness.

### D — LISTA VIVA / EXTENSIBLE (ADR-013 §7)
El estándar es extensible: un indispensable futuro entra en `emit.mjs` (para que el emitter lo genere) +
`launch-ready.mjs` (para que el gate lo verifique) → **lo heredan TODOS los builders**. La lista no es cerrada.

## Scope
- `scripts/builders/lib/emit-professional.mjs` (NUEVO): templates CONTACT_ACTION/CONTACT_FORM_COMPONENT
  (ContactForm client component reutilizable)/CONTACT_FORM_IMPORT/CONTACT_FORM_SECTION/CONTACT_PAGE (server)/
  NOT_FOUND_PAGE/WEBMANIFEST/A11Y_TEST/PLAYWRIGHT_CONFIG + `generateFavicons` async.
- `scripts/lib/i18n.mjs` (MODIFICADO): chrome keys del formulario (`contactFormTitle`, `contactFormLead`,
  `backHome`) en es/en — sólo ADITIVO (salida byte-idéntica para clientes existentes).
- `scripts/builders/lib/launch-ready.mjs` (NUEVO): `verifyLaunchReady` / `assertLaunchReady`.
- `scripts/builders/emit.mjs` (MODIFICADO): async, llama `generateFavicons` + todos los templates pro + LAYOUT
  con `{ cookiebot:true, favicons:true }` + Twitter Cards + JSON-LD por tipo en PAGE_FROM_IR.
- `scripts/builders/build-from-file.mjs` (MODIFICADO): `await emitFromIR` + `verifyLaunchReady` encadenado.
- `scripts/generate-satellite.mjs` (MODIFICADO): LAYOUT acepta `opts = {}` (cookiebot, favicons) + Twitter
  Cards site-level. Sin cambio de comportamiento cuando no se pasan opts (backward compatible).
- `package.json` skill: añade `sharp` como dep (requerido para favicon generation).
- Tests: `tests/emitter.test.mjs` (extendido con await + FB5 checks) + `tests/launch-ready.test.mjs` (NUEVO).
- **NO** toca los demás builders/modos ni la lógica de generación decorativa.

## Acceptance Criteria
1. **Formulario funcional SIEMPRE en la ruta de contacto REAL**: `src/components/ContactForm.tsx` (client
   component: TurnstileWidget + submit → Server Action) + `src/app/actions/send-lead.ts` (Resend + Turnstile
   verify) en TODO satélite. Si el cliente trae página de contacto (cualquier ruta), su contenido real se
   preserva (lossless) y se le añade `<ContactForm />`; si no, se crea `/contact` sintética. El gate verifica
   el form en la ruta REAL, no hardcodea `/contact`.
2. **Favicon**: logo real → `favicon.png` (32×32) + `apple-touch-icon.png` (180×180) +
   `android-chrome-{192,512}x{192,512}.png` via sharp; `favicon.svg` si logo es SVG; `site.webmanifest`.
3. **404 de marca**: `src/app/not-found.tsx` siempre presente, con siteName y enlace home.
4. **Cookiebot**: script Cookiebot en layout.tsx `<head>` (`NEXT_PUBLIC_COOKIEBOT_ID` controla runtime);
   analytics condicionado a consentimiento.
5. **Twitter Cards**: `twitter: { card: "summary_large_image" }` en layout + por página (PAGE_FROM_IR);
   FAQPage/Service JSON-LD si el contenido lo justifica (nunca inventado).
6. **a11y**: `tests/accessibility.spec.ts` emitido (axe-core WCAG AA; incomplete → humano; no finge total);
   `playwright.config.ts` + `@axe-core/playwright` en devDeps del satélite.
7. **Gate de launch-readiness**: `verifyLaunchReady(satDir)` pasa en satélite completo; falla si falta
   CUALQUIER indispensable; encadenado en `buildFromFile` tras `verifyEmit`.
8. **Tests verdes**: `launch-ready.test.mjs` (8 tests: pasa completo + falla por ítem) + `emitter.test.mjs`
   (extendido: await + FB5 checks + launch-ready integration). CI 18+ tests verdes.
9. **Backward compatible**: `LAYOUT` sin opts se comporta igual (sin cookiebot/favicons/twitter extra).

## Alignment
Implementa **FB5** de [`satellite-builders`](../strategy/satellite-builders.md) / [ADR-013](../adr/013-satellite-launch-readiness-standard.md).
**Núcleo común** → hereda TODO builder automáticamente. **Lista viva**: el mecanismo de extensión del estándar
(núcleo común + gate) es el que crece, no los builders. Honra §D4 (FAQPage/Service JSON-LD solo donde hay
contenido real; a11y honest; Cookiebot pluggable). Reutiliza i18n/SEO/em-ui del núcleo (ECO-56/58, ADR-011) y
el TurnstileWidget del registry em-ui (ownership). **No re-litiga** ECO-56/58 ni ADR-010/011/012.
