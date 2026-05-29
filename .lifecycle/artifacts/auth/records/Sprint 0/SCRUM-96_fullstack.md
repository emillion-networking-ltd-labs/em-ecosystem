# Implementation Record: SCRUM-96 Auth UX Polish — Password Recovery Flow, Figma Alignment + Resend Verification

## 2. Summary

Full-stack UX polish of the password recovery flow and email verification experience. Backend: added token validation endpoint, public resend-verification endpoint, same-password rejection, and shortened error messages. Frontend: Figma alignment across all 6 auth pages, success toasts, token validation on mount, inline resend-verification with CountdownTimer, route reorganization for semantic coherence.

- **Scope:** fullstack
- **Branch:** feature/security-warn-remediation
- **Implementation date:** 2026-03-01

## 3. Plan Reference

- Plan: `ai-specs/changes/plans/SCRUM-96_fullstack.md`
- Plan followed: **Partially** — Backend Phase 1 followed closely. Frontend Phase 2 followed the plan with additions: Figma alignment pass across all auth pages (Title Group pAlign=MIN, GoBackSection padding), route reorganization (/check-email → /password-reset/check-email, /email-sent → /activation/check-email), and activation check-email page aligned to new Figma frame Auth-Login-Check-Email-Activation.

## 4. Commits

| Hash | Message |
|------|---------|
| `5281264` | feat(SCRUM-96): auth UX polish — password recovery flow, Figma alignment, resend verification |

### Files Changed (15 files, +594/-174)

| Component | File | Change |
|-----------|------|--------|
| ResendVerificationPublicDto | `nexacore-api/src/auth/dto/resend-verification-public.dto.ts` | **NEW** — DTO with `@IsEmail()` for public resend endpoint |
| AuthService | `nexacore-api/src/auth/auth.service.ts` | +53 — `validateResetToken()`, `resendVerificationByEmail()`, same-password check in `resetPassword()`, shortened unverified login message |
| AuthController | `nexacore-api/src/auth/auth.controller.ts` | +43 — `GET /validate-reset-token` (@SkipCsrf), `POST /resend-verification-public` (@SkipCsrf, @Throttle 3/15min) |
| AuthService tests | `nexacore-api/src/auth/tests/auth.service.spec.ts` | +161 — 10 tests: validateResetToken (4), same-password (1), resendVerificationByEmail (5) |
| AuthController tests | `nexacore-api/src/auth/tests/auth.controller.spec.ts` | +38 — 3 tests: validateResetToken (2), resendVerificationPublic (1) |
| AuthContext | `nexacore-dashboard/src/context/AuthContext.tsx` | +31 — `validateResetToken`, `resendVerificationPublic` callbacks; login error flow dispatches AUTH_ERROR for verification errors |
| ForgotPasswordForm | `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` | Success toast before redirect; redirect to `/password-reset/check-email` |
| LoginForm | `nexacore-dashboard/src/components/auth/LoginForm.tsx` | +101 — Inline resend-verification link with SendHorizontal icon, CountdownTimer (60s), module-level cooldown cache, red styling during countdown |
| RegisterForm | `nexacore-dashboard/src/components/auth/RegisterForm.tsx` | Redirect to `/activation/check-email`; removed justify-center; dimension fix min-h-[204px] → min-h-[196px] |
| ResetPasswordForm | `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` | Figma layout (text link + single button), token validation on mount, confirm-password validation, success toast + redirect (removed success screen) |
| GoBackSection | `nexacore-dashboard/src/components/auth/GoBackSection.tsx` | `p-6` → `py-6` (Figma: padding top/bottom=24, left/right=0) |
| check-email page | `nexacore-dashboard/src/app/check-email/page.tsx` | **DELETED** — moved to `/password-reset/check-email` |
| email-sent page | `nexacore-dashboard/src/app/email-sent/page.tsx` | **DELETED** — moved to `/activation/check-email` |
| password-reset check-email | `nexacore-dashboard/src/app/password-reset/check-email/page.tsx` | **NEW** — Figma-aligned layout (text link + Try Again button) |
| activation check-email | `nexacore-dashboard/src/app/activation/check-email/page.tsx` | **NEW** — Aligned to Figma frame Auth-Login-Check-Email-Activation (text link only, no button) |

