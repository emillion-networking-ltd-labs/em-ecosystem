# Frontend Implementation Plan: SCRUM-316 Fix 401 Race Condition in ApiClient

## Overview

Fix the race condition where concurrent API requests that all receive 401 cause some to throw generic errors instead of SessionExpiredError, producing "Load users failed" toasts and cascading UI breakage (sidebar permissions loss).

## Architecture Context

- **Primary file**: `src/lib/api.ts` — ApiClient.request() 401 handling (lines 120-159)
- **Secondary**: `src/app/dashboard/page.tsx` — missing SessionExpiredError handling
- **Pattern**: Reactive refresh on 401 (correct per RFC 9700/OWASP) — bug is in implementation, not architecture
- **No backend changes**

## Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-316-frontend`

### Step 1: Fix 401 Handler Race Condition

**File**: `src/lib/api.ts` (lines 120-159)

**Current (buggy)**:
```ts
if (response.status === 401 && this.accessToken) {
```
When Request A fails refresh and sets `this.accessToken = null`, Requests B/C skip this entire block because `this.accessToken` is already null. They fall to `if (!response.ok)` and throw a generic error.

**Fix**: Remove `&& this.accessToken` guard. Add a `refreshFailed` flag to track when refresh has already failed in this cycle, so concurrent requests get `SessionExpiredError` instead of generic errors.

**New 401 handler logic**:
```ts
// Handle 401 with silent refresh
if (response.status === 401) {
  // If refresh already failed (another request cleared the token), throw immediately
  if (!this.accessToken && !this.refreshPromise) {
    throw new SessionExpiredError();
  }

  const newToken = await this.silentRefresh();
  if (newToken) {
    // Retry with new token (existing retry logic unchanged)
    headers.Authorization = `Bearer ${newToken}`;
    // ... (same retry code as current)
    return retryResponse.json();
  }

  // Refresh failed — only call onAuthFailure once
  if (this.accessToken) {
    this.accessToken = null;
    this.onAuthFailure?.();
  }
  throw new SessionExpiredError();
}
```

**Key changes**:
1. Remove `&& this.accessToken` — all 401s enter the handler
2. Early exit with `SessionExpiredError` if token already null and no refresh in-flight
3. Guard `onAuthFailure` with `if (this.accessToken)` to prevent multiple logout calls
4. All paths end with `SessionExpiredError` (never generic error for 401)

### Step 2: Add SessionExpiredError Handling to Dashboard

**File**: `src/app/dashboard/page.tsx` (lines 43-73)

Currently uses `Promise.allSettled` but individual promise `.then()` chains can still throw. The `catch {}` block is empty. Add `SessionExpiredError` awareness:

```ts
promises.push(
  apiClient
    .get<PaginatedResponse<SafeUser>>("/users?limit=1")
    .then((res) => {
      results.totalUsers = res.meta.total;
    })
    .catch((err) => {
      if (err instanceof SessionExpiredError) throw err;
      // Non-auth errors: leave metric as null
    }),
);
```

Import `SessionExpiredError` from `@/lib/api`.

### Step 3: Update Documentation

- `ai-specs/specs/integration-state.md` — changelog entry

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Fix 401 handler in api.ts
3. Step 2: Dashboard SessionExpiredError handling
4. Step 3: Update docs

## Testing Checklist

- [ ] Token expires naturally (wait 15 min) → admin page reloads data transparently (no toast)
- [ ] Token expires → concurrent requests all succeed after silent refresh
- [ ] Refresh fails (revoke session in DB) → single "Session expired" toast → redirect to login
- [ ] No "Load users failed" toast during normal token rotation
- [ ] Sidebar does not lose Admin menu during token refresh
- [ ] Dashboard metrics load without error after token refresh
- [ ] Build: npm run build clean
- [ ] TypeScript: tsc --noEmit 0 errors

## UI/UX Considerations

- No visible change when refresh succeeds — requests retry transparently
- Single clean logout when refresh fails — not multiple error toasts
- Sidebar permissions preserved during refresh cycle

## Dependencies

- No new dependencies

## Notes

- The reactive refresh pattern (refresh on 401) is architecturally correct per RFC 9700 and OWASP Session Management Cheat Sheet. This fix addresses the implementation-level race condition, not the pattern.
- 21 files use apiClient. Most delegate error handling to hooks/contexts that react to `onAuthFailure`. The fix in api.ts ensures all 401s produce `SessionExpiredError` (not generic errors), which is already handled by the auth context logout flow.
- `silentRefresh()` deduplication via `refreshPromise` is correct and unchanged — multiple concurrent 401s share the same refresh call.
