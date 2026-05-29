# Implementation Record: SCRUM-95 Rate Limiting and Account Lockout Coherence

## 2. Summary

Fixed incoherent rate limiting behavior across the auth system in two phases. Phase 1 fixed the backend seconds/ms bug, added RateLimitBanner to all forms, and raised login throttle to avoid masking lockout. Phase 2 (driven by QA testing) decoupled rate limit state from AuthContext into local per-form hooks, introduced throttle vs lockout differentiation with distinct UX, added a lockout cache to survive SPA navigation, and hardened button-disable behavior during countdowns.

- **Scope:** fullstack
- **Branch:** feature/security-warn-remediation
- **Implementation date:** 2026-02-28 to 2026-03-01

## 3. Plan Reference

- Plan: `ai-specs/changes/plans/SCRUM-95_fullstack.md`
- Plan followed: **Partially** — Phase 1 (commit `a139d79`) followed the plan closely. Phase 2 (commit `fe21804`) was a significant deviation driven by QA testing that revealed architectural limitations in the plan's approach. See Section 5 for detailed deviations.

## 4. Commits

| Hash | Message |
|------|---------|
| `a139d79` | fix(SCRUM-95): fix rate limiting and account lockout coherence |
| `fe21804` | fix(SCRUM-95): decouple rate limit state per form and fix UX coherence |

### Commit 1 (`a139d79`) — Phase 1: Backend fix + RateLimitBanner on all forms

| Component | File | Change |
|-----------|------|--------|
| CustomThrottlerGuard | `nexacore-api/src/common/guards/custom-throttler.guard.ts` | Fix seconds/ms confusion in retryAfter and resetTime; destructure timeToBlockExpire |
| CustomThrottlerGuard spec | `nexacore-api/src/common/guards/tests/custom-throttler.guard.spec.ts` | Fix mock values (ms to s), add blocked retryAfter assertion |
| Auth constants | `nexacore-api/src/auth/constants/auth.constants.ts` | Login throttle limit 5 to 10 |
| Rate limiting spec | `nexacore-api/src/auth/tests/rate-limiting.spec.ts` | Update login limit assertion |
| AuthContext | `nexacore-dashboard/src/context/AuthContext.tsx` | Clear rateLimitInfo in AUTH_START/AUTH_STOP; add retryAfter detection to 4 methods |
| RegisterForm | `nexacore-dashboard/src/components/auth/RegisterForm.tsx` | Add RateLimitBanner + disable form when rate limited |
| ForgotPasswordForm | `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` | Add RateLimitBanner + disable form when rate limited |
| ResetPasswordForm | `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` | Add RateLimitBanner + disable form when rate limited |
| MfaTotpStep | `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` | Add RateLimitBanner + disable form when rate limited |

### Commit 2 (`fe21804`) — Phase 2: Architecture refactor + UX differentiation

| Component | File | Change |
|-----------|------|--------|
| Auth controller | `nexacore-api/src/auth/auth.controller.ts` | Fix resetPassword throttle group `default` to `global` (was silently ignored) |
| Auth constants | `nexacore-api/src/auth/constants/auth.constants.ts` | Tune limits: register 3 to 5, refresh 10 to 30, oauth 5 to 10; update JSDoc |
| Rate limiting spec | `nexacore-api/src/auth/tests/rate-limiting.spec.ts` | Update all assertions for new values; `toBeLessThanOrEqual` for global comparison |
| Types | `nexacore-dashboard/src/lib/types.ts` | Add `RateLimitKind` type, `kind` field on `RateLimitInfo`, `RateLimitError` class |
| useRateLimit hook | `nexacore-dashboard/src/hooks/useRateLimit.ts` | **New file** — local per-form rate limit state with `kind` support |
| AuthContext | `nexacore-dashboard/src/context/AuthContext.tsx` | Remove `RATE_LIMITED` action + `rateLimitInfo` from global state; throw `RateLimitError` with `kind`; add `detectRateLimitKind` helper |
| RateLimitBanner | `nexacore-dashboard/src/components/ui/RateLimitBanner.tsx` | Accept `kind` prop; Lock icon for lockout, AlertTriangle for throttle |
| LoginForm | `nexacore-dashboard/src/components/auth/LoginForm.tsx` | Local `useRateLimit` hook; module-level lockout cache (`Map`); cache rescue logic in `handleLogin`; remove `clearRateLimit` from `handleChange` |
| RegisterForm | `nexacore-dashboard/src/components/auth/RegisterForm.tsx` | Local `useRateLimit` hook; catch `RateLimitError`; remove `clearRateLimit` from `handleChange`; add `disabled:opacity-50` |
| ForgotPasswordForm | `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` | Local `useRateLimit` hook; catch `RateLimitError`; remove `clearRateLimit` from `onChange`; add `disabled:opacity-50` |
| ResetPasswordForm | `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` | Local `useRateLimit` hook; catch `RateLimitError`; remove `clearRateLimit` from `onChange`; add `disabled:opacity-50` |
| MfaTotpStep | `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` | Local `useRateLimit` hook; `handleVerify` wrapper; remove `clearRateLimit` from digit/recovery `onChange` |

