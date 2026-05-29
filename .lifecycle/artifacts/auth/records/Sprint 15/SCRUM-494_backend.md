---
schema: ai-specs/schemas/record.schema.yml
ticket: SCRUM-494
sprint: Sprint 15
scope: backend
module: auth
date: 2026-05-20
branch: feature/SCRUM-494-backend
plan_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-494_backend.md
verify_path: ai-specs/changes/auth/plans/Sprint 15/SCRUM-494_verify.md
is_audit_fix: false
plan_followed: "yes"
pr: 333
merge_commit: e33fe6bae44ab179271e1be87ea097c0c4363dab
framework_version: 0.15.0
commits:
  - hash: "f723890"
    message: "SCRUM-494: AUTH v2 Phase 1.3 — JwtV2Strategy + first consumer endpoint (POST /auth/v2/refresh)"
    files:
      - nexacore-api/src/auth/auth-v2.controller.ts
      - nexacore-api/src/auth/auth.module.ts
      - nexacore-api/src/auth/constants/auth.constants.ts
      - nexacore-api/src/auth/strategies/jwt-v2.strategy.ts
      - nexacore-api/src/auth/tests/auth-v2.controller.spec.ts
      - nexacore-api/src/auth/tests/jwt-v2.strategy.spec.ts
      - nexacore-api/src/auth/token.service.v2.ts
      - nexacore-api/src/auth/utils/jwt-payload-v2.guard.ts
      - nexacore-api/src/sessions/sessions.module.ts
  - hash: "e33fe6b"
    message: "SCRUM-494: AUTH v2 Phase 1.3 — JwtV2Strategy + first consumer endpoint (POST /auth/v2/refresh) (#333)"
    files:
      - nexacore-api/src/auth/auth-v2.controller.ts
      - nexacore-api/src/auth/auth.module.ts
      - nexacore-api/src/auth/constants/auth.constants.ts
      - nexacore-api/src/auth/strategies/jwt-v2.strategy.ts
      - nexacore-api/src/auth/tests/auth-v2.controller.spec.ts
      - nexacore-api/src/auth/tests/jwt-v2.strategy.spec.ts
      - nexacore-api/src/auth/token.service.v2.ts
      - nexacore-api/src/auth/utils/jwt-payload-v2.guard.ts
      - nexacore-api/src/sessions/sessions.module.ts
---

# Implementation Record: SCRUM-494 AUTH v2 Phase 1.3 — `JwtV2Strategy` + first consumer endpoint (`POST /auth/v2/refresh`)

## Summary

Third and final sub-phase of Phase 1 of the AUTH v2 + Tenancy v1 program. Ships the **first v2 production HTTP surface**: a guarded `POST /auth/v2/refresh` endpoint that exercises both `TokenServiceV2` (Phase 1.1 — access token mint) and `SessionsServiceV2` (Phase 1.2 — opaque refresh rotation) end-to-end through Passport. Adds `JwtV2Strategy` (Passport strategy named `'jwt-v2'`, two-gate verify with extracted shape guard). **Strangler-pattern transition NAMED** — `SessionsServiceV2` and `TokenServiceV2` each gain their first production consumer; v1 paths bit-identical to main. **Phase 1 of the AUTH v2 program closes with this ticket.** Phase 2 (AuthIntent state machine) becomes unblocked.

- **Scope**: backend
- **Branch**: `feature/SCRUM-494-backend`
- **Implementation date**: 2026-05-20

## Plan Reference

