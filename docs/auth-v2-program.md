# AUTH v2 + Tenancy v1 — Programa original (referencia histórica)

> **Referencia histórica.** Recuperado del historial git de `em-development-framework`
> (repo congelado) el **2026-06-14**. Documenta el **programa original de 7 fases** y el
> **rationale de las decisiones D-001…D-010** que dieron forma a la reescritura de AUTH y a la
> introducción de multi-tenancy.
>
> ⚠️ **El NORTE VIVO y vigente es** [`emkeel-governance/strategy/auth.md`](../emkeel-governance/strategy/auth.md) **(APPROVED)
> + [`emkeel-governance/adr/002-auth-v2-activation.md`](../emkeel-governance/adr/002-auth-v2-activation.md).**
> Ante cualquier conflicto, **mandan esos dos**; este documento es el *"por qué"* histórico, no la
> decisión vigente. En particular, **ADR-002 revisó D-010**: la Fase 3 (passkey-first) y la Fase 4
> (step-up) están ahora **EN alcance**; la Fase 5 (OIDC issuer) está **congelada**; la Fase 6 diferida.
>
> *Origen:* `ai-specs/changes/auth/programs/AUTH-v2.md` (framework congelado). Las fases 0–2 (el MVP)
> se ejecutaron bajo el proyecto Jira legacy **SCRUM**; el go-forward se gobierna bajo **ECO / Emkeel**.
> El detalle de ejecución por ticket vive en el historial git de `nexacore-api`.

---

## 0. Resumen ejecutivo

NexaCore necesita evolucionar de un CRM single-tenant con AUTH de alta calidad a una plataforma
**SaaS multi-tenant white-label**. El módulo AUTH actual (~4.335 LOC, 19 ficheros, veredicto PASS de
16 auditorías) es **técnicamente riguroso pero conceptualmente single-tenant**. El arreglo no es
parchear — cada ruta de AUTH asume identidad single-tenant. El arreglo es una **reescritura dirigida**
del módulo AUTH preservando ~48% del código (passkey, mecánica MFA, anti-abuse, login-security) y
reescribiendo el ~52% que define el backbone arquitectónico (token engine, login flow, modelo de
sesión, integración OAuth).

El programa también introduce NexaCore como **OIDC issuer** (Stage 1, satélites first-party), pivota
AUTH a **passkey-first** con password como fallback, reemplaza el `executeLogin` procedural por una
**máquina de estados AuthIntent**, generaliza el step-up auth vía una **primitiva AuthChallenge**, y
migra de refresh tokens en formato JWT a **refresh tokens opacos** con estado server-side.

Horizonte estimado: ~17 semanas secuencial (~4 meses) si cada fase corre estrictamente en serie.
Algunas fases paralelizan (Fase 3 + Fase 4 no dependen estructuralmente entre sí), bajando el total a
~13-14 semanas. **Cada cambio AUTH respeta §15 AUTH change-control** (ticket Jira + ruta de revisión
separada) — el programa no lo elude.

---

## 1. Análisis estratégico (snapshot 2026-05-18)

### 1.1 Qué es el código hoy (verificado, no teórico)

- **10 modelos Prisma**: `User`, `Session`, `AuditLog`, `EmailVerificationToken`, `PasswordResetToken`,
  `TrustedDevice`, `WebAuthnCredential`, `OAuthAccount`, `Permission`, `RolePermission`.
  **Cero primitivas de tenancy.**
- **JWT payload**: `{ sub, email, role, jti, sessionId, iat }`. **Sin `tenantId`. Sin `tenantRole`.**
- **Modelo de sesiones**: solo user-scoped. `revokeAllUserSessions(userId)` opera cross-tenant por
  defecto (porque los tenants no existen).
- **Permisos**: mapeo global `Role × Permission`. Enum `Role` = `SUPERADMIN | ADMIN | USER`. Un solo
  tier; sin override de rol per-tenant.
- **Unicidad de email**: `User.email @unique` global. El mismo email no puede existir en dos tenants.
- **Ficheros del módulo AUTH**: `auth.controller.ts` (265 LOC) · `auth.service.ts` (186) ·
  `login.service.ts` (399) · `token.service.ts` (424) · `mfa.controller.ts` (162) · `mfa.service.ts`
  (306) · `oauth.controller.ts` (257) · `oauth-auth.service.ts` (132) · `passkey.controller.ts` (187) ·
  `passkey.service.ts` (469) · `session.controller.ts` (188) · `trusted-device.service.ts` (318) ·
  `login-security.service.ts` (142) · `password-breach.service.ts` (70) · `password-reset.service.ts`
  (175) · `email-verification.service.ts` (293) · `account.controller.ts` (164) · `auth.module.ts` (115)
  · `token-deny-list.service.ts` (83).

