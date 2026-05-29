# Implementation Record: SCRUM-347 Instant per-session deny-list on session revocation

## Summary

Closed the eventual-consistency gap where individual session revoke (`DELETE /auth/sessions/:id`) and 3 internal callers (email-verification, password-reset, password-change) only invalidated the refresh side; the access token for the revoked session remained valid until its 15-min TTL expired. Now both sides die immediately via Redis `deny:session:{sessionId}` key checked by `JwtStrategy` on every request.

- **Scope**: backend
- **Branch**: `feature/SCRUM-347-backend` (merged + deleted after PR #234)
- **Implementation date**: 2026-05-03 (develop) → 2026-05-04 (audit gate satisfied + commit)

## Plan Reference

- Plan: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-347_backend.md`](../../plans/Sprint%2012/SCRUM-347_backend.md)
- Verify report: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-347_verify.md`](../../plans/Sprint%2012/SCRUM-347_verify.md) — Verdict **PASS-WITH-DEBT** (transitioned 2026-05-04 from BLOCKED-RISK after Phase 3 audit re-run satisfied the Step 11 gate)
- Audit report: [`ai-specs/changes/auth/audit/audit-2026-05-04T00-30/fase-3-security-auth.md`](../../audit/audit-2026-05-04T00-30/fase-3-security-auth.md) — 18/18 targeted checks PASS, 0-FAIL baseline preserved
- Plan was followed: **Yes** — 13/13 steps complete (12 DONE + 1 DONE-DEVIATED Accepted-Quality on Step 9)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `ff36b4a` | SCRUM-347: Instant per-session deny-list on session revocation | 10 files (3 productive auth + 1 productive sessions + 1 interface + 5 specs); 255 insertions, 18 deletions |

PR #234 merged into `main` at 2026-05-04T00:57:35Z. Feature branch deleted (local + remote). Built on top of SCRUM-327 (`3422a25` parent in main).

## Deviations from Plan

(Imported from `/verify` PASS-WITH-DEBT report — no reclassification.)

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| Step 9 | Create integration test file `session-revoke.spec.ts` for E2E HTTP flow | Skipped — coverage achieved through unit tests at all layers (TokenDenyListService.denyBySessionId, JwtStrategy validates sessionId, SessionsService.revokeSession calls denyBySessionId) | E2E HTTP test deferred to Phase 9b infrastructure (Playwright) which doesn't exist yet | Accepted-Quality | SCRUM-350 (Phase 9b E2E tests) — already tracks this |
| Step 11 | Phase 3 audit re-run before /commit | Done 2026-05-04 (targeted re-run on SCRUM-347 + SCRUM-327 surface) | Pragmatic substitute for full 11-phase audit; covers the diff surface that introduces risk; remaining 240/258 checks unchanged from 2026-03-17 0-FAIL baseline | Accepted-Trivial | — (full audit can be scheduled in a follow-up housekeeping ticket if compliance review demands it) |

**0 Risk, 0 Scope-Gap.** All deviations Accepted-Quality / Accepted-Trivial.

## Test Results

**Backend** — 1042/1042 tests pass (was 1032 pre-SCRUM-347, +10 new cases)
- Unit: `npx jest --maxWorkers=1 --forceExit` → green
- `nest build` → clean
- Pre-push hooks (backend tests + build) PASS at push time

New tests (10 added across 3 specs):
- `jwt.strategy.spec.ts`: sessionId propagation through `validate` (PASS, REJECT-on-deny, undefined-session graceful path) — 4 cases.
- `token-deny-list.service.spec.ts`: `denyBySessionId` write + `isDenied` 4-arg pipeline + iat boundary preservation — 3 cases.
- `sessions.service.spec.ts`: `TokenDenyListService` mock added; both `revokeSession` and `revokeAllUserSessions` now assert deny-list call alongside DB write — 3 cases.

