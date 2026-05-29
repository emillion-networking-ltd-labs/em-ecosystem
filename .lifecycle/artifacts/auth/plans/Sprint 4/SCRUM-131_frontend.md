# Frontend Implementation Plan: SCRUM-131 Self-Service Account Deletion

## 1. Overview

Add the ability for any user (LOCAL or OAuth) to permanently delete their account from the profile page. The backend (SCRUM-105) implements `DELETE /users/me` with optional password verification for LOCAL users — this ticket is frontend only.

**Architecture**: Next.js 14 App Router, `apiClient` singleton, local component state for modal/form/messages, TailwindCSS for styling.

## 2. Architecture Context

### Components/Pages Involved
- **New**: `src/lib/delete-account-api.ts` — API function for account deletion
- **New**: `src/components/profile/DeleteAccount.tsx` — danger zone card with delete button + confirmation modal
- **Modified**: `src/lib/types.ts` — add `DeleteAccountDto` type
- **Modified**: `src/app/profile/page.tsx` — add `<DeleteAccount />` at the bottom of the profile

### Routing Considerations
- `/profile` — existing protected page, gets new danger zone card at the bottom
- No new routes needed — on successful deletion, redirect to `/login`

### State Management
- **DeleteAccount**: Local `useState` for modal visibility, `confirmText`, `password`, `loading`, `error`
- **No context changes** — uses existing `useAuth()` for `user` and `logout()`

### Key Dependency: ConfirmModal Limitation
The existing `ConfirmModal` component does not support a `disabled` prop on the confirm button — it only disables on `loading`. Account deletion requires the confirm button to be **disabled until the user types "DELETE" and enters a password (LOCAL)**. Therefore this component builds an inline confirmation modal with the same visual styling as ConfirmModal but with full control over button disabled state.

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch**: `feature/SCRUM-131-frontend`
- **Implementation Steps**:
  1. Ensure on latest `main`: `git checkout main && git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-131-frontend`
  3. Verify: `git branch`
- **Notes**: Must be the FIRST step before any code changes.

### Step 1: Add DeleteAccountDto Type

- **File**: `src/lib/types.ts`
- **Action**: Add TypeScript type matching backend DTO
- **Type to add**:

```typescript
export type DeleteAccountDto = {
  password?: string;
};
```

- **Implementation Notes**:
  - `password` is optional: required for LOCAL users, omitted for OAuth users
  - Response type is `MessageResponse` (already exists on main)

### Step 2: Create Delete Account API Module

- **File**: `src/lib/delete-account-api.ts` (NEW)
- **Action**: Single API function for account deletion
- **Exports**:

```typescript
import { apiClient } from './api';
import type { MessageResponse } from './types';

export function deleteAccount(password?: string): Promise<MessageResponse> {
  const options: RequestInit = password
    ? { body: JSON.stringify({ password }) }
    : {};
  return apiClient.delete<MessageResponse>('/users/me', options);
}
```

- **Implementation Notes**:
  - `apiClient.delete(endpoint, options)` passes `options` through to `request()`, which already sets `Content-Type: application/json`
  - For LOCAL users, password is sent in the request body
  - For OAuth users, no body is sent (empty options)
  - Backend returns `{ message: "Account deleted successfully" }`

### Step 3: Create DeleteAccount Component

- **File**: `src/components/profile/DeleteAccount.tsx` (NEW)
- **Action**: Danger zone profile card with delete button and custom confirmation modal
- **Component**: `export default function DeleteAccount()`
- **Implementation Steps**:

