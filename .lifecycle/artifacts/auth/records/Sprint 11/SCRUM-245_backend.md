# Implementation Record: SCRUM-245 Audit Fix Batch 3 — Structural Refactoring

## Summary

Structural refactoring to resolve 5 audit findings: reduced DI fan-out in 3 services below 8 deps (CX-05), extracted shared audit log helper (DU-04), delegated session operations properly (SD-06), decomposed long passkey method (SM-03), and reduced AuthService facade surface (SD-01). Pure refactoring — no behavioral changes.

- **Scope**: backend
- **Branch**: `feature/SCRUM-245-backend`
- **Implementation date**: 2026-03-15
- **Verification verdict**: PASS-WITH-DEBT

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 11/SCRUM-245_backend.md`
- **Verification**: `ai-specs/changes/plans/Sprint 11/SCRUM-245_verify.md`
- **Plan was followed**: Partially — 5 deviations, all classified and approved in `/verify`

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `c94c6f0` | SCRUM-245: Structural refactoring — extract LoginSecurityService, reduce DI fan-out | 12 files (+330 / -325) |

Key files:
- `src/auth/login-security.service.ts` (NEW — 121 lines)
- `src/auth/utils/audit-log.helper.ts` (NEW — 28 lines)
- `src/auth/token.service.ts` (major refactor, 10→7 deps)
- `src/auth/login.service.ts` (refactor, 9→8 deps)
- `src/auth/auth.service.ts` (refactor, 9→5 deps)
- `src/auth/passkey.service.ts` (decomposed verifyAuthentication)
- `src/auth/oauth-auth.service.ts` (updated to use LoginSecurityService)
- `src/sessions/sessions.service.ts` (2 new methods)
- `src/auth/auth.module.ts` (added LoginSecurityService provider)
- `src/auth/tests/auth-test.helpers.ts` (updated mocks)
- `src/auth/tests/auth-login-device.spec.ts` (updated mocks)
- `src/auth/tests/auth-token.spec.ts` (updated assertions)

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| — | N/A | `oauth-auth.service.ts` updated to use LoginSecurityService | Not in plan but required — called methods that moved to LoginSecurityService | Scope-Gap | Fixed during develop; no risk |
| 7 | `logPasskeyAuthFailure(…): void` | `failPasskeyAuth(…): never` | Enables TS control flow narrowing after throw | Accepted-Trivial | — |
| 7 | Keep `auditNoop` in PasskeyService | Replaced with `createAuditLogger` | Better DU-04 consistency across all services | Accepted-Trivial | — |
| 8 | Create `login-security.service.spec.ts` | Not created | Methods exercised via integration tests through auth-test.helpers | Accepted-Quality | SCRUM-249 |
| 8 | Add tests for `revokeSessionDirect` / `findPreviousActiveSessions` | Not created | Simple Prisma pass-through, exercised indirectly | Accepted-Quality | SCRUM-250 |

## Test Results

- **Build**: `nest build` — CLEAN (0 errors)
- **Tests**: 901 passed / 0 failed across 64 suites
- **Coverage**: No regression (pure refactoring, no new branches)
- **Manual verification**: All existing test assertions validate identical behavior pre/post refactoring

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Updated Service Dependency Chains (AuthService 9→5, TokenService 10→7, LoginService 9→8, added LoginSecurityService, updated OAuthAuthService), added LoginSecurityService to Test Mock Requirements, added changelog entry |

No changes needed to `data-model.md` or `api-spec.yml` — pure internal refactoring with no schema or API changes.

## Lessons Learned

- **What went well**: The plan's step-by-step ordering (add new → refactor existing → update tests) minimized intermediate breakage. Only one build failure occurred mid-development (oauth-auth.service.ts).
- **What was harder than expected**: `oauth-auth.service.ts` was not identified in the plan as needing changes, but it also called methods that moved to LoginSecurityService. This caused 4 build errors that had to be fixed as a scope-gap deviation.
- **Recommendations**: When extracting methods from a service, grep for ALL callers across the entire module — not just the source service. A `grep -r "methodName" src/` before planning would have caught the oauth-auth.service.ts dependency.