- Plan: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-494_backend.md`
- Verify: `ai-specs/changes/auth/plans/Sprint 15/SCRUM-494_verify.md` (verdict **PASS · 3 Accepted-Trivial · 0 blocking**)
- **Plan was followed**: Yes — all 10 steps executed in order. The 3 Accepted-Trivial deviations were either spec-idiom adjustments or canonical-config-key corrections, with no behavioral impact.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `f723890` | SCRUM-494: AUTH v2 Phase 1.3 — JwtV2Strategy + first consumer endpoint (POST /auth/v2/refresh) | 9 files (5 NEW + 4 MOD) |
| `e33fe6b` | (same) (#333) | Squash merge to `main` |

**Diff size**: 9 files · **+693 / -18 lines** (the -18 are: ~12 lines of private `isValidV2Payload` removed from `token.service.v2.ts` after extraction + minor comment + import line reflow).

## Deviations from Plan

All 3 deviations imported from the verify report (PASS · 3 Accepted-Trivial · 0 blocking).

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 2 | `validate(payload): Promise<JwtPayloadV2>` with `return Promise.resolve(payload)` on success (sync throw on failure) | `async validate` with `return payload` on success (Promise rejection on throw) | Jest's `.rejects.toThrow()` requires a rejected Promise; sync throw inside non-async method caused 8 spec failures. `async` makes throws surface as rejections — standard test idiom. Required `// eslint-disable-next-line @typescript-eslint/require-await` with a clear comment block. Passport-jwt accepts both forms; behavior IDENTICAL. | Accepted-Trivial | — |
| 4 | `configService.get<string>('app.env') === 'production'` | `configService.get<boolean>('app.isProduction') ?? false` | Plan §13 open consideration #2 was the canonical-key check at /develop time. Reading `src/config/app.config.ts:7` confirmed `app.isProduction` is the derived boolean (the `app.env` key doesn't exist). Same boolean value; identical behavior. | Accepted-Trivial | — |
| 4 | (Plan code sample had no eslint suppression) | One targeted `// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment` on the cookie extraction line `const refreshToken: string \| undefined = cookies?.[REFRESH_TOKEN_COOKIE_NAME_V2]` | The strict TypeScript-ESLint rule misreads the `(req as Request & { cookies?: Record<...>}).cookies` pattern as unsafe even though the explicit `string \| undefined` annotation maintains type safety. Suppression documented inline. | Accepted-Trivial | — |

