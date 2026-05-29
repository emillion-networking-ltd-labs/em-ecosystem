# Frontend Implementation Plan: SCRUM-349 Auth UX consistency + cross-tab session sync + audit governance rule

> Plan generated 2026-05-04 by `/plan SCRUM-349` (streamlined — small scope, ~6h, 3 cohesive sub-tasks). Sub-task 3 already shipped via SCRUM-347 commit `5ec1199` — only sub-tasks 1 + 2 remain in this plan.

## Header
**Frontend Implementation Plan: SCRUM-349 (sub-tasks 1 + 2)**

## Overview
Closes 2 of the 3 deferred follow-ups from SCRUM-342:
- **Sub-task 1**: toast on `RateLimitError` for `TrustedDevices.tsx` and `PasskeyManager.tsx` (currently only set inline banner — violates the toast-only convention from SCRUM-342).
- **Sub-task 2**: BroadcastChannel API for cross-tab session sync (~100ms LOGOUT propagation across tabs in same browser profile).

Sub-task 3 (audit-standards.mdc Section 6.7 Phase Invalidation rule) was completed via SCRUM-347's `/update-docs` commit `5ec1199` — re-applied here as a documentation pointer in the record file, no code change.

## Architecture Context

**Components affected (sub-task 1)**:
- `nexacore-dashboard/src/components/profile/TrustedDevices.tsx` — `handleTrust` already calls `setRateLimit(...)` on rate-limited result; add `addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC())` alongside.
- `nexacore-dashboard/src/components/profile/PasskeyManager.tsx` — uses `usePasskey().rateLimitInfo`. Add `useEffect` watching `rateLimitInfo` for null→set transitions and fire toast.

**Files affected (sub-task 2)**:
- `nexacore-dashboard/src/hooks/useCrossTabAuth.ts` — NEW. BroadcastChannel-based hook exposing `broadcast(event)` + auto-listener.
- `nexacore-dashboard/src/context/AuthContext.tsx` — mount the hook, broadcast `LOGOUT` on logout/handleAuthFailure, broadcast `AUTH_SUCCESS` on login. Listen to incoming events and dispatch `LOGOUT` (or no-op for AUTH_SUCCESS — only the originating tab needs to refresh user state).
- `nexacore-dashboard/tests/hooks/useCrossTabAuth.test.ts` — NEW. Test broadcast emission + listener invocation.

**State management**: existing AuthContext + reducer. No new context needed.

**Routing**: no route changes.

**UI tokens**: reuse existing `AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC()` toast.

## Implementation Steps

### Step 0: Branch
- Branch from current main (post-SCRUM-347 merge): `git checkout -b feature/SCRUM-349-frontend`.

### Step 1: Sub-task 1 — Toast on TrustedDevices rate-limit
- File: `src/components/profile/TrustedDevices.tsx`.
- Action: in `handleTrust`, when result is `{ status: "rate-limited" }`, also call `addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC())` immediately before/after `setRateLimit(...)`.
- Import `AUTH_TOAST` from `@/lib/toast-messages`.
- No regression to existing inline `RateLimitBanner` — toast is added, not replaced.

### Step 2: Sub-task 1 — Toast on PasskeyManager rate-limit
- File: `src/components/profile/PasskeyManager.tsx`.
- Action: import `AUTH_TOAST`. Add `useEffect` watching `rateLimitInfo` from `usePasskey()` hook for null→set transition. Use a `useRef` to track previous value to detect the transition. On detection, fire `addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC())`.
- Reasoning: the rate-limit state lives inside `usePasskey` (not surfaced via callback return value), so the component must observe via effect rather than checking the result of `registerPasskey`.

### Step 3: Sub-task 2 — `useCrossTabAuth` hook
- File: `src/hooks/useCrossTabAuth.ts` (NEW).
- API:
  ```ts
  type CrossTabAuthEvent = "LOGOUT" | "AUTH_SUCCESS";
  type UseCrossTabAuth = {
    broadcast: (event: CrossTabAuthEvent) => void;
  };
  function useCrossTabAuth(onEvent: (event: CrossTabAuthEvent) => void): UseCrossTabAuth;
  ```
