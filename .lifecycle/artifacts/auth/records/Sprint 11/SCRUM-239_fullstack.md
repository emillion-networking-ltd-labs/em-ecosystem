# Implementation Record: SCRUM-239 Unify 404 Messages + Login Password Validation

## Summary

Unified all 5 entity-specific NOT_FOUND error messages to generic `Resource not found` (CWE-200, OWASP ASVS V14.3.3) and added `validatePassword()` to LoginForm to match the pattern used by the other 3 auth forms.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-239`
- **Date**: 2026-03-15

## Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 11/SCRUM-239_fullstack.md`
- **Plan was followed**: Yes

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `079fdff` | SCRUM-239: Unify NOT_FOUND error messages and add login password validation | `error-messages.ts`, `sessions.service.spec.ts`, `LoginForm.tsx` |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 2 | Import `ErrorMessages` constant in test | Used literal `'Resource not found'` | Plan listed both approaches; literal is valid since it matches the constant value | Accepted-Trivial | — |
| 5 | `npm run build` passes | Pre-existing failure in `ConnectedAccounts.tsx:115` (conditional useState) | Confirmed via stash test — error exists on base branch without SCRUM-239 changes | Pre-existing | Already known issue |

## Test Results

- **Backend tests**: 903 passed / 0 failed
- **`nest build`**: Clean (no errors)
- **Frontend build**: Pre-existing failure (ConnectedAccounts.tsx — not related to this ticket)

## Bugs Found

No bugs found during implementation.

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added SCRUM-239 changelog entry |

## Lessons Learned

- Constant-value-only changes propagate automatically through all consumers — zero service/controller edits needed
- All 4 auth forms now consistently use `validatePassword()`, reducing divergence risk