### 1.2 Los 12 problemas lógicos (la lente "empresa ganadora")

| # | Problema | Severidad | Fase que lo aborda |
|---|----------|-----------|--------------------|
| L1 | AUTH es password-first cuando debería ser passkey-first | Estratégico | Fase 3 |
| L2 | El login flow es procedural, no máquina de estados | Estratégico | Fase 2 |
| L3 | Refresh token = JWT es arquitectónicamente confuso (3 mecanismos para 1 decisión) | Estratégico | Fase 1 |
| L4 | Trusted device a medias (fingerprint no crypto-bound) | Estratégico | Fase 3 (passkey lo supera) |
| L5 | Email verification se enmascara como INVALID_CREDENTIALS (mala UX) | UX | Fase 2 |
| L6 | MFA-setup forzado para admin crea fricción; TOTP es legacy en 2026 | Estratégico | Fase 3 |
| L7 | Lockout poco amigable + email-spammy | UX | Fase 2 |
| L8 | Sin step-up auth generalizado (`WithReauth` bespoke por operación) | Estratégico | Fase 4 |
| L9 | Sin abstracción `IdentityProvider` unificada | Estratégico | Fases 1+2+5 |
| L10 | Modelo de sesión cross-app poco claro (los satélites re-implementan auth) | Estratégico | Fase 5 (OIDC issuer) |
| L11 | bcrypt en refresh = techo de escala a ~1K usuarios concurrentes | Performance | Fase 1 |
| L12 | Historia de recovery ambigua (sin flujo para "perdí todo") | Riesgo | Fase 3 (passkey cross-device sync) |

### 1.3 Lo que dicen las 16 auditorías previas (y por qué no bastan)

La auditoría más reciente (2026-05-14, PASS 83.7%) encontró **0 FAIL · 8 WARN · 3 CRITICAL latentes**.
Los CRITICAL eran: secretos hardcodeados en fallback de dev, riesgo SSRF en avatar URL de OAuth, gap de
docs GDPR Cascade. **Todos hallazgos de correctitud de implementación, ninguno estratégico.**

Esto valida el framing del operador: *"el código es correcto, la lógica no funciona del todo"*. La
máquina de auditoría no puede detectar desalineación estratégica — valida contra estándares
OWASP/NIST/RFC, no contra criterios de "empresa ganadora en 2026".

---

## 2. Modelo multi-tenant (la base que aún no existe)

### 2.1 Modelos nuevos (greenfield)

```
Tenant
  id, slug @unique, name, status (active | trial | suspended | deleted)
  createdAt, updatedAt

TenantSettings  (1:1 con Tenant)
  tenantId @unique → Tenant
  branding (JSON)             # white-label: logo, colores, nombre
  modules (JSON)              # feature set toggleable
  authPolicy (JSON)           # per-tenant: passkeyRequired, mfaRequired, allowOAuth, sessionTimeout

TenantMembership  (User × Tenant)
  id, tenantId → Tenant, userId → User
  role (TenantRole: OWNER | ADMIN | MEMBER | VIEWER | CUSTOM)
  status (active | invited | suspended)
  invitedBy, joinedAt, lastActiveAt
  @@unique([tenantId, userId])

TenantInvitation
  id, tenantId, email, role, token, expiresAt, acceptedAt

AuthIntent  (máquina de estados para login)
  id, status (requires_credentials | requires_tenant_pick | requires_mfa
              | requires_passkey | requires_setup | succeeded | failed)
  userId?, tenantId?, expiresAt, createdAt
  context (JSON: factores elegidos, señales de anomalía, etc.)

AuthChallenge  (primitiva de step-up)
  id, userId, purpose (free-form scope token)
  expiresAt, fulfilledAt?, fulfillment_factor
```

### 2.2 Mutaciones de modelos existentes

| Modelo | Cambio | Rationale |
|--------|--------|-----------|
| `User.role` | QUITAR (mover a `TenantMembership.role`) | El rol pasa a ser per-tenant; admin cross-tenant = flag `isPlatformAdmin` |
| `User.isPlatformAdmin` | NUEVO Boolean | Reemplaza `Role.SUPERADMIN`; capacidad cross-tenant explícita |
| `User.email` | Mantener `@unique` por ahora | La identidad operacional pasa a (email, tenant) pero se preserva unicidad global en Fase 0 para evitar crash de migración |
| `Session.tenantId` | NUEVO requerido | La sesión siempre se liga a un tenant activo |
| `AuditLog.tenantId` | NUEVO nullable | Null = evento a nivel plataforma (usuario creado cross-tenant) |
| `TrustedDevice.tenantId` | NUEVO requerido | La confianza no cruza tenants |
| `OAuthAccount` | MANTENER user-scoped | Pero la config de provider se mueve a `TenantSettings.authPolicy` |

