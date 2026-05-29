---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-491
sprint: Sprint 15
scope: backend
module: tenants
date: 2026-05-19
status: draft
last_completed_ticket: SCRUM-489
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-491 Tenant HTTP Surface (AUTH v2 Phase 0.4)

## 1. Codebase State Snapshot

- **Date**: 2026-05-19
- **Last completed ticket**: SCRUM-489 (User.isPlatformAdmin + Role refactor, merged `b906ed0` on `main`)
- **Integration state verified**: Yes — `integration-state.md` is current as of SCRUM-489's `/update-docs` (2026-05-19 changelog row at the top).
- **Framework version**: 0.15.0.

### Files verified against live code

- `nexacore-api/prisma/schema.prisma` — confirms `TenantInvitation { id, tenantId, email, role (TenantRole default MEMBER), tokenHash @unique, invitedBy, expiresAt, acceptedAt?, createdAt, updatedAt }` with `@@index([tenantId])` + `@@index([email])`. Confirms `TenantMembership { id, tenantId, userId, role (TenantRole default MEMBER), status (MembershipStatus default active), invitedBy?, joinedAt, lastActiveAt, createdAt, updatedAt }` with `@@unique([tenantId, userId])` + indices on `[userId]`, `[tenantId]`, `[userId, status]`. The `tokenHash` field has the misleading `/// @sensitive — invitation token bcrypt hash` comment (the docstring this plan corrects).
- `nexacore-api/src/tenants/tenants.module.ts` — `@Global() @Module({ providers: [TenantsService], exports: [TenantsService] })`. No controllers yet.
- `nexacore-api/src/tenants/tenants.service.ts` — `TenantsService(prisma: PrismaService)` with 5 methods: `findById`, `findBySlug`, `create`, `update`, `findFirstActiveMembership` (added by SCRUM-489).
- `nexacore-api/src/common/context/tenant-context.ts` — `TenantContext.run(tenantId, fn)`, `runWithBypass(reason, fn)`, `getActiveTenantId()`, `isBypassed()`, `getOrThrow()`. Used both by the global interceptor (SCRUM-488) and by service bootstrap paths (SCRUM-489).
- `nexacore-api/src/audit/audit.service.ts` — `AuditService(prisma: PrismaService)`. `log(entry: AuditLogEntry)` shape: `{ action, userId?, targetUserId?, ipAddress?, userAgent?, metadata? }`. Errors swallowed internally.
- `nexacore-api/src/audit/audit.module.ts` — NOT `@Global`. AuditModule must be imported by any module whose providers inject AuditService.
- `nexacore-api/src/audit/enums/audit-action.enum.ts` — 41 values today (40 baseline + `TENANT_FILTER_BYPASS` from SCRUM-489). The 5 new values for this ticket all carry the `TENANT_*` prefix established by SCRUM-489.
- `nexacore-api/src/auth/guards/jwt-auth.guard.ts` — standard `JwtAuthGuard extends AuthGuard('jwt')`. No constructor deps. Always available (Passport global registry).
- `nexacore-api/src/auth/strategies/jwt.strategy.ts` — `validate()` returns `toSafeUser(user)`; `req.user` carries `{id, email, role, isPlatformAdmin, ...}` post-SCRUM-489.
- `nexacore-api/src/common/constants/error-messages.ts` — already has `tenants: { SLUG_TAKEN, NOT_FOUND }` and `tenantContext: { MISSING, CROSS_TENANT, BYPASS_WITHOUT_REASON }`. This plan adds a new `invitations: { ... }` namespace.
- `nexacore-api/src/common/filters/http-exception.filter.ts` — universal `@Catch()`, maps HttpException subclasses to `{success: false, error: {message, code, statusCode}}` envelope. `GoneException` and `NotFoundException` resolve cleanly.
- `nexacore-api/src/auth/constants/auth.constants.ts` — `THROTTLE_CONFIGS.sensitiveAction` already exists. Used by `account.controller.ts` (`@Throttle(THROTTLE_CONFIGS.sensitiveAction)`). The plan reuses this constant for `createInvitation` and `acceptInvitation`.
- `nexacore-api/src/app.module.ts` — `ThrottlerModule.forRoot([{name:'global', ttl, limit}])`. Per-route `@Throttle({...})` overrides. The throttler tracker is the default (IP-based per `@nestjs/throttler` defaults). The plan documents this as "effectively per-IP" — tenant-scoped tracker is Phase 1+ work.
- `nexacore-api/src/users/users.controller.ts` — sample of `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(Role.ADMIN) @RequirePermissions('users:write')` pattern. `req.user` typed inline with `{ id, role, isPlatformAdmin }` after SCRUM-489.
- `nexacore-api/src/tenants/dto/create-tenant.dto.ts` — sample of the DTO conventions used in this module: `@ApiProperty`, `class-validator` decorators, `@IsEnum(...) as const` style.

### Constructor signatures verified

- `TenantsService(prisma: PrismaService)` — 1 arg.
- `AuditService(prisma: PrismaService)` — 1 arg.
- All target NEW services (`InvitationsService`, `MembershipsService`) are designed below.

### Methods verified to exist

- `TenantsService.findById(id)` — `tenants.service.ts:34`.
- `TenantsService.findFirstActiveMembership(userId)` — `tenants.service.ts:123` (SCRUM-489).
- `AuditService.log(entry)` — `audit.service.ts:13`.
- `TenantContext.run(tenantId, fn)` + `runWithBypass(reason, fn)` + `getActiveTenantId()` — `tenant-context.ts`.

### Guard dependency chain verified

The new `TenantsController` will use `@UseGuards(JwtAuthGuard)`. **No RolesGuard / PermissionsGuard on this controller** — Phase 0.4 authorization is membership-role-based (OWNER/ADMIN/MEMBER inside `TenantMembership.role`), not platform-Role-based. The membership-role check is implemented as a service-layer helper (`MembershipsService.requireTenantRole(tenantId, userId, allowedRoles)`), NOT a NestJS guard. Rationale: NestJS guards see `req.user` but cannot easily access route params (the `:tenantId` path param) without ExecutionContext gymnastics — cleaner as service-layer assertion that consumes the resolved path param.

`JwtAuthGuard` requires zero module imports (Passport global). No new guard deps.

### Discrepancies with integration-state.md

None. `integration-state.md` was refreshed at SCRUM-489 `/update-docs`. The Guard Dependency Map row for `RolesGuard` mentions `User.isPlatformAdmin` (SCRUM-489 update); this plan does NOT touch that row.

### Plan-time decisions (locked from /enrich-us open questions)

