# Verification Report: SCRUM-218 — Remove JWT from query param in OAuth link (V8.3.1)

**Date**: 2026-03-13
**Plan**: ai-specs/ai-specs/changes/plans/Sprint 10/SCRUM-218_fullstack.md
**Branch**: feature/SCRUM-218-fullstack
**Verdict**: PASS

## Plan Compliance

| Step | Description | Status | Deviation Category | Notes |
|------|-------------|--------|-------------------|-------|
| 0 | Create feature branch | DONE | — | `feature/SCRUM-218-fullstack` from latest main |
| 1 | Create OAuthLinkCodeStore | DONE | — | Redis-backed, randomBytes(32), 60s TTL, single-use |
| 2 | Refactor OAuthLinkGuard | DONE | — | JWT removed, link code via OAuthLinkCodeStore.consume() |
| 3 | Add POST /auth/link/code endpoint | DONE | — | JwtAuthGuard, HttpStatus.CREATED, returns { code } |
| 4 | Register in AuthModule | DONE | — | OAuthLinkCodeStore in providers after OAuthCodeStore |
| 5 | Update guard tests | DONE | — | 4 tests: valid code, missing code, invalid code, consumed code |
| 6 | Create store tests | DONE | — | 6 tests: generate format, generate uniqueness, redis calls, consume valid/null |
| 7 | Add generateLinkCode to frontend API | DONE | — | POST /auth/link/code via apiClient |
| 8 | Update ConnectedAccounts | DONE | — | Async flow, loading state, error toast, accessToken removed |
| 9 | Update documentation | DONE | — | api-spec.yml + integration-state.md Guard Dependency Map |

**Additional changes** (not in plan, required for correctness):
- `oauth.controller.spec.ts`: Replaced JwtService mock with OAuthLinkCodeStore mock (controller DI changed)
- `oauth-exchange.spec.ts`: Same DI mock update
- `ConnectedAccounts.test.tsx`: Updated mock for generateLinkCode, added error test

## Deviations

None — implementation followed the plan exactly. Additional test updates were necessary consequences of the DI changes.

## Code Quality Checks

| Check | Result | Details |
|-------|--------|---------|
| New files with tests | 1/1 | `oauth-link-code.store.ts` → `oauth-link-code.store.spec.ts` (6 tests) |
| Security patterns | 0 violations | No process.env, no hardcoded errors, no token in URL, no `any` types |
| Build (backend) | PASS | `nest build` compiles clean |
| Tests (backend) | PASS | 863 passing, 0 failing |
| Tests (frontend) | PASS | 93 passing, 0 failing |
| Integration state | UP TO DATE | Guard Dependency Map updated: OAuthLinkGuard → OAuthLinkCodeStore |
| JWT in URL eliminated | CONFIRMED | grep `?token=` in auth link context: 0 matches |

## Security Verification

| Check | Result |
|-------|--------|
| No JWT/access token in any URL | PASS — `?token=` removed from guard, controller, and frontend |
| Link code cryptographically random | PASS — `randomBytes(32).toString('hex')` = 256 bits entropy |
| Link code single-use | PASS — Redis `get` + `del` in `consume()` |
| Link code TTL ≤ 60s | PASS — Redis `EX 60` |
| Error messages use ErrorMessages constants | PASS — `ErrorMessages.auth.AUTHENTICATION_FAILED` |
| No information disclosure in errors | PASS — generic 401 for all link code failures |

## Accepted-Risk Items

None.

## Tech Debt Tickets Created

None needed.
