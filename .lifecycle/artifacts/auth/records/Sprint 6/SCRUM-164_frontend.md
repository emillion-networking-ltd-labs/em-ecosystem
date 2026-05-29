# Implementation Record: SCRUM-164 Frontend error message sync

## Summary
Centralized all frontend error message detection constants and shared error extraction utilities, fixing broken verification email resend button and CSRF retry detection that silently broke when Sprint 5 (SCRUM-140) standardized backend error messages without updating the frontend.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-164-frontend`
- **Implementation date**: 2026-03-10

## Plan Reference
- Plan: `ai-specs/changes/plans/Sprint 6/SCRUM-164_frontend.md`
- Plan was followed: **Yes**

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `0f8e178` | feat(SCRUM-164): centralize frontend error message detection constants | `src/lib/error-constants.ts`, `src/lib/error-utils.ts`, `src/context/AuthContext.tsx`, `src/components/auth/LoginForm.tsx`, `src/lib/api.ts` + 4 more |

## Files Changed

### New files
| File | Purpose |
|------|---------|
| `nexacore-dashboard/src/lib/error-constants.ts` | Centralized error detection constants (DETECTION_EMAIL_VERIFICATION, DETECTION_CSRF_ERROR, HTTP_STATUS, ERROR_CODE) |
| `nexacore-dashboard/src/lib/error-utils.ts` | Shared helpers: extractErrorMessage, extractMessageByStatus, ensurePeriod |

### Modified files (critical — broken behavior fixed)
| File | Change |
|------|--------|
| `nexacore-dashboard/src/context/AuthContext.tsx` | Removed local ensurePeriod/extractErrorMessage, imported from error-utils. Replaced `'check your email'` with DETECTION_EMAIL_VERIFICATION constant. Replaced `'FORBIDDEN'` with ERROR_CODE.FORBIDDEN. |
| `nexacore-dashboard/src/components/auth/LoginForm.tsx` | Replaced `'check your email'` with DETECTION_EMAIL_VERIFICATION constant for isVerificationError detection. |
| `nexacore-dashboard/src/lib/api.ts` | Replaced `includes('CSRF')` with DETECTION_CSRF_ERROR constant for CSRF retry logic. |

### Modified files (consolidated — DRY improvement)
| File | Change |
|------|--------|
| `nexacore-dashboard/src/components/profile/ConnectedAccounts.tsx` | Removed local ApiError type + inline statusCode switch. Now uses extractMessageByStatus with HTTP_STATUS constants. |
| `nexacore-dashboard/src/components/profile/DeleteAccount.tsx` | Removed local extractMessage function. Now uses extractMessageByStatus. |
| `nexacore-dashboard/src/components/profile/ChangeEmailForm.tsx` | Removed local extractMessage function. Now uses extractMessageByStatus. |
| `nexacore-dashboard/src/hooks/useTrustedDevices.ts` | Removed local extractMessage function. Now uses extractMessageByStatus. |

### Verified files (no changes needed)
RegisterForm.tsx, ResetPasswordForm.tsx, ForgotPasswordForm.tsx, MfaTotpStep.tsx, OAuthCallbackHandler.tsx, MfaSetup.tsx, ActiveSessions.tsx — all use pass-through error handling (instanceof RateLimitError, raw message extraction, or catch-all) with no string matching.

## Deviations from Plan

Implementation followed the plan exactly.

## Test Results
- ESLint: clean (0 warnings, 0 errors)
- TypeScript: clean (0 errors)
- Manual verification:
  - Verification email detection: `DETECTION_EMAIL_VERIFICATION` matches backend `'Please check your email to continue'` ✓
  - CSRF detection: `DETECTION_CSRF_ERROR` matches backend `'CSRF validation failed'` ✓
  - All 4 consolidated helpers produce identical output to originals ✓

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Resend verification button not appearing (since Sprint 5) | HIGH | Fixed | String mismatch: frontend checked `'verify your email'`, backend sends `'Please check your email to continue'`. Now uses centralized constant. |
| CSRF retry using case-sensitive `includes('CSRF')` | LOW | Fixed | Now uses case-insensitive check via `toLowerCase().includes(DETECTION_CSRF_ERROR)` |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/frontend-standards.mdc` | Added "Error Message Detection Pattern" section with rules for centralized constants, shared helpers, and detection hierarchy |
| `ai-specs/changes/records/Sprint 6/SCRUM-164_frontend.md` | This record |

## Lessons Learned
- **String-based error detection is fragile**: When backend messages change, frontend behavior breaks silently. Centralizing constants in one file makes this a single-point update.
- **4 duplicated helpers across profile components**: The `extractMessage` pattern was copy-pasted into ConnectedAccounts, DeleteAccount, ChangeEmailForm, and useTrustedDevices. A shared utility prevents future drift.
- **Future improvement**: Adding business-level error codes to the backend (e.g., `EMAIL_NOT_VERIFIED`, `CSRF_FAILED`) would eliminate string matching entirely. Currently `error.code` maps to HTTP exception type (FORBIDDEN, UNAUTHORIZED), which is too coarse for UI behavior branching.
