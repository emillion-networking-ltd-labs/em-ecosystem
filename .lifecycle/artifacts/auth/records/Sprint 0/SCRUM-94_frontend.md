# Implementation Record: SCRUM-94 Toast Notification System

## Summary

Implemented a toast notification system for the dashboard with ToastContext, Toast/ToastContainer UI components, RateLimitBanner with animated CountdownTimer, and integrated across all auth forms and profile pages. A follow-up fix redesigned the Toast to match updated Figma spec, added title+description pattern, polished auth form validation, and cleaned up backend lockout messages.

- **Scope**: fullstack (frontend primary, minor backend message changes)
- **Branch**: `feature/security-warn-remediation`
- **Implementation date**: 2026-02-28

## Plan Reference

- **Original plan**: `ai-specs/changes/plans/SCRUM-94_frontend.md`
- **Plan was followed**: Partially — plan covered initial toast system (Steps 0–12). The follow-up fix commit added significant UX polish not in the original plan (Figma redesign, form validation fixes, CountdownTimer, backend message cleanup).

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `eb3cc5f` | feat(SCRUM-94): add toast notification system to dashboard | Toast.tsx, ToastContainer.tsx, ToastContext.tsx, providers.tsx, globals.css, AuthContext.tsx, admin/page.tsx, ActiveSessions.tsx, ChangePasswordForm.tsx, ProfileForm.tsx, PermissionsMatrix.tsx |
| `8f2a8b3` | fix(SCRUM-94): redesign toast notifications and polish auth forms | Toast.tsx, ToastContainer.tsx, CountdownTimer.tsx, RateLimitBanner.tsx, Input.tsx, globals.css, AuthContext.tsx, LoginForm.tsx, RegisterForm.tsx, ForgotPasswordForm.tsx, ResetPasswordForm.tsx, ActiveSessions.tsx, ChangePasswordForm.tsx, ProfileForm.tsx, PermissionsMatrix.tsx, admin/page.tsx, auth.service.ts, custom-throttler.guard.ts |

## Deviations from Plan

| Step | Planned | Actual | Reason |
|------|---------|--------|--------|
| Step 4 (Toast) | w-[400px], slide-in from right, fixed top-right | max-w-[450px], drop-in from top, centered, pill shape, title+description, hidden close on hover | Figma design updated after initial implementation |
| Step 6 (RateLimitBanner) | Two-line layout with border/bg, inline time formatting | Single-line with CountdownTimer digit boxes, flex-wrap for mobile | UX improvement — DaisyUI-style animated digit boxes |
| N/A | Not planned | Auth form validation fixes (empty field, hasError isolation) | QA testing revealed missing validation on ForgotPasswordForm and RegisterForm |
| N/A | Not planned | Password Check visual removed from Register/ResetPassword | No longer serves a purpose after validation changes |
| N/A | Not planned | Backend lockout messages shortened | "Try again in X minutes" text now redundant with CountdownTimer |
| N/A | Not planned | All addToast calls split into title + description | New Figma spec has title (12px/600) + subtitle (12px/400, 50% opacity) |
| N/A | Not planned | Error color token fixes (Input, ActiveSessions) | Audit found `text-error/75` should be `text-error`, and `hover:bg-status-error/10` was invalid |

## Test Results

- **Backend tests**: 428 passed, 34 suites, 0 failed
- **Coverage**: Stmts 98.46%, Branch 86.41%, Funcs 95.92%, Lines 98.51%
- **Frontend build**: `npm run build` — clean, 17 routes generated
- **Manual verification**:
  - Login wrong password → toast "Sign in failed" + "Invalid credentials"
  - Rapid login attempts → RateLimitBanner with CountdownTimer shows "Too many requests."
  - Account lockout → RateLimitBanner shows "Too many attempts. Account locked." + countdown
  - Register with empty fields → proper per-field validation
  - ForgotPassword with empty email → "Enter your email address"
  - Toast auto-dismisses after 5s
  - Toast close button appears on hover
  - Toast drops in from top, slides out to right
  - Mobile: RateLimitBanner text wraps with counter below

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `hover:bg-status-error/10` invalid token in ActiveSessions | LOW | Fixed | Changed to `hover:bg-error/10` (8f2a8b3) |
| Input error message used `text-error/75` instead of `text-error` | LOW | Fixed | Changed to `text-error` per design system spec (8f2a8b3) |
| RegisterForm marked both inputs on single-field error | MEDIUM | Fixed | Isolated `hasError` per field: email uses `emailError\|\|error`, password uses `passwordError\|\|error` (8f2a8b3) |
| RegisterForm empty password → silent return, no error | MEDIUM | Fixed | Added `passwordError` state with "Enter your password" message (8f2a8b3) |
| ForgotPasswordForm empty email → no error shown | MEDIUM | Fixed | Added `emailError` state with "Enter your email address" message (8f2a8b3) |
| Backend lockout message included "Try again in X minutes" → redundant with CountdownTimer | LOW | Fixed | Shortened to "Too many attempts. Account locked." (8f2a8b3) |
| Backend throttler message included "Please try again later." → redundant | LOW | Fixed | Shortened to "Too many requests." (8f2a8b3) |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/ui-design-system.md` | Rewrote section 24 (Toast Message) to match new Figma extraction: pill 416x84, padding 24h/16v, top-aligned, title 12px/600, subtitle 12px/400 50%, 4 variant icons with exact colors, close button spec |
| `ai-specs/specs/integration-state.md` | Added SCRUM-94 (fix) changelog entry documenting all component and behavior changes |

## Lessons Learned

- **Figma should be re-extracted before implementation** — the initial Toast was built from a stale spec. Re-extracting via the Figma MCP server caught the updated design (pill shape, title+description layout).
- **Form validation needs systematic review** — individual field errors (email vs password) must be isolated with separate state to avoid marking unrelated inputs.
- **Backend messages should be presentation-agnostic** — embedding "Try again in X minutes" in error messages creates coupling with the frontend display. Sending `retryAfter` as data and letting the frontend format it is cleaner.
- **DaisyUI replication pattern works well** — extracting CSS from DaisyUI source and implementing as standalone components (InfinitySpinner, CountdownTimer) keeps the bundle small while matching the visual style.