### 2.3 JWT v2 payload

```typescript
interface JwtPayload {
  sub: string;              // userId — identidad global
  jti: string;
  sessionId: string;
  iat: number;
  tenantId: string;         // NUEVO — tenant activo de esta sesión
  tenantRole: TenantRole;   // NUEVO — rol dentro del tenant activo
  isPlatformAdmin: boolean; // NUEVO — flag de capacidad cross-tenant
  // QUITADOS: email, role
}
```

### 2.4 Invariantes de tenancy reforzadas vía Prisma middleware

Cada query contra modelos tenant-scoped (`Session`, `AuditLog`, `TrustedDevice`, y todas las
entidades de negocio futuras) se filtra automáticamente por `tenantId = currentTenantId`. El middleware
lee `currentTenantId` de un contexto request-scoped. Una ruta de platform-admin puede opt-out con un
flag explícito `bypassTenantFilter: true`, auditado.

**Esto es no-negociable.** Sin el middleware, un solo `where: tenantId` olvidado produce una fuga de
datos cross-tenant — la clase más catastrófica de bug multi-tenant.

---

## 3. Inventario de reutilización (fichero por fichero)

| Categoría | Ficheros | LOC | % del módulo |
|-----------|----------|-----|--------------|
| **REUSE intacto** | `passkey.service.ts` (469) · `login-security.service.ts` (142) · `password-breach.service.ts` (70) · mecánica `mfa.service.ts` (306) · `email-verification.service.ts` (293) · `password-reset.service.ts` (175) · `token-deny-list.service.ts` (83) | ~1.538 | ~36% |
| **REUSE con ajuste menor** | `account.controller.ts` (164) · `mfa.controller.ts` (162) · `passkey.controller.ts` (187) | ~513 | ~12% |
| **REWRITE conceptual** | `token.service.ts` (424) · `auth.controller.ts` (265) · `login.service.ts` (399) · `session.controller.ts` (188) · `auth.service.ts` (186) · `oauth.controller.ts` (257) · `oauth-auth.service.ts` (132) · `trusted-device.service.ts` (318) · `auth.module.ts` (115) | ~2.284 | ~52% |
| **TOTAL** | 19 ficheros | ~4.335 | 100% |

**Rationale de reúso**:
- Passkey = identidad del **humano**, cross-tenant. Cero cambios.
- Login-security (impossible-travel, señales de login sospechoso) opera a nivel usuario.
- Password-breach = chequeo stateless contra HaveIBeenPwned.
- Mecánica MFA (TOTP encrypt/decrypt/verify) = cripto pura, stateless.
- Email-verification + password-reset = tokens user-scoped; contexto de tenant menor en el contenido del email.
- Token-deny-list = abstracción Redis; reutilizable para la primitiva de revocación de token opaco.

**Rationale de reescritura**:
- Token engine: refresh JWT-format + bcrypt + Redis deny-list = 3 mecanismos. Opaco + sha256 = 1 mecanismo.
- Login flow: el `executeLogin` procedural no compone con estados multi-tenant.
- Sesiones: cada query necesita scope de tenantId.
- OAuth: la config de provider debe ir per-tenant para white-label.
- Trusted device: requiere scoping de tenant.

---

## 4. Estructura de 7 fases

### Fase 0 — Tenancy Primitives (~3 semanas)

**Construye**: modelos `Tenant`, `TenantMembership`, `TenantSettings`, `TenantInvitation` · Prisma
tenant-filter middleware · bootstrap (usuarios existentes → tenant por defecto como OWNER) · flag
`User.isPlatformAdmin`.

**NO construye**: ningún cambio de flujo AUTH. El JWT sigue v1. Endpoints AUTH sin cambios.

**Gate de salida**: pytest verde · tabla `tenants` en producción · 100% usuarios existentes asignados al
tenant por defecto · Prisma middleware activado y bloqueando queries sin scope en modelos tenant-scoped ·
cero incidentes de producción durante el cutover.

**Por qué primero**: cada cambio AUTH referencia `Session`/`AuditLog`/`TrustedDevice`. Añadir `tenantId`
después significa retocar 30+ callsites. Añadirlo primero significa que el trabajo AUTH subsiguiente lo
asume.

### Fase 1 — Token Engine v2 (~2 semanas)

**Construye**: refresh tokens opacos (256-bit random + sha256, reemplazando JWT-format) · `JwtPayload`
v2 (con `tenantId`/`tenantRole`/`isPlatformAdmin`) · `TokenServiceV2` y `SessionsServiceV2` tenant-aware
nuevos, en paralelo a los actuales (strangler).

