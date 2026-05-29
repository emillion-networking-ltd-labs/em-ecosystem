# Implementation Record: SCRUM-342 — Restore "Invalid credentials" + Robust session-expired UX

## Summary

Fixed a regression introduced by SCRUM-326 where login with wrong password showed "An unexpected error occurred" instead of "Invalid credentials" (silentRefresh in the apiClient was hijacking the 401 from `/auth/login` and converting it to a `SessionExpiredError`). The work expanded during smoke testing into a full sweep of session-expiry and rate-limit UX issues across all five auth forms, plus formalization of the toast-severity convention in `frontend-standards.mdc`.

- **Scope**: frontend
- **Branch**: `feature/SCRUM-342-frontend` (deleted after merge)
- **Implementation date**: 2026-05-03
- **Sprint**: 12 (Auth UI Polish, id=411)

## Plan Reference

- Original plan: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-342_frontend.md`](../../plans/Sprint 12/SCRUM-342_frontend.md)
- Verify report: [`ai-specs/changes/auth/plans/Sprint 12/SCRUM-342_verify.md`](../../plans/Sprint 12/SCRUM-342_verify.md)
- Plan was followed: **Yes**, with three documented mid-cycle scope extensions (Steps 7b, 7c, 7d, 7e) all approved by the user during smoke. No silent deviations.

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `d9cd7d9` | SCRUM-342: Restore "Invalid credentials" on login + robust session-expired UX | 11 files: `api.ts`, `AuthContext.tsx`, `LoginForm.tsx`, `ActiveSessions.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `MfaTotpStep.tsx`, `toast-messages.ts`, `tests/lib/api.test.ts` (NEW), `tests/context/AuthContext.test.tsx` (NEW). Net diff +581/-24. |

