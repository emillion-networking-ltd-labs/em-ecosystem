# Implementation Record: SCRUM-169 Enforce Email Match on OAuth Account Linking

## 1. Summary

Added email validation to `linkOAuthProvider()` to reject OAuth accounts whose email doesn't match the authenticated user's NexaCore email. Case-insensitive comparison per RFC 5321 §2.4.

- **Scope**: backend
- **Branch**: `feature/SCRUM-169-backend`
- **Implementation date**: 2026-03-10

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 6/SCRUM-169_backend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `9ce52fd` | fix(SCRUM-169): enforce email match on OAuth account linking | `error-messages.ts`, `users.service.ts`, `users.service.spec.ts` |

## 4. Deviations from Plan

| # | Plan said | Actual | Classification | Action |
|---|-----------|--------|----------------|--------|
| 1 | `BadRequestException` import needed | Already imported | Pre-existing | None |

No functional deviations. Implementation followed the plan exactly.

## 5. Test Results

- **Unit tests**: 102 passed / 0 failed (users.service.spec.ts)
- **Overall**: 823 passed / 3 failed (pre-existing oauth-exchange.spec.ts TurnstileService DI issue, unrelated)
- **New tests**: 3 (email mismatch rejection, case-insensitive match, user not found)

## 6. Bugs Found

No bugs found during implementation.

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-169 |

## 8. Lessons Learned

- OAuthCallbackFilter already catches all exceptions and redirects with generic error message, so no frontend changes were needed for this security fix.
- The `BadRequestException` import was already present in `users.service.ts` from prior OAuth work.
