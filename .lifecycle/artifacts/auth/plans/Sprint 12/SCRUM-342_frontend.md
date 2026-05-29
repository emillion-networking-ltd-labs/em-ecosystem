# Frontend Implementation Plan: SCRUM-342 — Restore "Invalid credentials" message on login failure

## 1. Header

- **Ticket**: SCRUM-342
- **Sprint**: 12 (Auth UI Polish, id=411)
- **Scope**: frontend (nexacore-dashboard only)
- **Module**: auth
- **Severity**: HIGH (regression of documented security contract)
- **Branch**: `feature/SCRUM-342-frontend`
- **Author**: Claude Opus 4.7
- **Date**: 2026-05-03

## 2. Overview

Two compounding regressions in `nexacore-dashboard` cause the login flow to display "Sign in failed — An unexpected error occurred." (often paired with a "Session expired" toast) when the user enters wrong credentials, instead of the expected "Sign in failed — Invalid credentials." with an inline error below the password input.

The fix restores three previously-audited contracts:

- **SCRUM-217** — anti-enumeration (CWE-204/203): same message for every failure cause.
- **SCRUM-284** — unified error response shape `{success:false, error:{message,code,statusCode}}`.
- **SCRUM-300** — inline error hint via `state.error` set by `AUTH_ERROR` dispatch.

Backend (`nexacore-api`) is intact and not modified.

## 3. Architecture Context

### Files in scope

| File | Role | Lines affected |
|------|------|----------------|
| `nexacore-dashboard/src/lib/api.ts` | `ApiClient.request()` 401 handling | 122-164 |
| `nexacore-dashboard/src/context/AuthContext.tsx` | `login` callback catch block | 305-325 |

### Files referenced (read-only during this work)

- `nexacore-dashboard/src/lib/error-utils.ts:20-28` — `extractErrorMessage` (consumes the error body)
- `nexacore-dashboard/src/components/auth/LoginForm.tsx:339-386` — `PasswordStep` consumes `state.error` via `useAuth()` to render `<InlineError>`
- `nexacore-dashboard/src/lib/toast-messages.ts:14-19` — `AUTH_TOAST.LOGIN_FAILED` (toast template — unchanged)
- `nexacore-api/src/auth/login.service.ts:108-241` — backend baseline (unchanged, used to validate behavior)
- `nexacore-api/src/common/filters/http-exception.filter.ts:71-79` — error envelope (unchanged)

### Routing & state

- App Router page: `src/app/login/page.tsx` (no change)
- State: `AuthContext` reducer has the existing `AUTH_ERROR` action with `payload: string` already implemented (`AuthContext.tsx:70-80`). No reducer changes.

## 4. Implementation Steps

### Step 0: Create feature branch

```bash
git -C em-ecosystem-code checkout main
git -C em-ecosystem-code pull origin main
git -C em-ecosystem-code checkout -b feature/SCRUM-342-frontend
git -C em-ecosystem-code branch
```

The branch name is mandatory. No code changes happen on `main`.

### Step 1: Add allowlist + guard in `api.ts`

**File**: `nexacore-dashboard/src/lib/api.ts`

**Action**: Define a module-level Set of endpoints whose 401 responses must NOT trigger silentRefresh. Guard the silentRefresh block with this Set.

**Change**:

Before line 13 (after `CSRF_METHODS` constant), add:

```ts
// 401 from these endpoints means "credentials invalid" or "no session yet" —
// NOT "session expired". They must not trigger silentRefresh, otherwise the
// genuine error body is swallowed and replaced with SessionExpiredError.
const SKIP_REFRESH_ON_401 = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
]);
```

In `request()` at line 123, change:

```ts
// Before
if (response.status === 401) {
  const newToken = await this.silentRefresh();
  ...
```

to:

```ts
// After
if (response.status === 401 && !SKIP_REFRESH_ON_401.has(endpoint)) {
  const newToken = await this.silentRefresh();
  ...
```

The closing `}` of the `if (response.status === 401 ...)` block already exists on line 164. The fall-through path `if (!response.ok) { throw await this.parseErrorResponse(response); }` (lines 166-168) takes care of throwing the original 401 body for skipped endpoints — no other change needed.

**Implementation notes**:
- `SKIP_REFRESH_ON_401` is a module-level constant, not a class member, since it never changes.
- Comment is mandatory per Session-specific guidance: the WHY is non-obvious (a silent refresh on a public endpoint is a bug, not a feature), so a one-line comment is justified.
- Do NOT change the structure of `silentRefresh` or `parseErrorResponse`.

### Step 2: Keep `AUTH_STOP` dispatch in `AuthContext.tsx` (NO CHANGE)

