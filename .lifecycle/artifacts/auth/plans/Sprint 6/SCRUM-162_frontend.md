# Frontend Implementation Plan: SCRUM-162 ConnectedAccounts Multi-Provider Redesign

## 1. Overview

Redesign the ConnectedAccounts component and related frontend code to support multiple simultaneous OAuth providers. The backend (SCRUM-161, PR #44, merged) now returns `oauthProviders: string[]` in SafeUser and exposes per-provider endpoints (`GET /users/me/oauth`, `DELETE /users/me/oauth/:provider`). The frontend must align its types, API client, and UI to this new contract.

Architecture: Next.js 14 App Router, `'use client'` components, TailwindCSS, Context + Reducer state management.

## 2. Architecture Context

### Components/Pages Affected
- `src/lib/types.ts` — SafeUser type, new LinkedProvider type
- `src/lib/unlink-oauth-api.ts` → renamed to `src/lib/oauth-api.ts` — API client for OAuth operations
- `src/components/profile/ConnectedAccounts.tsx` — main component, full rewrite of connection logic
- `src/context/AuthContext.tsx` — handleOAuthCallback toast message (line 239)
- `src/components/profile/ChangeEmailForm.tsx` — provider-managed email warning (lines 31-32)

### Files Verified Against Live Code
| File | Verified | Key Facts |
|------|----------|-----------|
| `src/lib/types.ts` | Yes | SafeUser has `provider: 'LOCAL'\|'GOOGLE'\|'GITHUB'`, `providerId: string\|null`, `failedAttempts`, `lockedUntil`, `lockoutCount` — all to be removed/replaced |
| `src/lib/unlink-oauth-api.ts` | Yes | Single function `unlinkOAuth(password)` → `DELETE /users/me/oauth` with body |
| `src/components/profile/ConnectedAccounts.tsx` | Yes | 211 lines, uses `user.provider === provider.id` (line 115), single modal state, `handleConnect` redirects to `/auth/{provider}` (line 103) |
| `src/context/AuthContext.tsx` | Yes | 430 lines, `handleOAuthCallback` at line 224, uses `user.provider` at line 239 for toast |
| `src/components/profile/ChangeEmailForm.tsx` | Yes | 108 lines, `isLocal = user.provider === 'LOCAL'` at line 31, `providerName` at line 32 |
| `src/lib/api.ts` | Yes | ApiClient has `delete<T>(endpoint, options)` and `deleteWithBody<T>(endpoint, body, options)` methods |

### Routing Considerations
- No new routes needed. ConnectedAccounts lives on the existing profile/settings page.
- Connect button redirect changes from `/auth/{provider}` to `/auth/link/{provider}` (link flow vs login flow).

### State Management
- No new Context needed. Uses existing `AuthContext` (user state) and `ToastContext` (notifications).
- ConnectedAccounts tracks per-provider modal state locally.

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-162-frontend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-162-frontend`
  3. Verify: `git branch`

---

### Step 1: Update SafeUser Type and Add LinkedProvider

- **File**: `src/lib/types.ts`
- **Action**: Align SafeUser with backend contract, add LinkedProvider type

**Changes**:
1. Remove from SafeUser:
   - `provider: 'LOCAL' | 'GOOGLE' | 'GITHUB'`
   - `providerId: string | null`
   - `failedAttempts: number`
   - `lockedUntil: string | null`
   - `lockoutCount: number`

2. Add to SafeUser:
   - `oauthProviders: string[]`

3. Add new type after SafeUser:
   ```typescript
   export type LinkedProvider = {
     provider: string;
     providerId: string;
     email: string;
     linkedAt: string;
   };
   ```

4. Update `UnlinkOAuthDto` to include optional password (for multi-provider case where user has password):
   ```typescript
   export type UnlinkOAuthDto = {
     password?: string;
   };
   ```

**Dependencies**: None — this is the foundation type change.

**Implementation Notes**:
- The backend SafeUser (from `toSafeUser()` in SCRUM-161) omits `failedAttempts`, `lockedUntil`, `lockoutCount` via `Omit<>`. The frontend type must match.
- `provider` and `providerId` are still returned by the backend (dual-write) but the frontend must NOT use them — they will be removed in SCRUM-163.

---

### Step 2: Rename and Update OAuth API Client

- **File**: Rename `src/lib/unlink-oauth-api.ts` → `src/lib/oauth-api.ts`
- **Action**: Update `unlinkOAuth` signature, add `getLinkedProviders`

**New file content**:
```typescript
import { apiClient } from './api';
import type { MessageResponse, LinkedProvider } from './types';

export function unlinkOAuth(provider: string, password: string): Promise<MessageResponse> {
  return apiClient.deleteWithBody<MessageResponse>(
    `/users/me/oauth/${provider.toLowerCase()}`,
    { password },
  );
}

export function getLinkedProviders(): Promise<LinkedProvider[]> {
  return apiClient.get<LinkedProvider[]>('/users/me/oauth');
}
```

**Implementation Notes**:
- Uses `deleteWithBody` (exists in api.ts line 142) since DELETE with body is needed.
- Provider is lowercased in the URL path (`/users/me/oauth/google`) — backend controller normalizes to uppercase.
- Old import path `@/lib/unlink-oauth-api` must be updated in ConnectedAccounts.tsx.

---

### Step 3: Redesign ConnectedAccounts Component

- **File**: `src/components/profile/ConnectedAccounts.tsx`
- **Action**: Full rewrite of connection logic for multi-provider support

**Key Changes**:

1. **Import update**: `import { unlinkOAuth } from '@/lib/oauth-api'` (new path)

2. **isConnected logic** (replaces line 115):
   ```typescript
   const isConnected = user.oauthProviders.includes(provider.id);
   ```

3. **Per-provider modal state**: Track which provider the modal is for:
   ```typescript
   const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
   ```
   Replace `showModal` boolean with `disconnectingProvider !== null` check.

4. **handleConnect** (replaces line 103): Change redirect to link flow:
   ```typescript
   const handleConnect = (providerId: string) => {
     window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/link/${providerId.toLowerCase()}`;
   };
   ```

5. **handleUnlink** (replaces lines 66-89): Pass provider to API:
   ```typescript
   const handleUnlink = async () => {
     if (!disconnectingProvider) return;
     setLoading(true);
     try {
       await unlinkOAuth(disconnectingProvider, password);
       setDisconnectingProvider(null);
       setPassword('');
       addToast({ variant: 'success', title: 'Account disconnected', description: `${providerDisplayName(disconnectingProvider)} has been disconnected.` });
       await refreshSession();
     } catch (err: unknown) {
       // ... error handling (same pattern as current)
     } finally {
       setLoading(false);
     }
   };
   ```

6. **Safety guard for last provider**: If `!user.hasPassword && user.oauthProviders.length === 1`, the single connected provider shows "Set a password first" instead of Disconnect button (prevents lockout).

7. **Multiple simultaneous connections**: Remove the implicit mutual exclusivity. Each provider independently shows Connect or Disconnect based on `user.oauthProviders.includes(provider.id)`.

8. **Modal title**: Shows the specific provider being disconnected:
   ```typescript
   const activeProvider = providers.find((p) => p.id === disconnectingProvider);
   // In modal: "Disconnect {activeProvider?.name}"
   ```

9. **Modal description update**: Change from "converted to local authentication" to "This provider will be removed from your account." (since user may have other providers).

**Implementation Notes**:
- The `connectedProvider` variable (line 58) is removed — no longer a single connected provider.
- Disconnect button opens modal with `setDisconnectingProvider(provider.id)`.
- Close modal sets `setDisconnectingProvider(null)`.

---

### Step 4: Update AuthContext OAuth Callback

- **File**: `src/context/AuthContext.tsx`
- **Action**: Fix `handleOAuthCallback` toast to not use `user.provider`

**Change at line 238-240**:
```typescript
// BEFORE:
const providerName = user.provider === 'GOOGLE' ? 'Google' : user.provider === 'GITHUB' ? 'GitHub' : user.provider;

// AFTER:
// The last element of oauthProviders is the most recently linked
const lastProvider = user.oauthProviders[user.oauthProviders.length - 1];
const providerName = lastProvider === 'GOOGLE' ? 'Google' : lastProvider === 'GITHUB' ? 'GitHub' : lastProvider;
```

**Implementation Notes**:
- This works because after an OAuth link, the backend returns the updated SafeUser with the new provider in `oauthProviders`.
- The toast only fires when `oauthAction === 'linked'`, so `oauthProviders` will always have at least one entry.

---

### Step 5: Update ChangeEmailForm Provider Check

- **File**: `src/components/profile/ChangeEmailForm.tsx`
- **Action**: Replace `user.provider` checks with `user.oauthProviders`

**Changes at lines 31-32**:
```typescript
// BEFORE:
const isLocal = user.provider === 'LOCAL';
const providerName = user.provider === 'GOOGLE' ? 'Google' : user.provider === 'GITHUB' ? 'GitHub' : user.provider;

// AFTER:
const isOAuthOnly = user.oauthProviders.length > 0 && !user.hasPassword;
const providerNames = user.oauthProviders
  .map((p) => p === 'GOOGLE' ? 'Google' : p === 'GITHUB' ? 'GitHub' : p)
  .join(' and ');
```

**Update logic at line 37**:
```typescript
// BEFORE: const canSubmit = isLocal && ...
// AFTER: const canSubmit = !isOAuthOnly && ...
```

**Update warning at line 61**:
```typescript
// BEFORE: {!isLocal ? (...) : (...)}
// AFTER: {isOAuthOnly ? (...) : (...)}
```
Update warning text to use `providerNames` instead of single `providerName`.

**Logic explanation**:
- A user with password + OAuth can change email (they authenticate with password).
- A user with OAuth only (no password) cannot change email — they must set a password first.
- `isOAuthOnly` replaces the old `!isLocal` check.

**Update handleSubmit guard at line 41**:
```typescript
// BEFORE: if (!isLocal) return;
// AFTER: if (isOAuthOnly) return;
```

---

### Step 6: Verify No Remaining provider/providerId References

- **Action**: Search the entire `nexacore-dashboard/src/` directory for remaining references to `user.provider`, `user.providerId`, `\.provider`, `\.providerId`
- **Expected result**: Zero matches in source files (types.ts still has the type but the fields are removed)
- **If found**: Update each reference to use `user.oauthProviders`

---

### Step 7: TypeScript Compilation Check

- **Action**: Run `cd nexacore-dashboard && npx next build` (or `npx tsc --noEmit`)
- **Expected**: Clean compilation with no type errors
- **Common issues**:
  - Components or tests referencing `user.provider` will fail — fix in Step 6
  - The `LoginForm.test.tsx` may mock SafeUser with old fields — update mocks

---

### Step 8: Update Test Mocks

- **File**: `tests/components/auth/LoginForm.test.tsx`
- **Action**: Update any SafeUser mocks to use new shape (remove `provider`/`providerId`/`failedAttempts`/`lockedUntil`/`lockoutCount`, add `oauthProviders`)
- **Check other test files** in `tests/` for SafeUser mocks

---

### Step 9: Update Technical Documentation

- **Action**: Review and update technical documentation
- **Implementation Steps**:
  1. Review all code changes made during implementation
  2. No API endpoint changes needed (backend already updated in SCRUM-161)
  3. No data model changes needed (already updated in SCRUM-161)
  4. If any frontend patterns changed significantly, update `frontend-standards.mdc`
- **Notes**: Most documentation was already updated in SCRUM-161 `/update-docs`. This step verifies nothing additional is needed.

## 4. Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-162-frontend`
2. **Step 1**: Update SafeUser type + add LinkedProvider in `types.ts`
3. **Step 2**: Rename + update OAuth API client (`oauth-api.ts`)
4. **Step 3**: Redesign ConnectedAccounts component
5. **Step 4**: Update AuthContext handleOAuthCallback
6. **Step 5**: Update ChangeEmailForm provider checks
7. **Step 6**: Verify no remaining provider/providerId references
8. **Step 7**: TypeScript compilation check
9. **Step 8**: Update test mocks
10. **Step 9**: Update technical documentation (if needed)

## 5. Testing Checklist

### Component Functionality
- [ ] Google shows "Connect" when not in `oauthProviders`, "Disconnect" when present
- [ ] GitHub shows "Connect" when not in `oauthProviders`, "Disconnect" when present
- [ ] Both can show "Disconnect" simultaneously (multi-provider)
- [ ] Connect button redirects to `/auth/link/{provider}` (NOT `/auth/{provider}`)
- [ ] Disconnect opens modal with correct provider name
- [ ] Disconnect modal sends password to correct per-provider endpoint
- [ ] After disconnect, `refreshSession()` updates UI
- [ ] Toast shows on successful connect/disconnect

### Safety Guards
- [ ] User with no password + 1 OAuth provider: cannot disconnect (shows "Set a password first")
- [ ] User with password + 1 OAuth provider: can disconnect
- [ ] User with no password + 2 OAuth providers: can disconnect either (still has one left)

### Error Handling
- [ ] 401 on disconnect: shows "Invalid password" toast
- [ ] 429 on disconnect: shows rate limit toast
- [ ] Network error: shows generic error toast
- [ ] 400 invalid provider: shows backend error message

### ChangeEmailForm
- [ ] OAuth-only user (no password): shows provider-managed warning
- [ ] User with password + OAuth: can change email normally
- [ ] Warning text shows correct provider name(s)

### AuthContext
- [ ] OAuth callback with `oauthAction: 'linked'`: shows correct provider in toast

### TypeScript
- [ ] `next build` compiles clean
- [ ] No references to `user.provider` or `user.providerId` in source code

## 6. Error Handling Patterns

| Scenario | HTTP Status | User Feedback |
|----------|-------------|---------------|
| Invalid password on disconnect | 401 | Toast: "Invalid password." |
| Rate limited | 429 | Toast: "Too many requests. Try again later." |
| Provider not linked | 400 | Toast: backend message |
| OAuth link conflict | 409 | Toast: "Unable to link this provider." (generic, anti-enumeration) |
| Network failure | 0 | Toast: "Network error. Please check your connection." |
| Last provider without password | N/A (client-side) | "Set a password first" text, button disabled |

## 7. UI/UX Considerations

- **Loading states**: Disconnect button shows "Disconnecting..." and is disabled during API call
- **Modal**: Password field clears on close/submit (security)
- **Escape key**: Closes modal (existing behavior, preserved)
- **Overlay click**: Closes modal (existing behavior, preserved)
- **Multiple providers connected**: Both show red "Disconnect" button independently
- **TailwindCSS**: Reuse existing design tokens (border-error-border, text-error, bg-error-bg, etc.)
- **No layout changes**: Same card structure, same spacing

## 8. Dependencies

- No new external libraries required
- Existing dependencies used: React hooks, TailwindCSS, `@/lib/api` ApiClient
- Backend dependency: SCRUM-161 (merged, PR #44) — `GET /users/me/oauth`, `DELETE /users/me/oauth/:provider`

## 9. Notes

- **Backward compatibility**: Backend still returns `provider`/`providerId` fields (dual-write from SCRUM-161). Frontend must NOT use them — use `oauthProviders[]` exclusively. SCRUM-163 will remove the deprecated fields.
- **Password field security**: Clear password from state after modal close or submit. Never persist password beyond the request lifecycle.
- **File rename**: `unlink-oauth-api.ts` → `oauth-api.ts`. Git will track as rename if similarity > 50%.
- **No Figma changes**: This is a logic-only change. The visual design of ConnectedAccounts remains the same — only the data binding and interaction logic change.

## 10. Next Steps After Implementation

1. Run `/commit SCRUM-162` to commit, push, create PR, merge
2. Run `/update-docs SCRUM-162` to create implementation record
3. Proceed to SCRUM-163 (Phase D: cleanup deprecated User.provider/providerId fields)

## 11. Implementation Verification

- [ ] **Code Quality**: No TypeScript errors, consistent with existing patterns
- [ ] **Functionality**: Multi-provider connect/disconnect works independently
- [ ] **Testing**: All existing tests pass, mocks updated for new SafeUser shape
- [ ] **Integration**: Frontend types match backend SafeUser contract exactly
- [ ] **Documentation**: Technical docs updated if needed
- [ ] **Security**: Password cleared after modal interaction, no provider enumeration leaks