#### 3a. Component State
```typescript
const { user, logout } = useAuth();
const router = useRouter();
const [showModal, setShowModal] = useState(false);
const [confirmText, setConfirmText] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

#### 3b. Validation Logic
```typescript
const isLocal = user?.provider === 'LOCAL';
const isConfirmValid = confirmText === 'DELETE';
const isPasswordValid = !isLocal || password.length >= 8;
const canConfirm = isConfirmValid && isPasswordValid && !loading;
```

#### 3c. Submit Handler
```typescript
const handleDelete = async () => {
  setError('');
  setLoading(true);
  try {
    await deleteAccount(isLocal ? password : undefined);
    await logout();
    router.push('/login');
  } catch (err: unknown) {
    const e = err as { error?: { message?: string; statusCode?: number } };
    if (e?.error?.statusCode === 429) {
      setError('Too many requests. Try again later.');
    } else if (e?.error?.statusCode === 403) {
      setError('SUPERADMIN accounts cannot be deleted.');
    } else if (e?.error?.statusCode === 401) {
      setError('Incorrect password.');
    } else {
      setError(e?.error?.message ?? 'Failed to delete account.');
    }
  } finally {
    setLoading(false);
  }
};
```

#### 3d. Modal Close Handler
```typescript
const handleClose = () => {
  if (loading) return; // Prevent close while API call in flight
  setShowModal(false);
  setConfirmText('');
  setPassword('');
  setError('');
};
```

#### 3e. Danger Zone Card (always visible on profile)
- Uses standard profile card styling: `rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card`
- Section header: "Danger Zone" (uppercase, tracking-wider, `text-error`)
- Description: "Permanently delete your account and all associated data. This action cannot be undone."
- Button: `<Button variant="danger" size="md" fullWidth={false} onClick={() => setShowModal(true)}>Delete Account</Button>`

#### 3f. Confirmation Modal (inline, not ConfirmModal)
- **Overlay**: `fixed inset-0 z-50 flex items-center justify-center bg-black/40`
  - Click on overlay: `handleClose` (blocked when loading)
  - Escape key: `handleClose` (blocked when loading)
- **Modal container**: Same styling as ConfirmModal: `w-[427px] overflow-hidden rounded-3xl border border-border-default bg-surface-secondary shadow-card`
- **Top section** (border-b, bg-surface-primary, p-6):
  - Title: "Delete Account" (`text-heading-md text-content-primary`)
  - Description: "This action is permanent and cannot be undone. All your data will be anonymized and your sessions will be revoked."
  - **"Type DELETE to confirm"** label + text input:
    - `<Input name="confirmDelete" value={confirmText} onChange={...} placeholder="Type DELETE" />`
    - No `label` prop — use a `<p>` above: "Type **DELETE** to confirm" (`text-body-sm text-content-secondary mt-4`)
  - **Password field** (LOCAL users only):
    - `{isLocal && <Input label="Password" name="deletePassword" type="password" value={password} onChange={...} placeholder="Enter your password" />}`
    - Wrapped in `<div className="mt-4">`
  - **Error message** (if present):
    - `{error && <p className="mt-4 text-caption text-error">{error}</p>}`
- **Bottom section** (p-3, flex justify-end gap-3):
  - Cancel button: same styling as ConfirmModal cancel — `h-10 rounded-md px-6 text-body-sm font-medium text-content-secondary hover:bg-surface-subtle`, disabled when loading
  - Confirm button: same as ConfirmModal danger — `h-10 rounded-md px-6 text-body-sm font-medium bg-error text-white hover:opacity-90 disabled:opacity-50`, **disabled when `!canConfirm`**, onClick `handleDelete`
    - Text: `loading ? 'Deleting...' : 'Delete My Account'`

- **Dependencies**: `useAuth`, `useRouter`, `deleteAccount`, `Input`, `Button` (for the card button only), `useState`, `useEffect`, `useRef`
- **Pattern Reference**: ConfirmModal.tsx for modal visual structure, ChangePasswordForm.tsx for error message styling

### Step 4: Add DeleteAccount to Profile Page

- **File**: `src/app/profile/page.tsx`
- **Action**: Import and render DeleteAccount after ConnectedAccounts (last in profile)
- **Implementation Steps**:
  1. Import: `import DeleteAccount from '@/components/profile/DeleteAccount';`
  2. Add `<DeleteAccount />` after `<ConnectedAccounts />`
- **New order** (on main):
  ```
  <ProfileForm />
  <ChangePasswordForm />
  <AccountInfo />
  <ConnectedAccounts />
  <DeleteAccount />        ← NEW (danger zone, always last)
  ```
- **Notes**: DeleteAccount is shown to ALL users (both LOCAL and OAuth). The component adapts its confirmation form based on `user.provider`.

### Step 5: Build Verification

- **Action**: Verify the build passes
- **Implementation Steps**:
  1. Run `npm run build` (or `npx next build`) in nexacore-dashboard/
  2. Verify 0 TypeScript errors, all pages compile
  3. Check that `/profile` page size is reasonable

### Step 6: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made
- **Implementation Steps**:
  1. **Review Changes**: Analyze all code changes from steps 1-4
  2. **Update `integration-state.md`**: Add SCRUM-131 changelog entry
  3. **Verify `api-spec.yml`**: DELETE /users/me should already be documented from SCRUM-105 backend — verify frontend consumption matches
  4. **Verify Documentation**: Confirm all changes accurately reflected, English only
- **References**: Follow `documentation-standards.mdc`
- **Notes**: MANDATORY step before considering implementation complete

## 4. Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-131-frontend`
2. **Step 1**: Add `DeleteAccountDto` type to `types.ts`
3. **Step 2**: Create `delete-account-api.ts` module
4. **Step 3**: Create `DeleteAccount.tsx` component
5. **Step 4**: Add DeleteAccount to profile page
6. **Step 5**: Build verification (`next build`)
7. **Step 6**: Update technical documentation