**NO construye**: que el cliente use v2 aún. v2 existe internamente; los tests lo prueban; los endpoints
v1 continúan.

**Gate de salida**: TokenServiceV2 produce + valida correctamente · tests unit + integración pasan · v1
sin afectar en producción.

**Por qué segundo**: la Fase 0 hizo real el modelo de tenant. El token engine es la siguiente
dependencia: AuthIntent (Fase 2), passkey-first (Fase 3), OIDC issuer (Fase 5) montan encima. Construirlos
sobre refresh JWT-format = retrabajo al cambiar.

### Fase 2 — AuthIntent State Machine (~3 semanas)

**Construye**: modelo + servicio `AuthIntent` · nuevo login flow como máquina de estados ·
`POST /v2/auth/intents`, `POST /v2/auth/intents/:id/advance` · impl. de referencia frontend contra v2.

**NO construye**: passkey aún no primario; OIDC aún no; step-up aún bespoke.

**Gate de salida**: el usuario completa un login v2 completo (email+password+MFA+tenant pick)
end-to-end · v1 aún en producción · endpoint v2 tras feature flag para rollout gradual.

**Por qué tercero**: la máquina de estados reforma el control de flujo. Las Fases 3 (passkey-first) +
4 (step-up) pasan a ser aditivas — nuevos estados en la máquina — en vez de reescrituras invasivas.

### Fase 3 — Passkey-first Reframing (~2 semanas)

**Construye**: enrollment de passkey automático en signup · `requires_passkey` como ruta primaria en
AuthIntent · UI quita énfasis al password · magic links como opción passwordless secundaria.

**NO construye**: los endpoints de password no se eliminan (legacy + accesibilidad); TOTP MFA retenido
como fallback en políticas de tenant.

**Gate de salida**: un usuario nuevo puede registrarse → login → logout sin teclear password · usuarios
existentes pueden enrolar passkey y migrar su default.

**Por qué cuarto**: `passkey.service.ts` (469 LOC) ya existe. Esta fase es **cambio de flujo + UX**, no
implementación. Requiere AuthIntent de la Fase 2 para integrar limpio.

### Fase 4 — Step-up Auth (AuthChallenge) (~2 semanas)

**Construye**: modelo + servicio `AuthChallenge` · retrofit de operaciones `WithReauth` existentes
(`logoutAllWithReauth`, `trustDeviceWithReauth`, `revokeAllDevicesWithReauth`) · endpoints sensibles
nuevos heredan la primitiva.

**NO construye**: no se inventan operaciones sensibles nuevas en esta fase.

**Gate de salida**: los 3 métodos `WithReauth` se borran y reemplazan por rutas que resuelven
`AuthChallenge` · tests verifican comportamiento idéntico.

**Por qué quinto**: independiente de la Fase 3 estructuralmente. Se hace después para evitar cambios AUTH
concurrentes. **Puede paralelizar con la Fase 3** si la agenda lo demanda — no comparten ficheros.

### Fase 5 — OIDC Issuer (Stage 1) (~3 semanas)

**Construye**: `/.well-known/openid-configuration` · endpoint JWKS · emisión de ID token (sobre el token
engine de la Fase 1) · authorization code flow para satélites first-party.

**NO construye**: federación IN (clientes white-label con su propio IdP). Eso es Stage 2, diferido hasta
demanda de cliente.

**Gate de salida**: un satélite de prueba (endpoint interno o servicio) se autentica contra NexaCore vía
flujo OIDC estándar · el cliente usa `oidc-client-ts` genérico, no código custom.

**Por qué sexto**: necesita Fase 0 (contexto de tenant para los claims) + Fase 1 (token engine para
emisión) + Fase 2 (AuthIntent para el code flow). Todas las dependencias deben estar estables.

### Fase 6 — Migration + v1 Sunset (~2 semanas)

**Construye**: telemetría de uso v1 vs v2 por endpoint · deprecation headers · ejecución del plan de
sunset (borrar v1 cuando v2 > 95% del tráfico durante 2 semanas consecutivas).

**NO construye**: migración forzada del cliente — gestionada vía período de deprecación (4-6 semanas típico).

**Gate de salida**: tráfico v2 > 95% sostenido 2 semanas · PR de borrado de v1 aprobado · código v1
eliminado · estado final del módulo AUTH.

**Por qué último**: la limpieza ocurre cuando la nueva infraestructura está probada en producción.

---

## 5. Decision Log (append-only)

> **Invariante**: esta sección es APPEND-ONLY. No reescribir ni borrar entradas pasadas. Si una decisión
> se revierte, se añade una entrada nueva citando la reversión; la original se queda.

### Decision D-001 — Reescritura dirigida, no parche (2026-05-18)

**Contexto**: el módulo AUTH es técnicamente riguroso (16 auditorías PASS) pero single-tenant-by-design.

