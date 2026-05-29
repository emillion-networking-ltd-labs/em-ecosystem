# Frontend Implementation Plan: SCRUM-132 Unlink OAuth Provider from Profile

## 1. Overview

Add the ability for OAuth users to disconnect their Google or GitHub provider from the profile page. The backend (SCRUM-111) implements `DELETE /users/me/oauth` with password confirmation — this ticket is frontend only. After unlinking, the user's account reverts to LOCAL and all sessions are revoked.

**Architecture**: Next.js 14 App Router, `apiClient` singleton, local component state for modal/form, TailwindCSS for styling.

## 2. Architecture Context

### Components/Pages Involved
- **New**: `src/lib/unlink-oauth-api.ts` — API function for OAuth unlinking
- **Modified**: `src/components/profile/ConnectedAccounts.tsx` — add Disconnect button + confirmation modal
- **Modified**: `src/lib/types.ts` — add `UnlinkOAuthDto` type

### Routing Considerations
- `/profile` — existing protected page, ConnectedAccounts card gains Disconnect functionality
- No new routes needed — on successful unlink, redirect to `/login`

### State Management
- **ConnectedAccounts**: Local `useState` for modal visibility, password, loading, error
- No context changes — uses existing `useAuth()` for `user` and `logout()`

### Key Backend Behavior
- `DELETE /users/me/oauth` takes `{ password: string }` (NOT a provider field — backend infers provider from the authenticated user)
- Password is **required** (8-128 chars) — the user must have a local password set before unlinking
- Backend revokes all sessions + trusted devices after unlink
- Backend returns 400 if user has no `passwordHash` (OAuth-only, never set a local password)

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch**: `feature/SCRUM-132-frontend`
- **Implementation Steps**:
  1. Ensure on latest `main`: `git checkout main && git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-132-frontend`
  3. Verify: `git branch`
- **Notes**: Must be the FIRST step before any code changes.

### Step 1: Add UnlinkOAuthDto Type

- **File**: `src/lib/types.ts`
- **Action**: Add TypeScript type matching backend DTO
- **Type to add**:

```typescript
export type UnlinkOAuthDto = {
  password: string;
};
```