**File**: `nexacore-dashboard/src/context/AuthContext.tsx`

**Action**: NONE. The existing `dispatch({ type: "AUTH_STOP" }); throw err;` is correct per project convention.

**Project convention** (verified across all auth flows in `AuthContext.tsx`):

> **Backend errors are toast-only. Inline errors (`<InlineError>`) are reserved for client-side form validation only.** Every non-login auth flow (`register`, `forgotPassword`, `resetPassword`, MFA verify, etc.) dispatches `AUTH_STOP` on backend failure — `state.error` is never populated from server responses. The backend error message is delivered via `addToast({variant:"error", ...})` and that is the entire contract.

The original SCRUM-300 fix that introduced `AUTH_ERROR` was an outlier that violated this rule. SCRUM-301's silent revert (back to `AUTH_STOP`) was actually re-aligning with the convention, even if its commit message did not describe it as such. The bug today is purely the silentRefresh hijack in Step 1; no AuthContext change is required.

**Cosmetic improvement** (optional, no behavior change): inline the `extractErrorMessage(err)` call into the toast description to drop one local variable:

```ts
addToast({
  variant: "error",
  title: "Sign in failed",
  description: extractErrorMessage(err),
});
dispatch({ type: "AUTH_STOP" });
throw err;
```

Keep the trailing `throw err;` — it preserves backward compatibility with any future caller that wants to chain `.catch()` on the login promise.

### Step 3: Add regression tests for `api.ts`

**File**: `nexacore-dashboard/tests/lib/api.test.ts` (new)

**Action**: Cover the 401 routing logic with the new allowlist.

**Required test cases**:
1. `it("does not call silentRefresh on 401 from /auth/login")` — mock fetch to return 401 with `{success:false, error:{message:"Invalid credentials"}}`; assert that `apiClient.post('/auth/login', ...)` rejects with the original body and that `/auth/refresh` is never called.
2. `it("does not call silentRefresh on 401 from /auth/register")` — same pattern.
3. `it("still calls silentRefresh on 401 from /auth/me")` — mock 401 on `/auth/me`, mock 200 on `/auth/refresh`, assert silentRefresh runs and request is retried.
4. `it("preserves the original error body when 401 comes from a skipped endpoint")` — assert thrown error contains `error.message === "Invalid credentials"` (no `SessionExpiredError`).
5. `it("does not trigger onAuthFailure callback on 401 from skipped endpoints")` — register a spy via `setOnAuthFailure`, assert it is NOT called after a /auth/login 401.

**Tooling**: use the existing test setup (Jest + global `fetch` mock). Reference: `tests/test-utils.ts` (used by other tests).

### Step 4: Add regression tests for `AuthContext.tsx`

**File**: `nexacore-dashboard/tests/context/AuthContext.test.tsx` (new)

**Action**: Cover the catch-block dispatch behavior.

**Required test cases**:
1. `it("does NOT set state.error on backend failure (toast-only convention)")` — render `AuthProvider`, call `login()` with mocked apiClient that throws `{error:{message:"Invalid credentials"}}`; assert `state.error` remains `null` (inline error must NEVER fire from a backend response per project convention).
2. `it("shows error toast with backend message on login failure")` — assert `addToast` was called with `{variant:"error", title:"Sign in failed", description:"Invalid credentials."}`.
3. `it("does NOT show 'Session expired' toast on login failure")` — assert no toast with title "Session expired" was emitted.
4. `it("toast description falls back to 'An unexpected error occurred.' for malformed errors")` — sanity check that the fallback path still renders in the toast (not inline).

**Tooling**: Render `AuthProvider` with `ToastProvider` wrapper (mocked or real via `tests/test-utils.tsx`). Mock `apiClient.post` via `jest.mock("@/lib/api", ...)` returning a controllable promise.

### Step 5: Build & lint verification

Run from `em-ecosystem-code/nexacore-dashboard/`:

```bash
npm run lint
npm run test -- --testPathPattern="(api|AuthContext|LoginForm)"
npm run build
```

All three must pass with 0 errors / 0 new warnings.

### Step 6: Manual smoke (mandatory before /verify)

With backend running (`npm start` in `nexacore-api`) and frontend running (`npm run dev` in `nexacore-dashboard`):