**Alternativas consideradas**:
- A: Parche — añadir `tenantId?` nullable a los modelos existentes con migración gradual.
- B: Refactor — preservar estructura, mover métodos.
- C: Reescritura dirigida — mantener ~48% de código reutilizable, reescribir ~52% del backbone conceptual.

**Decisión**: C.

**Rationale**: el parche produce código permanente en modo-dual (`if (tenantId) {...} else { /* legacy */ }`);
las ramas explotan inmanejablemente. El refactor preserva la estructura conceptual equivocada
(single-tenant procedural). La reescritura es la única ruta que produce arquitectura limpia para el
horizonte de 5-10 años. ~48% de reúso mantiene el coste contenido.

### Decision D-002 — Passkey-first (2026-05-18)

**Contexto**: `passkey.service.ts` existe (469 LOC, WebAuthn completo) pero se trata como endpoint
separado, no como ruta primaria.

**Decisión**: pivotar a passkey-first; el password pasa a fallback legacy.

**Rationale**: los end-users white-label abarcan todos los niveles de alfabetización técnica; la fricción
de TOTP es alta; las brechas de password se propagan en cascada entre tenants; passkey + cross-device sync
(Apple/Google/1Password) maneja el caso "laptop nueva" mejor que un reset de password. El código ya está
ahí — lo que falta es el posicionamiento de producto.

### Decision D-003 — Refresh tokens opacos (2026-05-18)

**Contexto**: el refresh token actual = JWT firmado con el mismo JWT_SECRET + hash bcrypt en DB + Redis
deny-list. Tres mecanismos para una decisión.

**Decisión**: reemplazar con tokens opacos de 256-bit random + hash sha256 en DB.

**Rationale**: colapsa 3 mecanismos en 1. Quita el overhead de bcrypt (~100ms por refresh → techo de escala
a ~1K usuarios concurrentes). El estado server-side habilita políticas per-tenant (un tenant HIPAA puede
exigir refresh de 1h; estándar 12h). Los ganadores modernos (Stripe, GitHub, Linear, Vercel) usan este patrón.

### Decision D-004 — Máquina de estados AuthIntent (2026-05-18)

**Contexto**: `executeLogin` devuelve uno de 3 tipos de resultado; el cliente inspecciona `.status`. Añadir
multi-tenant explota a 7+ estados.

**Decisión**: introducir `AuthIntent { id, status, next_step, context }` como modelo canónico de
orquestación de login. Un solo endpoint avanza el estado.

**Rationale**: multi-tenant añade `requires_tenant_pick`; passkey-first añade `requires_passkey`; las
políticas de tenant añaden `requires_setup`. Sin máquina de estados, el frontend reimplementa un
condicional de 7 vías. Con máquina de estados, el frontend interroga un objeto. Patrón-Stripe, probado.

### Decision D-005 — NexaCore como OIDC issuer (Stage 1) (2026-05-18)

**Contexto**: los satélites first-party VAN a multiplicarse; cada uno re-implementando auth = N× bugs. Los
clientes white-label eventualmente querrán SSO con su propio IdP.

**Decisión**: implementar OIDC issuer para satélites first-party en la Fase 5. Diferir federación IN
(Stage 2) hasta demanda de cliente.

**Rationale**: el lado cliente OAuth ya lo entiende `oauth-auth.service.ts` (patrón code exchange).
Invertirlo a issuer es el espejo conceptual. Basado en estándares — los clientes usan librerías genéricas.
La futura federación IN es una capa de config sobre la misma primitiva.

### Decision D-006 — Primitiva de step-up AuthChallenge (2026-05-18)

**Contexto**: `WithReauth` existe 3× bespoke (logoutAll, trustDevice, revokeAllDevices). Operaciones
sensibles futuras (cambiar email/password, borrar cuenta, billing, transferir ownership) necesitarían cada
una su propio `WithReauth`.

**Decisión**: generalizar a la primitiva `AuthChallenge { id, purpose, expires_at, fulfilled_at }`.
Cualquier endpoint sensible requiere un challenge resuelto.

**Rationale**: un mecanismo, infinitos casos de uso. Auditoría más fácil (un modelo de challenge que
inspeccionar, no N métodos bespoke). UX más fácil (el frontend aprende un patrón).

### Decision D-007 — Separar tablas `Tenant` y `Organization` (2026-05-20)

**Contexto**: §2.1 introdujo una sola primitiva `Tenant` que confunde la unidad de billing/contrato con la
estructura de equipo/sub-grupo. El chat del operador (consolidado, aprobado 2026-05-20) estableció que son
conceptos de dominio distintos y no deben compartir tabla.

