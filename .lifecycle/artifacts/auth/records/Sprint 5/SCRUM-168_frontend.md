# Implementation Record: SCRUM-168 Fix Jest ESM Transform for @marsidev/react-turnstile

## 1. Summary

Added `jest.mock` for `@/components/ui/TurnstileWidget` in LoginForm.test.tsx to fix ESM parse failure from `@marsidev/react-turnstile`. One file changed, 7 lines added.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-168-frontend`
- **Implementation date**: 2026-03-10

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 5/SCRUM-168_frontend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `d6b4bd7` | fix(SCRUM-168): add TurnstileWidget mock to LoginForm tests | `tests/components/auth/LoginForm.test.tsx` |

## 4. Deviations from Plan

Implementation followed the plan exactly.

## 5. Test Results

- **Unit tests**: 71 passed / 0 failed (13 suites)
- **Previously failing**: LoginForm.test.tsx — now passes all 4 tests

## 6. Bugs Found

No bugs found during implementation.

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-168 |

## 8. Lessons Learned

- When adding a new dependency that ships ESM-only (like `@marsidev/react-turnstile`), immediately check if existing tests that transitively import it need a mock. This prevents test failures from accumulating as technical debt.
