# Verification Report: SCRUM-342 — Restore "Invalid credentials" + Robust session-expired UX

**Date**: 2026-05-03
**Plan**: `ai-specs/ai-specs/changes/auth/plans/Sprint 12/SCRUM-342_frontend.md`
**Branch**: `feature/SCRUM-342-frontend`
**Verdict**: **PASS-WITH-DEBT**

## Plan Compliance

| Step | Description | Status | Deviation Category | Notes |
|------|-------------|--------|-------------------|-------|
| 0 | Create feature branch `feature/SCRUM-342-frontend` from main | DONE | — | Verified via `git branch --show-current` |
| 1 | Add `SKIP_REFRESH_ON_401` allowlist + guard in `api.ts` | DONE | — | `api.ts:18` (Set), `api.ts:134` (guard) verified live |
| 2 | Keep `AUTH_STOP` dispatch in `AuthContext.tsx` (cosmetic only) | DONE | — | `AuthContext.tsx:323` `dispatch({ type: "AUTH_STOP" })`; `extractErrorMessage` inlined in toast call |
| 3 | Add regression tests for `api.ts` (5 cases) | DONE | — | `tests/lib/api.test.ts` 5/5 pass |
| 4 | Add regression tests for `AuthContext.tsx` (4 cases) | DONE | — | `tests/context/AuthContext.test.tsx` 4/4 pass |
| 5 | Build & lint verification (Round 1) | DONE-DEVIATED | Pre-existing | Lint clean on changed files (0 errors, 1 pre-existing warning); 13/13 in target suites; pre-existing failures in full suite documented as Pre-existing |
| 6 | Manual smoke (AC1-AC18 incl. cross-tab + cookie deletion + throttler) | DONE-DEVIATED | Accepted-Quality (AC5) | AC1-AC4, AC6, AC11-AC18 manually verified by user. AC5 (genuine session-expired toast via silentRefresh fail) partially validated by unit test `tests/lib/api.test.ts:75-92` (silentRefresh routing) — full end-to-end smoke deferred to follow-up backend ticket where individual session revocation will be made instant. |
| 7b | Differentiated throttler toast FIRST/REPEAT in `LoginForm.tsx` | DONE | — | `LoginForm.tsx:72` (ref), `:156-160` (logic), `:164-169` (toast switch) verified |
| 7c | Robust session-expired UX (4 sub-fixes) | DONE | — | (1) `ActiveSessions.tsx` `signOutAllSessions` + ConfirmModal, (2) `AuthContext.handleAuthFailure` `router.replace("/login")`, (3) `api.ts silentRefresh` `this.setAccessToken(...)`, (4) effect-split (callback registration separated from mount-once init) — all verified |
| 7d | Toast on RateLimitError for all 4 remaining auth forms | DONE | — | RegisterForm + ForgotPasswordForm → INBOX_HINT, ResetPasswordForm + MfaTotpStep → GENERIC, all verified |
| 7e | Toast severity audit + alignment with industry convention | DONE | — | `MISSING_RESET_TOKEN` and `EXPIRED_LINK` variants `warning` → `error`; new `Toast Severity Guidelines` section added to `frontend-standards.mdc` |
| 8 | Update `frontend-standards.mdc` (401 routing rule + toast-only convention) | DONE | — | `### 401 Routing Rule (MANDATORY)` and `### Backend errors are toast-only (MANDATORY)` subsections added under Service Layer Architecture |

## Deviations

