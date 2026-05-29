---
name: AUTH v2 + Tenancy v1 — plan
doc_type: plan
last_updated: 2026-05-27
created: 2026-05-18
related_audits:
  - ai-specs/changes/auth/audit/audit-2026-05-14T16-58/  # latest pre-program AUTH audit; PASS 83.7%
horizon_years: "5-10"
---

# AUTH v2 + Tenancy v1 — Plan

> **Plan/roadmap doc for the AUTH rewrite + tenancy introduction.** Read before touching AUTH code.
>
> **NOTE (2026-05-27 framework reset):** this document was preserved from the deleted program-orchestration layer (`changes/auth/programs/AUTH-v2.md` + `.state.yml`). The plan content below is still valid; only the orchestrator mechanism that drove it (`/decompose-phase`, `/promote-program`, phase transitions) is gone. Work AUTH-v2 tickets through the standard lifecycle (`/enrich-us` → `/plan` → `/develop` → `/verify` → `/commit` → `/update-docs`). Full prior history recoverable from git commit `6dccf01`.

## Status snapshot (recovered from AUTH-v2.state.yml @ 6dccf01, 2026-05-27)

**MVP shipped and merged (Phases 0–2 complete):**

| Phase | Name | Status | Tickets (PRs) |
|---|---|---|---|
| 0 | Tenancy Primitives | ✅ complete | SCRUM-487 (#326), 488 (#327), 489 (#328), 491 (#329) |
| 1 | Token Engine v2 | ✅ complete | SCRUM-492 (#330), 493 (#332), 494 (#333) |
| 2 | AuthIntent State Machine | ✅ complete | SCRUM-495 (#334), 497 (#335), 499 (#336) |
| 3 | Passkey-first Reframing | ⬜ planned | — |
| 4 | Step-up Auth (AuthChallenge) | ⬜ planned | — |
| 5 | OIDC Issuer (Stage 1) | ⬜ planned | — |
| 6 | Migration + v1 Sunset | ⬜ planned | — |

**Pending operator decision (per prior D-010):** activation of the MVP in production — flip the `AUTH_INTENT_V2_ENABLED` feature flag. Phases 3–6 are post-MVP and not yet decomposed into tickets.

---

## 0. Executive Summary

NexaCore needs to evolve from a single-tenant CRM with high-quality AUTH code into a multi-tenant white-label SaaS platform. The current AUTH module (~4,335 LOC, 19 files, PASS verdict from 16 prior audits) is **technically rigorous but conceptually single-tenant**. The fix is not patching — every AUTH path assumes single-tenant identity. The fix is a **directed rewrite** of the AUTH module preserving ~48% of the code (passkey, MFA mechanics, anti-abuse, login-security) and rewriting the ~52% that defines the architectural backbone (token engine, login flow, session model, OAuth integration).

The program also introduces NexaCore as an **OIDC issuer** (Stage 1, first-party satellites), pivots AUTH to **passkey-first** with password as fallback, replaces the procedural `executeLogin` with an **AuthIntent state machine**, generalizes step-up auth via an **AuthChallenge primitive**, and migrates from JWT-format refresh tokens to **opaque refresh tokens** with server-side state.

Estimated horizon: ~17 weeks sequential (~4 months) if every phase is run strictly serial. Some phases can parallelize (Fase 3 + Fase 4 don't structurally depend on each other) bringing total down to ~13-14 weeks. The program respects `workflow-standards.mdc §15` NOT-§15 throughout — every AUTH change still requires Jira ticket + separate review path.

---

## 1. Strategic Analysis (snapshot 2026-05-18)

### 1.1 What the code is today (verified, not theoretical)

- **10 Prisma models**: `User`, `Session`, `AuditLog`, `EmailVerificationToken`, `PasswordResetToken`, `TrustedDevice`, `WebAuthnCredential`, `OAuthAccount`, `Permission`, `RolePermission`. **Zero tenancy primitives**.
- **JWT payload**: `{ sub, email, role, jti, sessionId, iat }`. **No `tenantId`. No `tenantRole`.**
- **Sessions model**: user-scoped only. `revokeAllUserSessions(userId)` operates cross-tenant by default (because tenants don't exist).
- **Permissions**: global mapping `Role × Permission`. `Role` enum = `SUPERADMIN | ADMIN | USER`. Single tier; no per-tenant role override.
- **Email uniqueness**: `User.email @unique` globally. Same email cannot exist in two tenants.
- **AUTH module files**: `auth.controller.ts` (265 LOC) · `auth.service.ts` (186) · `login.service.ts` (399) · `token.service.ts` (424) · `mfa.controller.ts` (162) · `mfa.service.ts` (306) · `oauth.controller.ts` (257) · `oauth-auth.service.ts` (132) · `passkey.controller.ts` (187) · `passkey.service.ts` (469) · `session.controller.ts` (188) · `trusted-device.service.ts` (318) · `login-security.service.ts` (142) · `password-breach.service.ts` (70) · `password-reset.service.ts` (175) · `email-verification.service.ts` (293) · `account.controller.ts` (164) · `auth.module.ts` (115) · `token-deny-list.service.ts` (83).

### 1.2 The 12 logical problems (the "winning company" lens)

| # | Problem | Severity | Phase that addresses it |
|---|---------|----------|--------------------------|
| L1 | AUTH is password-first when it should be passkey-first | Strategic | Fase 3 |
| L2 | Login flow is procedural, not state-machine | Strategic | Fase 2 |
| L3 | Refresh token = JWT is architecturally confusing (3 mechanisms for 1 decision) | Strategic | Fase 1 |
| L4 | Trusted device is half-implemented (fingerprint not crypto-bound) | Strategic | Fase 3 (passkey supersedes) |
| L5 | Email verification masks as INVALID_CREDENTIALS (poor UX) | UX | Fase 2 |
| L6 | Admin MFA-setup forced creates friction; TOTP is legacy in 2026 | Strategic | Fase 3 |
| L7 | Lockout is unfriendly + email-spammy | UX | Fase 2 |
| L8 | No generalized step-up auth (bespoke `WithReauth` per operation) | Strategic | Fase 4 |
| L9 | No unified `IdentityProvider` abstraction | Strategic | Fases 1+2+5 |
| L10 | Cross-app session model unclear (satellites re-implement auth) | Strategic | Fase 5 (OIDC issuer) |
| L11 | bcrypt on refresh = scale ceiling at ~1K concurrent users | Performance | Fase 1 |
| L12 | Recovery story ambiguous (no flow for "lost everything") | Risk | Fase 3 (passkey cross-device sync) |

### 1.3 What 16 prior audits say (and why they're not enough)

The most recent audit (2026-05-14T16-58, PASS 83.7%) found **0 FAIL · 8 WARN · 3 CRITICAL latentes**. The CRITICALs were: dev fallback hardcoded secrets, OAuth avatar URL SSRF risk, GDPR Cascade docs gap. **All implementation-correctness findings, none strategic.**

This validates the operator's framing: *"el código es correcto, la lógica no funciona del todo"*. The auditing machine cannot detect strategic misalignment — it validates against OWASP/NIST/RFC standards, not against "winning company in 2026" criteria.

---

## 2. Multi-Tenant Model (the foundation that doesn't exist yet)

### 2.1 New models (greenfield)

```
Tenant
  id, slug @unique, name, status (active | trial | suspended | deleted)
  createdAt, updatedAt

TenantSettings  (1:1 with Tenant)
  tenantId @unique → Tenant
  branding (JSON)             # white-label: logo, colors, name
  modules (JSON)              # toggleable feature set
  authPolicy (JSON)           # per-tenant: passkeyRequired, mfaRequired, allowOAuth, sessionTimeout

TenantMembership  (User × Tenant)
  id, tenantId → Tenant, userId → User
  role (TenantRole: OWNER | ADMIN | MEMBER | VIEWER | CUSTOM)
  status (active | invited | suspended)
  invitedBy, joinedAt, lastActiveAt
  @@unique([tenantId, userId])

TenantInvitation
  id, tenantId, email, role, token, expiresAt, acceptedAt

AuthIntent  (state machine for login)
  id, status (requires_credentials | requires_tenant_pick | requires_mfa
              | requires_passkey | requires_setup | succeeded | failed)
  userId?, tenantId?, expiresAt, createdAt
  context (JSON: chosen factors, anomaly signals, etc.)

AuthChallenge  (step-up primitive)
  id, userId, purpose (free-form scope token)
  expiresAt, fulfilledAt?, fulfillment_factor
```

### 2.2 Existing model mutations

| Model | Change | Rationale |
|-------|--------|-----------|
| `User.role` | REMOVE (move to `TenantMembership.role`) | Role becomes per-tenant; cross-tenant admin = `isPlatformAdmin` flag |
| `User.isPlatformAdmin` | NEW Boolean | Replaces `Role.SUPERADMIN`; explicit cross-tenant capability |
| `User.email` | Keep `@unique` for now | Operational identity becomes (email, tenant) but global uniqueness preserved during Phase 0 to avoid migration crash |
| `Session.tenantId` | NEW required | Session is always bound to one active tenant |
| `AuditLog.tenantId` | NEW nullable | Null = platform-level event (user created cross-tenant) |
| `TrustedDevice.tenantId` | NEW required | Trust does not cross tenants |
| `OAuthAccount` | KEEP user-scoped | But provider config moves to `TenantSettings.authPolicy` |

### 2.3 JWT v2 payload

```typescript
interface JwtPayload {
  sub: string;              // userId — global identity
  jti: string;
  sessionId: string;
  iat: number;
  tenantId: string;         // NEW — active tenant for this session
  tenantRole: TenantRole;   // NEW — role within active tenant
  isPlatformAdmin: boolean; // NEW — cross-tenant capability flag
  // REMOVED: email, role
}
```

### 2.4 Tenancy invariants enforced via Prisma middleware

Every query against tenant-scoped models (`Session`, `AuditLog`, `TrustedDevice`, all future business entities) is automatically filtered by `tenantId = currentTenantId`. The middleware reads `currentTenantId` from a request-scoped context. A platform-admin path can opt out with an explicit `bypassTenantFilter: true` flag, audited.

**This is non-negotiable**. Without the middleware, a single forgotten `where: tenantId` produces a cross-tenant data leak — the most catastrophic class of multi-tenant bug.

---

## 3. Reusability Inventory (file-by-file)

| Category | Files | LOC | % of module |
|----------|-------|-----|-------------|
| **REUSE intact** | `passkey.service.ts` (469) · `login-security.service.ts` (142) · `password-breach.service.ts` (70) · `mfa.service.ts` mechanics (306) · `email-verification.service.ts` (293) · `password-reset.service.ts` (175) · `token-deny-list.service.ts` (83) | ~1,538 | ~36% |
| **REUSE with minor adjustment** | `account.controller.ts` (164) · `mfa.controller.ts` (162) · `passkey.controller.ts` (187) | ~513 | ~12% |
| **REWRITE conceptual** | `token.service.ts` (424) · `auth.controller.ts` (265) · `login.service.ts` (399) · `session.controller.ts` (188) · `auth.service.ts` (186) · `oauth.controller.ts` (257) · `oauth-auth.service.ts` (132) · `trusted-device.service.ts` (318) · `auth.module.ts` (115) | ~2,284 | ~52% |
| **TOTAL** | 19 files | ~4,335 | 100% |

**Reuse rationale**:
- Passkey = identity of the **human**, cross-tenant. Zero changes.
- Login-security (impossible-travel, suspicious-login signals) operates at user level.
- Password-breach = stateless HaveIBeenPwned check.
- MFA mechanics (TOTP encrypt/decrypt/verify) = pure crypto, stateless.
- Email-verification + password-reset = user-scoped tokens; minor tenant context in email content.
- Token-deny-list = Redis abstraction; reusable for opaque token revocation primitive.

**Rewrite rationale**:
- Token engine: refresh JWT-format + bcrypt + Redis deny-list = 3 mechanisms. Opaque + sha256 = 1 mechanism.
- Login flow: procedural `executeLogin` doesn't compose with multi-tenant states.
- Sessions: every query needs tenantId scope.
- OAuth: provider config must go per-tenant for white-label.
- Trusted device: tenant scoping required.

---

## 4. Sprint Phase Structure (7 phases)

### Fase 0 — Tenancy Primitives (~3 weeks)

**Builds**: `Tenant`, `TenantMembership`, `TenantSettings`, `TenantInvitation` models · Prisma tenant-filter middleware · bootstrap (existing users → default tenant as OWNER) · `User.isPlatformAdmin` flag.

**Does NOT build**: any AUTH flow change. JWT stays v1. AUTH endpoints unchanged.

**Gate of exit**: pytest green · `tenants` table in production · 100% existing users assigned to default tenant · Prisma middleware activated and blocking unscoped queries on tenant-scoped models · zero production incidents during cutover.

**Why first**: every AUTH change references `Session`/`AuditLog`/`TrustedDevice`. Adding `tenantId` later means retouching 30+ callsites. Adding it first means subsequent AUTH work assumes it.

### Fase 1 — Token Engine v2 (~2 weeks)

**Builds**: opaque refresh tokens (256-bit random + sha256, replacing JWT-format) · `JwtPayload` v2 (with `tenantId`/`tenantRole`/`isPlatformAdmin`) · new `TokenServiceV2` and `SessionsServiceV2` tenant-aware, paralelo a los actuales (strangler).

**Does NOT build**: client uses v2 yet. v2 exists internally; tests prove it; v1 endpoints continue.

**Gate of exit**: TokenServiceV2 produces + validates correctly · unit + integration tests pass · v1 unaffected in production.

**Why second**: Phase 0 made tenant model real. Token engine is the next dependency: AuthIntent (Phase 2), passkey-first (Phase 3), OIDC issuer (Phase 5) all ride on top of it. Building them on JWT-format refresh = retrabajo when we switch.

### Fase 2 — AuthIntent State Machine (~3 weeks)

**Builds**: `AuthIntent` model + service · new login flow as state machine · `POST /v2/auth/intents`, `POST /v2/auth/intents/:id/advance` · frontend reference impl against v2.

**Does NOT build**: passkey not yet primary; OIDC not yet; step-up still bespoke.

**Gate of exit**: user completes full v2 login (email+password+MFA+tenant pick) end-to-end · v1 still in production · v2 endpoint behind feature flag for gradual rollout.

**Why third**: state machine reshapes flow control. Phases 3 (passkey-first) + 4 (step-up) become additive — new states on the machine — rather than invasive flow rewrites.

### Fase 3 — Passkey-first Reframing (~2 weeks)

**Builds**: passkey enrollment automatic at signup · `requires_passkey` as primary path in AuthIntent · UI deemphasizes password · magic links as secondary passwordless option.

**Does NOT build**: password endpoints not removed (legacy + accessibility); MFA TOTP retained as fallback in tenant policies.

**Gate of exit**: new user can register → login → logout without typing a password · existing users can enroll passkey and migrate their default.

**Why fourth**: `passkey.service.ts` (469 LOC) already exists. This phase is **flow change + UX**, not implementation. Requires AuthIntent from Phase 2 to integrate cleanly.

### Fase 4 — Step-up Auth (AuthChallenge) (~2 weeks)

**Builds**: `AuthChallenge` model + service · retrofit existing `WithReauth` operations (`logoutAllWithReauth`, `trustDeviceWithReauth`, `revokeAllDevicesWithReauth`) · new sensitive endpoints inherit the primitive.

**Does NOT build**: no new sensitive operations invented in this phase.

**Gate of exit**: the 3 `WithReauth` methods are deleted and replaced by `AuthChallenge`-resolving paths · tests verify identical behavior.

**Why fifth**: independent of Phase 3 structurally. Done after to avoid concurrent AUTH changes. **Can parallelize with Phase 3** if scheduling demands — these two phases do not share files.

### Fase 5 — OIDC Issuer (Stage 1) (~3 weeks)

**Builds**: `/.well-known/openid-configuration` · JWKS endpoint · ID token issuance (on top of Phase 1 token engine) · authorization code flow for first-party satellites.

**Does NOT build**: federation IN (white-label customers with their own IdP). That is Stage 2, deferred until customer demand.

**Gate of exit**: a test satellite (internal endpoint or service) authenticates against NexaCore via standard OIDC flow · client uses generic `oidc-client-ts`, not custom code.

**Why sixth**: needs Phase 0 (tenant context for claims) + Phase 1 (token engine for issuance) + Phase 2 (AuthIntent for code flow). All dependencies must be stable.

### Fase 6 — Migration + v1 Sunset (~2 weeks)

**Builds**: telemetry of v1 vs v2 usage per endpoint · deprecation headers · sunset plan execution (delete v1 when v2 > 95% traffic for 2 consecutive weeks).

**Does NOT build**: forced client migration — managed via deprecation period (4-6 weeks typical).

**Gate of exit**: v2 traffic > 95% sustained 2 weeks · v1 deletion PR approved · v1 code removed · AUTH module final state.

**Why last**: cleanup happens when new infrastructure is proven in production.

---

## 5. Decision Log (append-only)

> **Invariant**: this section is APPEND-ONLY. Do not rewrite or delete past entries. If a decision is reversed, add a new entry citing the reversal; the original entry stays.

### Decision D-001 — Directed rewrite, not patch (2026-05-18)

**Context**: AUTH module is technically rigorous (16 audits PASS) but single-tenant-by-design.

**Alternatives considered**:
- A: Patch — add `tenantId?` nullable to existing models with gradual migration.
- B: Refactor — preserve structure, move methods around.
- C: Directed rewrite — keep ~48% reusable code, rewrite ~52% conceptual backbone.

**Decision**: C.

**Rationale**: Patch produces permanent dual-mode code (`if (tenantId) {...} else { /* legacy */ }`); branches explode unmanageably. Refactor preserves the wrong conceptual structure (single-tenant procedural). Rewrite is the only path that produces clean architecture for the 5-10 year horizon. ~48% reuse keeps cost contained.

### Decision D-002 — Passkey-first (2026-05-18)

**Context**: `passkey.service.ts` exists (469 LOC, full WebAuthn) but is treated as separate endpoint, not primary path.

**Decision**: pivot to passkey-first; password becomes legacy fallback.

**Rationale**: White-label end-users span all tech-literacy levels; TOTP friction is high; password breaches cascade across tenants; passkey + cross-device sync (Apple/Google/1Password) handles "new laptop" case better than password reset. The code is already there — what's missing is product positioning.

### Decision D-003 — Opaque refresh tokens (2026-05-18)

**Context**: Current refresh token = JWT signed with same JWT_SECRET + bcrypt hash in DB + Redis deny-list. Three mechanisms for one decision.

**Decision**: replace with opaque 256-bit random tokens + sha256 hash in DB.

**Rationale**: Collapses 3 mechanisms to 1. Removes bcrypt overhead (~100ms per refresh → scale ceiling at ~1K concurrent users). Server-side state enables per-tenant policies (HIPAA tenant can require 1h refresh; standard 12h). Modern winners (Stripe, GitHub, Linear, Vercel) all use this pattern.

### Decision D-004 — AuthIntent state machine (2026-05-18)

**Context**: `executeLogin` returns one of 3 result types; client inspects `.status`. Adding multi-tenant explodes to 7+ states.

**Decision**: introduce `AuthIntent { id, status, next_step, context }` as canonical login orchestration model. Single endpoint advances state.

**Rationale**: Multi-tenant adds `requires_tenant_pick`; passkey-first adds `requires_passkey`; tenant policies add `requires_setup`. Without state machine, frontend reimplements 7-way conditional. With state machine, frontend interrogates one object. Stripe-pattern, proven.

### Decision D-005 — NexaCore as OIDC issuer (Stage 1) (2026-05-18)

**Context**: First-party satellites WILL multiply; each re-implementing auth = N× bugs. White-label customers eventually want SSO with their own IdP.

**Decision**: implement OIDC issuer for first-party satellites in Phase 5. Defer federation IN (Stage 2) until customer demand.

**Rationale**: OAuth client side already understood by `oauth-auth.service.ts` (code exchange pattern). Inverting to issuer is conceptual mirror. Standards-based — clients use generic libraries. Future federation IN is config layer over same primitive.

### Decision D-006 — AuthChallenge step-up primitive (2026-05-18)

**Context**: `WithReauth` exists 3× bespoke (logoutAll, trustDevice, revokeAllDevices). Future sensitive ops (change email/password, delete account, billing, transfer ownership) would each need their own `WithReauth`.

**Decision**: generalize to `AuthChallenge { id, purpose, expires_at, fulfilled_at }` primitive. Any sensitive endpoint requires a resolved challenge.

**Rationale**: One mechanism, infinite use cases. Easier audit (one challenge model to inspect, not N bespoke methods). Easier UX (frontend learns one pattern).

### Decision D-007 — Separate `Tenant` from `Organization` tables (2026-05-20)

**Context**: §2.1 introduced a single `Tenant` primitive that conflates the billing/contract unit with the team/sub-grouping structure. Operator chat (consolidated in [ORCH-DRAFT-001](../../global/orchestrator/drafts/ORCH-DRAFT-001-multi-tenant-architecture.md) §Macro decisions, approved 2026-05-20) established these are distinct domain concepts and must not share a table.

**Decision**: model `Tenant` and `Organization` as distinct tables. `Tenant` = billing/contract identity (the customer); `Organization` = sub-grouping inside a tenant (departments, teams, business units). User-to-organization membership becomes a separate relation from user-to-tenant membership.

**Rationale**: coupling billing identity to org structure makes contract changes ripple through team data and vice-versa; restructuring org hierarchies should not touch billing; future scenarios (M&A absorbing an external tenant's orgs; per-org RBAC distinct from per-tenant RBAC) demand the split. Standard SaaS pattern (Stripe accounts vs. orgs; Atlassian sites vs. orgs; GitHub billing teams vs. orgs).

**Consequences**: new `Organization` Prisma model with `tenantId` FK (org belongs to one tenant; never cross-tenant). `TenantMembership` (Phase 0.1 / SCRUM-487) remains; add `OrganizationMembership` as separate relation. `AuditLog` grows `organizationId?` nullable. Permissions can be scoped at organization level (refines MT-7). Schema migration lands in Phase 2.1 candidate ticket per D-010.

### Decision D-008 — Database-isolation middleware by subdomain (defense-in-depth) (2026-05-20)

**Context**: §2.4 established Prisma `$extends` tenant-filter as the row-level isolation primitive (Phase 0.2 / SCRUM-488). Operator chat (ORCH-DRAFT-001 §Macro decisions, approved 2026-05-20) surfaced that an additional request-pipeline middleware is desired to pin `TenantContext` from the request subdomain BEFORE Prisma sees any query.

**Decision**: introduce `SubdomainTenantResolverMiddleware` in the NestJS request pipeline (executes before any controller) deriving the active tenant from the incoming subdomain (`acme.platform.com` → tenant `acme`) and binding the `TenantContext` (shipped in SCRUM-488 via `AsyncLocalStorage`) at the request boundary. Complements the row-level Prisma extension — defense-in-depth, not replacement.

**Rationale**: even if a future code path forgets `TenantContext.run(tenantId)`, subdomain middleware will have already established context at request entry. Enables white-label per-tenant domains (directly mitigates MT-12 — CORS/CSRF tenant-awareness). Subdomain resolution failure → fast-fail at request boundary rejecting unauthenticated tenant routes before any DB query.

**Consequences**: new middleware likely under `auth/middleware/` or `tenants/middleware/`. Subdomain → tenant via `TenantsService.findBySlug` (cache aggressively — per-request hot path). CORS/CSRF policy becomes subdomain-aware. `localhost` + platform-admin paths use opt-out via canonical subdomain (e.g. `admin.platform.com`) + `TenantContext.runWithBypass`. Landing batched with D-007 in Phase 2.1 ticket per D-010 and Q8.

### Decision D-009 — Local JWT signature validation (stateless verification by consumers) (2026-05-20)

**Context**: §1.3 established opaque refresh tokens (Phase 1.2 / SCRUM-493) but consumer-side (dashboard, external public API, future satellites) access-token verification path was not pinned down. Operator chat (ORCH-DRAFT-001 §Macro decisions, approved 2026-05-20) established consumer-side session validation must be **local** via JWKS, not a REST callback to AUTH on every request.

**Decision**: consumers validate JWT v2 access tokens locally via JWKS public-key fetch + cached signature verification. AUTH exposes a JWKS endpoint (lands in Phase 5); consumers cache keys; no per-request REST callback to AUTH for session validity.

**Rationale**: REST callback per request becomes a single point of failure and a latency floor; local JWKS validation is the standard OIDC pattern and scales linearly. Refresh tokens (D-003 / Phase 1.2) handle revocation; access tokens are short-lived (≤15 min) so the revocation window is bounded by token lifetime, not eliminated.

**Consequences**: Phase 5 (OIDC Issuer) gains a HARD dependency — JWKS endpoint must ship before any non-AUTH service validates JWT v2 in production. **Under D-010 MVP scope (3-week window), Phase 5 is deferred post-MVP**; dashboard + external public API use a transitional AUTH-direct validation path during the deadline window; D-009 stays the long-term direction. Trade-off accepted: a revoked session keeps producing valid access tokens until expiry (≤15 min). `token-deny-list.service.ts` covers emergency platform-wide revocation; consumers check it on critical operations only, not every request.

### Decision D-010 — MVP scope bound to Phase 0+1+2.1+2 for 3-week commercial window (2026-05-20)

**Context**: primary customer requires Multi-Tenant in production within 3 weeks (operator 2026-05-20). §0 estimate is ~13-14 weeks parallelized for the full 7-phase program; structural delta ~10 weeks. R-meta-001 in ORCH-DRAFT-001 raised this as CRITICAL; operator directed (ORCH-DRAFT-001 approval 2026-05-20, phrase "OK proceed") that the scope be bound strictly to fit the window.

**Decision**: bind the MVP scope to:
- ✅ **Phase 0** (Tenancy primitives) — done (SCRUM-487/488/489/491)
- ✅ **Phase 1** (Token Engine v2) — done (SCRUM-492/493/494)
- 🟢 **Phase 2.1** (D-007 `Organization` model + D-008 subdomain middleware) — net-new, single batched ticket per Q8 in ORCH-DRAFT-001
- 🟢 **Phase 2** (AuthIntent state machine + dashboard wiring as the first end-to-end JWT v2 consumer) — within the 3-week window

**Out of scope for the MVP window (deferred post-MVP):** Phase 3 (passkey-first), Phase 4 (step-up auth), Phase 5 (OIDC issuer Stage 1), Phase 6 (v1 sunset).

**Rationale**: customer needs tenant isolation in AUTH flows + Organization modeling + subdomain-based identity + dashboard login working multi-tenant. Phases 0+1 cover the first two; Phase 2.1 closes Organization + subdomain; Phase 2 closes the dashboard wiring. Phase 5 OIDC issuer + Phases 3/4 polish are nice-to-have for v1 cutover but not deal-breakers. Phase 6 sunset is post-MVP by definition.

**Consequences**: dashboard and external public API operate on a **transitional AUTH-direct validation path** during the deadline window (D-009 stays long-term, JWKS endpoint lands in Phase 5 post-MVP). Post-MVP planning ticket(s) covering Phase 3/4/5/6 created on operator demand only (per `feedback_no_unsolicited_backlog_mining`). Rebase pressure on `feature/SCRUM-*` branches expected; tickets batched per Q8 to keep PR count low.

**Cross-refs**: ORCH-DRAFT-001 §Risks R-meta-001 (resolved by this decision); D-007 + D-008 (Phase 2.1 contents); D-009 (Phase 5 → JWKS dependency deferred); R-meta-001 transitional path.

---

## 6. Current Phase State (live)

| Phase | Name | Status | Tickets | Notes |
|-------|------|--------|---------|-------|
| **0.1** | Tenant primitives + bootstrap | **complete** | SCRUM-487 (PR #326, merge `1f4aa16`, 2026-05-19) | 4 models + 3 enums + bootstrap migration + `TenantsService` (`@Global`) shipped. Verify PASS (2 Accepted-Trivial). 25 tenant tests + full 1071/1071 jest green at /verify. CI Layer 4 backend tests pre-existing coverage debt 89.85% < 90% (main was 89.72%; SCRUM-487 IMPROVED by +0.13pp). SCRUM-490 follow-up created for coverage debt sweep. |
| **0.2** | Prisma tenant-filter middleware | **complete** | SCRUM-488 (PR #327, merge `c88fa88`, 2026-05-19) | Prisma Client Extension (`$extends`, not `$use`) + `AsyncLocalStorage`-backed `TenantContext` library + `TenantContextInterceptor` (APP_INTERCEPTOR) + `auditAndRunBypass` helper + `AuditAction.TENANT_FILTER_BYPASS` enum value + PrismaModule factory-provider refactor. Verify **PASS** (1 Accepted-Trivial — extracted `handleTenantFilteredQuery` from opaque defineExtension closure for unit testability). +94 tests (1071 → 1165) cleared pre-existing 89.85% coverage threshold organically — **one-shot CI green** (all 12 checks PASS, no admin override). RLS evaluation NOT in this ticket (deferred to separate eval ticket). |
| **0.3** | `User.isPlatformAdmin` + Role refactor | **complete** | SCRUM-489 (PR #328, merge `b906ed0`, 2026-05-19) | **Scope corrected** (previously mislabelled "Tenant API surface" in this row — that was a SCRUM-488 `/update-docs` misprediction). Actual scope: cross-tenant capability flag (`User.isPlatformAdmin`) replaces the conflated `Role.SUPERADMIN` semantics; `Role` enum kept transitional until Phase 1 retires after JWT v2. 6 capability sites migrated; 6 Role-enum-machinery sites kept. Mitigates §8 MT-4. Verify **PASS · 0 deviations**. +9 tests (1165 → 1174) on heavily-testable capability-vs-role boundary paths. **One-shot CI green** (second consecutive). |
| **0.4** | Tenant HTTP surface (TenantsController + InvitationsService + listMembers) | **complete** | SCRUM-491 (PR #329, merge `622baa4`, 2026-05-19) | First production exercise of the SCRUM-488 middleware end-to-end through the HTTP layer. Ships 4 endpoints (createInvitation / acceptInvitation / revokeInvitation / listMembers) + 1 derived expire-on-accept check. 6 new `TENANT_*` AuditAction values. Partial unique index for createInvitation idempotency. 404-not-403 for cross-tenant denial (hides tenant existence). Service-layer authorization (NOT NestJS guards) via `MembershipsService.requireTenantRole`. `/tenant/switch` explicitly out — deferred to Phase 1 (depends on JWT v2 payload mechanics). Verify **PASS · 0 deviations**. +49 tests (1174 → 1223). **One-shot CI green** (third consecutive). |
| **1.1** | Token Engine v2 — internal scaffolding (`JwtPayloadV2` + `TokenServiceV2`) | **complete** | SCRUM-492 (PR #330, merge `309c38f`, 2026-05-19) | First implementation ticket of Phase 1. **Strangler-pattern foundation**: `TokenServiceV2` (mintAccessToken + verifyAccessToken; two-gate verify with explicit shape guard rejecting forged v1-shape payloads) + `JwtPayloadV2` interface (7 keys: sub, jti, sessionId, iat, tenantId, tenantRole, isPlatformAdmin — REMOVES v1's email + role) shipped as internal scaffolding only. **Zero production consumers** — `TokenServiceV2` deliberately NOT in `AuthModule.exports[]`; v1 `TokenService` continues to serve all HTTP paths unchanged. Mock-free spec (18 tests: 5 roundtrip + 5 parameterized `TenantRole` + 7 rejection paths including forged-v1-shape + 1 cross-instance). Inherits secret/issuer/audience/algorithm/expiresIn from `JwtModule.signOptions` (no per-call override; v1 and v2 cryptographically mutually-verifiable on same secret — shape is the only differentiator). All failure modes throw same `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` — no failure-mode enumeration. Verify **PASS · 0 deviations**. +18 tests (1223 → 1241). **CI Layer 4 FAILED on coverage threshold only** (1241/1241 tests passed; 89.79% < 90% by 0.21pp — same pre-existing main debt as SCRUM-487, tracked by SCRUM-490). Operator-authorized admin merge override (second of the wave). |
| **1.2** | Opaque refresh tokens + `SessionsServiceV2` (tenant-aware) | **complete** | SCRUM-493 (PR #332, merge `18fd537`, 2026-05-19) | Second sub-phase of Phase 1. **Strangler-pattern**: NEW `SessionV2` Prisma model (sessions_v2 table, refreshTokenHash @unique SHA-256, tenantId NOT NULL) + NEW `SessionsServiceV2` (4 public methods, NOT exported from SessionsModule) + 5 NEW `AuditAction.SESSION_V2_*` enum values. Zero production consumers; v1 SessionsService bit-identical to main. **Security primitives**: 256-bit CSPRNG → base64url plaintext → SHA-256 hex stored; plaintext returned ONCE; one-time-use rotation atomic in `prisma.$transaction`; cross-tenant lookup wrapped in `TenantContext.runWithBypass('session-v2-refresh-lookup')` then `TenantContext.run(tenantId)` for rotation; centralized `rejectRefresh` private helper = single throw site for 4 reject paths (no failure-mode enumeration, same `UnauthorizedException(AUTHENTICATION_FAILED)` for all). **Mitigates MT-2 (CRITICAL)** — server-side session carries tenantId — and **MT-10 (MEDIUM)** — `revokeAllForTenant` is tenant-scoped vs v1's cross-tenant bulk revoke. Verify **PASS · 3 Accepted-Trivial** (prisma format whitespace; prisma generate as separate step; composite-key name correction). +18 tests (1279 → 1297). **One-shot CI green** (all 11 checks PASS on first push; most defensive landing of the wave so far — zero blast radius + +1.0pp coverage pre-staged from SCRUM-490). Per-file `sessions.service.v2.ts` 97.95% statements/lines, 100% functions. |
| **1.3** | JwtV2Strategy + first consumer endpoint (`POST /auth/v2/refresh`) | **complete** | SCRUM-494 (PR #333, merge `e33fe6b`, 2026-05-20) | Third and final sub-phase of Phase 1 — **first v2 production HTTP surface**. NEW `JwtV2Strategy` (Passport name `'jwt-v2'`, two-gate verify with extracted `isValidV2Payload` util) + NEW `AuthV2Controller` (`POST /auth/v2/refresh`, cookie-only, rate-limited, no `@UseGuards`) + extracted `isValidV2Payload` util (single source of truth). **Strangler transition NAMED**: `SessionsModule.exports[]` += `SessionsServiceV2`; `TokenServiceV2` gains its first production consumer; Phase 1.2's 3-reference grep invariant deliberately retired. v1 paths (auth.controller, auth.service, token.service, jwt.strategy) bit-identical to main. **No failure-mode enumeration**: 2 controller throw sites + 1 strategy throw all use the same `AUTHENTICATION_FAILED` constant. **Order-of-operations documented**: validateAndRotate commits before mintAccessToken runs; mint failure → orphan rotation (acceptable per §2.4). Cookie posture mirrors v1 (httpOnly + secure-in-prod + sameSite=strict + path=/). Verify **PASS · 3 Accepted-Trivial** (async validate vs Promise.resolve; app.isProduction canonical key; eslint-disable on cookie cast). +23 tests (1297 → 1320). **One-shot CI green** (6th consecutive post-SCRUM-490). Per-file coverage 100% statements/lines/functions on all 3 NEW production files. |
| **1** (umbrella) | Token Engine v2 | **🎯 COMPLETE** | SCRUM-492 (1.1 ✅) · SCRUM-493 (1.2 ✅) · SCRUM-494 (1.3 ✅) · SCRUM-490 (coverage prerequisite ✅) | All three sub-phases shipped 2026-05-19/20. Internal v2 mint surface (TokenServiceV2 + SessionsServiceV2) → first production consumer (`POST /auth/v2/refresh` via JwtV2Strategy + AuthV2Controller). v1 paths bit-identical to main; clients have not migrated; v1 endpoints continue to serve all production traffic. Coverage floor cleared and maintained: 89.79% → **91.29% / 91.29%** with +1.29pp margin. **Phase 2 (AuthIntent state machine) becomes unblocked.** |
| **2.1** | `Organization` model + `SubdomainTenantResolverMiddleware` (D-007 + D-008 batched) | **complete** | SCRUM-495 (PR #334, merge `ee3f1ca`, 2026-05-21) | First sub-phase of Phase 2 — bundled D-007 + D-008 per ORCH-DRAFT-001 Q8. **2 new Prisma models** (Organization + OrganizationMembership) + **1 new enum** (OrganizationRole) + **Tenant.subdomain NOT NULL @unique** (backfilled from slug inside the migration) + **nullable AuditLog.organizationId** + **4 new AuditAction values** (ORGANIZATION_CREATED/MEMBER_ADDED/MEMBER_REMOVED/SUBDOMAIN_RESOLUTION_FAILED). **NEW `OrganizationsService`** (218 LOC, 6 methods, 404-not-403 cross-org denial, audit emission on every mutation). **NEW `SubdomainTenantResolverMiddleware`** (191 LOC) — request-boundary tenant binding via Host's subdomain; skip-paths (localhost / /health / /metrics); platform-admin canonical subdomain (configurable, default `'admin'`) → `runWithBypass('platform-admin-route')`; reserved-subdomain blocklist (15 names) → 404 generic to hide existence; lookup failures → 404 generic + `SUBDOMAIN_RESOLUTION_FAILED` audit (rate-limited 10/60s token bucket); module-level LRU cache (1024 × 5min TTL) with `static invalidate(subdomain)` hook from `TenantsService.update` on subdomain mutation. **NEW `OrganizationsController`** (4 endpoints, `@UseGuards(AuthGuard('jwt'))`): list / find one / create (OWNER or ADMIN of tenant) / addMember (OWNER or ADMIN of the org OR platform admin). **`TenantContextInterceptor` REWRITE — validator-not-binder** (Open Decision #6): constructor 1→2 deps (+MembershipsService). MODE 1 (context bound by middleware) validates via `requireMembership` without re-binding (prevents `AsyncLocalStorage` scope-nesting that would shadow the middleware's subdomain binding). MODE 2 (skip-path) preserves Phase 0.2 behavior (first-active-membership → `TenantContext.run`). **`TenantsService.create()`** extended in-`$transaction` to bootstrap default-org row (Open Decision #4 — mirrors bootstrap migration invariant). Migration `20260521152802_phase_2_1_organization_and_subdomain` (additive only). em-ecosystem PR #334 / squash merge `ee3f1ca`. **20 files staged** (10 NEW production + 4 NEW spec + 6 MOD), **+2001 / -105 lines**. +37 tests (1320 → **1357**); per-file coverage: organizations.service 97.24%, organizations.controller 99.06%, subdomain-middleware 94.24%, tenant-context.interceptor (rewritten) 100%. Coverage global: 91.29% → **91.03%** (−0.26pp; +1.03pp margin healthy — drop is unasserted LRU/TTL/rate-limit branches by design). Verify verdict: **PASS · 3 Accepted-Trivial · schema-validated** (Prisma enum 3-location pitfall: schema.prisma block + TS mirror + migration SQL all required; tenants.service.spec mock-plumbing for new $transaction namespace + subdomain fixture; 1 prettier trailing-comma auto-fixed). §15 AUTH change-control: single-PR in-domain case per §15.3.3 (audit-domain + AUTH v2 program touched; no cross-domain split). State machine: enrich-us → plan → develop → verify (PASS) → commit (ee3f1ca) → update-docs all advanced with `schema_validated=true` per FW-004. **Phase 2.2 (AuthIntent) + 2.3 (Dashboard wiring) remain on the MVP path** for the D-010 3-week commercial window. Refines MT-7 (per-org RBAC scope) + mitigates MT-12 (CORS/CSRF tenant-awareness — subdomain is now the canonical user-facing tenant identity). |
| **2.2** | AuthIntent State Machine | **complete** | SCRUM-497 (PR #335, merge `561c141`, 2026-05-22) | Second sub-phase of Phase 2 — replaces procedural `executeLogin` in v1 `LoginService` with a server-side state-machine driving login orchestration via the `AuthIntent` Prisma model. Closes program decision D-004. **Strangler**: v1 paths bit-identical (`git diff main` against 4 v1 paths + 6 Phase 1/2.1 paths = 0 lines). v2 endpoints behind feature flag `app.authIntentV2Enabled` (env `AUTH_INTENT_V2_ENABLED`, default false in prod, true in CI/test — controller `assertEnabled()` private helper returns 404 when flag off, mimicking "endpoint doesn't exist"). **NEW Prisma model AuthIntent** (`auth_intents` table) + NEW enum `AuthIntentStatus` (8 values, plan decision E added explicit `expired`) + 5 new `AuditAction` values + 3 reverse relations. Migration `20260522115127_phase_2_2_auth_intent` (additive only). **NEW `AuthIntentService`** (~560 LOC, 7-dep constructor — largest service in the AUTH v2 wave so far): `createIntent` + `advance` central dispatcher; per-state methods (advanceCredentials with timing-equalized bcrypt + lockout + email-verified gate; advanceMfa with inline `otpVerify` + recovery-code bcrypt-compare loop; advanceTenantPick); `transitionFromCredsCleared` single source of truth for fan-out (MFA → requires_mfa; subdomain pins tenantId AND user is member → succeeded per D5; single-tenant short-circuit → succeeded per D; multi-tenant → requires_tenant_pick); `succeed()` wraps mint in `TenantContext.runWithBypass('auth-intent-succeed-mint')` (SCRUM-488 convention); `emitAdvancedAudit()` private helper extracted at /commit time per Rule of Three (jscpd hook caught 2 copies of audit emission — no `--no-verify` used). **Single throw site**: 11 distinct failure reasons → `UnauthorizedException(AUTHENTICATION_FAILED)`; discrimination only in `AUTH_INTENT_FAILED.metadata.reason`. **Reused (NOT modified)**: TokenServiceV2 (Phase 1.1), SessionsServiceV2 (Phase 1.2 — exported as of Phase 1.3), TenantContext (Phase 0.2), SubdomainTenantResolverMiddleware (Phase 2.1 contributes the canonical tenantId hint). **NEW `AuthIntentController`** (177 LOC, 2-dep, NO `@UseGuards` — the intent IS the auth state): 2 endpoints under `@Controller('auth/v2/intents')`. On `status === 'succeeded'`: sets `refresh_token_v2` cookie (mirrors AuthV2Controller Phase 1.3 posture). **3 NEW DTOs**: `AdvanceAuthIntentDto` is a discriminated DTO with `@ValidateIf` per-field on `{ kind }`. **2 new app.config keys**: `authIntentV2Enabled` + `authIntentTtlMs` (15min default). em-ecosystem PR #335 / squash merge `561c141`. **12 files staged** (7 NEW production + 5 MOD), **+1819 / -1 lines**. +31 tests (1357 → **1388**); per-file coverage: auth-intent.service.ts 96.20%, auth-intent.controller.ts 98.87%, create-auth-intent.dto.ts 100%. Coverage global: 91.03% → **90.83%** (−0.20pp; +0.83pp margin still healthy — drop is DTO declarative coverage by design). Verify verdict: **PASS · 3 Accepted-Trivial · schema-validated** (DTO `@ValidateIf` vs class-transformer `@Type({discriminator})`; `CryptoService` dep instead of `MfaService` + inline 8-LOC `findMatchingRecoveryCode` helper; 31 tests vs 34 plan target — coverage targets still met). §15 AUTH change-control: single-PR in-domain case per §15.3.3. State machine: enrich-us → plan → develop → verify (PASS) → commit (561c141) → update-docs all advanced with `schema_validated=true` per FW-004. **Phase 2.3 (Dashboard wiring) remains the final MVP-scope sub-phase** for the D-010 3-week commercial window. |
| **2.3** | Dashboard wiring (first end-to-end JWT v2 consumer in production) | **complete** | SCRUM-499 (PR #336, merge `813e6cd`, 2026-05-22) | Third and final sub-phase of Phase 2 — frontend reference impl consuming the AuthIntent endpoints shipped in Phase 2.2 (`POST /auth/v2/intents` + `/advance`). **Strangler**: v1 `/login` route + `LoginForm.tsx` + `MfaTotpStep.tsx` + v1 `login()` body in `AuthContext.tsx` stay bit-identical (`git diff main` against v1 paths = 0 lines). v2 path lives in parallel behind `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED` (env var, default `false` in prod, `true` in CI/dev — Next.js inlines at build time). **NEW components** under `src/components/auth/v2/` (visual parity with v1 verified — operator-directed mid-`/develop` directive *"tIENES QUE DISEÑARLA EXACTAMENTE IGUAL A LAS DEMÁS"*): `LoginFormV2.tsx` (177 LOC, mirrors v1 LoginForm), `MfaTotpStepV2.tsx` (247 LOC, pixel-equivalent to v1 MfaTotpStep), `TenantPickStep.tsx` (145 LOC, **only genuinely new screen** — same 330/348 layout + stacked `Button variant="outline"` rows, raw tenantIds in font-mono short form per plan decision D2), `AuthIntentFlow.tsx` (46 LOC orchestrator — pure switch on `authIntentStatus`). **NEW `src/lib/auth-intent-api.ts`** (32 LOC, 100% coverage). **MOD `AuthContext.tsx`** (+248 LOC, pure additive): 4 new state fields + 2 reducer actions + 4 public methods (`loginV2`/`advanceMfaV2`/`advanceTenantPickV2`/`cancelAuthIntentV2`) + `handleAuthIntentResult` + `isGoneError` helpers. v1 `login()` body unchanged. **MOD `api.ts`**: `SKIP_REFRESH_ON_401` uses `shouldSkipRefresh()` startsWith helper. **MOD `app/login/page.tsx`**: 1-line conditional. em-ecosystem PR #336 / squash merge `813e6cd`. **16 files staged** (10 NEW + 6 MOD), **+1839 / -3 lines**. **+38 tests** (118 → **156**); aggregate v2-directory coverage 89.65% statements / 91.36% lines. Verify verdict: **PASS · 3 Accepted-Trivial · schema-validated** (38 tests vs ~44 plan target via consolidation; MfaTotpStepV2 coverage 0.11pp short on lines vs 85% target — uncovered catch branches mirror v1; 3 test-selector pivots for RTL+JSDOM quirks). §15 N/A — frontend consumer. Pre-commit prettier auto-fix on 2 long lines (no `--no-verify`). Pre-push CI parity green first push. Operator-feedback saved as memory `feedback_visual_parity_new_ui`. State machine: enrich-us → plan → develop → verify (PASS) → commit (813e6cd) → update-docs all advanced with `schema_validated=true` per FW-004. |
| **2** (umbrella) | AuthIntent + Org/Subdomain + Dashboard | **🎯 COMPLETE** | SCRUM-495 (2.1 ✅) · SCRUM-497 (2.2 ✅) · SCRUM-499 (2.3 ✅) | All 3 sub-phases shipped 2026-05-21 / 2026-05-22 / 2026-05-22. **D-010 MVP scope (3-week commercial window) CLOSED.** Backend (Organization model + Subdomain middleware + AuthIntent state machine) + Frontend (Dashboard wiring with feature flag) all in production main. Both flags default OFF until operator flips: backend `AUTH_INTENT_V2_ENABLED=true` (NestJS env) + frontend `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED=true` (Next.js build env). v1 paths bit-identical to main; v1 endpoints continue serving production traffic. Phase 3 (passkey-first reframing) + Phase 4 (AuthChallenge step-up) become unblocked (deferred post-MVP per D-010). |
| 3 | Passkey-first Reframing |   not_started | — | Blocked by 2 (deferred post-MVP per D-010) |
| 4 | Step-up Auth (AuthChallenge) | not_started | — | Blocked by 2 (can parallelize with 3); deferred post-MVP per D-010 |
| 5 | OIDC Issuer (Stage 1) | not_started | — | Blocked by 0+1+2; deferred post-MVP per D-010 (JWKS endpoint here) |
| 6 | Migration + v1 Sunset | not_started | — | Blocked by all; deferred post-MVP per D-010 |

**Currently active**: 🎯 **Phase 0 + Phase 1 + Phase 2 ALL COMPLETE** (2026-05-19 / 2026-05-20 / 2026-05-21 / 2026-05-22) — **11 tickets shipped across the AUTH v2 wave · D-010 MVP scope (3-week commercial window) CLOSED**:

- **Phase 0** (all 4 sub-phases):
  - **0.1** SCRUM-487 (`1f4aa16`) — Tenant primitives + bootstrap migration
  - **0.2** SCRUM-488 (`c88fa88`) — Prisma tenant-filter middleware
  - **0.3** SCRUM-489 (`b906ed0`) — User.isPlatformAdmin + Role refactor
  - **0.4** SCRUM-491 (`622baa4`) — Tenant HTTP surface
- **Coverage prerequisite**:
  - SCRUM-490 (`6d80f66`) — Backend coverage debt sweep (lifted main from 89.79% → 91.00%; permanently removed override pressure)
- **Phase 1** (all 3 sub-phases):
  - **1.1** SCRUM-492 (`309c38f`) — Token Engine v2 internal scaffolding (`TokenServiceV2` + `JwtPayloadV2`)
  - **1.2** SCRUM-493 (`18fd537`) — Opaque refresh + `SessionsServiceV2` tenant-aware
  - **1.3** SCRUM-494 (`e33fe6b`) — `JwtV2Strategy` + first consumer endpoint `POST /auth/v2/refresh` ← **closes Phase 1**
- **Phase 2 (all 3 sub-phases COMPLETE 🎯 — D-010 MVP scope CLOSED)**:
  - **2.1** SCRUM-495 (`ee3f1ca`) — `Organization` model + `SubdomainTenantResolverMiddleware` (D-007 + D-008 batched)
  - **2.2** SCRUM-497 (`561c141`) — `AuthIntent` state machine (`POST /auth/v2/intents` + `POST /auth/v2/intents/:id/advance`, behind backend `AUTH_INTENT_V2_ENABLED` flag). Closes D-004.
  - **2.3** SCRUM-499 (`813e6cd`) — Dashboard wiring (LoginFormV2 + MfaTotpStepV2 + TenantPickStep + AuthIntentFlow under `src/components/auth/v2/`, behind frontend `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED` flag) ← **closes Phase 2 umbrella + D-010 MVP scope**

Test baseline 1071 → **1320** (+249 tests across the wave). 6 of 8 PRs landed **one-shot CI green** (SCRUM-487 + SCRUM-492 needed admin override on pre-existing coverage debt, NOT ticket scope; debt was cleared by SCRUM-490). Zero net Accepted-Risk / Accepted-Quality / Scope-Gap deviations across both phases. Coverage 89.72% → **91.29% / 91.29%** with +1.29pp margin. Live invariants delivered through HTTP: tenancy primitives + middleware enforcement + capability flag + tenant HTTP lifecycle + v2 access token + opaque refresh + tenant-aware sessions + v2 refresh endpoint.

**Next milestone**: **operator activation decision** — when to flip both feature flags ON in production. Backend `AUTH_INTENT_V2_ENABLED=true` (NestJS env) + frontend `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED=true` (Next.js build env) → v2 login flow goes live. Gradual rollout strategy TBD (single dashboard env vs canary subset). v1 paths remain bit-identical in code; flipping flags off reverts to v1 transparently. **Post-MVP scope unblocked**: Phase 3 (passkey-first reframing — reframes LoginFormV2 to put passkey before password; wires `requires_passkey` transition in backend AuthIntent) + Phase 4 (AuthChallenge step-up — generalizes WithReauth into a primitive). Both deferred post-MVP per D-010. No Jira tickets exist for Phase 3 or Phase 4 yet — operator decision per `feedback_auth_program_ticket_creation`.

**Phase 1 deviation history (all RESOLVED)**:
- Phase 1.1 (SCRUM-492) landed via admin merge override due to pre-existing main coverage debt (89.72% vs 90% threshold).
- **SCRUM-490** (coverage debt sweep) shipped 2026-05-19 (PR #331, merge `6d80f66`) — lifted main to **91.00% / 91.00%**; override pressure removed.
- Phase 1.2 (SCRUM-493) added +0.15pp on top → **91.15% / 91.15%**.
- Phase 1.3 (SCRUM-494) added another +0.14pp → **91.29% / 91.29%**. Coverage floor permanently maintained.

No Jira ticket exists for Phase 2 yet — operator decision on when to create (per `feedback_auth_program_ticket_creation`: agent drafts, operator approves with explicit phrase, agent creates via REST API).

---

## 7. Cross-References

### 7.1 Code paths the program will touch

- `nexacore-api/prisma/schema.prisma` — model additions + mutations
- `nexacore-api/src/auth/**` — entire module (19 files)
- `nexacore-api/src/sessions/**` — tenant scoping
- `nexacore-api/src/permissions/**` — role refactor
- `nexacore-api/src/audit/**` — tenantId in events
- `nexacore-api/src/common/interfaces/jwt-payload.interface.ts` — v2 shape
- `nexacore-api/src/users/**` — query changes
- `nexacore-api/src/app.module.ts` — Prisma middleware registration
- `nexacore-dashboard/**` — frontend integration (AuthIntent consumer)

### 7.2 Prior AUTH audits (16 folders, chronological)

`ai-specs/changes/auth/audit/audit-2026-03-03T16-24/` through `audit-2026-05-14T16-58/`. Latest verdict PASS 83.7%, 0 FAIL. None identified strategic gaps (audit machinery validates correctness, not positioning).

### 7.3 Standards / framework references

- `workflow-standards.mdc §15` — NOT-§15 AUTH change-control. **Every phase respects this.**
- `workflow-standards.mdc §17` — skill versioning (any new skill during program gets versioned).
- `workflow-standards.mdc §22` — audit framework refinement (audits during/after program use the refined machinery).
- `audit-standards.mdc §4.0` — folder naming (canonical `audits/` plural for any audit during program).

### 7.4 Memory entry

`~/.claude/projects/-home-em-admin/memory/project_auth_v2_program.md` — cue for future sessions; points back to this doc.

---

## 8. Risks Register

The 12 multi-tenant risks identified during analysis:

| # | Risk | Severity | Phase that mitigates |
|---|------|----------|----------------------|
| MT-1 | JWT has no tenantId → any token works in any tenant after we add tenancy | **CRITICAL** | Phase 1 |
| MT-2 | Session has no tenantId → same problem server-side | **CRITICAL** | Phase 1 |
| MT-3 | `email @unique` global blocks "same email, two tenants, separate data" | HIGH | Phase 0 (gradual; preserve constraint during transition) |
| MT-4 | `Role` global on User = god-mode cross-tenant for SUPERADMIN | **CRITICAL** | Phase 0 |
| MT-5 | `AuditLog` has no tenantId → multi-tenant compliance (GDPR/SOC2) impossible | HIGH | Phase 0 |
| MT-6 | `OAuthAccount` provider config global → each tenant might want own OAuth app | MEDIUM | Phase 0 (TenantSettings.authPolicy) |
| MT-7 | Permission catalog global; no per-tenant override | MEDIUM | Phase 0 (default) / future |
| MT-8 | TrustedDevice has no tenantId → trusted laptop in tenant A bypasses MFA in tenant B | HIGH | Phase 0 |
| MT-9 | No Prisma tenant-filter middleware → forgotten `where: tenantId` = cross-tenant data leak | **CRITICAL** | Phase 0 |
| MT-10 | `revokeAllUserSessions(userId)` revokes cross-tenant (poor UX) | MEDIUM | Phase 1 (sessions tenant-aware) |
| MT-11 | No concept of "tenant trial/suspended/deleted" — suspended tenant should block login | HIGH | Phase 0 |
| MT-12 | CORS/CSRF not tenant-aware → mismo-origin policy for all tenants with custom domains | HIGH | Phase 0 / Phase 6 (white-label) |

**MT-1 + MT-2 + MT-4 + MT-9 are blocking**. Without resolving them, NexaCore cannot sell multi-tenant. They are all addressed in Phases 0-1.

---

## 9. Operating Conventions

### How to consult this doc in a future session

1. Auto-memory entry (`project_auth_v2_program.md`) provides the cue.
2. Read this doc top-to-bottom — §0 first for context, §6 for current state, §5 for decisions.
3. Open the ticket for the current phase: `ai-specs/changes/auth/plans/<sprint>/<ticket>_<scope>.md`.
4. Cross-reference code paths in §7.1 before making changes.

### How to update this doc

| Trigger | What to update |
|---------|---------------|
| New decision crystallizes | Append to §5 with D-NNN id |
| Phase starts | §6 → `in_progress`; §1 `last_updated` |
| Phase completes | §6 → `completed`; add "Phase N Closure" entry to §5 |
| Reusability estimate proves wrong | Correct §3 |
| Risk resolved | Mark MT-N resolved in §8 |
| New ticket lands | Add to `related_tickets` frontmatter |

### What NOT to do

- Do NOT delete past decisions from §5. Append-only.
- Do NOT change the 7-phase order without an explicit D-NNN decision entry justifying it.
- Do NOT promote OIDC federation IN (Stage 2) into this program without operator approval.
- Do NOT skip Phase 0 because "we can add tenancy later". That is exactly the trap the program exists to avoid.
- Do NOT touch AUTH files outside the current phase's scope. §15 NOT-AUTH change-control applies inside the program too.

---

## 10. Closing the program

The program completes when:
- All 7 phases hit their gate of exit.
- v1 AUTH code is removed (Phase 6 gate).
- A new audit cycle (`/audit auth full`) verifies the new module against `audit-standards.mdc`.
- `audit-maturity-history.yml` records the post-program maturity delta.
- This doc's `status` field changes from `active` to `completed` and `completed_at` is added to frontmatter.

After closure, this doc remains as historical record. The decision log becomes input for future architectural decisions; the reusability inventory becomes calibration data for future rewrites.
