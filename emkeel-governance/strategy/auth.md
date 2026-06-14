# Strategy: auth

Status: APPROVED   <!-- operador, human gate, 2026-06-14 -->
Strategy: auth   <!-- feature specs reference this with a `Strategy: auth` line -->

## Goal
Decidir el NORTE de AUTH v2 + Tenancy v1 — si/cómo **activar** el MVP (Fases 0–2, construido tras flag, OFF en prod) y **qué fases continuar, congelar o repensar** — NO el cómo de implementarlo.

## Context
<!-- grounded facts ONLY — cite file:line (repo) or a URL (market) for every claim -->

**Qué está construido de verdad (A1 — código en main):**
- El MVP v2 está construido y mergeado: `nexacore-api/src/auth/auth-intent.service.ts`, `auth-v2.controller.ts`, `token.service.v2.ts`, `nexacore-api/src/sessions/sessions.service.v2.ts`, `interfaces/jwt-payload-v2.interface.ts`, `strategies/jwt-v2.strategy.ts`.
- Está **OFF en prod tras feature flag**: `nexacore-api/src/config/app.config.ts:21` (`authIntentV2Enabled: process.env.AUTH_INTENT_V2_ENABLED === 'true'`) + frontend `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED` (`nexacore-dashboard/.env.example`).
- **El login v2 es password + TOTP MFA + tenant-pick**, NO passkey-first: `nexacore-api/src/auth/auth-intent.service.ts:207-209` (`case 'passkey': return this.failAndThrow(intent, 'passkey_not_implemented')`). El estado `requires_passkey` existe en el enum pero no está conducido (`nexacore-api/prisma/schema.prisma:486`).
- El código WebAuthn ya existe: `nexacore-api/src/auth/passkey.service.ts` (469 LOC) → Fase 3 es *wiring/UX*, no greenfield.
- Refresh opaco ya construido conforme a estándar: `nexacore-api/src/sessions/sessions.service.v2.ts:12-13,25` (256-bit CSPRNG → SHA-256 at rest → rotación one-time-use en `prisma.$transaction`).
- **Fase 4 (step-up) NO generalizada**: 6 métodos bespoke `*WithReauth` (`grep` en `nexacore-api/src/auth`), sin primitiva `AuthChallenge`.
- **Fase 5 (OIDC issuer) NO existe**: en `nexacore-api/src/auth/strategies/` solo hay clientes OAuth (`google.strategy.ts`, `github.strategy.ts`); sin JWKS ni `/.well-known/openid-configuration`.

**El plan original (recuperado del historial git de em-development-framework — repo congelado, NO en este árbol):** programa de 7 fases (0–6); decisiones D-001…D-010. MVP = Fases 0+1+2 atado por **D-010** a una **"ventana comercial de 3 semanas" (operador 2026-05-20)**; Fases 3 (passkey-first, D-002), 4 (step-up, D-006), 5 (OIDC issuer, D-005) y 6 (sunset) **diferidas post-MVP**. *(Fuente: `AUTH-v2.md` §5 D-002/D-005/D-006/D-010 — recuperado del historial del framework.)*

**Premisa vs contexto actual (A3):** hoy es **2026-06-14** → la ventana de 3 semanas de D-010 (arranque 2026-05-20) **YA CADUCÓ**. El driver de urgencia (deadline comercial) está muerto; ahora gobierna **Emkeel** y Tenancy v1 ya está dentro del MVP construido. ⇒ Activar deja de ser una carrera contra deadline y pasa a ser una **decisión deliberada de gobierno**.