| # | Step | Category | Description | Risk | Action |
|---|------|----------|-------------|------|--------|
| 1 | 5 | Pre-existing | `next build` has 1 ESLint error in `Tooltip.tsx` (rule definition missing); `tsc --noEmit` has 6 errors (ComponentShowcase, error-boundaries.test.tsx); `jest` full suite has 31 failing tests | None — verified reproducible on `main` (stash test confirmed identical baseline before SCRUM-342) | Documented; no new regressions introduced by this branch |
| 2 | 6 | Accepted-Quality | AC5 (Session expired toast on genuine backend revocation during operation) end-to-end smoke not fully validated. Reason: triggering AC5 reliably requires modifying backend session revocation behavior to deny-list access tokens immediately on per-session revoke (currently a known JWT eventual-consistency tradeoff with up-to-15min latency). | Low — silentRefresh routing covered by unit test `tests/lib/api.test.ts:75-92`; F5 reload path verified by user; only the in-operation toast path is unverified end-to-end | Tech debt: SCRUM-3xx backend "Individual session revocation should deny-list access token" (proposed to user during /verify; agreed as separate ticket) |
| 3 | 7b | Accepted-Quality | No unit test added for `throttleWindowEndsAtRef` first-vs-repeat detection in `LoginForm.tsx`. Reason: existing `LoginForm.test.tsx` mocks `useAuth`/`useRateLimit`/`ToastContext` completely; adding a behavioral test for the rate-limit catch path requires significant test infrastructure rework. | Low — manual smoke (AC11+AC12) verified the behavior in browser | Tech debt: include in follow-up E2E behavioral test ticket (Phase 9b — already proposed in earlier conversation) |
| 4 | 7c | Accepted-Quality | No unit test added for `ActiveSessions.signOutAllSessions` flow + ConfirmModal. Reason: pre-existing `ActiveSessions.test.tsx` does not exist; creating one would expand scope significantly. | Low — manual smoke (Window A scenario) verified the redirect flow | Tech debt: include in follow-up E2E behavioral test ticket |
| 5 | 7d | Deferred | `TrustedDevices.tsx` rate-limit toast (line 82) and `usePasskey` hook → `PasskeyManager` rate-limit toast lack the same convention violation fix. Out of scope of SCRUM-342 (different module — `/profile`, and `usePasskey` uses internal state separate from `useRateLimit` hook). | Low — pre-existing inconsistency, not regression | Tech debt: track in follow-up "Toast consistency in /profile" ticket |
| 6 | (post-7c) | Deferred | Backend `revokeSession` does NOT deny-list the revoked session's access token, leaving up to 15 min of stale-token access — pre-existing JWT eventual-consistency tradeoff. Documented in plan as out-of-scope of frontend SCRUM-342. User explicitly agreed to handle in separate backend ticket. | Medium (security hardening — not a regression, pre-existing) | New ticket SCRUM-3xx backend "Individual session revocation should deny-list access token" — to be opened post-merge |

## Code Quality Checks

| Check | Result | Details |
|-------|--------|---------|
| Lint (changed files) | PASS | 0 errors; 1 warning is pre-existing in `MfaSetupStep.tsx` (`<img>` vs `<Image>`) — not in this ticket's diff |
| Lint (full suite) | DEVIATED | 1 pre-existing error in `Tooltip.tsx` (`@typescript-eslint/no-explicit-any` rule not loaded) — verified reproducible on `main`, not caused by this ticket |
| TypeScript compile | DEVIATED | 6 pre-existing errors in `ComponentShowcase.tsx` and `error-boundaries.test.tsx` — verified reproducible on `main` |
| Tests (target suites) | PASS | 13/13 (`api.test.ts` 5, `AuthContext.test.tsx` 4, `LoginForm.test.tsx` 4) |
| Tests (full suite) | DEVIATED | 31 failing pre-existing (verified reproducible on `main`); 71 passing; 0 new regressions caused by SCRUM-342 (delta test count = +9 new passing in target suites) |
| Build (`next build`) | DEVIATED | Same 1 pre-existing ESLint error blocks build; not caused by this ticket |
| Integration state | NO CHANGE NEEDED | Frontend-only ticket; no module imports/guards/services changed in `nexacore-api`; `frontend-standards.mdc` updated as part of plan |
| New files with tests | 2/2 productive new files have tests | `api.ts` and `AuthContext.tsx` covered by new test files. Modified files (LoginForm, ActiveSessions, toast-messages, etc.) covered by manual smoke + Accepted-Quality deviations 3-4 above |
| Security pattern violations | 0 | No new `process.env`, no hardcoded errors outside ErrorMessages, no new ForbiddenException with unique message, no new `@Public()`, no new `any` types in production code (the 1 `any` error is pre-existing in `Tooltip.tsx`) |

## Regression Verification