## 5. Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
| No route reorganization | Routes restructured: `/check-email` → `/password-reset/check-email`, `/email-sent` → `/activation/check-email` | User requested semantic route coherence — password reset and activation flows should have distinct URL prefixes |
| No Figma alignment pass on existing pages | Removed `justify-center` from all 7 auth Title Groups, fixed GoBackSection padding, fixed dimension mismatches (LoginForm email h-116→h-110, password min-h-146→min-h-148, ForgotPassword min-h-146→min-h-148, Register min-h-204→min-h-196) | Comparison with extracted Figma specs revealed multiple alignment issues across all auth pages |
| Activation check-email uses same layout as old email-sent | Aligned to new Figma frame Auth-Login-Check-Email-Activation — only "Back to Sign In" text link, no description paragraph, no primary button | New Figma frame extracted and used as source of truth |
| Unverified login error message unchanged | Shortened: "Verify your email before signing in. Check your inbox for the link." → "Verify your email to sign in. Check your inbox." | User requested shorter message during QA |

## 6. Test Results

- **Backend:** 441 tests passed, 0 failed (34 suites)
- **Coverage:** Stmts 98.50%, Branch 86.55%, Funcs 96%, Lines 98.55% — all thresholds met
- **Frontend:** `npm run build` compiles clean (17 routes including new ones)
- **New tests added:** 13 (10 service + 3 controller)
- **Manual verification:**
  - `/forgot-password` → submit → success toast appears → redirects to `/password-reset/check-email`
  - `/password-reset/check-email` → layout matches Figma (text link + single button)
  - `/reset-password?token=EXPIRED` → redirects to `/forgot-password` + warning toast
  - `/reset-password` → empty confirm → "Confirm your password" error
  - Reset with same password → "New password must be different from current password"
  - Successful reset → success toast + redirect to `/login`
  - Login with unverified user → toast error + inline "Resend verification email" link
  - Click resend → 60s countdown with CountdownTimer digit boxes + red button
  - Navigate away and back → cooldown persists (module-level cache)
  - Register → redirects to `/activation/check-email` (layout matches Figma)

## 7. Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Title Groups vertically centered instead of top-aligned | LOW | Fixed | Removed `justify-center` from all 7 auth page Title Group divs (Figma pAlign=MIN) |
| GoBackSection has equal padding all sides | LOW | Fixed | Changed `p-6` to `py-6` (Figma: vertical padding only) |
| Dimension mismatches across 4 auth forms | LOW | Fixed | Updated min-h values to match Figma specs exactly |
| Error shown both as toast AND inline on resend verification | MEDIUM | Fixed | Removed inline error text — toast covers the full message, inline shows only resend button |
| CountdownTimer removed during refactor | MEDIUM | Fixed | Re-added CountdownTimer import and digit-box display during cooldown |

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/api-spec.yml` | Already had GET /validate-reset-token and POST /resend-verification-public (added in prior session) |
| `ai-specs/specs/integration-state.md` | Changelog entry updated with: route reorganization, Figma alignment details, CountdownTimer, shortened message, Auth-Login-Check-Email-Activation frame |
| `integrations/figma-mcp-server/specs/auth-login-check-email-activation.json` | NEW — Extracted Figma frame spec for activation check-email page |

## 9. Lessons Learned

- **Figma specs should be extracted and compared systematically** — Spot-checking individual elements misses alignment issues. Extracting full frame specs and comparing dimensions, layout modes, and alignment properties across all pages catches issues that visual inspection misses.
- **Route structure should reflect flow semantics** — Generic routes like `/check-email` and `/email-sent` are ambiguous when multiple flows use similar pages. Prefixing with the flow name (`/password-reset/`, `/activation/`) creates clarity for both developers and users.
- **Module-level caches for SPA navigation** — The resend verification cooldown uses a module-level `Map` (same pattern as SCRUM-95's lockout cache) to survive component unmount/remount during SPA navigation.
- **Toast vs inline error separation** — Showing the same error both as a toast and inline creates visual noise. Toast handles the full message; inline UI should only show actionable elements (like a resend button).
