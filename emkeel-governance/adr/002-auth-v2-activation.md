# ADR-002 — Activación de AUTH v2 + norte del programa (Fases 3/4 sí · Fase 5 congelada)

- **Estado:** Aceptada
- **Fecha:** 2026-06-14
- **Ticket:** [ECO-14](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-14)
- **Strategy:** auth
- **Decisor:** Operador (human gate)
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`). Estrategia fuente: [`emkeel-governance/strategy/auth.md`](../strategy/auth.md) (`Status: APPROVED`).

## Contexto

AUTH v2 + Tenancy v1 fue un programa de 7 fases (0–6) hecho con el framework anterior. El **MVP (Fases 0–2)** —tenancy primitives + token engine v2 opaco + AuthIntent state machine + wiring del dashboard— **está construido y mergeado en `main`, OFF tras feature flag** (`nexacore-api/src/config/app.config.ts:21`; frontend `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED`), sin regresión respecto a v1. El login v2 es **password + TOTP + tenant-pick** (la rama passkey devuelve `passkey_not_implemented`, `auth-intent.service.ts:207-209`). Fases 3 (passkey-first), 4 (step-up/AuthChallenge), 5 (OIDC issuer) y 6 (sunset v1) **no están construidas**.

La premisa que difería 3–6 —la "ventana comercial de 3 semanas" (D-010, operador 2026-05-20)— **ya caducó**. La estrategia `auth.md` analizó adecuación (A1), estándares de industria 2026 con fuentes verificadas (A2: NIST SP 800-63B-4, FIDO Alliance, RFC 9700, OIDC Core), la premisa caducada (A3) y la seguridad de activar (A4).

**Hallazgo de fondo:** password+TOTP **no cumple** NIST SP 800-63B-4 §2.2 (*verifiers SHALL offer ≥1 phishing-resistant option en AAL2*; TOTP no lo es) → es un **gap de conformidad real**, no una "mejora ausente". Y ser tu propio OIDC issuer (Fase 5) es **infraestructura grande** (OIDC Core = OP multi-endpoint; 9 decisiones de protocolo abiertas) **sin demanda real** a la escala actual.

## Decisión

**Opción 2 AMPLIADA** (de `auth.md`):

1. **Activar el MVP (Fases 0–2)** en producción (el *cómo* —flip global vs canario— es Estrategia B).
2. **Comprometer Fase 3 (passkey-first)** → cierra el gap NIST §2.2 → **AAL2 completo** (código WebAuthn ya existe: `passkey.service.ts`, 469 LOC).
3. **Comprometer Fase 4 (step-up / AuthChallenge)** → generaliza los 6 métodos bespoke `*WithReauth` en una primitiva → **habilita capacidad AAL3**.
4. **Target de assurance: AAL2 baseline + AAL3-capable.** AAL2 para todos los tenants (passkeys/TOTP); **AAL3 ofrecido a tenants regulados** vía security keys hardware **no exportables** sobre el WebAuthn de Fase 3 + el step-up de Fase 4 (NIST §2.3 prohíbe passkeys sincronizables en AAL3 por clave exportable).
5. **Congelar Fase 5 (OIDC issuer):** **no es seguridad, es capability de producto on-demand.** Se abrirá un strategy **buy-vs-build SOLO si un cliente real pide SSO** (probable federación-IN —usar su IdP—, no que NexaCore sea issuer).
6. **Diferir Fase 6 (sunset v1)** hasta que v2 esté **probado en prod**.

## Consecuencias

- AUTH v2 se activa; el **aislamiento multi-tenant entra en producción** (rollout en Estrategia B). Los flags OFF revierten a v1 de forma transparente (v1 sigue como fallback).
- **Fase 3 y Fase 4 quedan comprometidas y trazadas** por esta ADR → tickets de **Estrategia B**; cada feature spec llevará la línea `Strategy: auth` (gate `check_strategy_link`) y cada cambio AUTH irá bajo **§15 AUTH change-control** (ticket + revisión separada).
- **Seguridad:** AAL2 completo desde Fase 3; AAL3 disponible para tenants regulados tras Fase 4. La seguridad NO depende de Fase 5.
- **Fase 5 congelada:** los consumidores siguen en la **vía transitoria D-009** (validación AUTH-direct, sin JWKS); ventana de revocación ≤ TTL del access token (≤15 min). Acotar la vida de esa vía es pregunta abierta de Estrategia B.
- Esta ADR es **solo gobernanza**: **NO toca código AUTH** (§15 no aplica). Habilita el trabajo; no lo ejecuta.

## Alternativas consideradas

- **Opción 1 — Activar y congelar 3–6:** rechazada salvo como *stopgap con fecha*; sin plazo aparca el gap NIST §2.2 indefinidamente (drift silencioso que AGENTS.md desaconseja).
- **Opción 2 acotada (solo Fase 3):** superada por la ampliada — añade Fase 4 para cubrir **AAL3** (tenants regulados).
- **Opción 3 — Completar las 7 fases antes de activar:** rechazada — retrasa meses valor ya construido e incluye el over-engineering de Fase 5.
- **Opción 4 — Pivote / rediseño total:** rechazada — Fases 0/1/2 son sólidas y AAL2-correctas; el único núcleo defendible (buy-vs-build de OIDC) queda capturado al **congelar** Fase 5 hasta que haya demanda.

## Notas

- Fuentes verificadas (re-abiertas por crítica adversarial) en `auth.md §Sources`: NIST SP 800-63B-4 (§2.2/§2.3/§3.1.1.2), FIDO Alliance (passkeys), RFC 9700 (§2.2.2/§4.9.3), OIDC Core 1.0.
- Esta ADR **cierra la Estrategia A** (norte, gobernada). La **Estrategia B** (decomposición y tickets de Fase 3/4 bajo §15) se planifica después.
- No supersede a D-001…D-009 (decisiones de diseño ya construidas y correctas: rewrite dirigido, opaque refresh, AuthIntent, tenancy, JWT v2). Reafirma el diferir/congelar de D-010 para 5/6 y **adelanta 3+4** a "en alcance".