| Check | Result | Details |
|-------|--------|---------|
| Blast radius files verified | OK | `apiClient.request` flow consumers (every `apiClient.get/post/...` call across the dashboard) — verified via SKIP_REFRESH_ON_401 only excluding 4 specific endpoints; all other callsites still trigger silentRefresh as before |
| Mock propagation | OK | `tests/context/AuthContext.test.tsx` updated to add `useRouter` mock (added in Step 7c); no other test mocks needed updating |
| API contract | NO CHANGE | No backend endpoints modified |
| Schema compatibility | N/A | No Prisma schema changes |
| Export surface integrity | OK | No exports removed/renamed; only `toast-messages.ts` added new exports (`TOO_MANY_ATTEMPTS_FIRST`, `_REPEAT`, `_GENERIC`, `_INBOX_HINT`); legacy `TOO_MANY_ATTEMPTS` removed but had only 1 consumer (LoginForm) which was migrated |
| Pre-existing test baseline | OK (31 fails = 31 fails on main) | No new failures introduced |

## Audit Finding Resolution

N/A — This ticket is a regression bug fix + UX consistency work, not an audit remediation ticket.

## Recurrence Prevention

Although not an audit fix ticket, this work introduces preventive measures captured in `frontend-standards.mdc`:

| Mechanism | Type | Status |
|-----------|------|--------|
| `### 401 Routing Rule (MANDATORY)` documenting `SKIP_REFRESH_ON_401` allowlist convention | Documented standard | Implemented (Step 8) |
| `### Backend errors are toast-only (MANDATORY)` documenting the inline-vs-toast convention | Documented standard | Implemented (Step 8) |
| `### Toast Severity Guidelines (MANDATORY)` documenting four-variant convention + escalation pattern + anti-patterns | Documented standard | Implemented (Step 7e) |
| Follow-up ticket recommendations: Phase 9b behavioral E2E tests + audit-standards.mdc Section 6.7 phase invalidation | Process improvement | Recommended in earlier conversation; not yet ticketed |

## Tech Debt Tickets to Create (post-merge)

The following deviations require Jira tickets to formalize the deferred work. **Recommendation**: open after `/commit` so they reference the merged commit hash.

| Proposed Ticket | Type | Severity | Sprint | Covers |
|----------------|------|----------|--------|--------|
| SCRUM-3xx (1) — Individual session revocation should deny-list access token | Tech debt / Security hardening | MEDIUM | Sprint 12 (if hueco) or backlog | Deviation #2 (AC5 backend gap) + Deviation #6 (JWT eventual-consistency tradeoff). Backend-only fix. User agreed during /verify. |
| SCRUM-3xx (2) — E2E behavioral tests for auth flows (Phase 9b) | Tech debt / Test coverage | LOW | Backlog | Deviations #3 and #4 (LoginForm rate-limit logic, ActiveSessions logout flow). Playwright setup + ~10 behavioral tests. Aligns with audit framework's Phase 9b proposal. |
| SCRUM-3xx (3) — Toast consistency in /profile and PasskeyManager | Tech debt / UX consistency | LOW | Backlog | Deviation #5. TrustedDevices and PasskeyManager rate-limit toasts. |
| SCRUM-3xx (4) — BroadcastChannel cross-tab session sync | Enhancement / UX | LOW | Backlog | From earlier conversation. Same-browser-profile tabs would log out instantly when one logs out, instead of waiting for 401 cascade in each tab. |
| SCRUM-3xx (5) — `audit-standards.mdc` Section 6.7 Phase Invalidation | Process / Audit framework | LOW | Backlog | From earlier conversation. Add rule that frontend changes invalidate Phase 9 PASS. |

## Verdict Justification

**PASS-WITH-DEBT** because:
- All 12 plan steps are DONE (Step 5 and Step 6 have classified deviations, none Scope-Gap, none Accepted-Risk).
- 0 new regressions introduced (full suite delta = +9 passing tests, same 31 pre-existing fails).
- 6 deviations are all classifiable as Pre-existing, Accepted-Quality, or Deferred — none block merge.
- All security/anti-enumeration contracts intact (SCRUM-217, SCRUM-283, SCRUM-284 not violated; SCRUM-300/301 toast convention now formally documented).
- Backend untouched, audit baseline (0-FAIL on `auth` module from 2026-03-16) remains valid for backend code.
- No Accepted-Risk deviations (no security gaps introduced).

**Action required before `/commit`**:
- User confirms tech debt tickets to be opened post-merge (proposed list above).
- User approves verdict and authorizes proceeding to `/commit`.
