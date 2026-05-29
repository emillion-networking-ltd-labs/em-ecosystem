---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-491
sprint: Sprint 15
scope: backend
module: tenants
date: 2026-05-19
branch: feature/SCRUM-491-tenants-backend
plan_path: ai-specs/changes/tenants/plans/Sprint 15/SCRUM-491_backend.md
verify_path: ai-specs/changes/tenants/plans/Sprint 15/SCRUM-491_verify.md
is_audit_fix: false
plan_followed: "yes"
pr: 329
merge_commit: 622baa4ec6e0f4ff596751c62cc7018ce056998f
framework_version: 0.15.0
commits:
  - hash: "2fb19c3"
    message: "SCRUM-491: Tenant HTTP surface (AUTH v2 Phase 0.4)"
    files:
      - nexacore-api/prisma/migrations/20260519144836_invitation_audit_actions/migration.sql
      - nexacore-api/prisma/migrations/20260519144838_invitation_partial_unique/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/audit/enums/audit-action.enum.ts
      - nexacore-api/src/common/constants/error-messages.ts
      - nexacore-api/src/tenants/dto/accept-invitation.dto.ts
      - nexacore-api/src/tenants/dto/create-invitation.dto.ts
      - nexacore-api/src/tenants/dto/invitation-response.dto.ts
      - nexacore-api/src/tenants/dto/member-response.dto.ts
      - nexacore-api/src/tenants/invitations.service.ts
      - nexacore-api/src/tenants/memberships.service.ts
      - nexacore-api/src/tenants/tenants.controller.ts
      - nexacore-api/src/tenants/tenants.module.ts
      - nexacore-api/src/tenants/tests/invitations.dto.spec.ts
      - nexacore-api/src/tenants/tests/invitations.service.spec.ts
      - nexacore-api/src/tenants/tests/memberships.service.spec.ts
      - nexacore-api/src/tenants/tests/tenants.controller.spec.ts
      - nexacore-api/src/tenants/tests/tenants.integration.spec.ts
  - hash: 622baa4
    message: "SCRUM-491: Tenant HTTP surface (AUTH v2 Phase 0.4) (#329)"
    files:
      - nexacore-api/prisma/migrations/20260519144836_invitation_audit_actions/migration.sql
      - nexacore-api/prisma/migrations/20260519144838_invitation_partial_unique/migration.sql
      - nexacore-api/prisma/schema.prisma
      - nexacore-api/src/audit/enums/audit-action.enum.ts
      - nexacore-api/src/common/constants/error-messages.ts
      - nexacore-api/src/tenants/dto/accept-invitation.dto.ts
      - nexacore-api/src/tenants/dto/create-invitation.dto.ts
      - nexacore-api/src/tenants/dto/invitation-response.dto.ts
      - nexacore-api/src/tenants/dto/member-response.dto.ts
      - nexacore-api/src/tenants/invitations.service.ts
      - nexacore-api/src/tenants/memberships.service.ts
      - nexacore-api/src/tenants/tenants.controller.ts
      - nexacore-api/src/tenants/tenants.module.ts
      - nexacore-api/src/tenants/tests/invitations.dto.spec.ts
      - nexacore-api/src/tenants/tests/invitations.service.spec.ts
      - nexacore-api/src/tenants/tests/memberships.service.spec.ts
      - nexacore-api/src/tenants/tests/tenants.controller.spec.ts
      - nexacore-api/src/tenants/tests/tenants.integration.spec.ts
---

# Implementation Record: SCRUM-491 Tenant HTTP Surface (AUTH v2 Phase 0.4)

## Summary

**Phase 0.4 — the final ticket of Phase 0** of the AUTH v2 + Tenancy v1 program. Ships the first HTTP layer that exercises the SCRUM-488 Prisma tenant-filter middleware end-to-end through real request traffic. 4 endpoints (createInvitation, acceptInvitation, revokeInvitation, listMembers) + 1 derived expire-on-accept behavior + 6 new `TENANT_*` AuditAction values + partial unique index for createInvitation idempotency. Phase 0 is now complete.

- **Scope**: backend
- **Branch**: `feature/SCRUM-491-tenants-backend` (deleted after merge)
- **Date**: 2026-05-19 (single-session implementation + verify + merge)
- **CI outcome**: **one-shot green** — all 12 checks PASS on first push. **Third consecutive one-shot green** for the AUTH v2 Phase 0 wave (after SCRUM-488 and SCRUM-489).

