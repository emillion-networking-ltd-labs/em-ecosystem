# Implementation Record: SCRUM-223 — Migrate token.service.ts to ConfigService (I-10)

## Summary

Replaced 6 direct `process.env` reads in `token.service.ts` with `ConfigService` injection, completing the ConfigService migration started in SCRUM-179. All auth services now use centralized, validated configuration.

- **Scope**: backend
- **Branch**: `feature/SCRUM-223-backend`
- **Date**: 2026-03-13

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-223_backend.md`
- **Plan followed**: Yes (1 Accepted-Trivial deviation)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `717fac1` | SCRUM-223: Migrate token.service.ts from process.env to ConfigService (I-10) | 2 files (0 new, 2 modified) |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 3 | Replace inline `configService.get()` calls in methods | Extracted `accessExpiration` to private readonly field in constructor | DRY — matches existing `refreshExpiration` pattern, avoids repeated `configService.get()` calls | Accepted-Trivial | — |

## Test Results

- Backend: 870 passed / 0 failed (57 suites)
- No new tests (existing 20 auth-token tests cover all TokenService behavior)
- Build: `nest build` compiles clean

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-223; updated Service Dependency Chains: TokenService now has ConfigService as 10th dep |

## Lessons Learned

- The existing config factory pattern (`auth.config.ts`, `app.config.ts`) made migration trivial — all config keys already existed.
- `app.isProduction` boolean in `app.config.ts` is cleaner than comparing `nodeEnv === 'production'` in every service.
- Adding ConfigService mock to shared test helpers (`auth-test.helpers.ts`) benefits all auth test suites, not just TokenService tests.