The enrichment surfaced 7 open questions for `/plan`. All 7 are resolved here:

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | Cross-tenant denial code (404 vs 403) | **404 Not Found** | Hides tenant existence from non-members. Aligned with GitHub/Linear convention. Implementation: `MembershipsService.requireMembership(tenantId, userId)` throws `NotFoundException(ErrorMessages.tenants.NOT_FOUND)` when no row matches; the tenant-filter middleware (SCRUM-488) is the secondary safety net (any leak through to Prisma queries throws CrossTenantViolation → 500). The 404 fires FIRST at the controller layer for a clean UX. |
| Q2 | `expireInvitation` admin endpoint | **NO** | Out of scope. Derived expire-on-accept is sufficient. Force-expire is functionally equivalent to revokeInvitation. If admin tooling ever needs force-expire as distinct from revoke, that's a Phase 2+ enhancement. |
| Q3 | Soft-delete `revokedAt` column | **NO — hard-delete** | The `TENANT_INVITATION_REVOKED` audit log row is sufficient evidence. Hard-delete keeps the schema clean AND keeps the partial unique index simple (`WHERE acceptedAt IS NULL` — no second clause). |
| Q4 | `TENANT_INVITATION_EMAIL_MISMATCH_REJECTED` as 6th audit value | **YES** | Symmetric with `TENANT_INVITATION_EXPIRE_REJECTED` (already in enrichment). Both rejection paths are security signals (token misuse attempt). Total enum additions: **6 new `TENANT_*` AuditAction values** (not 5 as the enrichment said). |
| Q5 | `revokeInvitation` "OR invitedBy" | **NO** | Capability follows current role. Demote case → handled by Phase 2+ if UX feedback emerges. |
| Q6 | Audit metadata blob shape | **Per-action shape locked** | See §5.5 below for the 6 explicit blob shapes. Emails redacted via the existing `audit.service.ts` redaction convention (operator concerns out of scope of this ticket). |
| Q7 | Throttler scope | **User-scoped via existing `THROTTLE_CONFIGS.sensitiveAction`** | NestJS throttler default tracker = IP-based (`req.ip`). Tenant-scoped tracker requires a custom `getTracker(req)` implementation that reads `req.user.id` or a tenant id — non-trivial. Phase 0.4 reuses the existing `sensitiveAction` config (5 req/min/IP). Tenant-scoped throttling deferred to Phase 1+. |

### CI Gate Anticipation (per workflow-standards §22 / SCRUM-485)

| CI gate                                       | Expected behavior |
|-----------------------------------------------|-------------------|
| Job 1: `py_compile (all tools)`               | PASS / unchanged (no Python tooling touched) |
| Job 2: `Schema validate (changed artifacts)`  | PASS — plan + verify + record artifacts route via `changes/tenants/{plans,records}/Sprint 15/` SCHEMA_BY_PATH rules already in place from SCRUM-487/488 |
| Job 2: `Groundedness (warn-only)`             | PASS / unchanged |
| Job 2: `Audit: coupling check (warn-only)`    | PASS / unchanged (no F/G findings) |
| Job 2: `Audit: completion check (warn-only)`  | SKIP (no new audit folder) |
| Job 3: `Schema validate (historical)`         | SKIP (no `schemas/**` change) |
| Job 4: `Smoke test: state-machine.py`         | PASS / unchanged |
| Job 5: `pytest (linchpin tests)`              | PASS / unchanged |
| em-ecosystem CI Layer 4 (Backend Tests)       | **target PASS** — adds ≥30 new tests across 4 unit specs + 1 integration spec. Coverage net-positive (4 endpoints × happy + edge × authorization paths is dense). |
| em-ecosystem CI Layer 5 (Build Backend)       | PASS — pure NestJS additions, no DI churn outside the tenants module |

**SKIP_PATHS / SCHEMA_BY_PATH expectations**: no new `.md`/`.yml` files outside `ai-specs/changes/tenants/{plans,records}/Sprint 15/SCRUM-491_*`. Existing routing covers this ticket.

## 2. Regression Impact Analysis

### Blast radius

**Direct dependents of modified files**:

