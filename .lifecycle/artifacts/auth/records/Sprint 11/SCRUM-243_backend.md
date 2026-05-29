# Implementation Record: SCRUM-243 Audit Fix Batch 1 — Code Fixes

## Summary

Implemented 14 audit finding fixes (1 FAIL + 13 WARN) from the auth module audit (2026-03-13), covering security, code hygiene, API documentation, and compliance improvements across 27 files.

- **Scope**: backend
- **Branch**: `feature/SCRUM-243-backend`
- **Implementation date**: 2026-03-15
- **Verification**: PASS-WITH-DEBT

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 11/SCRUM-243_backend.md`
- **Verification**: `ai-specs/changes/plans/Sprint 11/SCRUM-243_verify.md`
- **Plan was followed**: Yes (1 trivial deviation, 1 quality deviation)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `30805dc` | SCRUM-243: Fix 14 audit findings — code quality, security, and compliance | 27 files: 5 controllers, 4 services, 3 DTOs, 2 stores, 2 strategies, 1 helper, 3 tests, 2 constants, 1 utility (new), 1 tsconfig, 1 api-spec, 1 config, 1 error-messages |

## Deviations from Plan

Imported from `/verify` report (SCRUM-243_verify.md):

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 5 | `export { OAuthProfile }` re-export | `export type { OAuthProfile }` | TypeScript `isolatedModules` flag requires type-only re-exports (TS1205) | Accepted-Trivial | — |
| 6 | Create pseudonymize-email.ts utility | Created without test file | Utility is simple (6 lines), test deferred | Accepted-Quality | SCRUM-248 |

## Test Results

- **Overall**: 901 tests passing, 0 failing, 64 suites
- **Unit tests**: 901 passed / 0 failed
- **Build**: `nest build` compiles clean
- **Tests updated**: MFA setup message assertion updated (auth.controller.spec.ts), cleanup() tests removed (oauth-code.store.spec.ts, oauth-state.store.spec.ts)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Added `Passkeys` tag definition |
| `ai-specs/specs/integration-state.md` | Added changelog entry for SCRUM-243 |

## Lessons Learned

- **Batch audit fixes are efficient**: Grouping 14 related findings into one ticket reduced branch overhead and kept changes cohesive.
- **`isolatedModules` constraint**: When re-exporting types from files that also export values, TypeScript requires `export type` syntax. This is a common gotcha with modern TS configs.
- **Prettier pre-commit hook**: All files must be formatted before commit — running `prettier --write` on all changed files before staging prevents hook failures.
