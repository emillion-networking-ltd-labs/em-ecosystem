# Implementation Record: SCRUM-234 — Extract Inline Error Strings (CH-02)

## Summary

Extracted 3 unique inline error message strings (across 6 throw sites in 4 service files) into `ErrorMessages` constants for DRY compliance. Added 4 new constants, updated 2 test assertions. Pure refactoring — no behavioral changes.

- **Scope**: backend
- **Branch**: `feature/SCRUM-234-backend`
- **Date**: 2026-03-14
- **PR**: #95

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 10/SCRUM-234_backend.md`
- **Verification**: `ai-specs/changes/plans/Sprint 10/SCRUM-234_verify.md` — PASS
- **Plan followed**: Yes (no deviations)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `e8069ec` | SCRUM-234: Extract inline error strings to ErrorMessages constants (CH-02) | `error-messages.ts`, `mfa.service.ts`, `login.service.ts`, `password-reset.service.ts`, `passkey.service.ts`, `auth-password.spec.ts` |

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results

- **Build**: `nest build` compiles clean
- **Tests**: 889 passed, 0 failed, 60 suites

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-234 |

## Lessons Learned

- The `ErrorMessages` constant pattern scales well — adding new namespaced constants is trivial and all service files already import it.
- Code verification revealed 1 additional inline string (`PASSWORD_MUST_DIFFER`) beyond the 3 the audit identified — always verify actual code, not just audit findings.
- Out-of-scope: `users.service.ts:458` has the same breach message inline (users module) — not fixed here since this ticket scopes to auth module only.
