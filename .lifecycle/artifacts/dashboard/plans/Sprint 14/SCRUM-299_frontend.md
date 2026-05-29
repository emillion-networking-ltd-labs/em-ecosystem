# Frontend Implementation Plan: SCRUM-299 Auto-logout on Expired Session + Fix Duplicate Toast

## Overview

Fix 2 bugs: (1) duplicate toast when fetchUsers fires twice on admin page, (2) no auto-logout when refresh token expires — user stays in zombie authenticated state.

## Architecture Context

- **Files to modify**: `src/lib/api.ts`, `src/context/AuthContext.tsx`, `src/app/admin/page.tsx`
- **No new files**
- **No API changes**

## Current State (verified from live code)

### api.ts (ApiClient class)
- `accessToken` (line 9), `refreshPromise` (line 10), `deviceFingerprint` (line 11)
- `request()` method (line 29): 401 interceptor at line 107-142, calls `silentRefresh()`
- `silentRefresh()` (line 218-241): returns `null` on failure — **no callback to notify AuthContext**
- When silentRefresh returns null, execution falls through to line 144: `throw await this.parseErrorResponse(response)` — generic error, no logout

### AuthContext.tsx
- `refreshSession()` (line 217-237): correctly dispatches `LOGOUT` on failure
- `mountedRef` guard (line 242-255): prevents double-fire on mount
- **No connection between ApiClient's silentRefresh failure and AuthContext logout**

### admin/page.tsx
- `fetchUsers` (line 43-64): `useCallback` with deps `[search, addToast]`
- `useEffect(() => fetchUsers(1), [fetchUsers])` (line 66-68): **no mountedRef guard** — double-fires in React dev mode

## Implementation Steps

### Step 0: Create Feature Branch

- Branch: `feature/SCRUM-299-frontend`
- Base: `main`

---

### Step 1: Add onAuthFailure callback to ApiClient

**File**: `src/lib/api.ts`

**Action**: Add a callback property that AuthContext can register.

1. Add private field:
   ```typescript
   private onAuthFailure: (() => void) | null = null;
   ```

2. Add setter method:
   ```typescript
   setOnAuthFailure(callback: (() => void) | null) {
     this.onAuthFailure = callback;
   }
   ```

3. In the 401 handler (line 108-142), after `silentRefresh()` returns null, call the callback before throwing:
   ```typescript
   if (response.status === 401 && this.accessToken) {
     const newToken = await this.silentRefresh();
     if (newToken) {
       // ... existing retry logic ...
     }
     // Refresh failed — notify auth context
     this.accessToken = null;
     this.onAuthFailure?.();
   }
   ```

**Why**: ApiClient is a singleton utility — it can't import or dispatch to React context. The callback pattern decouples the notification from the implementation.

---

### Step 2: Register onAuthFailure in AuthContext

**File**: `src/context/AuthContext.tsx`

**Action**: On mount, register a logout callback with apiClient.

1. Create a `handleAuthFailure` callback that dispatches LOGOUT:
   ```typescript
   const handleAuthFailure = useCallback(() => {
     dispatch({ type: "LOGOUT" });
   }, []);
   ```

2. Register it in the existing mount useEffect (line 243-255), after fingerprint:
   ```typescript
   useEffect(() => {
     if (mountedRef.current) return;
     mountedRef.current = true;
     apiClient.setOnAuthFailure(handleAuthFailure);
     (async () => {
       // ... existing fingerprint + refresh logic ...
     })();
   }, [refreshSession, handleAuthFailure]);
   ```

3. Clean up on unmount (return function):
   ```typescript
   return () => {
     apiClient.setOnAuthFailure(null);
   };
   ```

**Why**: AuthContext is the single owner of auth state. When ApiClient detects an unrecoverable 401, it notifies AuthContext which dispatches LOGOUT — clearing tokens, redirecting to /login.

---

### Step 3: Fix duplicate fetchUsers on admin page

**File**: `src/app/admin/page.tsx`

**Action**: Add mountedRef guard to prevent React StrictMode double-fire.

1. Add ref:
   ```typescript
   const mountedRef = useRef(false);
   ```

2. Guard the useEffect:
   ```typescript
   useEffect(() => {
     if (mountedRef.current) return;
     mountedRef.current = true;
     fetchUsers(1);
   }, [fetchUsers]);
   ```

**Why**: Same pattern as AuthContext (line 242-255). React 18 dev mode double-invokes effects. The ref guard ensures fetchUsers only fires once on mount.

**Note**: The search-triggered re-fetch (when user types in search) should NOT be guarded — only the initial mount. The `search` dependency in `fetchUsers` callback handles search changes via the `[fetchUsers]` dependency in useEffect, which is correct. But the mountedRef only blocks the FIRST double-fire. Subsequent re-renders from search changes will work normally because `fetchUsers` identity changes (new `search` value), and by then `mountedRef.current` is already `true`.

Wait — this is a problem. If mountedRef blocks ALL calls, search won't work. The fix should only block the INITIAL double-fire, not subsequent calls.

Better approach: use AbortController to cancel the previous request when a new one starts:

```typescript
useEffect(() => {
  const controller = new AbortController();
  fetchUsers(1, controller.signal);
  return () => controller.abort();
}, [fetchUsers]);
```

And update fetchUsers to accept signal:
```typescript
const fetchUsers = useCallback(
  async (page: number, signal?: AbortSignal) => {
    setLoading(true);
    try {
      // ... pass signal to apiClient.get() ...
    } catch (err) {
      if (signal?.aborted) return; // Don't toast on abort
      addToast(ADMIN_TOAST.LOAD_USERS_FAILED);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  },
  [search, addToast],
);
```

**Why AbortController over mountedRef**: AbortController handles BOTH the double-fire (second call aborts the first) AND the stale-closure problem (navigating away cancels pending request). It's the React 18 recommended pattern.

---

### Step 4: Pass AbortSignal through ApiClient

**File**: `src/lib/api.ts`

**Action**: Ensure `request()` passes the signal to fetch. The `options` parameter already accepts `RequestInit` which includes `signal`. Verify fetch calls include `...options` spread so signal is forwarded.

Check line 120: `await fetch(url, { ...options, ... })` — signal should be included via spread. If not, add explicitly.

---

### Step 5: Build & verify

1. `npx tsc --noEmit` — 0 errors
2. `npx next build` — compiles
3. Manual test:
   - Open admin page → 1 toast on 401 (not 2)
   - Expire refresh token → auto-redirect to /login
   - Search works after initial mount

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add onAuthFailure to ApiClient
3. Step 2: Register callback in AuthContext
4. Step 3: Fix admin page with AbortController
5. Step 4: Verify signal passthrough in ApiClient
6. Step 5: Build & verify

## Testing Checklist

- [ ] Admin page: exactly 1 toast on 401 (not 2)
- [ ] Expired refresh token: auto-redirect to /login
- [ ] Auth state cleared after auto-logout (accessToken null, user null)
- [ ] Search on admin page still works after initial load
- [ ] Navigation away from admin page cancels pending request
- [ ] Normal 401 → refresh → retry flow still works (not broken by callback)
- [ ] TypeScript: 0 errors
- [ ] Next.js build: compiles

## Dependencies

- No new npm packages

## Notes

- The `onAuthFailure` callback fires ONLY when silentRefresh returns null (unrecoverable). Normal 401→refresh→retry flow is unaffected.
- AbortController is preferred over mountedRef for data fetching effects (React 18 docs recommendation).
- The LOGOUT dispatch in AuthContext already clears tokens and the middleware redirects unauthenticated users to /login.