## 5. Testing Checklist

### Build Verification
- [ ] `next build` passes with 0 errors
- [ ] No TypeScript errors

### Manual Verification — LOCAL Users
- [ ] Danger zone card visible on profile page
- [ ] Click "Delete Account" opens confirmation modal
- [ ] Modal shows "type DELETE" input AND password input
- [ ] Confirm button disabled until "DELETE" is typed AND password entered (>= 8 chars)
- [ ] Clicking confirm with valid inputs calls DELETE /users/me with { password }
- [ ] On success: auth state cleared, redirected to /login
- [ ] Wrong password → "Incorrect password." error in modal, modal stays open
- [ ] SUPERADMIN → "SUPERADMIN accounts cannot be deleted." error in modal
- [ ] Rate limited → "Too many requests. Try again later." error in modal
- [ ] Cancel button closes modal and resets all fields
- [ ] Overlay click closes modal (when not loading)
- [ ] Escape key closes modal (when not loading)
- [ ] Cannot close modal while delete is in progress

### Manual Verification — OAuth Users
- [ ] Danger zone card visible on profile page
- [ ] Click "Delete Account" opens confirmation modal
- [ ] Modal shows "type DELETE" input but NO password input
- [ ] Confirm button disabled until "DELETE" is typed
- [ ] On success: auth state cleared, redirected to /login

### End-to-End (requires backend running)
- [ ] Submit account deletion → confirmation email received
- [ ] Account data anonymized (tombstone)
- [ ] All sessions/tokens revoked
- [ ] Cannot log in with deleted account

## 6. Error Handling Patterns

| Error Source | Error | Frontend Behavior |
|-------------|-------|-------------------|
| Backend 200 | Success | Call `logout()`, redirect to `/login` |
| Backend 401 | Wrong password | Show "Incorrect password." in modal |
| Backend 403 | SUPERADMIN role | Show "SUPERADMIN accounts cannot be deleted." in modal |
| Backend 429 | Rate limited | Show "Too many requests. Try again later." in modal |
| Client | "DELETE" not typed | Confirm button disabled |
| Client | Password empty/short (LOCAL) | Confirm button disabled |
| Network | Connection error | Show "Network error. Please check your connection." (from ApiClient) |

## 7. UI/UX Considerations

### TailwindCSS & Theme
- Danger zone card: `rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card` (matches all profile sections)
- Section header: `text-body-sm font-semibold uppercase tracking-wider text-error` (red to indicate danger)
- Description: `text-body-sm text-content-secondary`
- Delete button: `<Button variant="danger">` for red destructive styling
- Modal: same visual structure as ConfirmModal (w-[427px], rounded-3xl, surface-secondary bg)
- Error messages in modal: `text-caption text-error`