**Decisión**: modelar `Tenant` y `Organization` como tablas distintas. `Tenant` = identidad de
billing/contrato (el cliente); `Organization` = sub-agrupación dentro de un tenant (departamentos, equipos,
unidades de negocio). La membresía user-a-organization es una relación separada de la user-a-tenant.

**Rationale**: acoplar la identidad de billing a la estructura org hace que los cambios de contrato
repercutan en datos de equipo y viceversa; reestructurar jerarquías org no debería tocar billing; escenarios
futuros (M&A absorbiendo orgs de un tenant externo; RBAC per-org distinto de per-tenant) exigen la división.
Patrón SaaS estándar (Stripe accounts vs. orgs; Atlassian sites vs. orgs; GitHub billing teams vs. orgs).

**Consecuencias**: nuevo modelo Prisma `Organization` con FK `tenantId` (la org pertenece a un tenant; nunca
cross-tenant). `TenantMembership` (Fase 0.1) se mantiene; se añade `OrganizationMembership` como relación
separada. `AuditLog` gana `organizationId?` nullable. Los permisos pueden scopearse a nivel organization
(refina MT-7). La migración de schema aterriza en la Fase 2.1.

### Decision D-008 — Middleware de aislamiento por subdominio (defense-in-depth) (2026-05-20)

**Contexto**: §2.4 estableció el tenant-filter Prisma `$extends` como primitiva de aislamiento row-level
(Fase 0.2). El chat del operador (consolidado, aprobado 2026-05-20) planteó que se desea un middleware
adicional en el pipeline de request que fije `TenantContext` desde el subdominio ANTES de que Prisma vea
una query.

**Decisión**: introducir `SubdomainTenantResolverMiddleware` en el pipeline de request de NestJS (ejecuta
antes de cualquier controller) derivando el tenant activo del subdominio entrante (`acme.platform.com` →
tenant `acme`) y ligando el `TenantContext` (vía `AsyncLocalStorage`) en el límite del request. Complementa
la extensión Prisma row-level — defense-in-depth, no reemplazo.

**Rationale**: aunque una ruta de código futura olvide `TenantContext.run(tenantId)`, el middleware de
subdominio ya habrá establecido el contexto en la entrada del request. Habilita dominios per-tenant
white-label (mitiga directamente MT-12 — CORS/CSRF tenant-aware). Fallo de resolución de subdominio →
fast-fail en el límite del request rechazando rutas de tenant no autenticadas antes de cualquier query DB.

**Consecuencias**: nuevo middleware bajo `tenants/middleware/`. Subdominio → tenant vía
`TenantsService.findBySlug` (cachear agresivamente — hot path per-request). La política CORS/CSRF pasa a ser
subdomain-aware. `localhost` + rutas platform-admin usan opt-out vía subdominio canónico (ej.
`admin.platform.com`) + `TenantContext.runWithBypass`. Aterriza batched con D-007 en la Fase 2.1.

### Decision D-009 — Validación local de firma JWT (verificación stateless por consumidores) (2026-05-20)

**Contexto**: §1.3 estableció refresh tokens opacos (Fase 1.2) pero la ruta de verificación de access-token
del lado consumidor (dashboard, API pública externa, satélites futuros) no estaba fijada. El chat del
operador (consolidado, aprobado 2026-05-20) estableció que la validación de sesión del lado consumidor debe
ser **local** vía JWKS, no un callback REST a AUTH en cada request.

**Decisión**: los consumidores validan los access tokens JWT v2 localmente vía fetch de clave pública JWKS
+ verificación de firma cacheada. AUTH expone un endpoint JWKS (aterriza en la Fase 5); los consumidores
cachean las claves; sin callback REST per-request a AUTH para validez de sesión.

**Rationale**: el callback REST per-request se vuelve un único punto de fallo y un piso de latencia; la
validación JWKS local es el patrón OIDC estándar y escala linealmente. Los refresh tokens (D-003 / Fase 1.2)
manejan la revocación; los access tokens son short-lived (≤15 min) así que la ventana de revocación está
acotada por la vida del token, no eliminada.

**Consecuencias**: la Fase 5 (OIDC Issuer) gana una dependencia DURA — el endpoint JWKS debe shippear antes
de que cualquier servicio no-AUTH valide JWT v2 en producción. **Bajo el scope MVP de D-010 (ventana de
3 semanas), la Fase 5 se difiere post-MVP**; el dashboard + la API pública externa usan una ruta transitoria
de validación AUTH-direct durante la ventana del deadline; D-009 sigue siendo la dirección a largo plazo.
Trade-off aceptado: una sesión revocada sigue produciendo access tokens válidos hasta expirar (≤15 min).
`token-deny-list.service.ts` cubre la revocación de emergencia platform-wide; los consumidores la chequean
solo en operaciones críticas, no en cada request.