## Plan Reference

- **Plan**: `ai-specs/changes/tenants/plans/Sprint 15/SCRUM-491_backend.md`
- **Verify**: `ai-specs/changes/tenants/plans/Sprint 15/SCRUM-491_verify.md` (verdict **PASS**, **0 deviations**)
- **Plan followed**: Yes — all 9 in-scope plan steps DONE step-for-step. Documentation step N+1 deferred-by-design to this record.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `2fb19c3` | SCRUM-491: Tenant HTTP surface (AUTH v2 Phase 0.4) | 18 files: 7 NEW production (controller + 2 services + 4 DTOs) + 5 NEW spec + 2 NEW migrations + 4 MOD (schema, audit enum, error-messages, tenants.module) |
| `622baa4` | SCRUM-491: Tenant HTTP surface (AUTH v2 Phase 0.4) (#329) | Squash-merge commit on `main` (one-shot CI green — no admin override) |

## Deviations from Plan

**Implementation followed the plan exactly.** Zero deviations across all 6 categories (Accepted-Trivial / Accepted-Quality / Accepted-Risk / Deferred / Pre-existing / Scope-Gap).

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|

No rows. Plan compliance verified at `/verify` against live code (9/9 steps DONE).

## Test Results

| Suite | Result | Notes |
|-------|--------|-------|
| Backend jest (full project) | **1223/1223 pass**, 83 suites, 0 failures | +49 net new over the 1174 baseline (SCRUM-489 left it at 1174). Comfortably above the plan §1 target of ≥30 new tests. |
| New tenants test suites | 49/49 pass | invitations.dto.spec (10) + invitations.service.spec (14) + memberships.service.spec (10) + tenants.controller.spec (6) + tenants.integration.spec (9). |
| `nest build` | Exit 0 | — |
| ESLint on `src/tenants/**` + touched MOD files | Clean after `--fix` (52 Prettier formatting items auto-fixed) | — |
| Migration smoke | `prisma migrate status` → 28 migrations Applied; "Database schema is up to date" | Both new migrations (`20260519144836_invitation_audit_actions` and `20260519144838_invitation_partial_unique`) applied cleanly. |
| CI Layer 1 (Secrets) | PASS | — |
| CI Layer 2 (Deps — api + dashboard) | PASS | — |
| CI Layer 3 (SAST — backend + frontend) | PASS | — |
| CI Layer 4 (Backend Tests) | **PASS** | Coverage cleared the 90% line threshold organically — third consecutive one-shot green. |
| CI Layer 4 (Frontend Tests) | PASS | — |
| CI Layer 5 (Build — backend + frontend) | PASS | — |
| CI Security Gate (All Checks) | PASS | — |

### Manual verification (via integration spec)

| Scenario | Result |
|----------|--------|
| Cross-tenant access returns 404 (not 403) | Verified — `tenants.integration.spec.ts` non-member listMembers + non-member createInvitation + MEMBER-trying-createInvitation all throw `NotFoundException` |
| OWNER createInvitation returns plaintext token + audit event | Verified — token is sha256-hashed at storage, plaintext returned in response, `TENANT_INVITATION_CREATED` audit emitted |
| Platform-admin bypass | Verified — `isPlatformAdmin: true` user revokes invitation in tenant they have no membership in; membership-check is NOT queried |
| Expire-on-accept → 410 + EXPIRE_REJECTED audit | Verified — invitation with `expiresAt < now()` throws `GoneException`, audit event written |
| Email mismatch → 403 + EMAIL_MISMATCH_REJECTED audit | Verified — invitation for `a@x.com` accepted by `b@x.com` throws `ForbiddenException`, audit event written |
| createInvitation race recovery (P2002) | Verified — concurrent createInvitation simulated; service catches P2002, returns existing row with `token: null` |
| revokeInvitation on already-accepted → 409 (no delete) | Verified — service throws `ConflictException`; `prisma.tenantInvitation.delete` NOT called |

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | (Part 2) Module Registry: TenantsModule now imports `AuditModule`, gains `TenantsController` + `InvitationsService` + `MembershipsService`, exports extended. Controller Guard Chains: NEW `TenantsController` row. Service Dependency Chains: 2 new edges (`InvitationsService → PrismaService + AuditService`; `MembershipsService → PrismaService`). 2026-05-19 changelog row for SCRUM-491 + Phase 0 milestone note. |
| `ai-specs/specs/data-model.md` | (Part 3) AuditAction enum table gains 6 new rows (TENANT_INVITATION_CREATED, ACCEPTED, REVOKED, EXPIRE_REJECTED, EMAIL_MISMATCH_REJECTED, MEMBERSHIP_CREATED) with metadata-shape semantics + security-signal notes. TenantInvitation entity description corrected (bcrypt → SHA-256 hash on tokenHash). |
| `ai-specs/specs/api-spec.yml` | (Part 3) **First HTTP endpoints added under `tenants` tag**: 4 routes (POST createInvitation, POST acceptInvitation, DELETE revokeInvitation, GET listMembers) with full request/response schemas + error responses + security definitions. |
| `ai-specs/changes/auth/programs/AUTH-v2.md` | (Part 3) §6 Current Phase State — Phase 0.4 marked **complete** with PR #329 + merge SHA. **Phase 0 milestone reaffirmed COMPLETE** (all 4 sub-phases shipped: 0.1 + 0.2 + 0.3 + 0.4). Next milestone Phase 1. |

## Lessons Learned

- **Service-layer authorization beats NestJS guards for path-param-dependent checks.** The original plan considered a `TenantOwnerOrAdminGuard` NestJS guard, but rejected it because the role check needs `:tenantId` from the URL path, and `ExecutionContext.switchToHttp().getRequest().params.tenantId` is awkward. The `MembershipsService.requireTenantRole(tenantId, userId, allowedRoles, isPlatformAdmin)` helper at the service entry point reads cleanly and tests as a normal service method. Pattern worth promoting for any future tenant-scoped controller.
- **Partial unique index handles idempotency under concurrency where SERIALIZABLE would over-lock.** The `WHERE acceptedAt IS NULL` clause means accepted invitations don't participate in the constraint — only pending ones. This lets the service do an UX-friendly `findFirst` for the happy path while the DB enforces correctness under race. SERIALIZABLE would have blocked unrelated reads on the table.
- **One-shot CI green is now the default expectation, not a happy accident.** Three consecutive successful CI runs (SCRUM-488 + SCRUM-489 + SCRUM-491) across AUTH-deep tickets validate the discipline: plan-time CI gate anticipation table + `/verify` mechanical gates + tight scope = predictable green merges. SCRUM-487's admin override was a coverage-debt artifact, not a process failure.
- **Phase 0 demonstrated that a multi-week program plan can ship in 2 sessions when each phase is well-scoped.** SCRUM-487 (Phase 0.1) + SCRUM-488 (Phase 0.2) + SCRUM-489 (Phase 0.3) + SCRUM-491 (Phase 0.4) all merged within 2026-05-19 (4 tickets, 4 PRs, 152 net new tests, 1 admin override only because of pre-existing debt). Worth documenting as the operating model for Phase 1 and future programs.
- **Audit-value enum extensions are unscary when consistent.** Five separate enum-extension migrations have now shipped without incident (SCRUM-433 OAUTH_AUTO_VERIFIED, SCRUM-488 TENANT_FILTER_BYPASS, SCRUM-491 ×6). The pattern is well-established: `ALTER TYPE ... ADD VALUE 'X';` per line, no transaction wrapper needed, hand-rolled to bypass P3014 shadow-DB. Worth promoting from "individual ticket workaround" to "documented enum-extension recipe" in the framework.

## Recommended Follow-ups

- **AUTH v2 Phase 1 — Token Engine v2 / JWT v2 payload** (priority=HIGH, module=auth, type=feature) — natural next phase. JWT payload gains `tenantId`, `tenantRole`, `isPlatformAdmin` per program doc §2.3. Eliminates the per-request DB hits introduced by Phase 0 (TenantContextInterceptor membership lookup + Phase 0.3's `req.user.isPlatformAdmin` resolution). Also subsumes the `/tenant/switch` endpoint that was deferred from Phase 0.4 (≤30 LOC over the rewritten TokenService).
- **`/tenant/switch` endpoint** (priority=MEDIUM, module=tenants, type=feature) — explicitly out of scope of Phase 0.4 because it depends on JWT v2. Will land naturally as part of Phase 1, but worth a stub Jira ticket to track the dependency.
- **Soft-delete `revokedAt` column on `tenant_invitations`** (priority=LOW, module=tenants, type=feature) — alternative to current hard-delete on revoke. Trade-off: row-level retention vs schema cleanliness. Re-evaluate if retention requirements emerge from compliance review.
- **Tenant-scoped throttler tracker** (priority=LOW, module=auth, type=tech-debt) — Phase 0.4 reuses `THROTTLE_CONFIGS.sensitiveAction` (IP-based via default NestJS tracker). Tenant-scoped throttling requires a custom `getTracker(req)` implementation. Defer until Phase 1 JWT v2 makes the tenantId reliably available on every request.
- **MembershipsService synthetic-OWNER refactor for platform-admin** (priority=LOW, module=tenants, type=tech-debt) — current implementation returns `null` for platform admins (clean enough), but the controller has to remember to short-circuit role-set logic. A dedicated `IsPlatformAdminGuard` semantic would be cleaner. Worth revisiting when Phase 1+ introduces more bypass call sites.
- **Email-sending integration for invitations** (priority=MEDIUM, module=tenants, type=feature) — Phase 0.4 returns the invitation token plaintext in the create response; caller is responsible for out-of-band delivery to the invitee. Production deployment needs actual email integration with `MailService`. Worth filing now to scope.

## Rollback Playbook

### 12.1 Trigger conditions

- p95 latency on authenticated `/tenants/:tid/*` endpoints > 500ms (the membership lookup adds one DB hit per request).
- Error rate on `POST /tenants/:tid/invitations` > 1% (createInvitation idempotency / race recovery defects).
- Audit log row count for `TENANT_INVITATION_*` events drops to zero post-deploy (audit pipeline broken).
- Regression in any AUTH-tier endpoint that consumes `MembershipsService` (would manifest as 500s).

### 12.2 Rollback steps (in execution order)

1. **Revert merge commit**: `git revert -m 1 622baa4` to a hotfix branch from `main`, then merge.
2. **Migration handling**:
   - The enum-extension migration (`20260519144836_invitation_audit_actions`) is **additive and idempotent in effect**: 6 new enum values that no application code references after revert. Safe to leave in place. To physically remove (NOT recommended — destroys audit history):
     ```sql
     -- Postgres does not support DROP VALUE on enums. Removal requires
     -- ALTER TYPE rename + recreate. Heavy. Leave the values dormant.
     ```
   - The partial unique index migration (`20260519144838_invitation_partial_unique`) is **additive**: new constraint on an empty table (zero invitations created pre-Phase-0.4). To physically remove:
     ```sql
     DROP INDEX IF EXISTS "uniq_tenant_invitation_pending";
     ```
     Safe at any time since no code references the index name.
3. **Cache/state cleanup**:
   - No Redis keys owned by this ticket.
   - No in-memory caches.
   - Any pending invitation rows created during the brief Phase-0.4-live window become orphans (the controllers that create/accept them are reverted). Acceptable — they expire naturally; no manual cleanup needed.
4. **External provider state**: None. No third-party integrations.
5. **Verification**:
   - `nest build` clean post-revert.
   - `npx jest --maxWorkers=1 --forceExit` — should drop back to 1174/1174 (the +49 new tests revert with the spec files).
   - Smoke E2E: `curl -X POST /tenants/<any-uuid>/invitations` with a valid JWT → expect 404 (route no longer exists post-revert).

### 12.3 Estimated rollback time

- Happy path (revert + redeploy): ~5 minutes (CI Layer 1-5 on the revert branch).
- Schema cleanup (optional DROP INDEX, NOT recommended for the enum): +1 minute manual DB op + verification.

### 12.4 Known risks of rollback

**None at the rollback layer.** The HTTP surface introduced by Phase 0.4 has zero existing frontend consumers (Phase 0.4 was the first to expose tenancy via HTTP; the dashboard does not yet consume these routes). Any in-flight invitations created during the live window expire naturally; the underlying `TenantInvitation` rows remain in the DB as orphans but cause no functional issues. Schema changes are additive and dormant after revert.
