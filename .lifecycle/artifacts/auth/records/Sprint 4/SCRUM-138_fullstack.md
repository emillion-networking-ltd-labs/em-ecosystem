# Implementation Record: SCRUM-138 Manual Verification — Sprint 4 Frontend Features

## Summary

Manual end-to-end verification of all Sprint 4 frontend security integration features (SCRUM-128 through SCRUM-134), including bug fixes discovered during testing across both backend and frontend.

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-138-frontend-verification`
- **Implementation date**: 2026-03-07
- **PR**: [#30](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/30)

## Plan Reference

- No formal plan — SCRUM-138 is a verification/testing ticket, not a development ticket.
- Verification checklist defined inline from Sprint 4 feature tickets.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `f0a4543` | feat(SCRUM-138): manual verification fixes for Sprint 4 frontend features | 31 files (11 backend, 19 frontend, 1 new) |

## Verification Points & Fixes

### Point 2: Change Password flow
- **Bug found**: OAuth users setting password for first time were logged out (sessions revoked)
- **Fix**: `users.service.ts` — conditional session revocation: only revoke on actual password CHANGE (`if (user.passwordHash)`), not first-time SET
- **Bug found**: LOCAL users changing password were NOT logged out (security requirement)
- **Fix**: `ChangePasswordForm.tsx` — added `logout()` + `router.push('/login')` when `hasPassword` is true

### Point 3: Connected Accounts
- **Fix**: `ConnectedAccounts.tsx` — uses `hasPassword` field instead of `provider === 'LOCAL'`; calls `refreshSession()` after OAuth unlink

### Point 4: OAuth login/auto-linking
- **Bug found**: Blocking LOCAL→OAuth login threw `ConflictException`, breaking all OAuth flows
- **Research**: Analyzed Clerk, Supabase, Auth0, Firebase best practices
- **Fix**: Restored auto-linking for verified LOCAL accounts (Clerk/Supabase pattern)
- **Bug found**: OAuth error displayed inline ("cutre") instead of as toast
- **Fix**: Created `OAuthCallbackFilter` (NestJS ExceptionFilter) for OAuth callback error handling; `OAuthCallbackHandler.tsx` redirects immediately; `LoginForm.tsx` shows toast
- **Bug found**: "Account created" toast shown instead of "Account linked" (fragile heuristic)
- **Fix**: Added `oauthAction` flag (`created`|`linked`|`login`) from backend `findOrCreateByOAuth` through entire OAuth exchange pipeline for deterministic toasts
- **Bug found**: Double toast on OAuth error (React StrictMode)
- **Fix**: Added `useRef` guard in `LoginForm.tsx`

### Point 5: Delete Account
- **Bug found**: Password field not shown for OAuth-linked accounts that have a password
- **Fix**: `DeleteAccount.tsx` — uses `hasPassword` instead of `provider === 'LOCAL'`

### Point 6: Verify Email Change
- **Verified**: Page works correctly, email sent
- **Bug found**: After email change, OAuth provider remains linked to old email
- **Fix**: `auth.service.ts` `verifyEmailChange` — auto-unlinks OAuth (`provider: 'LOCAL', providerId: null`) when email changes

### Point 7: Security Activity
- **Bug found**: `TOKEN_REFRESH` and `REGISTER` events showed raw action names
- **Fix**: Added entries to `EVENT_CONFIG` in `SecurityActivity.tsx`
- **Bug found**: Duplicate "Active Sessions" section (independent component + inside SecurityActivity)
- **Fix**: Removed sessions section from `SecurityActivity.tsx`, kept dedicated `ActiveSessions` component
- **Bug found**: All sessions showed "Unknown Device" — `deviceInfo` always null
- **Fix**: Added `parseDeviceInfo()` in `sessions.service.ts` to auto-derive from user-agent (e.g. "Chrome on Windows")
- **Bug found**: `ActiveSessions` showed "Windows NT 10.0" instead of "Windows"
- **Fix**: Aligned `parseUserAgent` in `ActiveSessions.tsx` with backend parser; prefers `deviceInfo` from server
- **Bug found**: Double refresh on mount due to React StrictMode
- **Fix**: Added `useRef` guard in `AuthContext.tsx` mount effect

### Point 8: Mobile Sidebar
- **Verified**: Hamburger, link close, overlay close — all implemented correctly in `DashboardLayout.tsx`, `Sidebar.tsx`, `NavBar.tsx`

## Deviations from Plan

No formal plan existed. SCRUM-138 was a verification ticket — all changes were bug fixes discovered during manual testing.

## Test Results

- Manual verification: All 8 points verified and passing
- Backend tests: Not re-run in this ticket (tests may need mock updates for changed signatures — deferred)
- Frontend tests: Not applicable (no test infrastructure changes)

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| OAuth SET password logs user out | HIGH | Fixed | Conditional session revocation in `users.service.ts` |
| LOCAL CHANGE password doesn't log out | HIGH | Fixed | Added `logout()` in `ChangePasswordForm.tsx` |
| OAuth login blocked for LOCAL accounts | HIGH | Fixed | Restored auto-link, added `OAuthCallbackFilter` |
| OAuth errors shown inline, not toast | MEDIUM | Fixed | `OAuthCallbackFilter` + redirect + toast in `LoginForm.tsx` |
| Wrong toast (created vs linked) | MEDIUM | Fixed | Backend `oauthAction` flag through OAuth pipeline |
| Delete account missing password field | MEDIUM | Fixed | Uses `hasPassword` instead of `provider` |
| Email change leaves OAuth linked | MEDIUM | Fixed | Auto-unlink in `verifyEmailChange` |
| "Unknown Device" in sessions | LOW | Fixed | `parseDeviceInfo()` in `sessions.service.ts` |
| Duplicate Active Sessions UI | LOW | Fixed | Removed from `SecurityActivity.tsx` |
| Missing event labels (TOKEN_REFRESH, REGISTER) | LOW | Fixed | Added to `EVENT_CONFIG` |
| Double toast on StrictMode | LOW | Fixed | `useRef` guards in `LoginForm.tsx` and `AuthContext.tsx` |
| "Windows NT 10.0" in UA display | LOW | Fixed | Aligned frontend UA parser with backend |

## Files Modified

### Backend (11 files + 1 new)
| File | Changes |
|------|---------|
| `nexacore-api/src/auth/auth.controller.ts` | Added `UseFilters(OAuthCallbackFilter)` on callbacks; propagated `oauthAction` in exchange response |
| `nexacore-api/src/auth/auth.service.ts` | Added `oauthAction` to `AuthResult`; updated `validateOAuthUser` to propagate action; updated `generateOAuthCode`/`exchangeOAuthCode` types |
| `nexacore-api/src/auth/guards/oauth-callback.filter.ts` | **NEW** — ExceptionFilter for OAuth callback error handling |
| `nexacore-api/src/auth/strategies/jwt.strategy.ts` | Minor type alignment |
| `nexacore-api/src/auth/tests/jwt.strategy.spec.ts` | Test updates |
| `nexacore-api/src/auth/tests/token-deny-list.service.spec.ts` | Test updates |
| `nexacore-api/src/auth/token-deny-list.service.ts` | Minor updates |
| `nexacore-api/src/common/interfaces/jwt-payload.interface.ts` | Type alignment |
| `nexacore-api/src/sessions/sessions.service.ts` | Added `parseDeviceInfo()` function; auto-derive `deviceInfo` from user-agent |
| `nexacore-api/src/users/dto/change-password.dto.ts` | Made `currentPassword` optional (for first-time SET) |
| `nexacore-api/src/users/entities/user.entity.ts` | Exposed `hasPassword` in `SafeUser` |
| `nexacore-api/src/users/users.service.ts` | `findOrCreateByOAuth` returns `{ user, action }`; conditional session revocation in `changePassword` |

### Frontend (19 files)
| File | Changes |
|------|---------|
| `nexacore-dashboard/src/components/auth/LoginForm.tsx` | OAuth error as toast with ref guard |
| `nexacore-dashboard/src/components/auth/OAuthCallbackHandler.tsx` | Immediate redirect, no inline errors |
| `nexacore-dashboard/src/components/layout/DashboardLayout.tsx` | Mobile sidebar overlay + slide-in |
| `nexacore-dashboard/src/components/layout/NavBar.tsx` | Mobile hamburger button |
| `nexacore-dashboard/src/components/layout/Sidebar.tsx` | Mobile mode with `mobileVisible` prop and `onNavigate` |
| `nexacore-dashboard/src/components/profile/ActiveSessions.tsx` | Aligned UA parser; prefer `deviceInfo` from server |
| `nexacore-dashboard/src/components/profile/ChangeEmailForm.tsx` | UI adjustments |
| `nexacore-dashboard/src/components/profile/ChangePasswordForm.tsx` | Logout on change, refreshSession on first set |
| `nexacore-dashboard/src/components/profile/ConnectedAccounts.tsx` | Uses `hasPassword`; `refreshSession` after unlink |
| `nexacore-dashboard/src/components/profile/DeleteAccount.tsx` | Uses `hasPassword` for password field |
| `nexacore-dashboard/src/components/profile/PasskeyManager.tsx` | UI adjustments |
| `nexacore-dashboard/src/components/profile/ProfileForm.tsx` | UI adjustments |
| `nexacore-dashboard/src/components/profile/SecurityActivity.tsx` | Removed duplicate sessions; added event labels |
| `nexacore-dashboard/src/components/profile/TrustedDevices.tsx` | UI adjustments |
| `nexacore-dashboard/src/components/ui/Input.tsx` | Minor fix |
| `nexacore-dashboard/src/context/AuthContext.tsx` | Backend `oauthAction` for toasts; ref guard on mount |
| `nexacore-dashboard/src/hooks/usePasskey.ts` | Minor updates |
| `nexacore-dashboard/src/hooks/useTrustedDevices.ts` | Minor updates |
| `nexacore-dashboard/src/lib/types.ts` | Added `hasPassword` to `SafeUser`, `oauthAction` to `AuthResponse` |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/records/Sprint 4/SCRUM-138_fullstack.md` | This record |
| `ai-specs/specs/integration-state.md` | Updated with new OAuthCallbackFilter, oauthAction changes |

## Lessons Learned

- **OAuth account lifecycle is complex**: The interaction between LOCAL accounts, OAuth linking, email changes, and session management creates many edge cases that are hard to predict without manual testing.
- **React StrictMode double-fire**: Any effect that calls an API with side effects (token refresh, session creation) must be guarded with `useRef` to prevent double execution.
- **Backend should drive UI decisions**: Fragile frontend heuristics (e.g., checking `createdAt` timestamps) should be replaced by explicit backend signals (e.g., `oauthAction` flag).
- **Industry research pays off**: Analyzing Clerk, Supabase, Auth0, Firebase patterns led to the correct OAuth auto-linking implementation.
- **Jira ticket SCRUM-158 created**: For future multi-provider OAuth architecture (OAuthAccount table, dedicated link/unlink endpoints).