### Decision D-010 — Scope MVP atado a Fase 0+1+2.1+2 para ventana comercial de 3 semanas (2026-05-20)

**Contexto**: el cliente principal requiere Multi-Tenant en producción en 3 semanas (operador 2026-05-20).
La estimación de §0 es ~13-14 semanas paralelizado para el programa completo de 7 fases; delta estructural
~10 semanas. Se planteó como CRITICAL y el operador dirigió (aprobación 2026-05-20, frase "OK proceed") que
el scope se atara estrictamente para caber en la ventana.

**Decisión**: atar el scope MVP a:
- ✅ **Fase 0** (Tenancy primitives) — hecho (SCRUM-487/488/489/491)
- ✅ **Fase 1** (Token Engine v2) — hecho (SCRUM-492/493/494)
- 🟢 **Fase 2.1** (D-007 modelo `Organization` + D-008 middleware de subdominio) — net-new, un ticket batched
- 🟢 **Fase 2** (máquina de estados AuthIntent + dashboard wiring como primer consumidor JWT v2 end-to-end)

**Fuera de scope para la ventana MVP (diferido post-MVP):** Fase 3 (passkey-first), Fase 4 (step-up auth),
Fase 5 (OIDC issuer Stage 1), Fase 6 (v1 sunset).

**Rationale**: el cliente necesita aislamiento de tenant en flujos AUTH + modelado Organization +
identidad basada en subdominio + login del dashboard funcionando multi-tenant. Fases 0+1 cubren las primeras
dos; Fase 2.1 cierra Organization + subdominio; Fase 2 cierra el dashboard wiring. El OIDC issuer de la
Fase 5 + las Fases 3/4 son nice-to-have para el cutover v1 pero no deal-breakers. La Fase 6 sunset es
post-MVP por definición.

**Consecuencias**: el dashboard y la API pública externa operan en una **ruta transitoria de validación
AUTH-direct** durante la ventana del deadline (D-009 sigue siendo a largo plazo, el endpoint JWKS aterriza
en la Fase 5 post-MVP). Tickets de planificación post-MVP de Fase 3/4/5/6 se crean solo bajo demanda del
operador.

> **🔄 Revisión 2026-06-14 (ADR-002 — gobernanza Emkeel/ECO):** la ventana comercial de 3 semanas de D-010
> **ya caducó**, así que activar dejó de ser una carrera y pasó a ser una decisión deliberada de gobierno.
> ADR-002 (alimentado por [`strategy/auth.md`](../emkeel-governance/strategy/auth.md), análisis A1–A4 con
> fuentes verificadas) **re-evaluó el diferir de las Fases 3–6**:
> - **Activar el MVP (Fases 0–2)** — seguro frente a regresión (= factores de v1 + aislamiento *enforced*).
> - **Fase 3 (passkey-first) → EN alcance** — cierra el gap de conformidad **NIST SP 800-63B-4 §2.2**
>   (*verifiers SHALL offer ≥1 phishing-resistant option en AAL2*; TOTP no lo es) → **AAL2 completo**.
> - **Fase 4 (step-up) → EN alcance** — habilita **capacidad AAL3** (security keys hardware no exportables).
> - **Fase 5 (OIDC issuer) → CONGELADA** — no es seguridad, es capability de producto on-demand; buy-vs-build
>   solo si llega demanda real de SSO (probable federación-IN).
> - **Fase 6 (sunset v1) → diferida** hasta que v2 esté probado en prod.
>
> El **norte vigente** es `strategy/auth.md` (APPROVED) + `adr/002-auth-v2-activation.md`. Este D-010
> queda como registro histórico; no se reescribe (append-only).

---

## 6. Estado de fases (al cierre del MVP — era framework, 2026-05-22)

> Estado **histórico** del MVP. El go-forward (qué activar / qué continuar) lo manda **ADR-002**, no esta
> tabla. El detalle de ejecución por ticket (tests, coverage, commits) vive en el historial git de
> `nexacore-api`. Tickets bajo el proyecto Jira legacy **SCRUM**.