**Estándares de industria 2026 (A2 — fuentes verificadas, ver §Sources):**
- **Passkeys / phishing-resistance** es la dirección dominante: FIDO Alliance describe passkeys como *"phishing resistant and secure by design"* y *"more secure than the combination of either 'password + OTP' or 'password + phone approval'"* (fidoalliance.org). NIST SP 800-63B-4 (jul-2025): los verifiers **SHALL offer** al menos una opción phishing-resistant en **AAL2** (§2.2) y **AAL3 SHALL** proveer phishing-resistance con clave no exportable (§2.3). **TOTP no es phishing-resistant** → ofrecer solo password+TOTP no cubre la obligación §2.2.
- **El MVP password+MFA es aceptable AAL2 (no inseguro):** NIST 800-63B-4 §3.1.1.2 permite passwords de **mínimo 8 caracteres** cuando se usan con MFA, exige **screening contra listas de brechas** y **no** exige rotación periódica. El producto ya hace breach-check (`nexacore-api/src/auth/password-breach.service.ts`).
- **Refresh tokens (D-003) alineado con el estándar actual:** RFC 9700 (ene-2025) §2.2.2 — *"Refresh tokens for public clients MUST be sender-constrained or use refresh token rotation"*; §4.9.3 — no almacenar tokens en claro. El impl. opaco+SHA-256+rotación lo cumple.
- **Ser tu propio OIDC issuer (D-005, Fase 5) es una infraestructura grande:** OIDC Core 1.0 obliga a un OP a Authorization + Token endpoints + emisión de **ID tokens firmados (JWS)** + claves/**JWKS** (UserInfo es *recomendado*; Discovery/Registration son specs companion adicionales) — en conjunto *"a comprehensive identity infrastructure responsibility"* (openid.net). El probe recuperado de Fase 5 enumera **9 valores de protocolo sin decidir** (algoritmo de firma, rotación de claves, claims del ID token, audiencia, PKCE…) — decision-debt alta, sin diseño concreto.

**Seguridad de activar el MVP tal cual (A4):** el login v2 usa los **mismos factores que v1** (password + TOTP MFA) más aislamiento multi-tenant *enforced* (middleware Fase 0 + sesiones v2 tenant-aware). Respecto a la prod actual **no introduce un hueco nuevo** (v1 también es password+MFA y pasó 16 auditorías) y cumple los controles de password de NIST §3.1.1.2 (≥8 char con MFA, breach-screening vía `password-breach.service.ts`, sin rotación periódica). **PERO hay un matiz de conformidad que NO debe ocultarse:** NIST §2.2 obliga a *ofrecer al menos una opción phishing-resistant en AAL2*, y **TOTP no lo es** → un MVP password+TOTP que no ofrece ninguna opción phishing-resistant deja un **gap de conformidad §2.2 real** (no es solo "mejora ausente"). Conclusión A4: activar es **seguro frente a regresión** (≥ que v1) y entrega el aislamiento multi-tenant, pero **arrastra un gap de phishing-resistance que hay que cerrar con plazo** — y cerrarlo es exactamente Fase 3 (passkey-first), lo que **refuerza priorizarla**, no diferirla sin fecha. Caveat adicional: sin JWKS (D-009), los consumidores usan una vía transitoria AUTH-direct; ventana de revocación ≤ TTL del access token (≤15 min). *(Supuesto: el resto del bundle AAL2 de v1 —reauth, replay-resistance— se mantiene; conviene confirmarlo en la activación.)*

## Options
<!-- at least 2 real options; EVERY row MUST cite a Source (file:line or URL). -->
| # | Option | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Activar MVP (0–2), congelar 3–6** | `nexacore-api/src/config/app.config.ts:21` + NIST 800-63B-4 §2.2 + §3.1.1.2 (https://pages.nist.gov/800-63-4/sp800-63b.html) | Entrega ya el valor real (multi-tenancy); sin regresión (= v1 + aislamiento); coste ~0 (flip de flag, rollout gradual); sin deadline que apremie | **Aparca un gap de conformidad NIST §2.2** (no ofrece opción phishing-resistant) de forma indefinida; v2 password-first cuando 2026 empuja passkeys | **Medio si es indefinido / Bajo si es stopgap con fecha.** Sin plazo, el "MVP ya" se vuelve permanente con el gap §2.2 abierto |
| 2 | **Activar MVP + continuar selectivo: Fase 3 (passkey-first); congelar 4/5/6** | https://fidoalliance.org/passkeys/ + `nexacore-api/src/auth/passkey.service.ts` (469 LOC ya existe) | Cierra el gap 2026 (phishing-resistance) con código que ya existe (wiring, no greenfield); valor multi-tenant ya; congela el over-engineering (OIDC) | Más trabajo que (1); requiere ticket(s) y §15 AUTH change-control para Fase 3 | Bajo-medio. Passkeys sincronizables = AAL2, NO AAL3 (NIST §2.3) — basta para el caso pyme |
| 3 | **Completar las 7 fases antes de activar nada** | OIDC Core 1.0 (https://openid.net/specs/openid-connect-core-1_0.html) + `AUTH-v2.md` §0 (~13–14 sem. estimadas, recuperado) | "Norte completo" de una vez; OIDC issuer + step-up + sunset todos hechos | Meses de retraso sobre valor YA construido; incluye Fase 5 (OIDC) que es infra grande con 9 decisiones abiertas; bloquea multi-tenancy tras un deadline ya caducado | **Alto.** Over-engineering: construir tu propio IdP a escala pyme sin demanda real de SSO/federación |
| 4 | **Pivotar / repensar (esp. comprar IdP en vez de construir Fase 5)** | OIDC Core 1.0 (https://openid.net/specs/openid-connect-core-1_0.html) — "comprehensive identity infrastructure responsibility" | Evita reimplementar un OP completo; si llega demanda SSO/federación, un IdP gestionado (build-vs-buy) puede ganar a D-005 | Pivote total es desproporcionado: 0/1/2 son sólidos y AAL2-correctos (no hay que tirarlos); solo Fase 5 merece el debate buy-vs-build | Medio. Riesgo = descartar trabajo válido; el pivote real aplica SOLO a Fase 5, no al MVP |

## Recommendation
<!-- which option + why — this is judgment; the human approves it at the gate -->
**Opción 2 AMPLIADA — APROBADA por el operador (human gate, 2026-06-14):** activar el MVP ahora + **comprometer Fase 3 (passkey-first) Y Fase 4 (step-up / AuthChallenge)**; **target de assurance: AAL2 baseline + AAL3-capable** para tenants regulados; **CONGELAR Fase 5 (OIDC issuer)**; **diferir Fase 6 (sunset v1)**.

Racional:
- **(a) Activar el MVP ya** — seguro y de gobierno tranquilo: el valor multi-tenant está construido, usa los factores de v1 + aislamiento *enforced* y cumple NIST §3.1.1.2; el deadline de D-010 caducó (A3), así que no hay carrera.
- **(b) Fase 3 (passkey-first) → NIST AAL2 completo.** Cierra el gap de conformidad §2.2 (*ofrecer ≥1 opción phishing-resistant*); el código WebAuthn ya existe (`passkey.service.ts`, 469 LOC) → es wiring de alto valor y coste contenido (FIDO; NIST §2.2).
- **(c) Fase 4 (step-up / AuthChallenge) → habilita AAL3.** Generaliza los 6 `*WithReauth` bespoke en una primitiva `AuthChallenge`; combinada con security keys hardware **no exportables** sobre el WebAuthn de Fase 3, da la **capacidad AAL3** que NIST §2.3 exige (clave no exportable + phishing-resistance) para los tenants regulados. Por eso Fase 4 entra **en alcance ahora**, no en backlog.
- **Target AAL2 + AAL3-capable:** AAL2 es el baseline para todos los tenants (passkeys/TOTP); AAL3 se *ofrece* a tenants regulados que aporten security keys hardware no exportables (NIST §2.3 prohíbe passkeys sincronizables en AAL3 por clave exportable — de ahí "AAL3-capable" vía hardware keys, no por defecto).
- **(d) CONGELAR Fase 5 (OIDC issuer):** **no es seguridad, es capability de producto on-demand.** Ser tu propio OP es infraestructura grande (OIDC Core, 9 decisiones de protocolo abiertas en el probe) sin demanda real a la escala actual. Se abre un **strategy buy-vs-build SOLO si un cliente real pide SSO** (probablemente federación-IN — usar su IdP — no que NexaCore sea issuer). No bloquea seguridad: AAL2/AAL3 los dan Fases 3+4, no Fase 5.
- **(e) Diferir Fase 6 (sunset v1):** la retirada de v1 va cuando v2 esté **probado en prod**.

> **Nota de la crítica adversarial (incorporada):** Fase 3/4 (seguridad: phishing-resistance + AAL3) y Fase 5 (capability de producto) **no son simétricas** — por eso se comprometen 3+4 y se congela 5. Fuentes re-abiertas y verificadas (citas exactas); correcciones aplicadas (AAL3 §2.3; Discovery/UserInfo de OIDC matizados).

**Gobernanza:** decisión registrada en `emkeel-governance/adr/002-auth-v2-activation.md`; gobernada vía ticket ECO-14 (rama `docs/ECO-14-auth-strategy`, PR sin merge). El **cómo** (tickets de Fase 3/4 bajo §15 AUTH change-control) es la **Estrategia B**, posterior.

## Non-goals
- NO es el "cómo" (decomposición/tickets de Fase 3) — eso es Estrategia B, posterior.
- NO toca código AUTH en este paso (§15 change-control); esto es investigación + documento.
- NO reabre las decisiones D-001…D-009 ya construidas y correctas (rewrite dirigido, opaque refresh, AuthIntent, tenancy, JWT v2): el aislamiento multi-tenant y el token engine están alineados con estándar (RFC 9700) y se conservan.
- NO promueve OIDC federación-IN (Stage 2) ni decide buy-vs-build de IdP aquí (sería su propio strategy si llega demanda).

## Decisions
<!-- optional: link the chosen decision as an ADR -->
**APROBADA (human gate, 2026-06-14)** — Opción 2 AMPLIADA. Registrada en [`emkeel-governance/adr/002-auth-v2-activation.md`](../adr/002-auth-v2-activation.md). Gobernada vía ticket **ECO-14** (rama `docs/ECO-14-auth-strategy`, PR sin merge). Los specs de los features de Fase 3 y Fase 4 (Estrategia B) deben llevar la línea `Strategy: auth` (lo exige el gate `check_strategy_link`). **Anti-drift:** el cierre del **gap §2.2** (Fase 3) y la **capacidad AAL3** (Fase 4) son obligaciones **trazadas** vía ADR-002 → tickets de Estrategia B, nunca "más adelante" abierto.

### Preguntas — resueltas en el human gate (2026-06-14)
- **#3 Fase 4 (step-up):** RESUELTA → **EN alcance ahora** (no backlog). Generalizar los 6 `*WithReauth` en `AuthChallenge`; habilita la capacidad AAL3.
- **#4 Fase 5 (OIDC issuer):** RESUELTA → **CONGELADA** hasta demanda real de SSO; entonces se abrirá un strategy **buy-vs-build** (probable federación-IN, no ser issuer). No hay satélite que la necesite hoy.
- **#5 Target de assurance:** RESUELTA → **AAL2 baseline + AAL3-capable** para tenants regulados (security keys hardware no exportables sobre WebAuthn de Fase 3 + step-up de Fase 4).

### Preguntas que quedan abiertas → **se resuelven en Estrategia B (el cómo)**
1. **Activación**: ¿flip global del flag de una vez, o rollout gradual (canario/subset)? (D-010 dejó "rollout TBD".)
2. **Vida de la vía transitoria D-009 (sin JWKS):** ¿mantenerla indefinida o acotar su vida? (Independiente de Fase 5 congelada: los consumidores siguen validando vía AUTH-direct.)

## Sources (verificadas con tool — cada una abierta)
- FIDO Alliance — Passkeys: https://fidoalliance.org/passkeys/ — *"Passkeys are phishing resistant and secure by design"*; *"more secure than … 'password + OTP' or 'password + phone approval'"*; *"a password replacement technology"*.
- NIST SP 800-63B-4 (jul-2025): https://pages.nist.gov/800-63-4/sp800-63b.html — §2.2 AAL2 *SHALL offer ≥1 phishing-resistant option*; §2.3 AAL3 *SHALL provide phishing resistance* + clave no exportable (syncable passkeys *SHALL NOT* en AAL3); §3.1.1.2 password ≥8 con MFA / ≥15 single-factor, breach-screening *SHALL*, sin rotación periódica.
- RFC 9700 — OAuth 2.0 Security BCP (ene-2025): https://www.rfc-editor.org/rfc/rfc9700.html — §2.2.2 *"Refresh tokens for public clients MUST be sender-constrained or use refresh token rotation"*; §4.9.3 no almacenar access tokens en claro.
- OpenID Connect Core 1.0: https://openid.net/specs/openid-connect-core-1_0.html — OP debe implementar Authorization + Token + UserInfo + ID token + JWKS + discovery → *"a comprehensive identity infrastructure responsibility"*.
- Código in-repo (A1): `nexacore-api/src/config/app.config.ts:21`; `nexacore-api/src/auth/auth-intent.service.ts:207-209`; `nexacore-api/prisma/schema.prisma:486`; `nexacore-api/src/auth/passkey.service.ts` (469 LOC); `nexacore-api/src/sessions/sessions.service.v2.ts:12-13,25`.
- Plan original (recuperado del historial git de `em-development-framework`, NO en este árbol): `AUTH-v2.md` §5 D-002/D-005/D-006/D-009/D-010; `2026-05-23-auth-v2-phase5-oidc-shape-probe.md` (9 decisiones OIDC abiertas).