PR: [#231](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/231) — merged fast-forward to `main`.

## Deviations from Plan

Imported from `/verify` report (verdict PASS-WITH-DEBT — already approved by user during verification phase). No reclassification.

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 5 | Build/lint/test all clean | Pre-existing failures present (1 ESLint error in `Tooltip.tsx`, 6 tsc errors in `ComponentShowcase.tsx`/`error-boundaries.test.tsx`, 31 jest fails in unrelated UI suites) | Verified reproducible on `main` via `git stash` + retest — not caused by this branch. | **Pre-existing** | Track as known baseline gaps; not within scope of SCRUM-342 |
| 6 | Manual smoke for AC5 (genuine session-expired toast via in-operation silentRefresh fail) | Partial — silentRefresh routing covered by unit test `tests/lib/api.test.ts:75-92`; F5 reload path verified live; in-operation toast path not validated end-to-end | Triggering AC5 reliably requires backend behavior change (per-session deny-list of access tokens) which is out of scope of this frontend ticket | **Accepted-Quality** | New ticket SCRUM-339 (backend deny-list — see below) |
| 7b | Differentiated FIRST/REPEAT toast in LoginForm | DONE | — | — | — |
| 7c | Robust session-expired UX (4 sub-fixes including effect-split for callback registration) | DONE | — | — | — |
| 7c (test) | Add unit tests for `throttleWindowEndsAtRef` first-vs-repeat in LoginForm | Not added | `LoginForm.test.tsx` mocks `useAuth`/`useRateLimit`/`ToastContext` heavily; adding behavioral coverage for the rate-limit catch path requires significant test infrastructure rework | **Accepted-Quality** | Tracked in MEMORY.md backlog under "SCRUM-342 follow-ups" → Phase 9b E2E tests |
| 7c (test) | Add unit tests for `ActiveSessions.signOutAllSessions` flow | Not added | No pre-existing `ActiveSessions.test.tsx`; creating one expands scope | **Accepted-Quality** | Same as above |
| 7d | Toast on RateLimitError for all auth forms | DONE for 4 auth forms (Register, Forgot, Reset, MFA) | — | — | — |
| 7d (extension) | Toast on RateLimitError for `TrustedDevices.tsx` and `usePasskey` hook | Not done | Different module (`/profile`) and different code shape (usePasskey uses internal state separate from `useRateLimit`) — out of scope of frontend SCRUM-342 | **Deferred** | MEMORY.md backlog |
| 7e | Toast severity audit + alignment | DONE — `MISSING_RESET_TOKEN` and `EXPIRED_LINK` warning → error; new `Toast Severity Guidelines` section in `frontend-standards.mdc` | — | — | — |
| (post-7c) | Backend `revokeSession` does not deny-list access token of revoked session | Pre-existing JWT eventual-consistency tradeoff (up-to-15min stale-token window) | Documented in plan as out-of-scope of frontend SCRUM-342; user explicitly agreed during smoke to handle in separate backend ticket | **Deferred** | New ticket SCRUM-339 (see below) |

**Total deviations**: 6 — 0 Scope-Gap, 0 Accepted-Risk, 1 Pre-existing, 3 Accepted-Quality, 2 Deferred. None block merge (already merged).

## Test Results

- **Target suites** (api.test.ts, AuthContext.test.tsx, LoginForm.test.tsx): 13/13 pass
- **Full suite**: 71 passing / 31 failing (31 failures are **pre-existing on `main`**, verified reproducible via `git stash` test before branch creation; net delta vs main = +9 passing in target suites, 0 new failures)
- **Manual verification** (by user):
  - AC1 (wrong password → Invalid credentials toast) ✅
  - AC2 (non-registered email → same anti-enumeration toast) ✅
  - AC3a (locked account → Invalid credentials, no countdown — anti-enumeration intact) ✅
  - AC3b (throttler trip → countdown banner + warning toast FIRST) ✅
  - AC4 (no inline error on backend failure — toast-only convention) ✅
  - AC6 (no Session expired toast on login fail) ✅
  - AC11 (first 429 → warning yellow toast with email hint) ✅
  - AC12 (repeat 429 → error red toast "Sign-ins temporarily blocked") ✅
  - AC13 (Sign out from all sessions UI → ConfirmModal → success toast + redirect) ✅
  - AC14 (manual cookie deletion → toast + redirect on next navigation) ✅
  - AC15 (Register rate-limit → INBOX_HINT toast) ✅
  - AC16 (Forgot rate-limit → INBOX_HINT toast) ✅
  - AC17 (Reset rate-limit → GENERIC toast) ✅ (verified by user)
  - AC18 (MFA rate-limit → GENERIC toast) ✅ (verified by user)
  - **AC5** (genuine session-expired toast in operation): partial — see Deviations. Unit test covers routing; end-to-end smoke deferred.
- **Tests skipped**: none — all target suite tests pass.

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| `apiClient.silentRefresh` hijacked 401 from `/auth/login` and produced `SessionExpiredError` instead of surfacing "Invalid credentials" | HIGH (the original SCRUM-342 bug) | Fixed | Added `SKIP_REFRESH_ON_401` allowlist in `api.ts` |
| `apiClient.silentRefresh` used direct field assignment `this.accessToken = ...` instead of `this.setAccessToken(...)`, leaking `authFailureTriggered` flag state across recovery cycles | MEDIUM | Fixed | Switched to setter (`api.ts:275`) |
| `AuthContext.handleAuthFailure` callback was permanently `null` in StrictMode dev because the registration `useEffect` had a `mountedRef.current` guard that combined with cleanup nullification produced body→cleanup→skip sequence | HIGH (silenced toast/redirect across the entire dashboard) | Fixed | Split callback registration into its own `useEffect` (no mount guard); kept the mount-once init effect separate |
| `ActiveSessions` button labeled "Revoke all others" actually called `/auth/logout-all` which kills ALL sessions including current — UI/backend semantic mismatch | MEDIUM | Fixed | Renamed to "Sign out from all sessions"; added ConfirmModal; on success calls `AuthContext.logout()` for explicit redirect |
| 4 auth forms (Register, Forgot, Reset, MfaTotp) lacked `addToast` on `RateLimitError` — violated newly-documented toast-only convention | LOW (UX inconsistency, not regression) | Fixed | Added `addToast` to each catch with appropriate variant (INBOX_HINT or GENERIC) |
| Backend `revokeSession` does not deny-list the access token of the revoked session — pre-existing JWT eventual-consistency tradeoff allowing up to 15 min of stale-token access | MEDIUM (security hardening, not regression) | Deferred | Tracked in new ticket SCRUM-339 |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/frontend-standards.mdc` | (1) New `### 401 Routing Rule (MANDATORY)` subsection under Service Layer Architecture documenting `SKIP_REFRESH_ON_401` allowlist. (2) New `### Backend errors are toast-only (MANDATORY)` subsection documenting the inline-vs-toast convention. (3) New `### Toast Severity Guidelines (MANDATORY)` subsection documenting the four-variant convention (error/warning/info/success), event-to-variant mapping table, FIRST/REPEAT escalation pattern, and three anti-patterns to avoid future drift. |
| `ai-specs/changes/auth/plans/Sprint 12/SCRUM-342_frontend.md` | Plan document (created during `/plan`, frozen as required by workflow standards). |
| `ai-specs/changes/auth/plans/Sprint 12/SCRUM-342_verify.md` | Verify report (created during `/verify`). |

No `data-model.md` or `api-spec.yml` changes — frontend-only ticket, backend untouched.

`integration-state.md` not modified — no module imports/exports/guards/services/permissions changed in `nexacore-api`.

## Audit Finding Verification

N/A — This ticket is a regression bug fix + UX consistency work, not an audit remediation ticket.

## Lessons Learned

### What went well
- The `/verify` step caught the proper sequencing (manual smoke → then commit) and the user's iterative feedback during smoke surfaced 4 additional issues that would have shipped as bugs otherwise (cross-tab session sync, `authFailureTriggered` flag leak, button label/behavior mismatch in `ActiveSessions`, missing toasts in 4 forms).
- Splitting toast variants by context (FIRST/REPEAT for login, INBOX_HINT for register/forgot, GENERIC for reset/mfa) is a maintainable middle-ground between "one toast for everything" and "custom message per form".
- Documenting conventions in `frontend-standards.mdc` during the implementation (rather than as a postscript) made it a deliverable artifact, not an afterthought.

### What was harder than expected
- Cross-tab session sync diagnosis: the `authFailureTriggered` flag bug + the `useEffect` callback registration bug looked superficially similar (both produced "no toast on session expiry") and required careful code reading to separate. The fix to split the registration effect into its own `useEffect` is non-obvious from the symptom.
- The backend revoke-session vs revoke-all asymmetry (one deny-lists tokens, the other doesn't) was a pre-existing trap that took multiple rounds of user-driven smoke to surface clearly.
- Toast copy work expanded into multiple revisions ("Too many attempts", "If you are a registered user", "If we sent you an email") — each iteration improved anti-enumeration safety but added rounds. Lesson: sketch the copy mapping table upfront, not after seeing each edge case.

### Recommendations for similar tickets
- For frontend-only auth tickets, do NOT touch backend code even when a backend bug is the obvious root cause — open a separate ticket. SCRUM-342's discipline kept the audit 0-FAIL baseline intact for `nexacore-api`.
- When introducing UI conventions (toast severity, inline-vs-toast), formalize them in `frontend-standards.mdc` during the implementation — this is what makes them stick across future tickets.
- React StrictMode bugs (like the callback registration race) should be on the standard checklist for any `useEffect` that mutates external state. The pattern "split mount-once init from re-runnable effects" is reusable.
- During smoke, ask the user to test cross-tab scenarios (open second incognito window, login same user) — many auth bugs hide in single-window testing.