- Implementation:
  - Open `new BroadcastChannel("em-auth")` once via `useEffect` mount-only.
  - Add message listener that calls `onEvent(message.data.type)` for each incoming message; ignore self-broadcast (BroadcastChannel does not deliver to sender by default — verify this assumption with a guard).
  - Cleanup: close channel on unmount.
  - Return `broadcast(event)` that does `channel.postMessage({ type: event, ts: Date.now() })`.
  - Graceful degradation: if `typeof BroadcastChannel === "undefined"` (very old browsers), the hook returns a no-op `broadcast` and never invokes `onEvent`. Logged once via `console.warn` (or silent).

### Step 4: Sub-task 2 — AuthContext integration
- File: `src/context/AuthContext.tsx`.
- Action: 
  1. Import `useCrossTabAuth`.
  2. Inside the provider, define a stable `handleCrossTabEvent` callback: on `"LOGOUT"`, call `dispatch({ type: "LOGOUT" })` and `router.replace("/login")`. On `"AUTH_SUCCESS"`, no-op (each tab is responsible for its own state — broadcasting AUTH_SUCCESS allows future use cases like "refresh user info in other tabs", out of scope for SCRUM-349).
  3. Wire `const { broadcast } = useCrossTabAuth(handleCrossTabEvent);`.
  4. Call `broadcast("LOGOUT")` inside `logout()` (line 489 area) BEFORE the `dispatch({ type: "LOGOUT" })` so other tabs receive it without delay.
  5. Call `broadcast("LOGOUT")` inside `handleAuthFailure` (line 252-258 area) similarly.
  6. Call `broadcast("AUTH_SUCCESS")` inside login success paths (after `AUTH_SUCCESS` dispatch).

### Step 5: Tests
- File: `tests/hooks/useCrossTabAuth.test.ts` (NEW).
- Cases:
  - `broadcast` triggers `postMessage` on the channel with the right type.
  - Listener invokes `onEvent` with the received event type.
  - Cleanup closes the channel.
  - Old browser (BroadcastChannel undefined): broadcast is a no-op, no error.
- File: existing component tests for `TrustedDevices.test.tsx` and `PasskeyManager.test.tsx`.
- Cases to add:
  - `TrustedDevices`: when `trustCurrentDevice` returns `{ status: "rate-limited" }`, both `setRateLimit` AND `addToast` are called.
  - `PasskeyManager`: simulate `rateLimitInfo` transitioning from null → `{ retryAfter: 60 }` and assert `addToast` fires once.

### Step 6: Update Technical Documentation
- `frontend-standards.mdc` already has the toast-only convention from SCRUM-342. Reference SCRUM-349 in a brief Changelog entry under "Re-authentication" or "Toast Severity Guidelines" section.
- `integration-state.md` Changelog row.
- (No `audit-standards.mdc` update — sub-task 3 already done in SCRUM-347 commit `5ec1199`.)

## Implementation Order
1. Step 0 — Branch.
2. Step 1 + Step 2 (sub-task 1, parallel-safe).
3. Step 3 (sub-task 2 hook).
4. Step 4 (sub-task 2 integration).
5. Step 5 (tests).
6. Step 6 (docs).

## Testing Checklist
- [ ] `npm run lint` clean on changed files.
- [ ] `npm run build` clean (TS check passes).
- [ ] `npm test` — new specs green; baseline frontend failures unchanged or improved.
- [ ] Manual: trust device 5+ times in 60s → toast appears.
- [ ] Manual: register passkey 5+ times → toast appears.
- [ ] Manual: open 2 tabs, log out in tab A → tab B redirects to /login within ~100ms.

## Error Handling Patterns
- Rate-limit: toast (per SCRUM-342 convention) + inline banner (existing).
- Cross-tab: no UI for failures (graceful degradation if BroadcastChannel unsupported).

## Dependencies
None new. Uses native `BroadcastChannel` API (97% browser support per caniuse 2026).

## Notes
- BroadcastChannel scope: same browser profile + same origin. Incognito windows are separate profiles by design — feature does not propagate across them. Documented in the hook's JSDoc.
- AUTH_SUCCESS broadcast: emitted but currently no-op listener. Reserved for future "freshen user state in other tabs after profile update" use case.

## Implementation Verification
- [ ] Sub-task 1: AC1 + AC2 satisfied (toast appears on rate-limit in both components).
- [ ] Sub-task 2: AC3 satisfied (BroadcastChannel propagates LOGOUT < 100ms).
- [ ] Sub-task 3: AC4 — already satisfied via SCRUM-347 commit `5ec1199` (audit-standards.mdc Section 6.7).

## Module-Level Planning
N/A — small frontend bundle.