## 5. Deviations from Plan

### Architectural deviations (Phase 2)

| Planned | Actual | Reason |
|---------|--------|--------|
| Keep `RATE_LIMITED` action in AuthContext with global `rateLimitInfo` state | Removed entirely; each form manages its own rate limit state via local `useRateLimit` hook | QA testing revealed cross-form state leakage: triggering forgot-password rate limit caused a counter on the login form because `rateLimitInfo` was shared in global AuthContext |
| Single UX for both 429 (throttle) and 403 (lockout) — "Same UX, backend message differentiates" | Added `RateLimitKind` type (`'throttle'` / `'lockout'`), different icons (AlertTriangle vs Lock), distinct banner messages | User required visual differentiation between IP throttle and account lockout because they represent fundamentally different security events with different recovery paths |
| AuthContext dispatches `RATE_LIMITED` action to set state | AuthContext throws `RateLimitError` (new class) with `kind`; forms catch it and call local `setRateLimit` | Required by the local-hook architecture — AuthContext no longer owns rate limit state |
| No lockout cache mechanism | Module-level `Map<string, { retryAfter, lockedAt }>` outside LoginForm component | When IP throttle (429) fires while account lockout is active, the 429 response masks the 403. The cache stores the lockout state per email so the frontend can display the correct lockout banner even when the backend returns 429 |
| `clearRateLimit` called in every `onChange` handler | Removed `clearRateLimit` from all `onChange`/`handleChange` handlers | QA testing showed that typing in fields during an active countdown re-enabled the submit button, defeating the purpose of the rate limit UX |
| No new files — "Zero new files" per plan | 1 new file: `useRateLimit.ts` | Required by the local per-form state architecture |

### Value adjustments (Phase 2)

| Planned | Actual | Reason |
|---------|--------|--------|
| `register: limit 3` | `register: limit 5` | Original limit too aggressive for legitimate users with typos |
| `refresh: limit 10` | `refresh: limit 30` | Silent background refresh can legitimately fire frequently (tab switching, multiple tabs) |
| `oauth: limit 5` | `oauth: limit 10` | Aligned with login limit since OAuth callback involves similar request patterns |
| `resetPassword: @Throttle({ default: ... })` | `@Throttle({ global: ... })` | **Bug fix**: `'default'` doesn't match any registered throttler name (only `'global'` is registered), so the override was silently ignored — endpoint fell back to 100/60s instead of intended 5/60s |

### Items from plan that were NOT needed

| Planned | Why not needed |
|---------|---------------|
| Temporary diagnostic Logger in CustomThrottlerGuard | Was added then removed before commit — verification confirmed keys are correctly isolated per endpoint |

## 6. Test Results