- **Implementation Notes**:
  - Password is **required** (unlike DeleteAccountDto where it's optional)
  - `MessageResponse` already exists on this branch from SCRUM-131 (or will be added if branching from main where it doesn't exist yet — check and add if needed)

### Step 2: Create Unlink OAuth API Module

- **File**: `src/lib/unlink-oauth-api.ts` (NEW)
- **Action**: Single API function for OAuth unlinking
- **Exports**:

```typescript
import { apiClient } from './api';
import type { MessageResponse } from './types';

export function unlinkOAuth(password: string): Promise<MessageResponse> {
  return apiClient.delete<MessageResponse>('/users/me/oauth', {
    body: JSON.stringify({ password }),
  });
}
```

- **Implementation Notes**:
  - Uses `apiClient.delete(endpoint, options)` — body is passed via `RequestInit.body` (same pattern as SCRUM-131's deleteAccount)
  - Only sends `{ password }` — backend infers the provider from the authenticated user
  - Rate limited 5/60s on backend; frontend handles 429 error

### Step 3: Modify ConnectedAccounts Component

- **File**: `src/components/profile/ConnectedAccounts.tsx`
- **Action**: Add Disconnect button for connected OAuth providers + inline confirmation modal with password field
- **Implementation Steps**:

#### 3a. Add Imports
```typescript
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { unlinkOAuth } from '@/lib/unlink-oauth-api';
import Input from '@/components/ui/Input';
```

#### 3b. Add State
```typescript
const router = useRouter();
const { user, logout } = useAuth();  // add logout to existing destructure
const overlayRef = useRef<HTMLDivElement>(null);

const [showModal, setShowModal] = useState(false);
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

#### 3c. Add Validation + Handlers
```typescript
const canConfirm = password.length >= 8 && !loading;

const handleClose = () => {
  if (loading) return;
  setShowModal(false);
  setPassword('');
  setError('');
};

const handleUnlink = async () => {
  setError('');
  setLoading(true);
  try {
    await unlinkOAuth(password);
    await logout();
    router.push('/login');
  } catch (err: unknown) {
    const e = err as { error?: { message?: string; statusCode?: number } };
    if (e?.error?.statusCode === 429) {
      setError('Too many requests. Try again later.');
    } else if (e?.error?.statusCode === 401) {
      setError('Invalid password.');
    } else {
      setError(e?.error?.message ?? 'Failed to unlink OAuth provider.');
    }
  } finally {
    setLoading(false);
  }
};
```

#### 3d. Modify Provider Row — Replace "Connected" Badge with "Disconnect" Button
Currently the connected provider shows:
```tsx
<span className="text-caption text-success">Connected</span>
<Check size={16} className="text-success" />
```

Replace with:
```tsx
{isConnected ? (
  <button
    onClick={() => setShowModal(true)}
    className="rounded-md border border-error-border px-4 py-1.5 text-caption text-error hover:bg-error-bg"
  >
    Disconnect
  </button>
) : (
  // existing Connect button unchanged
)}
```

- **Styling**: The Disconnect button uses the same sizing as the existing Connect button but with error/danger colors matching the Button `danger` variant tokens (`border-error-border`, `text-error`, `hover:bg-error-bg`)
- **LOCAL users**: Their provider is `'LOCAL'`, so no provider row matches `isConnected`, and no Disconnect button appears naturally

#### 3e. Add Inline Confirmation Modal (after the card's closing div)
Same visual pattern as ConfirmModal (w-[427px], rounded-3xl, surface-secondary) and consistent with SCRUM-131's DeleteAccount modal. Renders conditionally when `showModal` is true.

- **Overlay**: `fixed inset-0 z-50 flex items-center justify-center bg-black/40`
  - Click overlay: `handleClose` (blocked when loading)
  - Escape key: `handleClose` (blocked when loading)
- **Top section** (border-b, bg-surface-primary, p-6):
  - Title: "Disconnect {providerName}" (`text-heading-md text-content-primary`)
    - `providerName` is derived from `user.provider` (e.g., "Google", "GitHub")
  - Description: "Your account will be converted to local authentication. All sessions will be revoked and you'll need to log in with your email and password."
  - Password field: `<Input label="Password" name="unlinkPassword" type="password" value={password} onChange={...} placeholder="Enter your password" />`
  - Error message: `{error && <p className="mt-4 text-caption text-error">{error}</p>}`
- **Bottom section** (p-3, flex justify-end gap-3):
  - Cancel button: same styling as ConfirmModal cancel, disabled when loading
  - Confirm button: danger styling (`bg-error text-white`), **disabled when `!canConfirm`**, onClick `handleUnlink`
    - Text: `loading ? 'Disconnecting...' : 'Disconnect'`

#### 3f. Escape Key Handler
```typescript
useEffect(() => {
  if (!showModal) return;
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
});
```

- **Dependencies**: `useAuth` (add `logout`), `useRouter`, `unlinkOAuth`, `Input`, `useState`, `useEffect`, `useRef`
- **Pattern Reference**: SCRUM-131 DeleteAccount.tsx for inline modal structure

### Step 4: Build Verification

- **Action**: Verify the build passes
- **Implementation Steps**:
  1. Run `npm run build` (or `npx next build`) in nexacore-dashboard/
  2. Verify 0 TypeScript errors, all pages compile
  3. Check that `/profile` page size is reasonable

### Step 5: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made
- **Implementation Steps**:
  1. **Review Changes**: Analyze all code changes from steps 1-3
  2. **Update `integration-state.md`**: Add SCRUM-132 changelog entry
  3. **Verify `api-spec.yml`**: DELETE /users/me/oauth should already be documented from SCRUM-111 backend — verify frontend consumption matches
  4. **Verify Documentation**: Confirm all changes accurately reflected, English only
- **References**: Follow `documentation-standards.mdc`
- **Notes**: MANDATORY step before considering implementation complete

## 4. Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-132-frontend`
2. **Step 1**: Add `UnlinkOAuthDto` type to `types.ts`
3. **Step 2**: Create `unlink-oauth-api.ts` module
4. **Step 3**: Modify `ConnectedAccounts.tsx` (Disconnect button + confirmation modal)
5. **Step 4**: Build verification (`next build`)
6. **Step 5**: Update technical documentation

## 5. Testing Checklist

### Build Verification
- [ ] `next build` passes with 0 errors
- [ ] No TypeScript errors

### Manual Verification — OAuth Users
- [ ] Connected provider row shows "Disconnect" button (not "Connected" badge)
- [ ] Unconnected provider rows still show "Connect" button
- [ ] Click "Disconnect" opens confirmation modal
- [ ] Modal shows provider name in title (e.g., "Disconnect Google")
- [ ] Modal shows password field
- [ ] Confirm button disabled until password >= 8 chars
- [ ] On success: auth state cleared, redirected to /login
- [ ] Wrong password → "Invalid password." error in modal, modal stays open
- [ ] No passwordHash → backend message shown in modal
- [ ] Rate limited → "Too many requests. Try again later." error in modal
- [ ] Cancel button closes modal and resets fields
- [ ] Overlay click closes modal (when not loading)
- [ ] Escape key closes modal (when not loading)
- [ ] Cannot close modal while API call is in flight

### Manual Verification — LOCAL Users
- [ ] No "Disconnect" button appears (no provider matches `isConnected`)
- [ ] "Connect" buttons still work for Google and GitHub

### End-to-End (requires backend running)
- [ ] Unlink Google → account becomes LOCAL, all sessions revoked
- [ ] Re-login with email/password works
- [ ] Can re-link OAuth provider after unlinking

## 6. Error Handling Patterns

| Error Source | Error | Frontend Behavior |
|-------------|-------|-------------------|
| Backend 200 | Success | Call `logout()`, redirect to `/login` |
| Backend 400 | No passwordHash | Show backend message in modal ("You must set a password before unlinking...") |
| Backend 400 | Already LOCAL | Show backend message (should not happen — button hidden for LOCAL) |
| Backend 401 | Wrong password | Show "Invalid password." in modal |
| Backend 429 | Rate limited | Show "Too many requests. Try again later." in modal |
| Client | Password < 8 chars | Confirm button disabled |
| Network | Connection error | Show "Network error. Please check your connection." (from ApiClient) |

## 7. UI/UX Considerations

### TailwindCSS & Theme
- Disconnect button: `rounded-md border border-error-border px-4 py-1.5 text-caption text-error hover:bg-error-bg` (same sizing as Connect button, danger colors from Button danger variant)
- Modal: same visual structure as ConfirmModal and SCRUM-131 DeleteAccount modal (w-[427px], rounded-3xl, surface-secondary bg)
- Error messages in modal: `text-caption text-error`
- Connect button: unchanged (`border-border-default`, neutral colors)

### Responsive Design
- ConnectedAccounts card: full width within `max-w-2xl` container
- Modal: fixed 427px width, centered (same as ConfirmModal)

### Accessibility
- Password input with proper label via Input component
- Confirm button disabled state communicated via `disabled:opacity-50`
- Escape key to close modal

### Loading States
- Confirm button: shows "Disconnecting..." text when loading
- Cancel button: disabled when loading
- Overlay/Escape: blocked when loading

## 8. Dependencies

### External Libraries
- None needed — no new dependencies for this ticket

### Internal Components Used
- `Input` (`@/components/ui/Input`) — password field in modal
- `apiClient` (`@/lib/api`) — API singleton (via unlink-oauth-api.ts)
- `useAuth` (`@/hooks/useAuth`) — user, logout

### Why Not ConfirmModal?
Same rationale as SCRUM-131: ConfirmModal doesn't support a `disabled` prop on the confirm button. This ticket requires the confirm button disabled until password >= 8 chars. Building the modal inline with the same visual structure gives full control.

## 9. Notes

- **No new dependencies**: This ticket uses only existing components and libraries.
- **Body is `{ password }`, not `{ provider }`**: The original ticket description incorrectly stated the body contains a provider field. The actual backend DTO (UnlinkOAuthDto) only has `password: string`. Backend infers the provider from the authenticated user's current provider.
- **OAuth-only users (no passwordHash)**: A user who signed up via OAuth and never set a local password cannot unlink. The backend returns 400 with "You must set a password before unlinking your OAuth provider". The frontend shows this message in the modal. (Note: There is currently no "Set Password" feature on the frontend — this is a known limitation.)
- **Sessions revoked on unlink**: Backend revokes all sessions + trusted devices. The frontend must call `logout()` to clear local auth state, then redirect to `/login`.
- **LOCAL users naturally excluded**: The `isConnected` check (`user.provider === provider.id`) is false for LOCAL users, so no Disconnect button appears. No explicit guard needed.
- **Re-linking is possible**: After unlinking, the user can sign in with Google/GitHub again to re-link. The backend's `findOrCreateByOAuth()` handles the LOCAL → OAuth upgrade path.
- **No SUPERADMIN protection**: Unlike account deletion (403 for SUPERADMIN), unlinking has no role restriction. A SUPERADMIN can unlink their OAuth provider.
- **Main branch state**: No Toast/ToastContext, no RateLimitBanner, no CSRF. ConfirmModal, Button, Input, AuthContext all available. MessageResponse may or may not be on main (added by SCRUM-130/131 on their branches) — check and add if needed.
- **All code and documentation in English**.

## 10. Next Steps After Implementation

1. Run build: `npm run build` — must pass with zero errors
2. Manual testing with backend running (localhost:3000 + localhost:3001)
3. Test unlink flow: disconnect Google/GitHub → re-login with email/password
4. Create PR: `feature/SCRUM-132-frontend` → `main`
5. Update Jira ticket SCRUM-132 status

## 11. Implementation Verification

### Code Quality
- [ ] No TypeScript errors (`next build` passes)
- [ ] Consistent naming (PascalCase components, camelCase functions)
- [ ] No `any` types — all properly typed
- [ ] Disconnect button only visible for OAuth users (natural via isConnected check)

### Functionality
- [ ] API call uses correct endpoint (`DELETE /users/me/oauth`) and payload (`{ password }`)
- [ ] All error states (400, 401, 429) handled with user-friendly messages
- [ ] Confirm button properly disabled until password >= 8 chars
- [ ] Modal blocked from closing during API call
- [ ] Logout + redirect works after successful unlink

### Integration
- [ ] Auth token refresh still works
- [ ] Profile page renders all sections correctly
- [ ] Connect buttons still work for unconnected providers

### Documentation
- [ ] `integration-state.md` updated with SCRUM-132 changelog
- [ ] Implementation record created after completion