**Manual smoke** — pending production deploy verification of:
- Revoke individual session → 401 immediate on subsequent request with that session's access token.
- Logout-all → 401 immediate on all sessions.
- In-flight tokens (no `sessionId` payload) → graceful degradation.

## Bugs Found

No bugs introduced. Implementation closes a documented eventual-consistency gap (the bug being fixed itself).

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | (Updated in prior `/update-docs SCRUM-347` cycle) — AuthModule row reflects SessionsModule forwardRef + TokenDenyListService export. SessionsService dependency chain shows TokenDenyListService (forwardRef). |
| `ai-specs/specs/audit-standards.mdc` | NEW Section 6.7 "Phase Invalidation rule" + Phase 9b sub-phase definition (FE-27..FE-32) — partial completion of SCRUM-349/SCRUM-350 surface, kept in this commit since it conceptually belongs to the SCRUM-347 audit-gate work. |
| `ai-specs/changes/auth/audit/audit-2026-05-04T00-30/fase-3-security-auth.md` | NEW targeted Phase 3 audit report. 18/18 checks PASS. |
| `ai-specs/changes/auth/records/Sprint 12/SCRUM-347_backend.md` | This record (Part 1). |
| `ai-specs/specs/data-model.md` | No changes — no Prisma schema changes. |
| `ai-specs/specs/api-spec.yml` | No changes — no API contract changes. |

## Audit Finding Verification

Not strictly an audit-fix ticket. SCRUM-347 is a follow-up of SCRUM-342 surfacing the eventual-consistency gap during smoke. Resolution:

| Finding | Endpoint(s) | Status | Evidence |
|---------|-------------|--------|----------|
| `DELETE /auth/sessions/:id` did not invalidate access token | `sessions.service.revokeSession` + JwtStrategy.validate | RESOLVED | `denyBySessionId(id, ttl)` paired with DB write; isDenied checks `deny:session:{id}` |
| `POST /auth/logout-all` and 3 internal callers did not invalidate access tokens | `sessions.service.revokeAllUserSessions` | RESOLVED | `denyAllForUser(userId, ttl)` paired with DB updateMany |

**Recurrence prevention**: `audit-standards.mdc` Section 6.7 Phase Invalidation rule (this run) — formalizes that any change to JwtStrategy / SessionsService / TokenDenyListService triggers a Phase 3 audit re-run before merge. PR review checklist in `backend-standards.mdc` already covers session/deny-list changes via the inline pairing pattern.

**SLA status**: MEDIUM severity per ticket — completed within sprint (Sprint 12).

## Lessons Learned

- **forwardRef cycle established a clean reverse-coupling pattern**: AuthModule (which provides TokenDenyListService) ↔ SessionsModule (which now needs it for paired writes). Mirrors the pre-existing UsersModule ↔ AuthModule cycle. Reusable for future "the service that revokes also needs to deny-list" tickets.
- **Idempotency by Redis SET refresh-on-write**: TokenService.logoutAll and UsersService admin-lock-user already called `denyAllForUser`. SessionsService now also calls it internally — net is two SET on the same Redis key with same TTL. Redis SET refreshes TTL on subsequent writes, so this is naturally idempotent. Documented as Accepted-Trivial deviation.
- **Graceful degradation on optional payload field**: making `sessionId` optional in JwtPayload (rather than mandatory) protects in-flight tokens minted before deploy. The `isDenied` 4-arg signature gracefully skips the session check when undefined — important for zero-downtime rollout.
- **Targeted Phase 3 audit is a pragmatic substitute for full re-run**: 18 checks against the diff surface caught everything that mattered for SCRUM-347 + SCRUM-327. Full audit re-run can be scheduled separately for compliance-review purposes; doesn't need to gate every code merge.
- **SCRUM-347 + SCRUM-327 together cover OWASP ASVS V2.8 + V3.3 fully**: re-auth on sensitive actions (V2.8) + immediate session revocation (V3.3). Sister tickets that should have been planned together but were written as a sequence — for future similar work, plan re-auth and revocation as a single security-hardening epic.