1. Register a fresh account, verify email.
2. On `/login`: enter the registered email + WRONG password → expect toast "Sign in failed — Invalid credentials." NO "Session expired" toast. NO inline error below the password input (toast-only convention).
3. On `/login`: enter a non-registered email + any password → same toast, anti-enumeration intact.
4a. **Account lockout** (5+ wrong passwords on real account) → "Sign in failed — Invalid credentials." with NO countdown banner. Lockout is intentionally hidden behind the generic message per SCRUM-217 (CWE-204 anti-enumeration). Indistinguishable from AC2 by design.
4b. **Login throttler** (10 attempts within 60s, `AUTH_RATE_LIMITS.login`) → 429 with `Retry-After`. LoginForm renders the inline `RateLimitBanner` with countdown AND the "Too many attempts / If you are a registered user, please check your email for further instructions." warning toast. Both surfaces are pre-existing (SCRUM-166, SCRUM-297). The "If you are a registered user…" wording is also anti-enumeration safe.
5. Login successfully, then in DB revoke the user's RefreshToken row → next API call should yield "Session expired" toast + redirect to /login. Confirms the genuine session-expiry path is intact.

### Step 7b: Differentiated throttler toast (scope extension — added 2026-05-03)

**Context**: During AC3b smoke validation (throttler trip), the user observed that switching the email field after the throttler trippes still shows the same "If you are a registered user, please check your email…" toast. The hint is anti-enumeration safe but UX-misleading for a user attempting a NEW email — the system has not sent that user any email; the hint is a hold-over from the original triggering account.

**Decision**: Differentiate the toast by **first hit vs repeat hit within the same throttle window** (NOT by email — that would be enumeration risk). Both variants stay anti-enumeration safe because their selection is determined by `rateLimitInfo.isRateLimited` state, not by any email-related signal. They fire identically for any email A or B.

| Trigger | Toast title | Toast description |
|---|---|---|
| **First 429** in window (`!rateLimitInfo.isRateLimited`) | "Too many attempts" | "If you are a registered user, please check your email for further instructions." (current copy) |
| **Repeat 429** in same window (`rateLimitInfo.isRateLimited === true`) | "Too many attempts" | "Sign-ins still blocked. Please wait." |

**Files to modify**:

1. `nexacore-dashboard/src/lib/toast-messages.ts` — split `TOO_MANY_ATTEMPTS` into `TOO_MANY_ATTEMPTS_FIRST(desc)` and `TOO_MANY_ATTEMPTS_REPEAT()` (no parameter — fixed copy):

```ts
TOO_MANY_ATTEMPTS_FIRST: (desc: string): ToastMsg => ({
  variant: "warning",
  title: "Too many attempts",
  description: desc,
}),
TOO_MANY_ATTEMPTS_REPEAT: (): ToastMsg => ({
  variant: "warning",
  title: "Too many attempts",
  description: "Sign-ins still blocked. Please wait.",
}),
```

Remove the legacy `TOO_MANY_ATTEMPTS` (only one consumer in `LoginForm.tsx`).

2. `nexacore-dashboard/src/components/auth/LoginForm.tsx` (lines 140-148) — switch by `rateLimitInfo.isRateLimited`:

```ts
} catch (err) {
  if (err instanceof RateLimitError) {
    const isFirstHit = !rateLimitInfo.isRateLimited;
    setRateLimit(err.retryAfter, err.message, "throttle");
    addToast(
      isFirstHit
        ? AUTH_TOAST.TOO_MANY_ATTEMPTS_FIRST(
            "If you are a registered user, please check your email for further instructions.",
          )
        : AUTH_TOAST.TOO_MANY_ATTEMPTS_REPEAT(),
    );
  }
}
```

`rateLimitInfo` is read from React state, so within the same render cycle it reflects the PREVIOUS state — `setRateLimit` updates apply on the next render. This means `!rateLimitInfo.isRateLimited` correctly identifies a first hit.

**Out of scope**: `RegisterForm`, `ForgotPasswordForm`, `MfaTotpStep`, `ResetPasswordForm` do NOT call `addToast` on `RateLimitError` (they only call `setRateLimit`). No change needed in those forms.

**FIRST vs REPEAT detection — final design (after first patch was rejected)**:

Initial naive approach used `!rateLimitInfo.isRateLimited` to detect the first hit. This failed because the existing audited UX clears `rateLimitInfo` via `clearRateLimit()` on `onChangeEmail` (the only retry path — the Sign In button is disabled while rate-limited). A subsequent patch removed `clearRateLimit()` from `onChangeEmail` to keep the state alive, but that altered the audited countdown UX (the banner persisted across navigation in a way the user had not approved).

**Correct design**: keep `rateLimitInfo` and its lifecycle EXACTLY as in main (audited UX intact, including `clearRateLimit()` in `onChangeEmail`), and introduce an INDEPENDENT `useRef<number | null>` in `LoginForm` storing the absolute timestamp at which the current throttle window ends. The ref:

- Survives navigation between email and password steps because `LoginForm` does not unmount.
- Is independent of `rateLimitInfo` — `clearRateLimit()` does not touch it.
- Resets only when (a) the absolute time passes the stored timestamp, or (b) the LoginForm unmounts (page reload). Both are correct UX boundaries.

```ts
const throttleWindowEndsAtRef = useRef<number | null>(null);

// In handleLogin catch:
const now = Date.now();
const inThrottleWindow =
  throttleWindowEndsAtRef.current !== null &&
  now < throttleWindowEndsAtRef.current;
const isFirstHit = !inThrottleWindow;
if (isFirstHit) {
  throttleWindowEndsAtRef.current = now + err.retryAfter * 1000;
}
setRateLimit(err.retryAfter, err.message, "throttle");
addToast(isFirstHit ? AUTH_TOAST.TOO_MANY_ATTEMPTS_FIRST(...) : AUTH_TOAST.TOO_MANY_ATTEMPTS_REPEAT());
```

`onChangeEmail` is RESTORED to its audited form (calls `clearRateLimit()` as before). The countdown banner UX is identical to main. Only the toast differentiation is new, and it's driven by an orthogonal ref-based mechanism.

**Anti-enumeration verification**:
- Selection between `_FIRST` and `_REPEAT` depends ONLY on the local `rateLimitInfo.isRateLimited` state (a per-session, per-tab boolean).
- No backend signal, no email lookup, no per-account state involved.
- An attacker observing both variants firing for any email cannot infer which emails are registered.
- ✅ CWE-204 / CWE-203 intact.

### Step 7c: Robust session-expired UX (scope extension — added 2026-05-03)

**Context**: During AC5 manual smoke, the user discovered that clicking "Revoke all others" in `/profile` produces inconsistent behavior — the backend revokes ALL sessions including current, but the frontend optimistically keeps the current session in the UI list. After this, the user can navigate but pages render without data, no toast appears, and only F5 redirects to `/login`. This violates OWASP Session Management Cheat Sheet §5.4 (explicit session termination must end the UI session) and breaks the user's mental model.

**Root cause analysis**:

1. **UI / backend mismatch**: button labeled `Revoke all others` calls `/auth/logout-all`, which on backend invokes `sessionsService.revokeAllUserSessions(userId)` (no exclusion of current) plus `tokenDenyListService.denyAllForUser(userId)` (deny-lists ALL access tokens). The current session is killed but the frontend optimistic update `setSessions(prev => prev.filter(s => s.isCurrent))` pretends it survived. Reference: [token.service.ts:344-355](em-ecosystem-code/nexacore-api/src/auth/token.service.ts#L344-L355), [sessions.service.ts:168-173](em-ecosystem-code/nexacore-api/src/sessions/sessions.service.ts#L168-L173), [ActiveSessions.tsx:95-105](em-ecosystem-code/nexacore-dashboard/src/components/profile/ActiveSessions.tsx#L95-L105) (pre-fix).
2. **`authFailureTriggered` flag never reset on successful refresh**: [api.ts silentRefresh](em-ecosystem-code/nexacore-dashboard/src/lib/api.ts) used direct `this.accessToken = data.accessToken` instead of `this.setAccessToken(...)`, bypassing the flag-reset logic. A prior failure could leave the flag stuck at `true` indefinitely, silencing all future toasts.
3. **Redirect-on-LOGOUT depends on `ProtectedRoute`**: `handleAuthFailure` only dispatched LOGOUT, relying on `ProtectedRoute`'s `useEffect` to call `router.replace("/login")`. Pages without ProtectedRoute (rare but possible) and race conditions during page transitions can cause the redirect to not fire.

**Decision**: three coordinated fixes in this scope.

#### Fix 1 — `ActiveSessions.tsx`: align UI to backend behavior + explicit logout flow

- Rename button: `Revoke all others` → `Sign out from all sessions`.
- Add `ConfirmModal` (variant=danger) before the action — destructive operations should require confirmation per WAI-ARIA APG and OWASP UX guidance.
- After successful `POST /auth/logout-all`, immediately:
  - Show success toast: "All sessions ended / You have been signed out from this device and all others."
  - Call `AuthContext.logout()` which clears local state, dispatches LOGOUT, and (post Fix 2) redirects to `/login`.
- The `setSessions(...)` optimistic filter is REMOVED — the user is now on `/login`, the list state is irrelevant.

#### Fix 2 — `AuthContext.handleAuthFailure`: explicit `router.replace("/login")`

- Import `useRouter` from `next/navigation` in AuthProvider.
- After `dispatch({ type: "LOGOUT" })`, call `router.replace("/login")`.
- Defense in depth: ensures redirect happens even if `ProtectedRoute` is not mounted on the current page or the effect race-conditions with the dispatch.

#### Fix 3 — `apiClient.silentRefresh`: use the setter

- Replace `this.accessToken = data.accessToken` with `this.setAccessToken(data.accessToken)`.
- Restores the `authFailureTriggered = false` reset that was missing from the direct assignment path.

**Files affected (Step 7c)**:

| File | Change |
|------|--------|
| `nexacore-dashboard/src/components/profile/ActiveSessions.tsx` | Button rename + ConfirmModal + new handler `signOutAllSessions` calling `logout()` |
| `nexacore-dashboard/src/context/AuthContext.tsx` | Import `useRouter`; add `router.replace("/login")` in `handleAuthFailure` |
| `nexacore-dashboard/src/lib/api.ts` | `silentRefresh` uses `this.setAccessToken(...)` |
| `nexacore-dashboard/tests/context/AuthContext.test.tsx` | Add `useRouter` mock |

**Sub-fix in Step 7c — split callback registration effect (root cause)**:

During smoke validation of cross-tab logout, the user reported that even with Fixes 1-3, a second window/tab whose backend session was revoked by another tab keeps navigating empty pages without firing the toast/LOGOUT/redirect cascade. Root cause traced in [AuthContext.tsx](em-ecosystem-code/nexacore-dashboard/src/context/AuthContext.tsx):

```ts
const mountedRef = useRef(false);
useEffect(() => {
  if (mountedRef.current) return;
  mountedRef.current = true;
  apiClient.setOnAuthFailure(handleAuthFailure);  // ← register
  // ...
  return () => {
    apiClient.setOnAuthFailure(null);             // ← cleanup nulls
  };
}, [refreshSession, handleAuthFailure]);
```

In React StrictMode (dev), `useEffect` runs body → cleanup → body. The first body sets `apiClient.onAuthFailure` to `handleAuthFailure`. The cleanup nulls it. The second body skips because `mountedRef.current === true` (refs persist within the same component instance across StrictMode's intentional double-invoke). Result: `onAuthFailure` ends up **null** for the entire session in dev mode.

When `cascade-401 → silentRefresh fail → this.onAuthFailure?.()` runs in apiClient, the nullish-call is a no-op. No toast, no LOGOUT, no redirect. Pages render empty until F5.

**Fix**: separate the callback registration into its own effect (no `mountedRef` guard), and keep the mount-once initialization separate:

```ts
useEffect(() => {
  apiClient.setOnAuthFailure(handleAuthFailure);
  return () => apiClient.setOnAuthFailure(null);
}, [handleAuthFailure]);

const mountedRef = useRef(false);
useEffect(() => {
  if (mountedRef.current) return;
  mountedRef.current = true;
  // ... fingerprint + refresh
}, [refreshSession]);
```

The callback effect is safely re-runnable. In StrictMode, body→cleanup→body still ends with the callback set (last body sets it). In normal mode, set once, only re-runs if `handleAuthFailure` reference changes (which is a real dep change worth honoring).

**Out of scope of Step 7c** (deferred):

- Backend support for "Sign out from other devices" (preserves current). The current backend behavior is "kill all", and Step 7c aligns the UI to that. If a future requirement is to offer BOTH options (Google-style), backend would need an `excludeSessionId` parameter on `revokeAllUserSessions` and `denyAllForUser`.
- BroadcastChannel API for instant cross-tab LOGOUT propagation in same-browser-profile tabs (current fix is reactive — depends on a 401 cascade in each tab; BroadcastChannel would push LOGOUT proactively to all tabs of the same profile within milliseconds). Doesn't apply to incognito-window-to-incognito-window because those are isolated profiles.

### Step 7d: Toast on RateLimitError for ALL auth forms (consistency completion)

**Context**: After Step 7b added the FIRST/REPEAT toast pattern to LoginForm, manual smoke surfaced that `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm` and `MfaTotpStep` only call `setRateLimit(...)` (inline banner) but skip `addToast(...)`. This violates the convention documented in this very ticket's Step 8 update to `frontend-standards.mdc` ("Backend errors are toast-only"). The inline banner alone does not surface the WHAT happened to the user — only the WHEN they can retry.

**Decision**: extend toast coverage to all 4 remaining auth forms.

**Toast variant mapping** (per applicability of email hint):

| Form | Toast variant | Reason |
|---|---|---|
| `RegisterForm` | `TOO_MANY_ATTEMPTS_INBOX_HINT` (new) | Backend may send a notification email if address is already registered, but the user on /register is explicitly NOT-yet-registered — the LoginForm wording "if you are a registered user" is contradictory. INBOX_HINT uses neutral conditional: "If we sent you an email, please check your inbox for instructions." Anti-enumeration safe (doesn't disclose whether email was sent or whether account exists). |
| `ForgotPasswordForm` | `TOO_MANY_ATTEMPTS_INBOX_HINT` (new) | Same wording as Register for consistency. Recovery email may have been sent during prior attempts; conditional wording fits without confirming account existence. |
| `ResetPasswordForm` | `TOO_MANY_ATTEMPTS_GENERIC` (no hint) | User already used the reset link; no further security email is sent. |
| `MfaTotpStep` | `TOO_MANY_ATTEMPTS_GENERIC` (no hint) | User in active MFA challenge; rate-limit means brute-force defense, no email pending. |

**Why two email-related variants and not one**: LoginForm uses `TOO_MANY_ATTEMPTS_FIRST` with the wording "If you are a registered user, please check your email…" because the user IS attempting to access an existing account — affirming registration status fits the user's intent and reassures the legitimate owner who got their account targeted. Register/Forgot can't make that affirmation: the /register user has not yet registered (contradiction), and /forgot-password should not confirm whether the address is registered. The new INBOX_HINT solves both with conditional wording that alludes to email without claiming registration.

**New toast entry** in `toast-messages.ts`:

```ts
TOO_MANY_ATTEMPTS_GENERIC: (): ToastMsg => ({
  variant: "warning",
  title: "Too many attempts",
  description: "Please try again later.",
}),
```

**Why no FIRST/REPEAT distinction in these forms**: in LoginForm the user can navigate back to the email step during a rate-limit window and retry, producing repeat 429s where the second copy is appropriate. In Register/Forgot/Reset/MfaTotp the submit button stays disabled during the rate-limit window with no alternate retry path — the user CANNOT trigger a second 429 in the same window. A single toast per event is sufficient.

**Files affected** (Step 7d, 5 productive files):

| File | Change |
|------|--------|
| `nexacore-dashboard/src/lib/toast-messages.ts` | Add `TOO_MANY_ATTEMPTS_GENERIC` entry |
| `nexacore-dashboard/src/components/auth/RegisterForm.tsx` | `addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_FIRST(...))` in `RateLimitError` catch |
| `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` | Idem |
| `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` | `addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC())` |
| `nexacore-dashboard/src/components/auth/MfaTotpStep.tsx` | Idem (also adds `useToast` import + `addToast` in deps array) |

**Out of scope of Step 7d** (deferred):

- `TrustedDevices.tsx` rate-limit on trust-device action (line 82) — also lacks toast, same convention violation, but in `/profile` module (not auth flow proper).
- `usePasskey` hook internal rate-limit handling (consumed by `PasskeyManager`) — uses an internal `setRateLimitInfo` state separate from `useRateLimit` hook; needs a different fix shape (likely a `useEffect` watching `rateLimitInfo` change in PasskeyManager).
- Recommendation for both: track in the same follow-up tech-debt ticket as the cross-tab BroadcastChannel improvement (already proposed).

### Step 7e: Toast severity audit and alignment with industry convention (added 2026-05-03)

**Context**: After Step 7d, audited all 15 auth/profile toasts against the four-variant industry convention (IBM Carbon, Atlassian Design System, Salesforce Lightning, Microsoft Fluent — all converge on the same semantic mapping):

- `error` (red): user's action **failed** or **cannot continue** — flow is blocked
- `warning` (yellow): something **needs attention** but is not necessarily wrong; recoverable
- `info` (blue): neutral FYI
- `success` (green): confirmation of completed action

**Audit results**: 13/15 toasts already correct. Two borderline cases fixed:

| Toast | Before | After | Rationale |
|---|---|---|---|
| `MISSING_RESET_TOKEN` | `warning` | `error` | User on `/reset-password` without token → reset flow blocked. Per Carbon/Atlassian "action cannot proceed" → error. |
| `EXPIRED_LINK` | `warning` | `error` | Same reasoning — invalid token blocks the reset workflow. |

**Documentation update**: Added `### Toast Severity Guidelines (MANDATORY)` section to `frontend-standards.mdc` (under `## UI/UX Standards`, before Form Handling). Includes:

- The four-variant semantic mapping
- Event-to-variant table for every auth event in this codebase
- Severity escalation pattern (FIRST `warning` → REPEAT `error`) with `LoginForm.tsx` cited as canonical implementation
- Three anti-patterns to avoid future drift

This formalizes the convention so subsequent feature work and reviews can reference it as the single source of truth.

**Files affected** (Step 7e):

| File | Change |
|------|--------|
| `nexacore-dashboard/src/lib/toast-messages.ts` | `MISSING_RESET_TOKEN` and `EXPIRED_LINK` variants `warning` → `error` |
| `ai-specs/specs/frontend-standards.mdc` | New section `Toast Severity Guidelines` |

### Step 8: Update technical documentation

**File**: `ai-specs/specs/frontend-standards.mdc`

**Action**: Add a brief note in the "ApiClient" or "Error Handling" subsection (or create one if absent) documenting the 401 routing rule:

> **401 routing**: `apiClient.request` triggers silent token refresh on 401 ONLY for authenticated endpoints. Auth endpoints (`/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/forgot-password`) bypass refresh because their 401 means "invalid credentials", not "expired session". The allowlist is `SKIP_REFRESH_ON_401` in `src/lib/api.ts`. Do not remove without re-validating SCRUM-217 / SCRUM-300 contracts.

If the section does not exist, place it under a new "## Error Handling" heading following the existing standards file's structure.

## 5. Implementation Order

1. Step 0 — Branch creation
2. Step 1 — `api.ts` allowlist + guard
3. Step 2 — `AuthContext.tsx` (AUTH_STOP unchanged; cosmetic inline only)
4. Step 3 — `api.test.ts` regression tests
5. Step 4 — `AuthContext.test.tsx` regression tests
6. Step 5 — build/lint/test verification (Round 1)
7. Step 6 — manual smoke (golden path + edge cases) — discovers AC3b throttler-toast UX issue
8. Step 7b — split `TOO_MANY_ATTEMPTS` into FIRST/REPEAT variants in `toast-messages.ts` + `LoginForm.tsx` (scope extension)
9. Step 5 (Round 2) — re-run lint/tests after Step 7b
10. Step 6 (Round 2) — re-validate AC3b smoke for first-vs-repeat toast
11. Step 8 — `frontend-standards.mdc` update (401 routing + toast-only convention)

Steps 1 and 2 may be done in parallel. Step 7b is added mid-cycle after manual smoke surfaces the UX gap; this is documented as a deliberate scope extension (not Scope-Gap deviation) since the user explicitly approved widening the ticket rather than spinning a follow-up.

## 6. Testing Checklist

### Unit / integration tests added

- [ ] `tests/lib/api.test.ts` — 5 cases covering 401 allowlist routing
- [ ] `tests/context/AuthContext.test.tsx` — 4 cases covering catch-block dispatch

### Existing tests not broken

- [ ] `tests/components/auth/LoginForm.test.tsx` — 100% pass
- [ ] `tests/components/auth/MfaTotpStep.test.tsx` — 100% pass
- [ ] All other `tests/components/profile/*` tests pass

### Build / quality gates

- [ ] `npm run lint` — 0 errors, 0 new warnings
- [ ] `npm run test` — full suite passes
- [ ] `npm run build` — clean Next.js build

### Manual UX verification

- [ ] AC1 — Wrong password → "Invalid credentials." toast
- [ ] AC2 — Non-registered email → SAME message (anti-enum)
- [ ] AC3a — Locked account (failedAttempts > 5) → "Invalid credentials." with NO countdown banner (anti-enum, indistinguishable from AC2 by design)
- [ ] AC3b — Throttler trip (10 attempts within 60s) → 429 with `Retry-After` → inline RateLimitBanner countdown + "Too many attempts" warning toast (pre-existing from SCRUM-166/SCRUM-297)
- [ ] AC4 — NO inline error renders on backend failure (toast-only convention)
- [ ] AC5 — Genuine session expiry on logged-in user still triggers "Session expired" toast + LOGOUT
- [ ] AC6 — NO "Session expired" toast on login failure
- [ ] AC11 — First throttler trip (intent 11) → "Too many attempts / If you are a registered user…" toast (full copy)
- [ ] AC12 — Subsequent throttler hits (intent 12+) within same window → "Too many attempts / Sign-ins still blocked. Please wait." (short copy). Switching email field does NOT change the toast variant — selection is by `rateLimitInfo.isRateLimited` state, not by email.
- [ ] AC13 — `/profile` "Sign out from all sessions" button shows confirmation modal, on confirm: success toast "All sessions ended" + immediate redirect to `/login` (no orphaned dashboard state).
- [ ] AC14 — Manually deleting `refresh_token` cookie via DevTools, then navigating in dashboard → first 401 cascade triggers "Session expired" toast + redirect to `/login` (no pages-without-data orphan state).
- [ ] AC15 — Register: 6th submission within 60s → 429 → inline RateLimitBanner countdown + warning toast "Too many attempts / If we sent you an email, please check your inbox for instructions." (INBOX_HINT)
- [ ] AC16 — Forgot password: idem AC15 (same INBOX_HINT toast).
- [ ] AC17 — Reset password: rate-limit triggers inline banner + generic toast "Too many attempts / Please try again later." (no email hint).
- [ ] AC18 — MFA TOTP: rate-limit triggers inline banner + generic toast "Too many attempts / Please try again later."

## 7. Error Handling Patterns

### Allowlist convention

The introduced `SKIP_REFRESH_ON_401` set is the canonical place to declare endpoints that must not trigger silent refresh. If a future endpoint is added (e.g., `/auth/passkey/login/options`), evaluate whether 401 means "credentials invalid" → add to set, or "session expired" → leave out.

### Error body shape

The frontend assumes the backend always returns `{success:false, error:{message:string, code:string, statusCode:number}}` per `HttpExceptionFilter`. `extractErrorMessage` reads `errObj.error.message` with fallback to `"An unexpected error occurred."`. The fallback should ONLY trigger on truly unexpected errors (network failure, malformed JSON) — not on documented 401 failures.

### Toast vs inline error (project convention)

- **Toast** (top of screen): the ONLY surface for backend/server errors. Transient, may be dismissed.
- **InlineError** below an input: reserved for **client-side form validation errors** only (e.g., "Enter a valid email", "Password too short"). Never populated from a server response.

This rule is uniform across `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `MfaTotpStep`, `MfaSetupStep` and `LoginForm` — every backend-failure dispatch in `AuthContext` uses `AUTH_STOP` (clears loading, leaves `state.error` null). The `activeError = ... || error` pattern in those forms is defensive — `error` from `useAuth()` is never set in practice.

## 8. UI/UX Considerations

No visual changes. The inline error block on the password step remains reserved for client-side validation errors (e.g., when `validatePassword(formData.password)` returns a string). Backend failures show only via toast.

- TailwindCSS classes unchanged.
- Theme tokens unchanged.
- `aria-live="polite"` on the InlineError container (`LoginForm.tsx:383`) — unchanged. The screen-reader announcement is driven by the toast role for backend errors.
- No layout shift: the container already reserves `min-h-6` height when an error is present.

## 9. Dependencies

No new external libraries. No new internal components.

Existing dependencies referenced:
- `extractErrorMessage` from `@/lib/error-utils`
- `addToast` from `@/context/ToastContext`
- `AUTH_TOAST.LOGIN_FAILED` from `@/lib/toast-messages` (used indirectly via `addToast({title:"Sign in failed",description:message})` — note: `LoginForm.tsx:144` uses the helper for rate limit only; the catch block constructs the toast inline. This is consistent with existing code; no refactor in scope.)

## 10. Notes

- **Language**: All code, comments, and docs in English.
- **Commit hygiene**: 1 commit, message format `fix(SCRUM-342): restore Invalid credentials message on login failure`.
- **No backend changes**: any temptation to "also clean up" backend code is out of scope. Backend is the audited 0-FAIL baseline; do not touch.
- **Memory rule (incremental quality)**: change ONLY the lines needed. Do not refactor `silentRefresh`, `parseErrorResponse`, or any unrelated `AuthContext` action. Reproduce before fix (Step 6 manual smoke covers this).
- **Memory rule (no auto-commit)**: stop at end of Step 7. `/commit` is a separate phase. `/verify` first.

## 11. Next Steps After Implementation

After this ticket is verified and committed:

1. **Tech-debt ticket (TBD)** — Phase 9b behavioral E2E smoke + Section 6.7 phase invalidation rule. Will be opened separately.
2. **Re-run audit** — full 11-phase audit on auth module to issue new 0-FAIL baseline including the framework hardening.
3. **Memory update** — add SCRUM-342 entry to `MEMORY.md` under "Active Projects & Tickets".

## 12. Implementation Verification

Final checklist before transitioning to `/verify`:

- [ ] **Code Quality**: 2 files changed (api.ts, AuthContext.tsx) + 2 test files added. Net diff < 80 lines.
- [ ] **Functionality**: AC1-AC6 all manually verified in browser.
- [ ] **Testing**: 9 new test cases (5 + 4) all pass; existing suite green.
- [ ] **Integration**: `LoginForm` renders InlineError correctly; `RateLimitBanner` still works on lockout; `Session expired` toast still works on genuine expiry.
- [ ] **Documentation**: `frontend-standards.mdc` updated with 401 routing rule.
- [ ] **Plan compliance**: every step in this plan executed in order; deviations (if any) documented in the verify report.