- **Backend:** 428 tests passed, 0 failed (34 suites)
- **Coverage:** Stmts 98.82%, Branch 86.64%, Funcs 96.8%, Lines 98.89% — all thresholds met
- **Frontend:** `npm run build` compiles clean (10 routes)
- **Manual verification:**
  - Password account: 4x 401 then attempt 5: 403 locked 15min (retryAfter: 900, lockoutLevel: 1)
  - OAuth-only account: 8x 401, never locks, DB failedAttempts: 0
  - IP throttler: kicks in at attempt 11 (429, retryAfter: 60)
  - Forgot-password rate limit does NOT leak to login form (local state)
  - Register rate limit does NOT leak to login form (local state)
  - Login lockout shows Lock icon + "Too many attempts. Account locked." with countdown
  - Login IP throttle shows AlertTriangle icon + "Too many requests." with countdown
  - Navigating to /register and back to /login preserves lockout banner (module-level cache)
  - Typing in fields during countdown does NOT re-enable submit button
  - Changing email (screen change) correctly clears rate limit state

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| retryAfter always 1s (seconds/ms confusion) | HIGH | Fixed (Phase 1) | CustomThrottlerGuard.handleRequest: removed `/1000` division, values already in seconds |
| Throttler masks lockout (both limit=5) | HIGH | Fixed (Phase 1) | Raised AUTH_RATE_LIMITS.login.limit from 5 to 10 |
| AUTH_START/AUTH_STOP don't clear rateLimitInfo | MEDIUM | Fixed then superseded | Phase 1: added clear to reducer. Phase 2: removed `rateLimitInfo` from AuthContext entirely |
| 4 auth methods miss retryAfter in errors | MEDIUM | Fixed (Phase 1) | Added retryAfter detection to verifyMfaLogin, forgotPassword, resetPassword, resendVerification |
| 4 forms missing RateLimitBanner | LOW | Fixed (Phase 1) | Added RateLimitBanner to RegisterForm, ForgotPasswordForm, ResetPasswordForm, MfaTotpStep |
| Cross-form rate limit state leakage | HIGH | Fixed (Phase 2) | Moved `rateLimitInfo` from global AuthContext to local `useRateLimit` hook per form |
| `resetPassword` throttle group name `default` silently ignored | HIGH | Fixed (Phase 2) | Changed to `global` to match registered throttler name; endpoint now correctly enforces 5/60s |
| IP throttle masks lockout on frontend | MEDIUM | Fixed (Phase 2) | Module-level lockout cache per email; when 429 fires, frontend checks cache and shows lockout banner if applicable |
| lockout cache lost on SPA navigation | MEDIUM | Fixed (Phase 2) | Moved cache from `useRef` (destroyed on unmount) to module-level `Map` (survives remount) |
| Typing in fields re-enables submit during countdown | MEDIUM | Fixed (Phase 2) | Removed `clearRateLimit()` from all `onChange`/`handleChange` handlers |

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/plans/SCRUM-95_fullstack.md` | Phase 1: Added Issue 4, Step 2b, Design Decision 5, OAuth-only lockout exclusion |
| `ai-specs/specs/integration-state.md` | Added changelog entries for SCRUM-94 and SCRUM-95 |

## 9. Lessons Learned

- **Global auth state is wrong for rate limiting** — Rate limit state is per-form, not per-session. Sharing it via AuthContext caused cross-form leakage that was invisible until multi-form QA testing. Local hooks (`useRateLimit`) with component-level ownership prevent this entirely.
- **Throttle group names must match registered throttlers** — `@Throttle({ default: ... })` silently falls back to global defaults when no throttler named `'default'` is registered. This is a `@nestjs/throttler` footgun: no warning, no error, just silent ignore. Always use the exact name from `ThrottlerModule.forRoot([{ name: 'global', ... }])`.
- **Two-layer rate limiting needs frontend awareness** — When IP throttle (429, guard-level) fires while account lockout (403, controller-level) is active, the 429 masks the 403. The frontend must cache lockout state to display the correct banner during this overlap period.
- **Module-level state for SPA navigation survival** — `useRef` and `useState` are destroyed on component unmount. For state that must survive SPA navigation (login to register and back), a module-level `Map` outside the component is the simplest solution without introducing a new context.
- **onChange handlers should not clear countdowns** — Clearing rate limit state on every keystroke defeats the purpose of disabling the submit button during a countdown. Rate limits should only clear via `onExpired` (countdown reaches zero) or explicit screen changes.
- **ThrottlerStorageService returns seconds, not milliseconds** — `getExpirationTime()` in `@nestjs/throttler` v6.5.0 already divides by 1000. Test mocks that used ms values masked this bug.
- **Plans need revision checkpoints for QA-driven changes** — The original plan was sound for Phase 1 but could not anticipate the architectural refactoring required by Phase 2. When QA reveals fundamental issues, the plan should be formally revised rather than informally extended.
