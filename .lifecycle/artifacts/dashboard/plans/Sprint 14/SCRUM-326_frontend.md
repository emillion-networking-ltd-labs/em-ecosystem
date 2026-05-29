# Frontend Implementation Plan: SCRUM-326 Session Inconsistency Fixes

## Overview

Fix 3 specific issues causing the "half-disconnected" state where the UI thinks it's connected but the backend doesn't. Based on full auth flow audit against OWASP ASVS V3, NIST 800-63B, and GitHub/Stripe patterns.

## What works correctly (DO NOT TOUCH)
- Token in memory (not localStorage) — XSS-proof ✅
- ProtectedRoute waits for isInitialized before rendering children ✅
- Refresh token rotation with theft detection (family-based) ✅
- Token deny-list in Redis ✅
- CSRF protection ✅
- Concurrent session limit (5) ✅
- silentRefresh deduplication via refreshPromise ✅

## 3 Fixes Required

### Fix 1: onAuthFailure race condition (HIGH)

**File**: `src/lib/api.ts` (lines 161-165)

**Problem**: When silentRefresh fails and multiple concurrent requests hit the 401 path, the first request sets `this.accessToken = null` and calls `onAuthFailure()`. Subsequent requests find `this.accessToken` already null and skip `onAuthFailure()`. If the first request's `onAuthFailure` fails or is slow, AuthContext may not receive the logout signal.

**Current code**:
```ts
if (this.accessToken) {
  this.accessToken = null;
  this.onAuthFailure?.();
}
```

**Fix**: Add a flag to track if onAuthFailure was already triggered. Reset flag when new token is set.

**Lines to edit**: 
- Add `private authFailureTriggered = false;` after line 19
- Lines 161-165: Check flag instead of accessToken
- `setAccessToken()`: Reset flag when new token set

### Fix 2: Idle timeout buffer (MEDIUM)

**File**: `src/context/AuthContext.tsx` (line ~690)

**Problem**: Frontend idle timeout = 30 min. Backend session idle = 30 min. Both fire at the same time. If user clicks "Keep me signed in" at minute 29:50, frontend resets but backend already revoked the session. Next request fails with 401.

**Current code**: `useIdleTimeout(30 * 60 * 1000, ...)`

**Fix**: Change frontend idle timeout to 28 minutes (2 min buffer before backend revokes at 30).

**Line to edit**: Change `30 * 60 * 1000` to `28 * 60 * 1000`

### Fix 3: fetchStats without auth guard (MEDIUM)

**File**: `src/app/admin/page.tsx` (lines 96-100)

**Problem**: `fetchStats` fires in its own `useEffect` on mount without checking if auth token is available. Although ProtectedRoute blocks rendering, the `fetchStats` useEffect fires on the same render cycle as the first child render — if the token expires between renders, it fires without token.

**Current code**:
```ts
useEffect(() => {
  fetchStats();
}, [fetchStats]);
```

**Fix**: Add `isAuthenticated` guard before calling fetchStats.

## Implementation Order

1. Fix 1: api.ts onAuthFailure flag (1 file, 3 lines)
2. Fix 2: AuthContext idle timeout buffer (1 file, 1 line)
3. Fix 3: fetchStats auth guard (1 file, 1 line)

## Rules (Section 10)

- Edit ONLY the specific lines listed
- Do NOT rewrite files or add "bonus" changes
- `git diff` before commit — verify no unintended changes
- Ask user to test before pushing
- Do NOT touch ProtectedRoute, refreshSession, token storage, or CSRF

## Testing Checklist

- [ ] F5 on admin page → loads correctly after refresh (no 401 cascade)
- [ ] Idle 28 min → warning modal appears
- [ ] Click "Keep me signed in" → session continues working
- [ ] Idle 30 min → backend revokes → clean logout
- [ ] Multiple concurrent 401s → single clean logout (no duplicate toasts)
- [ ] Navigate between pages → no blank screens
