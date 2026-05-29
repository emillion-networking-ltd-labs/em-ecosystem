# Implementation Record: SCRUM-241 Refactor: Split large test files (SM-02)

## Summary

Split 2 large test files (auth-login.spec.ts: 906 lines, passkey.service.spec.ts: 1067 lines) into 6 smaller files, all under 500 lines. Extracted shared passkey test setup to auth-test.helpers.ts. Zero logic changes — only file reorganization. Resolves audit WARN SM-02.

- **Scope**: backend
- **Branch**: `feature/SCRUM-241-backend`
- **Date**: 2026-03-15

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 11/SCRUM-241_backend.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `e01e39d` | SCRUM-241: Split large test files for maintainability (SM-02) | 7 files: auth-login.spec.ts, auth-login-security.spec.ts, auth-login-device.spec.ts, auth-test.helpers.ts, passkey.service.spec.ts, passkey-authentication.spec.ts, passkey-management.spec.ts |

## Deviations from Plan

Implementation followed the plan exactly. No follow-up needed.

## Test Results

- **Backend tests**: 903 passed, 0 failed (64 suites, was 60)
- **Build**: `nest build` compiles clean
- **File sizes**: All 6 test files under 500 lines (max: 462)
- **Test distribution**: 92 tests across 6 files = original 42 (auth-login) + 50 (passkey)

| File | Lines | Tests |
|------|-------|-------|
| auth-login.spec.ts | 161 | 7 |
| auth-login-security.spec.ts | 414 | 19 |
| auth-login-device.spec.ts | 370 | 16 |
| passkey.service.spec.ts | 346 | 14 |
| passkey-authentication.spec.ts | 462 | 23 |
| passkey-management.spec.ts | 275 | 13 |

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added SCRUM-241 changelog entry, updated header |

## Lessons Learned

- Extracting shared test setup (createPasskeyTestSetup) before splitting files prevents duplication and ensures each split file stays small.
- `jest.mock()` calls must remain at the top level of each file — they cannot be extracted to a shared helper because Jest hoists them.
- The passkey tests use direct class instantiation (not TestingModule), so the shared setup pattern is a simple factory function rather than an async module builder.
