# Implementation Record: SCRUM-91 Tests for OAuth Strategies — PKCE and Validate Branches

## Summary

- **What**: Extended unit tests for `GitHubStrategy` and `GoogleStrategy` to cover `authorizationParams()`, `authenticate()` PKCE monkey-patch, and remaining `validate()` branches (displayName parsing, error propagation). 19 new tests added (395 → 414 total). All 4 coverage thresholds now pass.
- **Scope**: `backend`
- **Branch**: `feature/SCRUM-91-backend`
- **Date**: 2026-02-27

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/SCRUM-91_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `66fc991` | test(SCRUM-91): add PKCE and validate branch tests for OAuth strategies | `src/auth/tests/github.strategy.spec.ts`, `src/auth/tests/google.strategy.spec.ts` (2 files, +355) |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Unit tests**: 31/31 suites pass, 414 tests pass, 0 failures
- **New tests added**: 19 (GitHub: 11, Google: 8)
  - `authorizationParams()`: 3 per strategy (6 total)
  - `authenticate()`: 4 per strategy (8 total)
  - `validate()` GitHub displayName: 3 tests
  - `validate()` error propagation: 1 per strategy (2 total)
- **Per-file coverage**:
  - `github.strategy.ts`: 100% stmts, 82.05% branches, 100% funcs, 100% lines
  - `google.strategy.ts`: 100% stmts, 80% branches, 100% funcs, 100% lines
- **Global coverage**:
  - Statements: 93.58% → **97.34%** (threshold 90% ✅)
  - Branches: 81.86% → **85.89%** (threshold 85% ✅)
  - Lines: 94.08% → **97.94%** (threshold 90% ✅)
  - Functions: 88.12% → **91.78%** (threshold 90% ✅)
- **Build**: `nest build` clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/plans/SCRUM-91_backend.md` | Plan created |
| `ai-specs/changes/records/SCRUM-91_backend.md` | This record |

## Lessons Learned

- **What went well**: Mocking `Strategy.prototype.authenticate` from `passport-github2`/`passport-google-oauth20` cleanly intercepts `super.authenticate` calls without complex prototype chain manipulation. Setting `(strategy as any)._oauth2` is the standard Passport testing pattern for verifying OAuth2 internals.
- **What was harder than expected**: Nothing — the PKCE monkey-patch is a well-structured single-shot wrapper that's straightforward to test by capturing the patched function and calling it manually.
- **Recommendations**: Remaining branch gaps (80-82%) in strategy files are from implicit TypeScript optional chaining (`req.ip`, `req.socket?.remoteAddress`, `profile.photos?.[0]`) and constructor `process.env` fallbacks. These are not worth chasing with unit tests — coverage is already at 100% statements/functions/lines.
