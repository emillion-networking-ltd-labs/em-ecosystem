# Implementation Record: SCRUM-218 — Remove JWT from query param in OAuth link (V8.3.1)

## Summary

Replaced JWT access token in OAuth account linking URL query parameter (`?token=`) with a short-lived, single-use, Redis-backed link code (`?code=`). Eliminates token leakage via server logs, proxy logs, browser history, and Referer headers.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-218-fullstack`
- **Date**: 2026-03-13

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-218_fullstack.md`
- **Plan followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `830709c` | SCRUM-218: Replace JWT query param with short-lived link code in OAuth account linking | 11 files (2 new, 9 modified) |

## Deviations from Plan

Implementation followed the plan exactly. Additional test file updates (`oauth.controller.spec.ts`, `oauth-exchange.spec.ts`, `ConnectedAccounts.test.tsx`) were necessary consequences of the DI changes and were not explicitly listed as separate plan steps.

## Test Results

- Backend: 863 passed / 0 failed (57 suites)
- Frontend: 93 passed / 0 failed (15 suites)
- New tests: 10 (guard: 4, store: 6) + 1 frontend error test
- Build: `nest build` compiles clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Added POST /auth/link/code endpoint; updated GET /auth/link/google and /auth/link/github (query param `token` → `code`, removed BearerAuth security) |
| `ai-specs/specs/integration-state.md` | Updated Guard Dependency Map: OAuthLinkGuard deps changed from JwtService to OAuthLinkCodeStore |

## Lessons Learned

- Existing Redis store pattern (OAuthStateStore, OAuthCodeStore) made adding OAuthLinkCodeStore trivial — consistent architecture pays off.
- Pre-push hooks running full test suite caught DI mock issues in test files not originally in the plan scope.
