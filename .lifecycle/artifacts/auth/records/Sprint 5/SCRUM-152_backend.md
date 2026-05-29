# Implementation Record: SCRUM-152 OAuth Flow Errors Reveal Internal Mechanism Details

## 1. Summary

Fixed the `OAuthCallbackFilter` to always return a generic `"Authentication failed"` message to the frontend instead of extracting and forwarding raw exception messages via `?error=` URL parameter. Replaced hardcoded `"Invalid or expired OAuth state parameter"` in both Google and GitHub strategies with `ErrorMessages.auth.AUTHENTICATION_FAILED`. Added server-side `Logger` for debugging.

- **Scope**: backend
- **Branch**: `feature/SCRUM-152-backend`
- **Implementation date**: 2026-03-09
- **PR**: #41
- **Security references**: CWE-200, CWE-209

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 5/SCRUM-152_backend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `5eea87a` | fix(SCRUM-152): prevent OAuth callback filter from leaking internal error details | 5 files (3 source + 2 test) |

## 4. Deviations from Plan

Implementation followed the plan exactly.

## 5. Files Changed

### Modified Source Files (3)

| File | Changes |
|------|---------|
| `nexacore-api/src/auth/guards/oauth-callback.filter.ts` | Removed exception message extraction logic. Always uses `ErrorMessages.auth.AUTHENTICATION_FAILED` for redirect. Added `Logger` for server-side error logging. |
| `nexacore-api/src/auth/strategies/google.strategy.ts` | Line 78: `'Invalid or expired OAuth state parameter'` → `ErrorMessages.auth.AUTHENTICATION_FAILED`. Added `ErrorMessages` import. |
| `nexacore-api/src/auth/strategies/github.strategy.ts` | Line 78: `'Invalid or expired OAuth state parameter'` → `ErrorMessages.auth.AUTHENTICATION_FAILED`. Added `ErrorMessages` import. |

### Modified Test Files (2)

| File | Changes |
|------|---------|
| `nexacore-api/src/auth/tests/google.strategy.spec.ts` | Lines 168, 188: `'Invalid or expired OAuth state parameter'` → `'Authentication failed'` (2 assertions). |
| `nexacore-api/src/auth/tests/github.strategy.spec.ts` | Lines 166, 185: `'Invalid or expired OAuth state parameter'` → `'Authentication failed'` (2 assertions). |

## 6. Test Results

- **Backend**: 44 suites, 820 tests — all pass
- **TypeScript**: `nest build` compiles clean
- **Net test change**: 0 (4 assertions updated, none added or removed)

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added. No module/guard/DI/controller/permission/schema changes — error message and logging changes only. |

## 9. Lessons Learned

- The `OAuthCallbackFilter` was the primary security risk — it acted as an **amplifier** that forwarded any internal exception message to the frontend via URL parameter. Even if strategies used generic messages, any `HttpException` from downstream services would still leak through.
- `"No email provided by [Google|GitHub]"` messages were intentionally kept — after the filter fix they only appear in server logs and are valuable for debugging. The provider name is not a disclosure risk since the user initiated the flow with that specific provider.
- The `ErrorMessages.auth.AUTHENTICATION_FAILED` constant already existed (`"Authentication failed"`) — no new constants were needed.