| File | Type of change | Direct dependents (production) |
|------|----------------|--------------------------------|
| `prisma/schema.prisma` | +6 enum values + 1 comment correction (no model changes) | All Prisma client consumers (compile-time only — additive enum doesn't break) |
| `src/audit/enums/audit-action.enum.ts` | +6 TS enum values | Mirror of Prisma — additive |
| `src/tenants/tenants.module.ts` | +1 controller, +2 services, +1 module import (AuditModule) | None (consumed via DI by tests + app boot) |
| `src/common/constants/error-messages.ts` | +1 namespace (`invitations`) | None — additive |

**NEW files (production)**: 7 files

| File | Purpose |
|------|---------|
| `src/tenants/tenants.controller.ts` | 4 HTTP endpoints |
| `src/tenants/invitations.service.ts` | createInvitation, acceptInvitation, revokeInvitation, derived expire check |
| `src/tenants/memberships.service.ts` | listMembers + `requireMembership` / `requireTenantRole` helpers |
| `src/tenants/dto/create-invitation.dto.ts` | `{email, role, expiresInDays?}` |
| `src/tenants/dto/accept-invitation.dto.ts` | `{token}` |
| `src/tenants/dto/invitation-response.dto.ts` | response projection |
| `src/tenants/dto/member-response.dto.ts` | response projection |

**Test dependents**: zero EXISTING spec files require updates. Reason: no class constructor signatures changed at existing classes (`TenantsService`, `AuditService`, `PrismaService` all unchanged). The 6 new audit values are additive — existing tests that check specific actions don't break. The error-messages namespace addition is additive.

NEW spec files (5):

- `src/tenants/tests/tenants.controller.spec.ts` — controller unit (mocks services)
- `src/tenants/tests/invitations.service.spec.ts` — service unit (mocks Prisma)
- `src/tenants/tests/memberships.service.spec.ts` — service unit
- `src/tenants/tests/tenants.integration.spec.ts` — e2e through NestJS testing module with sqlite-or-real-DB (decision at /develop step 6)
- `src/tenants/tests/invitations.dto.spec.ts` — DTO validation (followup pattern from SCRUM-487's `tenants.dto.spec.ts`)

### Breaking changes identified

**None.** All changes are additive:

| Change | Why it's not breaking |
|--------|----------------------|
| 6 new `AuditAction` enum values | Prisma `ALTER TYPE ADD VALUE` is additive. No existing row references these values; no exhaustive switch statements over `AuditAction` in the codebase (verified via grep). |
| Partial unique index on `tenant_invitations` | New constraint — only fires on `INSERT`. Existing rows (bootstrap migration from SCRUM-487 created zero invitations) cannot violate. Tested in §6 Step 6. |
| `invitations` namespace in ErrorMessages | Additive — no rename or removal of existing keys. |
| New controller routes under `/tenants/...` | No existing route at `/tenants/...` (TenantsModule had no controller pre-SCRUM-491). Zero collision risk. |
| AuditModule import in TenantsModule | TenantsModule was previously self-contained (only Prisma global). Adding `imports: [AuditModule]` is a standard pattern — no module deletion or removal. |
| `tokenHash` comment correction (bcrypt → sha256) | `///` Prisma doc comment. Does NOT generate a migration (Prisma `migrate dev` ignores them). Pure schema documentation. |

### API contract impact

**4 new HTTP endpoints**. `api-spec.yml` needs to be updated at `/update-docs` (step N+1). All endpoints are NEW (no modification of existing). Frontend impact: zero existing frontend code uses these routes; new dashboard features will consume them in a separate ticket.

### Schema migration impact

Two migrations in this ticket:

1. **Prisma enum extension migration** — hand-rolled SQL (P3014 shadow DB constraint workaround per SCRUM-487/489 pattern):
   ```sql
   ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_CREATED';
   ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_ACCEPTED';
   ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_REVOKED';
   ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_EXPIRE_REJECTED';
   ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_EMAIL_MISMATCH_REJECTED';
   ALTER TYPE "AuditAction" ADD VALUE 'TENANT_MEMBERSHIP_CREATED';
   ```
   Note: Postgres `ALTER TYPE ... ADD VALUE` cannot run inside a transaction. Each statement is its own standalone DDL — exactly the pattern used by `20260328194437_add_oauth_auto_verified_audit_action` and `20260519105759_add_tenant_filter_bypass_audit_action`.

2. **Partial unique index migration** — separate raw SQL migration:
   ```sql
   CREATE UNIQUE INDEX "uniq_tenant_invitation_pending"
     ON "tenant_invitations" ("tenantId", LOWER("email"))
     WHERE "acceptedAt" IS NULL;
   ```

**Backward compatibility**: both migrations are additive. Zero existing rows in `tenant_invitations` (bootstrap migration created zero invitations; only memberships). No existing code path fails on these adds.

### Test files requiring updates

**None.** All test impact lives in NEW spec files (listed above). No existing spec needs modification.

### Blast radius size

**11 files touched (production)**: 4 MOD (schema, audit enum, error-messages, tenants.module) + 7 NEW (controller + 2 services + 4 DTOs). Above the 5-file extra-review threshold — flag for `/verify` careful regression sweep. The "no existing test files modified" claim is the key verification target.

## 3. Overview

Phase 0.4 ships the **first HTTP layer that exercises the SCRUM-488 tenant-filter middleware end-to-end** through real request traffic. Adds 4 endpoints and 1 derived behavior over the existing `TenantInvitation` + `TenantMembership` schema (created in SCRUM-487):

- `POST /tenants/:tenantId/invitations` (createInvitation)
- `POST /tenants/invitations/accept` (acceptInvitation)
- `DELETE /tenants/:tenantId/invitations/:invitationId` (revokeInvitation, hard-delete)
- `GET /tenants/:tenantId/members` (listMembers)
- Derived: `acceptInvitation` rejects expired tokens (`410 Gone`) + emits `TENANT_INVITATION_EXPIRE_REJECTED` audit event

Architecture principles:

- **Service-layer authorization for tenant-role checks** (not NestJS guards) — guards see `req.user` but not route params cleanly; the membership-role check needs `:tenantId` from the URL. A `MembershipsService.requireTenantRole(tenantId, userId, allowedRoles)` helper at the service entry point reads cleaner than `@UseGuards(TenantOwnerOrAdminGuard)` would.
- **Defense in depth on cross-tenant**: 404 from controller (preferred UX) + `CrossTenantViolationError` from the SCRUM-488 extension (backstop). Both fire FIRST through `TenantContext.run(:tenantId, ...)` block; if the user isn't a member, the membership check throws 404 before any tenant-scoped Prisma query runs.
- **Token security**: 32-byte CSPRNG → base64url. SHA-256 deterministic hash for the `@unique` constraint (correcting the misleading `bcrypt` comment from SCRUM-487). Plaintext token returned ONCE in the create response; never logged.
- **Idempotency under concurrency**: partial unique index `WHERE acceptedAt IS NULL` is the DB-level enforcement; service does a `findFirst` pre-check for UX (no race-rare exception in the happy path). Race window covered by the constraint.
- **Hard-delete on revoke**: keeps schema + index simple; audit log carries the evidence.

`/tenant/switch` is explicitly out — Phase 1 with JWT v2 reissue mechanics. See §10 out-of-scope.

## 4. Architecture Context

### Modules involved

- **TenantsModule** (existing, `@Global`) — gains 1 controller + 2 services. NEEDS `imports: [AuditModule]` (AuditService not global; required by the 2 new services that log lifecycle events).
- **AuditModule** (existing, non-global) — no changes; imported by TenantsModule.
- **PrismaModule** (existing, `@Global`) — no changes.
- **AuthModule** (existing) — no changes. `JwtAuthGuard` is used by TenantsController but it's Passport-global, no import needed.

### Components affected

| Layer | Component | Disposition |
|-------|-----------|-------------|
| Schema | `prisma/schema.prisma` | +6 enum values + 1 `///` doc comment correction |
| Migrations | `prisma/migrations/<ts>_invitation_audit_actions/migration.sql` (NEW) | 6× `ALTER TYPE ADD VALUE` |
| Migrations | `prisma/migrations/<ts>_invitation_partial_unique/migration.sql` (NEW) | Raw SQL `CREATE UNIQUE INDEX ... WHERE acceptedAt IS NULL` |
| TS enum | `src/audit/enums/audit-action.enum.ts` | +6 values |
| Module | `src/tenants/tenants.module.ts` | `imports: [AuditModule]`; `controllers: [TenantsController]`; `providers: [..., InvitationsService, MembershipsService]`; `exports: [..., MembershipsService]` |
| Controller | `src/tenants/tenants.controller.ts` (NEW) | 4 routes |
| Service | `src/tenants/invitations.service.ts` (NEW) | createInvitation, acceptInvitation, revokeInvitation, expire-on-accept check |
| Service | `src/tenants/memberships.service.ts` (NEW) | listMembers, requireMembership, requireTenantRole |
| DTOs | `src/tenants/dto/{create-invitation, accept-invitation, invitation-response, member-response}.dto.ts` (NEW) | Validation + response projections |
| Errors | `src/common/constants/error-messages.ts` | +1 namespace `invitations: { NOT_FOUND, EXPIRED, EMAIL_MISMATCH, ALREADY_ACCEPTED }` |
| Tests | 5 NEW spec files under `src/tenants/tests/` | See §2 blast radius |

## 5. Architecture Context — Detailed Patterns

### 5.1 Controller wiring + tenant-context propagation

The controller methods wrap the handler body in `TenantContext.run(tenantId, ...)` so the SCRUM-488 middleware sees the active tenant for every tenant-scoped Prisma query. Pattern:

```typescript
// tenants.controller.ts (sketch — final code at /develop)
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(
    private readonly invitations: InvitationsService,
    private readonly memberships: MembershipsService,
  ) {}

  @Post(':tenantId/invitations')
  @Throttle(THROTTLE_CONFIGS.sensitiveAction)
  async createInvitation(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateInvitationDto,
    @Request() req: { user: { id: string; isPlatformAdmin: boolean }; ip?: string; headers?: Record<string, string> },
  ): Promise<InvitationResponseDto> {
    await this.memberships.requireTenantRole(tenantId, req.user.id, [TenantRole.OWNER, TenantRole.ADMIN], req.user.isPlatformAdmin);
    return TenantContext.run(tenantId, () =>
      this.invitations.createInvitation(tenantId, req.user.id, dto, this.requestMeta(req)),
    ) as Promise<InvitationResponseDto>;
  }

  // ... acceptInvitation, revokeInvitation, listMembers ...

  private requestMeta(req: { ip?: string; headers?: Record<string, string> }) {
    return { ipAddress: req.ip ?? null, userAgent: req.headers?.['user-agent'] ?? null };
  }
}
```

**Key invariants**:

- The membership-role check runs FIRST (before `TenantContext.run`). It needs the bypass-context for the bootstrap lookup (same as SCRUM-489's `findFirstActiveMembership` — uses `TenantContext.runWithBypass('tenant-context-resolution', ...)` internally).
- `acceptInvitation` is the exception: it does NOT take `:tenantId` from the URL (the user doesn't know which tenant the invitation belongs to before accepting). The invitation lookup runs in bypass scope (token-only lookup), then resolves the tenant from `invitation.tenantId`, THEN wraps the membership creation in `TenantContext.run(invitation.tenantId, ...)`.
- `isPlatformAdmin: true` → bypass the membership check entirely (platform admins can invite/revoke across any tenant for support purposes; cross-tenant access still audited via `TENANT_FILTER_BYPASS` if they hit a scoped query, but the controller-level membership check is the gate here).

### 5.2 Token mechanics

```typescript
// invitations.service.ts (sketch)
import { randomBytes, createHash } from 'crypto';

function generateToken(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(32).toString('base64url'); // 43 chars
  const hash = createHash('sha256').update(plaintext).digest('hex'); // 64 hex chars
  return { plaintext, hash };
}

function hashToken(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}
```

- 32 bytes of CSPRNG → base64url encoding → 43-char URL-safe string.
- SHA-256 deterministic → `findUnique({ where: { tokenHash: hashToken(candidate) } })`.
- Comment correction in `schema.prisma`: `/// @sensitive — invitation token bcrypt hash` → `/// @sensitive — invitation token SHA-256 hash (hex)`.

### 5.3 createInvitation idempotency + concurrency

```typescript
// invitations.service.ts (sketch — full flow)
async createInvitation(tenantId: string, invitedBy: string, dto: CreateInvitationDto, meta: RequestMeta): Promise<InvitationResponseDto> {
  const normalizedEmail = dto.email.toLowerCase();

  // (1) UX-friendly: check for existing pending invitation
  const existing = await this.prisma.tenantInvitation.findFirst({
    where: { tenantId, email: { equals: normalizedEmail, mode: 'insensitive' }, acceptedAt: null },
  });
  if (existing) {
    // Idempotent: return the existing invitation WITHOUT a token (token is single-emission).
    return this.toResponseDto(existing, { token: null });
  }

  // (2) Generate + insert (DB constraint covers concurrent-call race window)
  const { plaintext, hash } = generateToken();
  const expiresAt = new Date(Date.now() + (dto.expiresInDays ?? 7) * 24 * 60 * 60 * 1000);

  try {
    const invitation = await this.prisma.tenantInvitation.create({
      data: { tenantId, email: normalizedEmail, role: dto.role, tokenHash: hash, invitedBy, expiresAt },
    });
    await this.audit.log({ action: AuditAction.TENANT_INVITATION_CREATED, userId: invitedBy, ipAddress: meta.ipAddress, userAgent: meta.userAgent, metadata: { invitationId: invitation.id, tenantId, targetEmail: normalizedEmail, role: dto.role, expiresAt } });
    return this.toResponseDto(invitation, { token: plaintext });
  } catch (err) {
    // Race: partial unique index conflict → re-fetch and return existing.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const racedExisting = await this.prisma.tenantInvitation.findFirst({
        where: { tenantId, email: normalizedEmail, acceptedAt: null },
      });
      if (racedExisting) return this.toResponseDto(racedExisting, { token: null });
    }
    throw err;
  }
}
```

**Why two queries (findFirst + create with race recovery)**: the findFirst is the UX-friendly happy path (no exception under sequential calls). The race-recovery branch covers the concurrent-call window. The DB partial unique index is the source of truth.

**Why the second response omits `token`**: tokens are single-emission. The caller who creates the invitation first receives the plaintext. A duplicate `createInvitation` call CANNOT learn the existing plaintext (irrecoverable — only the hash is stored). Returning `token: null` is the signal that "this invitation already exists; ask the original inviter for the link".

### 5.4 acceptInvitation flow

```typescript
async acceptInvitation(token: string, userId: string, userEmail: string, meta: RequestMeta): Promise<{ membershipId: string; tenantId: string; role: TenantRole; status: MembershipStatus }> {
  const hash = hashToken(token);

  // Bypass scope for the token lookup — we don't know the tenant yet.
  const invitation = await TenantContext.runWithBypass('invitation-token-lookup', () =>
    this.prisma.tenantInvitation.findUnique({ where: { tokenHash: hash } }),
  );
  if (!invitation) {
    throw new NotFoundException(ErrorMessages.invitations.NOT_FOUND);
  }

  // Re-accept idempotency: if already accepted by this user, return existing membership.
  if (invitation.acceptedAt) {
    const existing = await TenantContext.runWithBypass('invitation-token-lookup', () =>
      this.prisma.tenantMembership.findUnique({ where: { tenantId_userId: { tenantId: invitation.tenantId, userId } } }),
    );
    if (existing && existing.status === MembershipStatus.active) {
      return { membershipId: existing.id, tenantId: invitation.tenantId, role: existing.role, status: existing.status };
    }
    // accepted-by-someone-else (token-stuffing attempt)
    throw new ConflictException(ErrorMessages.invitations.ALREADY_ACCEPTED);
  }

  // Expire-on-accept: derived behavior.
  if (invitation.expiresAt.getTime() < Date.now()) {
    await this.audit.log({
      action: AuditAction.TENANT_INVITATION_EXPIRE_REJECTED,
      userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
      metadata: { invitationId: invitation.id, tenantId: invitation.tenantId, expiresAt: invitation.expiresAt },
    });
    throw new GoneException(ErrorMessages.invitations.EXPIRED);
  }

  // Email match: case-insensitive.
  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    await this.audit.log({
      action: AuditAction.TENANT_INVITATION_EMAIL_MISMATCH_REJECTED,
      userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
      metadata: { invitationId: invitation.id, tenantId: invitation.tenantId, expectedEmail: invitation.email, actualEmail: userEmail },
    });
    throw new ForbiddenException(ErrorMessages.invitations.EMAIL_MISMATCH);
  }

  // All checks passed: atomically (a) materialize membership, (b) set acceptedAt, (c) audit.
  return TenantContext.run(invitation.tenantId, async () => {
    const result = await this.prisma.$transaction(async (tx) => {
      const acceptedAt = new Date();
      await tx.tenantInvitation.update({ where: { id: invitation.id }, data: { acceptedAt } });
      const membership = await tx.tenantMembership.upsert({
        where: { tenantId_userId: { tenantId: invitation.tenantId, userId } },
        create: { tenantId: invitation.tenantId, userId, role: invitation.role, status: MembershipStatus.active, invitedBy: invitation.invitedBy, joinedAt: acceptedAt, lastActiveAt: acceptedAt },
        update: { role: invitation.role, status: MembershipStatus.active, lastActiveAt: acceptedAt },
      });
      return membership;
    });
    await this.audit.log({
      action: AuditAction.TENANT_INVITATION_ACCEPTED,
      userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
      metadata: { invitationId: invitation.id, tenantId: invitation.tenantId, membershipId: result.id, role: result.role },
    });
    await this.audit.log({
      action: AuditAction.TENANT_MEMBERSHIP_CREATED,
      userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
      metadata: { membershipId: result.id, tenantId: invitation.tenantId, role: result.role },
    });
    return { membershipId: result.id, tenantId: invitation.tenantId, role: result.role, status: result.status };
  }) as Promise<{ membershipId: string; tenantId: string; role: TenantRole; status: MembershipStatus }>;
}
```

**Upsert rationale**: the bootstrap migration in SCRUM-487 created a membership for every existing user in their "Personal Workspace" tenant. If a user is invited to a NEW tenant they have no row in. If a user is RE-invited to a tenant they already have a (perhaps suspended) row in, the upsert reactivates / role-updates. Cleaner than insert-with-conflict-handling.

### 5.5 Audit metadata blob shapes (per-action contracts)

| Action | Required keys | Optional |
|--------|---------------|----------|
| `TENANT_INVITATION_CREATED` | `invitationId`, `tenantId`, `targetEmail` (redacted in prod), `role`, `expiresAt` | — |
| `TENANT_INVITATION_ACCEPTED` | `invitationId`, `tenantId`, `membershipId`, `role` | — |
| `TENANT_INVITATION_REVOKED` | `invitationId`, `tenantId`, `targetEmail` (redacted in prod) | — |
| `TENANT_INVITATION_EXPIRE_REJECTED` | `invitationId`, `tenantId`, `expiresAt` | `attemptingUserId` (often equal to `userId` on the AuditLog row) |
| `TENANT_INVITATION_EMAIL_MISMATCH_REJECTED` | `invitationId`, `tenantId`, `expectedEmail` (redacted in prod), `actualEmail` (redacted in prod) | — |
| `TENANT_MEMBERSHIP_CREATED` | `membershipId`, `tenantId`, `role` | `invitationId` (when materialized from an invitation) |

Redaction is the responsibility of `AuditService.log()` consumers — the call sites pass the email plain (so dev / debugging works) and the audit redaction layer (if/when active in prod) masks before persist. This is the same pattern SCRUM-433 established.

### 5.6 MembershipsService helpers

```typescript
// memberships.service.ts (sketch)
@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Throws NotFoundException if the user is not a member (404 hides tenant existence). */
  async requireMembership(tenantId: string, userId: string, isPlatformAdmin: boolean): Promise<TenantMembership> {
    if (isPlatformAdmin) {
      // Platform admins skip the membership check. Cross-tenant access still gated by the
      // SCRUM-488 middleware (which they can bypass explicitly via auditAndRunBypass).
      const fake = await this.prisma.tenantMembership.findFirst({ where: { tenantId } });
      // Return a synthetic OWNER-equivalent for capability checks; we never persist this.
      // Alternative: keep a separate code path. See §12 note.
      return fake ?? this.throwNotFound();
    }
    const membership = await TenantContext.runWithBypass('membership-check', () =>
      this.prisma.tenantMembership.findUnique({
        where: { tenantId_userId: { tenantId, userId } },
      }),
    );
    if (!membership || membership.status !== MembershipStatus.active) {
      throw new NotFoundException(ErrorMessages.tenants.NOT_FOUND);
    }
    return membership;
  }

  /** Throws NotFoundException (404, not 403, to hide tenant existence) when caller lacks role. */
  async requireTenantRole(tenantId: string, userId: string, allowedRoles: TenantRole[], isPlatformAdmin: boolean): Promise<TenantMembership> {
    const membership = await this.requireMembership(tenantId, userId, isPlatformAdmin);
    if (isPlatformAdmin) return membership;
    if (!allowedRoles.includes(membership.role)) {
      throw new NotFoundException(ErrorMessages.tenants.NOT_FOUND);
    }
    return membership;
  }

  /** Paginated member list. */
  async listMembers(tenantId: string, page: number, pageSize: number): Promise<{ data: MemberResponseDto[]; page: number; pageSize: number; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.tenantMembership.findMany({
        where: { tenantId },
        include: { user: { select: { email: true } } },
        orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.tenantMembership.count({ where: { tenantId } }),
    ]);
    return { data: rows.map(toMemberResponseDto), page, pageSize, total };
  }

  private throwNotFound(): never { throw new NotFoundException(ErrorMessages.tenants.NOT_FOUND); }
}
```

**Note on platform-admin path** (§12 follow-up): the synthetic OWNER-equivalent return for platform-admin is a code smell. A cleaner refactor is two separate helpers: `requireMembershipOrPlatformAdmin` and a controller-side branch. Documented as `/plan` Accepted-Trivial — implement the simpler version for Phase 0.4 and revisit when Phase 1 makes the bypass pattern more concrete.

### 5.7 DTO shapes

```typescript
// create-invitation.dto.ts
export class CreateInvitationDto {
  @ApiProperty({ description: 'Email of the invitee', example: 'alice@acme.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ enum: TenantRole, example: 'MEMBER' })
  @IsEnum(TenantRole)
  role!: TenantRole;

  @ApiProperty({ description: 'TTL in days (default 7, max 30)', required: false, default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}

// accept-invitation.dto.ts
export class AcceptInvitationDto {
  @ApiProperty({ description: 'Invitation token (plaintext, 43 chars base64url)' })
  @IsString()
  @Length(40, 64)
  token!: string;
}
```

`InvitationResponseDto` includes `token: string | null` (null for idempotent duplicate response). `MemberResponseDto` includes `userId, email, role, status, joinedAt, lastActiveAt`.

## 6. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-491-tenants-backend`.
- **Branch Naming**: MANDATORY `feature/SCRUM-491-tenants-backend`.
- **Implementation Steps**:
  1. `git checkout main && git pull origin main` — verify HEAD is `b906ed0` or later (SCRUM-489 merged).
  2. `git checkout -b feature/SCRUM-491-tenants-backend`.
  3. `git branch` — confirm.
- **Notes**: First HTTP-surface AUTH v2 ticket. `workflow-standards.mdc §15` review path REQUIRED at /commit (touches AUTH-adjacent code + new AuditAction enum values + schema migration).

### Step 1: Schema + migrations

- **Files**:
  - `nexacore-api/prisma/schema.prisma` (MOD: +6 enum values + 1 comment correction)
  - `nexacore-api/prisma/migrations/<ts>_invitation_audit_actions/migration.sql` (NEW)
  - `nexacore-api/prisma/migrations/<ts2>_invitation_partial_unique/migration.sql` (NEW)
  - `nexacore-api/src/audit/enums/audit-action.enum.ts` (MOD: +6 TS values, mirror)
- **Action**: Two migrations (enum extension + partial unique index) + corrected `tokenHash` comment.
- **Implementation Steps**:
  1. Edit `schema.prisma`: append 6 values to `enum AuditAction { ... }` (TENANT_INVITATION_CREATED, TENANT_INVITATION_ACCEPTED, TENANT_INVITATION_REVOKED, TENANT_INVITATION_EXPIRE_REJECTED, TENANT_INVITATION_EMAIL_MISMATCH_REJECTED, TENANT_MEMBERSHIP_CREATED). Order: alphabetical within the `TENANT_*` group, after `TENANT_FILTER_BYPASS`.
  2. Correct the `///` comment on `TenantInvitation.tokenHash` from `bcrypt hash` to `SHA-256 hash (hex)`.
  3. Hand-write migration #1 `prisma/migrations/<UTC ts>_invitation_audit_actions/migration.sql`:
     ```sql
     -- AlterEnum
     ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_CREATED';
     ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_ACCEPTED';
     ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_REVOKED';
     ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_EXPIRE_REJECTED';
     ALTER TYPE "AuditAction" ADD VALUE 'TENANT_INVITATION_EMAIL_MISMATCH_REJECTED';
     ALTER TYPE "AuditAction" ADD VALUE 'TENANT_MEMBERSHIP_CREATED';
     ```
  4. Hand-write migration #2 `prisma/migrations/<UTC ts +1s>_invitation_partial_unique/migration.sql`:
     ```sql
     CREATE UNIQUE INDEX "uniq_tenant_invitation_pending"
       ON "tenant_invitations" ("tenantId", LOWER("email"))
       WHERE "acceptedAt" IS NULL;
     ```
  5. Apply: `npx prisma migrate deploy`.
  6. `npx prisma generate`.
  7. Append 6 TS enum values to `audit-action.enum.ts` in the same order.
- **Implementation Notes**: P3014 shadow DB workaround applies — hand-write both migrations. Two SEPARATE migration directories so Prisma's migration metadata stays atomic. The partial unique index `LOWER("email")` is functional Postgres syntax — `CREATE UNIQUE INDEX ... ON (..., LOWER(col))` is supported natively.

### Step 2: ErrorMessages.invitations namespace

- **File**: `nexacore-api/src/common/constants/error-messages.ts` (MOD).
- **Action**: Append `invitations` namespace after `tenantContext`.
- **Implementation Steps**:
  ```typescript
  invitations: {
    NOT_FOUND: 'Invitation not found',
    EXPIRED: 'Invitation has expired',
    EMAIL_MISMATCH: 'Invitation email does not match your account',
    ALREADY_ACCEPTED: 'Invitation has already been accepted',
  },
  ```
- **Implementation Notes**: User-facing messages; no internal leakage.

### Step 3: DTOs

- **Files (NEW)**:
  - `nexacore-api/src/tenants/dto/create-invitation.dto.ts`
  - `nexacore-api/src/tenants/dto/accept-invitation.dto.ts`
  - `nexacore-api/src/tenants/dto/invitation-response.dto.ts`
  - `nexacore-api/src/tenants/dto/member-response.dto.ts`
- **Action**: Class-validator + class-transformer + Swagger decorators per §5.7.
- **Implementation Notes**: `expiresInDays` default applies at the service layer (the DTO leaves it undefined when omitted; service defaults to 7). `Length(40, 64)` on the accept token allows the 43-char base64url AND any future hash-format experiments without churn.

### Step 4: InvitationsService

- **File (NEW)**: `nexacore-api/src/tenants/invitations.service.ts`.
- **Action**: Implement createInvitation, acceptInvitation, revokeInvitation per §5.2-5.4.
- **Function Signatures**:
  ```typescript
  createInvitation(tenantId: string, invitedBy: string, dto: CreateInvitationDto, meta: RequestMeta): Promise<InvitationResponseDto>
  acceptInvitation(token: string, userId: string, userEmail: string, meta: RequestMeta): Promise<AcceptResultDto>
  revokeInvitation(tenantId: string, invitationId: string, revokerId: string, meta: RequestMeta): Promise<void>
  ```
- **Dependencies**: `PrismaService`, `AuditService`. Constructor: `(prisma: PrismaService, audit: AuditService)`.
- **Implementation Notes**:
  - revokeInvitation: hard-delete via `prisma.tenantInvitation.delete({ where: { id_tenantId composite via findFirstOrThrow } })`. If `acceptedAt` is set → throw `ConflictException(ErrorMessages.invitations.ALREADY_ACCEPTED)` (you can't revoke something already accepted). 404 on not-found of the row within the tenant scope.
  - Email canonicalization: always lower-case before write AND before query. The partial unique index uses `LOWER("email")` so this is consistent.
  - Token plaintext is returned ONCE via `InvitationResponseDto.token` on createInvitation success. On idempotent duplicate, `token` is `null`.

### Step 5: MembershipsService

- **File (NEW)**: `nexacore-api/src/tenants/memberships.service.ts`.
- **Action**: Implement `requireMembership`, `requireTenantRole`, `listMembers` per §5.6.
- **Dependencies**: `PrismaService`. Constructor: `(prisma: PrismaService)`.
- **Implementation Notes**: All membership-lookups run in `TenantContext.runWithBypass('membership-check', ...)` because membership-resolution IS the bootstrap of tenant-scoped context. This is the same pattern as `TenantsService.findFirstActiveMembership` from SCRUM-489.

### Step 6: TenantsController

- **File (NEW)**: `nexacore-api/src/tenants/tenants.controller.ts`.
- **Action**: 4 endpoints per §5.1.
- **Routes**:
  - `POST /tenants/:tenantId/invitations` — `@UseGuards(JwtAuthGuard) @Throttle(THROTTLE_CONFIGS.sensitiveAction)`
  - `POST /tenants/invitations/accept` — `@UseGuards(JwtAuthGuard) @Throttle(THROTTLE_CONFIGS.sensitiveAction)`
  - `DELETE /tenants/:tenantId/invitations/:invitationId` — `@UseGuards(JwtAuthGuard)`
  - `GET /tenants/:tenantId/members` — `@UseGuards(JwtAuthGuard)`
- **Dependencies**: `InvitationsService`, `MembershipsService`. Constructor: `(invitations: InvitationsService, memberships: MembershipsService)`.
- **Implementation Notes**:
  - `req.user` type: `{ id: string; email: string; role: Role; isPlatformAdmin: boolean }` (post-SCRUM-489).
  - For `acceptInvitation`: NO membership check (the user might not be in any tenant yet). Just pass `req.user.id` and `req.user.email` to the service.
  - `createInvitation` and `revokeInvitation` require `requireTenantRole(tenantId, userId, [OWNER, ADMIN], isPlatformAdmin)` first.
  - `listMembers` requires `requireMembership(tenantId, userId, isPlatformAdmin)` only (any member can list).
  - All handlers wrap their service call in `TenantContext.run(tenantId, ...)` EXCEPT `acceptInvitation` which manages its own bypass-then-run sequence internally.

### Step 7: Register controller + AuditModule import in TenantsModule

- **File (MOD)**: `nexacore-api/src/tenants/tenants.module.ts`.
- **Action**:
  ```typescript
  @Global()
  @Module({
    imports: [AuditModule],
    controllers: [TenantsController],
    providers: [TenantsService, InvitationsService, MembershipsService],
    exports: [TenantsService, MembershipsService],
  })
  export class TenantsModule {}
  ```
- **Implementation Notes**: `MembershipsService` is exported because future tickets (Phase 1 JWT v2, Phase 2 role management) will inject it from other modules. `InvitationsService` stays private to the module (lifecycle owner of invitations only).

### Step 8: Tests

- **Files (NEW)** — 5 spec files:
  - `src/tenants/tests/invitations.dto.spec.ts` — DTO validation (≈8 tests)
  - `src/tenants/tests/invitations.service.spec.ts` — service unit (≈14 tests)
  - `src/tenants/tests/memberships.service.spec.ts` — service unit (≈8 tests)
  - `src/tenants/tests/tenants.controller.spec.ts` — controller unit, mocking services (≈10 tests)
  - `src/tenants/tests/tenants.integration.spec.ts` — e2e via NestJS testing module (≈8 tests)
- **Suite breakdowns**:
  - **invitations.dto.spec.ts**: email format / required, role enum, expiresInDays bounds (1-30), default behavior, token length bounds.
  - **invitations.service.spec.ts**:
    - createInvitation: happy (returns token), idempotent dup (returns existing, token=null), race (P2002 + recovery), expiresAt default 7 days, role echo, audit emitted.
    - acceptInvitation: happy (membership created/upserted, both audit events), token-not-found (404 + no audit), expired (410 + expire audit), email mismatch (403 + mismatch audit), already-accepted same user (200 idempotent), already-accepted different user (409).
    - revokeInvitation: happy (hard-delete + audit), already-accepted (409), not-found (404).
  - **memberships.service.spec.ts**:
    - requireMembership: happy, not-member (404), suspended-member (404), platform-admin bypass.
    - requireTenantRole: happy ALLOWED role, wrong role (404), platform-admin bypass.
    - listMembers: pagination, default pageSize, max pageSize, ordering.
  - **tenants.controller.spec.ts**: 4 routes × happy + 1 authz-fail each.
  - **tenants.integration.spec.ts**:
    - End-to-end happy path: user A invites user B → user B accepts → user A lists members (now sees B).
    - Cross-tenant probe: user in tenant T1 calls `/tenants/T2/members` → 404 (NOT 403).
    - Partial unique index enforcement: direct raw INSERT of duplicate pending invitation → DB rejects with unique violation; subsequent normal API createInvitation returns existing (race-recovery branch tested live).
    - Expire-on-accept: invitation with `expiresAt < now()` → 410 + audit row written.
    - Email mismatch: invitation for `a@x.com` accepted attempt by `b@x.com` → 403 + audit row written.
    - Platform-admin bypass: isPlatformAdmin=true user calls revokeInvitation on a tenant they have no membership in → succeeds + bypass audit (SCRUM-489's TENANT_FILTER_BYPASS not relevant here because the controller-level check is skipped, not the middleware).
- **Implementation Notes**: target net new test count **≥30** (per enrichment AC). Coverage delta net-positive; we're shipping controller + 2 services with full happy + error path coverage on every endpoint.

### Step 9: nest build + jest + lint + migration smoke

- **Action**: Final quality gates.
- **Implementation Steps**:
  1. `npm run build` — exit 0.
  2. `npx jest --maxWorkers=1 --forceExit` — full project ≥ 1174 baseline + ~30 new tests, 0 failures.
  3. `npx eslint 'src/tenants/**/*.ts'` — clean.
  4. `npx prisma migrate status` — both new migrations Applied.
  5. **Smoke verify partial unique index**: `psql -c "SELECT indexname FROM pg_indexes WHERE indexname = 'uniq_tenant_invitation_pending';"` returns one row. (If `psql` auth fails as in SCRUM-489, the integration test for partial-unique-enforcement is the alternate evidence.)

### Step N+1: Update Technical Documentation

- **Action**: DEFERRED-BY-DESIGN to `/update-docs`.
- **Files at `/update-docs`**:
  - `ai-specs/specs/api-spec.yml` — add 4 endpoints with full request/response schemas.
  - `ai-specs/specs/integration-state.md`:
    - Module Registry: TenantsModule gains controller + 2 services + AuditModule import.
    - Controller Guard Chains: new `TenantsController` row.
    - Service Dependency Chains: new edges (`InvitationsService → PrismaService, AuditService`; `MembershipsService → PrismaService`).
    - Changelog row for 2026-05-19 SCRUM-491.
  - `ai-specs/specs/data-model.md`: add 6 new `AuditAction` values to the enum table with descriptions.
  - `ai-specs/changes/auth/programs/AUTH-v2.md` §6: Phase 0.4 row → `complete` with PR + merge SHA. Phase 0 milestone reaffirmed.

## 7. Implementation Order

1. Step 0 — Branch from main
2. Step 1 — Schema + 2 migrations (enum extension + partial unique index)
3. Step 2 — `ErrorMessages.invitations` namespace
4. Step 3 — 4 DTO files
5. Step 4 — InvitationsService
6. Step 5 — MembershipsService
7. Step 6 — TenantsController
8. Step 7 — TenantsModule registration (controllers, providers, exports, AuditModule import)
9. Step 8 — 5 spec files (≥30 new tests)
10. Step 9 — Build + jest + lint + migration smoke

(Step N+1 documentation update at `/update-docs`.)

## 8. Testing Checklist

Post-implementation verification:

- [ ] Both migrations applied: `prisma migrate status` clean.
- [ ] Partial unique index visible in DB: `pg_indexes` query OR integration test enforces it.
- [ ] `nest build` exit 0.
- [ ] `npx jest --maxWorkers=1 --forceExit` — ≥ 1174 + 30 tests; 0 failures.
- [ ] ESLint clean on `src/tenants/**`.
- [ ] **Behavioral gates** (must hold across the integration spec):
  - createInvitation idempotency: second call returns existing, token=null.
  - acceptInvitation expired: 410 + audit row `TENANT_INVITATION_EXPIRE_REJECTED`.
  - acceptInvitation email mismatch: 403 + audit row `TENANT_INVITATION_EMAIL_MISMATCH_REJECTED`.
  - Cross-tenant member list: 404 (not 403).
  - revokeInvitation hard-delete: row gone from DB; audit row present.
  - Race recovery: concurrent createInvitation → DB unique violation → service catches P2002 → returns existing.

### Regression test checklist

No existing test files need updates (per §2). The full jest run is the regression gate; any pre-existing test failure indicates a missed implementation-detail break.

## 9. Error Response Format

All errors mapped by the existing `HttpExceptionFilter`:

| Condition | Exception | HTTP | Message (from ErrorMessages) |
|-----------|-----------|------|------------------------------|
| Invitation token not found | `NotFoundException` | 404 | `Invitation not found` |
| Invitation expired | `GoneException` | 410 | `Invitation has expired` |
| Email mismatch | `ForbiddenException` | 403 | `Invitation email does not match your account` |
| Invitation already accepted (different user attempts) | `ConflictException` | 409 | `Invitation has already been accepted` |
| Cross-tenant access / non-member calls /tenants/:tid endpoint | `NotFoundException` | 404 | `Tenant not found` |
| Caller has wrong tenant-role (MEMBER trying to invite) | `NotFoundException` | 404 | `Tenant not found` (intentionally identical to cross-tenant — hides distinction between "wrong role" and "not a member") |
| Revoke target is already accepted | `ConflictException` | 409 | `Invitation has already been accepted` |
| Validation error (DTO) | `BadRequestException` | 400 | `Validation failed` (existing `HttpExceptionFilter` handles `class-validator` arrays) |

Standard JSON envelope:

```json
{
  "success": false,
  "error": { "message": "Invitation has expired", "code": "GONE", "statusCode": 410 }
}
```

## 10. Partial Update Support

N/A — no PATCH endpoints. revokeInvitation is DELETE; acceptInvitation is POST-with-side-effect (no partial state).

## 11. Dependencies

ZERO new dependencies. All packages already installed:

- `@nestjs/common` — `Controller`, `Get`, `Post`, `Delete`, `Param`, `Body`, `Request`, `UseGuards`, `Injectable`, exception classes.
- `@nestjs/swagger` — `ApiProperty`.
- `@nestjs/throttler` — `Throttle`.
- `class-validator`, `class-transformer` — DTO decorators.
- `@prisma/client` — generated types.
- `crypto` (Node built-in) — `randomBytes`, `createHash`.

## 12. Notes

### Business rules

- **Phase 0.4 ships HTTP surface for invitations + member listing only.** No tenant CRUD, no settings editor, no role changes, no member removal, no `/tenant/switch`.
- **Hard-delete on revoke** is intentional. The audit log row is the evidence trail. If retention requirements emerge → Phase 2+ ticket (per enrichment open question Q3).
- **Cross-tenant denial uses 404 (not 403)** to hide tenant existence. Consistent with GitHub/Linear. The 404 fires at the membership check BEFORE any tenant-scoped Prisma query, ensuring the SCRUM-488 middleware's `CrossTenantViolationError` is only the backstop (never reached in the happy controller flow).
- **`isPlatformAdmin: true` bypasses the controller-level membership check.** This is consistent with SCRUM-489's RolesGuard / PermissionsGuard bypass — platform admins can act across any tenant. The Prisma extension's bypass scope is NOT automatically activated by `isPlatformAdmin`; if the platform admin's controller call triggers a tenant-scoped Prisma query, the extension still enforces. Either the controller wraps the call in `TenantContext.run(tenantId)` (preferred) or the platform admin's flow uses `auditAndRunBypass` explicitly.
- **MembershipsService synthetic-OWNER for platform-admin** (§5.6 sketch) is a code smell. Phase 2+ refactor: extract `IsPlatformAdminGuard` semantics into a separate code path so the helper doesn't return a fake membership. Tracked as informal follow-up (no Jira ticket; out of scope for Phase 0.4).

### Workflow / security constraints

- **NOT-§15 review path REQUIRED**: touches `prisma/schema.prisma` (enum extension is §15.1 AUTH-adjacent), introduces 6 new `AuditAction` values (audit table is auth-adjacent). Single-domain — no split-PR per §15.3.3 (all `src/tenants/**` + schema additive).
- **NEVER `--no-verify`**: Husky pre-commit enforces Prettier — auto-fix at /develop step 9.
- **NEVER commit fixes for other tickets**: pre-existing bugs on a separate branch.
- **Token plaintext logging**: NEVER. The token plaintext exists in memory in createInvitation for exactly one return statement and then is GC'd. No `Logger.log(plaintext)` anywhere.

### Language

English only. JSDoc comments, audit metadata keys, ErrorMessages, commit messages all English.

## 13. Next Steps After Implementation

1. Run `/verify SCRUM-491` after Step 9. Do NOT skip — first HTTP surface for tenancy deserves explicit verification.
2. After `/verify` PASS / PASS-WITH-DEBT → `/commit SCRUM-491`.
3. CI Layer 4 Backend Tests: target PASS. Test density (4 endpoints × full happy + error matrix + integration spec) should clear the threshold comfortably.
4. After merge → `/update-docs SCRUM-491`:
   - api-spec.yml: 4 new endpoints documented.
   - integration-state.md: new controller + 2 services + AuditModule edge + 6 audit values + changelog row.
   - data-model.md: AuditAction table gains 6 rows.
   - AUTH-v2.md §6: Phase 0.4 → complete with PR + merge SHA.
5. **Phase 0 milestone reaffirmed**: with 0.4 complete, the entire HTTP surface of tenancy primitives is live. Phase 1 (Token Engine v2 / JWT v2) is now the next major milestone. The /switch endpoint that was deferred lands in Phase 1 (≤30 LOC over the rewritten TokenService).

## 14. Implementation Verification

### Code Quality
- [ ] Every new file has a file-level JSDoc with SCRUM-491 reference.
- [ ] Zero `any` types in production code.
- [ ] Zero new hardcoded error strings outside `ErrorMessages.invitations`.
- [ ] Zero new `process.env` reads outside ConfigService.
- [ ] Zero new `@Public()` decorators.
- [ ] No token plaintext ever passed to `Logger.log` or `console.log`.

### Functionality
- [ ] 4 endpoints + 1 derived expire check work per §5.
- [ ] Cross-tenant returns 404 (not 403).
- [ ] Platform-admin bypass works across the 3 endpoints that require tenant-role.
- [ ] Partial unique index enforces idempotency under concurrent createInvitation.
- [ ] Token single-emission: re-create returns null token; original plaintext is irrecoverable.

### Testing
- [ ] All 5 NEW spec files green.
- [ ] Integration spec exercises every happy + error matrix on each endpoint.
- [ ] Coverage net-positive vs main.

### Regression
- [ ] All 13 PrismaService consumers compile + existing tests pass (zero pre-existing test files modified).
- [ ] `nest start` does NOT crash with DI errors.
- [ ] Both migrations Applied; `prisma migrate status` clean.
- [ ] Smoke E2E: actual HTTP request to one of the 4 endpoints returns the documented contract.

### Integration
- [ ] TenantsModule imports AuditModule.
- [ ] TenantsModule exports MembershipsService (consumed by future tickets).
- [ ] Swagger / OpenAPI shows all 4 endpoints with full schemas.
- [ ] `TenantContext.run(:tenantId, ...)` is invoked in every controller handler EXCEPT acceptInvitation (which manages its own bypass → run sequence).

### Documentation updates
- [ ] Deferred-by-design to `/update-docs` (Step N+1).

### NOT-§15 review path
- [ ] PR title includes `[SCRUM-491]`.
- [ ] PR description cites §15 review path + lists tenant-controller files touched.
- [ ] CODEOWNERS auto-requests AUTH reviewers (schema + AuditAction enum touch trigger this).

---

## Module-Level Planning

**Phase 0.4 EXTENDS the existing `TenantsModule`** (created in SCRUM-487, made `@Global` then). The module gains 1 controller + 2 services + 1 module import (AuditModule). No new NexaCore-level entities — operates on `TenantInvitation` and `TenantMembership` created in Phase 0.1. No new permissions seeded (authorization is tenant-role-based via `TenantMembership.role`, not platform-Role permissions).

## Satellite App Planning

**N/A** — backend NexaCore-internal HTTP surface. No satellite app involved.