| Fase | Nombre | Estado | Shipped como |
|------|--------|--------|--------------|
| 0.1 | Tenant primitives + bootstrap | ✅ complete | SCRUM-487 (`1f4aa16`) |
| 0.2 | Prisma tenant-filter middleware | ✅ complete | SCRUM-488 (`c88fa88`) |
| 0.3 | `User.isPlatformAdmin` + Role refactor | ✅ complete | SCRUM-489 (`b906ed0`) |
| 0.4 | Tenant HTTP surface | ✅ complete | SCRUM-491 (`622baa4`) |
| — | Coverage debt sweep (prerequisito) | ✅ complete | SCRUM-490 (`6d80f66`) |
| 1.1 | Token Engine v2 — scaffolding interno | ✅ complete | SCRUM-492 (`309c38f`) |
| 1.2 | Refresh opacos + `SessionsServiceV2` | ✅ complete | SCRUM-493 (`18fd537`) |
| 1.3 | `JwtV2Strategy` + `POST /auth/v2/refresh` | ✅ complete | SCRUM-494 (`e33fe6b`) |
| 2.1 | `Organization` + `SubdomainTenantResolverMiddleware` | ✅ complete | SCRUM-495 (`ee3f1ca`) |
| 2.2 | `AuthIntent` state machine (tras flag `AUTH_INTENT_V2_ENABLED`) | ✅ complete | SCRUM-497 (`561c141`) |
| 2.3 | Dashboard wiring (tras flag `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED`) | ✅ complete | SCRUM-499 (`813e6cd`) |
| 3 | Passkey-first Reframing | ⛔ no construido → **EN alcance por ADR-002** | — |
| 4 | Step-up Auth (AuthChallenge) | ⛔ no construido → **EN alcance por ADR-002** | — |
| 5 | OIDC Issuer (Stage 1) | ⛔ no construido → **CONGELADO por ADR-002** | — |
| 6 | Migration + v1 Sunset | ⛔ no construido → **diferido por ADR-002** | — |

**MVP cerrado (D-010, 2026-05-22):** Fases 0+1+2 en `main`, ambos flags OFF en prod (`AUTH_INTENT_V2_ENABLED`
backend + `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED` frontend). Las rutas v1 quedan bit-idénticas; apagar los
flags revierte a v1 de forma transparente.

---

## 7. Riesgos multi-tenant (registro)

Los 12 riesgos multi-tenant identificados durante el análisis:

| # | Riesgo | Severidad | Fase que lo mitiga |
|---|--------|-----------|--------------------|
| MT-1 | El JWT no tiene tenantId → cualquier token sirve en cualquier tenant tras añadir tenancy | **CRITICAL** | Fase 1 |
| MT-2 | La sesión no tiene tenantId → mismo problema server-side | **CRITICAL** | Fase 1 |
| MT-3 | `email @unique` global bloquea "mismo email, dos tenants, datos separados" | HIGH | Fase 0 (gradual; preservar constraint en transición) |
| MT-4 | `Role` global en User = modo-dios cross-tenant para SUPERADMIN | **CRITICAL** | Fase 0 |
| MT-5 | `AuditLog` sin tenantId → compliance multi-tenant (GDPR/SOC2) imposible | HIGH | Fase 0 |
| MT-6 | Config de provider `OAuthAccount` global → cada tenant podría querer su app OAuth | MEDIUM | Fase 0 (TenantSettings.authPolicy) |
| MT-7 | Catálogo de permisos global; sin override per-tenant | MEDIUM | Fase 0 (default) / futuro |
| MT-8 | `TrustedDevice` sin tenantId → laptop confiado en tenant A bypassa MFA en tenant B | HIGH | Fase 0 |
| MT-9 | Sin Prisma tenant-filter middleware → `where: tenantId` olvidado = fuga cross-tenant | **CRITICAL** | Fase 0 |
| MT-10 | `revokeAllUserSessions(userId)` revoca cross-tenant (mala UX) | MEDIUM | Fase 1 (sesiones tenant-aware) |
| MT-11 | Sin concepto de "tenant trial/suspended/deleted" — un tenant suspendido debería bloquear login | HIGH | Fase 0 |
| MT-12 | CORS/CSRF no tenant-aware → política mismo-origen para todos los tenants con dominios custom | HIGH | Fase 0 / Fase 6 (white-label) |

**MT-1 + MT-2 + MT-4 + MT-9 son bloqueantes.** Sin resolverlos, NexaCore no puede vender multi-tenant.
Todos se abordan en las Fases 0-1.

---

## 8. Paths de código que el programa toca

- `nexacore-api/prisma/schema.prisma` — adiciones + mutaciones de modelos
- `nexacore-api/src/auth/**` — el módulo entero (19 ficheros)
- `nexacore-api/src/sessions/**` — scoping de tenant
- `nexacore-api/src/audit/**` — tenantId en eventos
- `nexacore-api/src/common/**` — interfaces de JWT payload (shape v2)
- `nexacore-api/src/tenants/**` — modelos + middleware de tenancy
- `nexacore-api/src/app.module.ts` — registro del middleware/interceptor
- `nexacore-dashboard/**` — integración frontend (consumidor de AuthIntent)

---

*Fin de la referencia histórica. El "por qué" original se preserva aquí; el "qué hacer ahora" vive en
`emkeel-governance/strategy/auth.md` + `adr/002-auth-v2-activation.md`.*
