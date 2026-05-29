# Implementation Record: SCRUM-19 Auth Pages, ApiClient and AuthContext

## Summary

Implemented the authentication integration layer for `nexacore-dashboard`: AuthContext with reducer pattern, ApiClient HTTP methods, client-side email validation, password strength indicators, token management via Next.js API Route Handlers (set-tokens, refresh, logout), ForgotPasswordForm UI, InfinitySpinner and RingSpinner components. Also fixed Prisma 7 compatibility and dotenv loading in the backend.

- **Scope**: `frontend` (with backend fixes)
- **Branch**: `feature/SCRUM-19-frontend`
- **Implementation dates**: 2026-02-25

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/SCRUM-19_frontend.md`
- **Plan was followed**: **Partially** — Plan was written retroactively and aligned to actual code. The plan documents the final state accurately.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `9cf6a3b` | fix(nexacore-api): Prisma 7 adapter pattern, dotenv loading and validation message | `nexacore-api/src/prisma/prisma.service.ts`, `nexacore-api/src/main.ts`, `nexacore-api/src/auth/dto/register.dto.ts`, `nexacore-api/package.json` (5 files, +199/-1) |
| `83a3d97` | feat(SCRUM-19): auth pages integration, ApiClient, AuthContext and form validation | `src/context/AuthContext.tsx`, `src/hooks/useAuth.ts`, `src/app/api/auth/set-tokens/route.ts`, `src/app/api/auth/refresh/route.ts`, `src/app/api/auth/logout/route.ts`, `src/components/auth/ForgotPasswordForm.tsx`, `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`, `src/components/ui/InfinitySpinner.tsx`, `src/components/ui/RingSpinner.tsx`, `src/lib/api.ts` (16 files, +778/-63) |

## Deviations from Plan

Since the plan was written retroactively and aligned to the final code state, there are no deviations between plan and implementation. Notable design decisions:

| Decision | Context | Outcome |
|----------|---------|---------|
| `isInitialized` NOT in this story | AuthState only has `user`, `accessToken`, `isLoading`, `error` | `isInitialized` was added later in SCRUM-21 to fix guard behavior |
| `handleOAuthCallback` NOT in this story | AuthContext provides login, register, logout, refreshSession, clearError | `handleOAuthCallback` was added in SCRUM-20 |
| ForgotPasswordForm is functional UI | Has form, validation, submit handler with simulated loading | Backend endpoint doesn't exist yet, but UI is complete (not a "stub") |
| Error display: inline AlertTriangle + span | Not using ErrorAlert component | Simpler inline pattern for System Message slot |
| Cookie settings: `sameSite: 'lax'`, `maxAge: 7 days` | Standard security defaults for refresh token | Different from what might be expected (`strict` or `30 days`) |

## Test Results

- No automated unit/integration tests written in this story
- Manual verification:
  - [x] Email validation (empty, invalid format, valid)
  - [x] Password strength indicators (5 icons with green check badges)
  - [x] Login flow: email → password → API call → redirect
  - [x] Register flow: email + password → API call → redirect
  - [x] Error display from backend validation messages
  - [x] Token management: httpOnly cookie for refresh, in-memory for access
  - [x] Silent session restore on page mount via refreshSession()
  - [x] ForgotPasswordForm renders and validates
  - [x] InfinitySpinner and RingSpinner render correctly
- Backend fixes verified: Prisma 7 adapter works, dotenv loads, validation messages reach frontend

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Prisma 7 `datasourceUrl` removed | HIGH | Fixed in `9cf6a3b` | Migrated to `PrismaPg` driver adapter |
| dotenv not loading in NestJS | MEDIUM | Fixed in `9cf6a3b` | Added `import 'dotenv/config'` in main.ts |
| Register DTO validation message too long | LOW | Fixed in `9cf6a3b` | Shortened special character requirement message |
| LanguageSelector dropdown colors wrong | LOW | Fixed in `83a3d97` | Changed `surface-subtle` → `surface-tertiary` |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/plans/SCRUM-19_frontend.md` | Retroactive plan created and aligned to code |

## Lessons Learned

- **What went well**: Reducer pattern for AuthContext made state transitions explicit and debuggable. The extractErrorMessage helper elegantly surfaces backend validation details.
- **What was harder than expected**: Prisma 7 breaking changes required an unplanned backend fix commit. The autofill CSS override (`box-shadow inset` trick) was non-obvious.
- **Recommendations**: Always verify ORM compatibility before frontend integration. Keep backend fixes in separate commits from frontend work for traceability.