### Responsive Design
- Danger zone card: full width within `max-w-2xl` container (profile page constraint)
- Modal: fixed 427px width, centered (same as ConfirmModal)

### Accessibility
- Modal traps focus (escape to close when not loading)
- Confirm button clearly labeled "Delete My Account"
- Password input with proper label
- Disabled state communicated via `disabled:opacity-50`

### Loading States
- Confirm button: shows "Deleting..." text when loading
- Cancel button: disabled when loading
- Overlay/Escape: blocked when loading (prevents accidental close mid-deletion)

## 8. Dependencies

### External Libraries
- None needed — no new dependencies for this ticket

### Internal Components Used
- `Button` (`@/components/ui/Button`) — danger zone card button
- `Input` (`@/components/ui/Input`) — confirm text and password fields in modal
- `apiClient` (`@/lib/api`) — API singleton (via delete-account-api.ts)
- `useAuth` (`@/hooks/useAuth`) — user, logout

### Why Not ConfirmModal?
The existing `ConfirmModal` component disables the confirm button only when `loading` is true. Account deletion requires the confirm button to be disabled based on form validation (DELETE typed + password entered). Building the modal inline with the same visual structure gives full control over the disabled state while maintaining visual consistency.

## 9. Notes

- **No new dependencies**: This ticket uses only existing components and libraries.
- **Both LOCAL and OAuth**: Unlike ChangeEmailForm (LOCAL only), DeleteAccount renders for ALL users. The form adapts: LOCAL users see a password field, OAuth users don't.
- **SUPERADMIN protection**: The backend blocks SUPERADMIN self-deletion (403). The frontend shows the error but does NOT hide the button — the error message is sufficient feedback.
- **Post-deletion flow**: After successful deletion, `logout()` is called which clears the access token and httpOnly refresh cookie. The backend has already deleted all sessions, so the logout POST may fail, but `logout()` uses try/finally so the cleanup always runs. ProtectedRoute will then redirect to `/login`.
- **No "deleted" query param on redirect**: The redirect is to plain `/login`. The user's account is gone — showing a "deleted" banner would require state that doesn't survive the logout. The login page renders normally.
- **apiClient.delete body handling**: The `delete` method passes `options` through to `request()`. Body is included via `RequestInit.body`. Content-Type header is already set by `request()`.
- **Main branch state**: No Toast/ToastContext, no RateLimitBanner, no CSRF. ConfirmModal, Button, Input, AuthContext all available. MessageResponse type exists.
- **All code and documentation in English**.

## 10. Next Steps After Implementation

1. Run build: `npm run build` — must pass with zero errors
2. Manual testing with backend running (localhost:3000 + localhost:3001)
3. Test both LOCAL and OAuth deletion flows
4. Create PR: `feature/SCRUM-131-frontend` → `main`
5. Update Jira ticket SCRUM-131 status

## 11. Implementation Verification

### Code Quality
- [ ] No TypeScript errors (`next build` passes)
- [ ] Consistent naming (PascalCase components, camelCase functions)
- [ ] No `any` types — all properly typed
- [ ] Danger zone card renders for both LOCAL and OAuth users

### Functionality
- [ ] API call uses correct endpoint (`DELETE /users/me`) and payload
- [ ] LOCAL flow: password required, sent in body
- [ ] OAuth flow: no password field, no body sent
- [ ] All error states (401, 403, 429) handled with user-friendly messages
- [ ] Confirm button properly disabled until conditions met
- [ ] Modal blocked from closing during API call

### Integration
- [ ] Auth token refresh still works
- [ ] Profile page renders all sections correctly
- [ ] Logout clears all state after deletion
- [ ] Redirect to /login works after deletion

### Documentation
- [ ] `integration-state.md` updated with SCRUM-131 changelog
- [ ] Implementation record created after completion