The earlier extraction of `isValidV2Payload` (plan Step 1) was an explicit plan-time decision (operator decision #1) — NOT a deviation. It executed as planned.

## Test Results

- **Test suites**: 96 passed (94 baseline + 2 new spec files), 0 failed.
- **Tests**: **1320 passed** (1297 baseline + **23 net new**), 0 failed.
- **Coverage (global)**:
  - **statements 91.29%** (≥ 90% threshold ✅; +0.14 pp on top of SCRUM-493's 91.15%)
  - **lines      91.29%** (same)
  - branches    82.54% (≥ 80% ✅)
  - functions   88.21% (≥ 85% ✅)
- **Per-file coverage**:
  - `jwt-v2.strategy.ts`: **100% statements / lines / functions**.
  - `auth-v2.controller.ts`: **100% statements / lines / functions**.
  - `jwt-payload-v2.guard.ts`: **100% statements / lines / functions**.
  - `token.service.v2.ts` (modified): **100% statements / lines / functions** (Phase 1.1 spec stays green 18/18 post-extraction).
- **New spec breakdown**:
  - `jwt-v2.strategy.spec.ts` — 11 tests across 4 describe blocks (2 happy + 7 missing-field rejects + 1 non-boolean isPlatformAdmin + 1 forged-v1-shape + 1 message-invariance).
  - `auth-v2.controller.spec.ts` — 12 tests across 3 describe blocks (6 happy incl. secure-in-prod variant + 4 rejection paths incl. orphan-rotation + 1 response-shape contract).
- **Build**: `nest build` exit 0. **DI bootstrap clean** — critical because e2e tests at `test/auth-e2e/setup.ts:699` bootstrap full AppModule with the new strategy + controller registered.
- **ESLint**: clean on all 9 files (2 targeted `eslint-disable-next-line` with explanatory comments).
- **Manual verification**: PR #333 CI **one-shot green — all 11 checks SUCCESS** (no admin override). 6th consecutive one-shot green since SCRUM-490 cleared the coverage floor.

## Bugs Found

No bugs found during implementation. One spec idiom issue (sync-throw vs `.rejects.toThrow()`) surfaced during Step 8 and was resolved by switching `validate` to `async` (recorded as Accepted-Trivial deviation #1 above).

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Header `Last update` bumped to SCRUM-494 with Phase 1 COMPLETE marker. New Changelog row documenting the first v2 production HTTP surface + strangler-pattern transition. Module Registry annotations on AuthModule (new JwtV2Strategy + AuthV2Controller) and SessionsModule (SessionsServiceV2 now exported). New Service Dependency Chains entries for JwtV2Strategy + AuthV2Controller. New Controller Guard Chains entry for AuthV2Controller (no `@UseGuards`, throttle-only). |
| `ai-specs/changes/auth/programs/AUTH-v2.md` | §6 Phase 1.3 row marked complete with PR #333 / merge `e33fe6b`. Phase 1 umbrella row marked **COMPLETE** (all 3 sub-phases done). "Currently active" section rewritten to reflect Phase 1 COMPLETE milestone. Next milestone footer updated to point at Phase 2 (AuthIntent state machine). |
| `ai-specs/specs/api-spec.yml` | NEW path `/auth/v2/refresh` added under a new `Auth v2` tag. POST, cookie-based (no Bearer required), responses 200 / 401 / 429. Body: `{ accessToken: string, user: { id, tenantId, tenantRole, isPlatformAdmin } }`. |
| `ai-specs/specs/data-model.md` | **Unchanged** — no entity changes in this phase. |

## Lessons Learned

- **`.rejects.toThrow()` is the source of truth for spec idiom**. Sync throws from non-async methods don't surface as Promise rejections — and Jest's matcher won't catch them. Future strategy/validate-style methods should default to `async`, even if the body is sync; the `// eslint-disable-next-line @typescript-eslint/require-await` cost is small and the spec idiom payoff is large.
- **Plan §13 "Open considerations for /develop time" earns its keep**. The `app.isProduction` vs `app.env` check was explicitly flagged at plan time and surfaced as a real adjustment at /develop. Same pattern as SCRUM-493 (composite-key field order). Plans on Prisma/config-heavy surfaces should default to including a §13 section for things the planner couldn't fully verify without running.
- **Single-source-of-truth extraction at consumer-count = 2 is the right inflection point**. `isValidV2Payload` lived as a private method in `TokenServiceV2` through Phase 1.1 + 1.2 (consumer count = 1: only `verifyAccessToken`). When Phase 1.3 added `JwtV2Strategy.validate` as the second consumer, extraction became necessary. **Future v2-program private utils should be extracted to standalone util files as soon as consumer-count ≥ 2** — duplication or `class.privateAccess` workarounds are technical debt.
- **Strangler-pattern NAMED relaxation works**. Phase 1.2's grep invariant ("`SessionsServiceV2` ≤ 3 references") was deliberately constructed to make the Phase 1.3 export change a reviewable event, not a silent leak. The verify report's "strangler-relaxation observable" line documents the transition cleanly. **Reuse this pattern**: name the relaxation in a future phase's plan + verify + record so the audit trail is contiguous.
- **e2e AppModule bootstrap as DI smoke test**: the `nest build` + e2e bootstrap chain catches DI typing errors that pure unit tests miss. Future tickets adding strategies/controllers to a globally-registered module should include "DI bootstrap smoke check" as a /develop step.

## Recommended Follow-ups

- **Add E2E test for POST /auth/v2/refresh happy path + cookie rotation** (priority=MEDIUM, module=auth, type=test) — current spec uses mocked services + mock Response; a real e2e against a test DB would prove `validateAndRotate` atomicity + cookie persistence end-to-end. Defer to Phase 2 (when more v2 endpoints exist to amortize the test-infra setup cost).
- **Document v2 cookie posture in `ai-specs/specs/backend-standards.mdc`** (priority=LOW, module=auth, type=doc) — v2's cookie shape mirrors v1 today, but future phases may diverge (e.g., Phase 2 AuthIntent state machine may introduce a v2-specific session cookie). Pin the current v1+v2 convention so divergence is deliberate.

## Rollback Playbook

### 12.1 Trigger conditions

This change introduces a **NEW** HTTP endpoint (`POST /auth/v2/refresh`). Currently it has no production traffic (no client uses it yet) — frontend migration is deferred. Conceivable triggers if traffic does arrive:

- `error rate on POST /auth/v2/refresh > 1%` over 5 minutes (excluding 401/429 expected denials).
- `p95 latency on POST /auth/v2/refresh > 500ms`.
- Regression in `e2e auth-flows` suite mentioning the new endpoint.
- DI bootstrap failure on `AppModule.compile()` in CI (would indicate the new strategy/controller registration broke something invisible during testing).

### 12.2 Rollback steps (in execution order)

1. **Revert commit**: `git revert e33fe6b` on a hotfix branch, open PR, merge to `main`. Pure-additive change — revert is mechanical and conflict-free unless Phase 2 has already landed on top (in which case revert Phase 2 first).
2. **Migration handling**: **N/A** — zero Prisma schema changes, zero migrations.
3. **Cache/state cleanup**:
   - Any active `SessionV2` rows created via `/auth/v2/refresh` will remain in `sessions_v2` table — harmless (no consumer post-revert). They eventually age out via `expiresAt`.
   - **Cookies on clients**: clients holding `refresh_token_v2` cookies retain them but no endpoint accepts them post-revert. Recommended client behavior: catch the cookie-not-recognized response (404 on `/auth/v2/refresh`) and fall back to v1's `/auth/refresh` (different cookie name). No data inconsistency.
4. **External provider state**: **N/A** — no OAuth registrations, no webhooks, no external dependencies.
5. **Verification**: post-revert, grep `nexacore-api/src/` for `JwtV2Strategy`, `AuthV2Controller`, `/auth/v2/refresh` — all should return 0 matches in production code (only the 2 surviving comment references in `jwt-payload-v2.interface.ts` from Phase 1.1 remain — unaffected). `nest build` must exit 0; AppModule bootstrap must succeed.

### 12.3 Estimated rollback time

- Happy path (revert + CI + merge): **~5 minutes total** (no DB, no cache invalidation, no external state).
- If Phase 2 has landed on top: revert Phase 2 first then Phase 1.3 — variable, depends on Phase 2 surface.

### 12.4 Known risks of rollback

**Low**. The change is HTTP-additive only. v1 paths bit-identical to main, so reverting Phase 1.3 only removes the v2-refresh entry point. No customer data loss. The only client-side risk is for any pre-production client already configured to use `/auth/v2/refresh` — they'd see 404s until they fall back to v1. Since the frontend migration is deferred to a later phase, real-world impact is currently zero.

## NOT-§15 verification

PR #333 single-domain AUTH:
- `nexacore-api/src/auth/auth.module.ts` (MOD), `auth-v2.controller.ts` (NEW), `constants/auth.constants.ts` (MOD), `strategies/jwt-v2.strategy.ts` (NEW), `tests/auth-v2.controller.spec.ts` (NEW), `tests/jwt-v2.strategy.spec.ts` (NEW), `token.service.v2.ts` (MOD), `utils/jwt-payload-v2.guard.ts` (NEW) — all `src/auth/**`.
- `nexacore-api/src/sessions/sessions.module.ts` (MOD) — `src/sessions/**`, AUTH-adjacent per program doc §15.1.
- Zero `prisma/schema.prisma` changes.
- Zero `src/audit/**` changes.
- Zero `nexacore-dashboard/**` changes.

Per `workflow-standards.mdc §15.3.3`, single-domain AUTH → **no split-PR required**. §15 review path applied; CODEOWNERS auto-routed AUTH reviewers based on `src/auth/**` + `src/sessions/**` touch patterns. Mandatory §12 Rollback Playbook included above.
