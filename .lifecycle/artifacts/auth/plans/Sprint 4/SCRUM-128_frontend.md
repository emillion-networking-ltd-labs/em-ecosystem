# Frontend Implementation Plan: SCRUM-128 Passkey/WebAuthn Frontend Integration

## 1. Overview

Add complete WebAuthn/FIDO2 passkey support to nexacore-dashboard. The backend already provides 7 fully tested endpoints via `passkey.controller.ts` and `passkey.service.ts` using `@simplewebauthn/server`. This ticket adds the browser-side WebAuthn integration using `@simplewebauthn/browser` and the corresponding UI components for registration, login, and management.

**Architecture**: Next.js 14 App Router, React Context + useReducer for auth state, TailwindCSS for styling, `apiClient` singleton for API calls with automatic CSRF + token refresh.

## 2. Architecture Context

### Components/Pages Involved
- **New**: `src/components/profile/PasskeyManager.tsx` — multi-view component for passkey management in profile
- **New**: `src/hooks/usePasskey.ts` — custom hook encapsulating WebAuthn browser API + backend API calls
- **Modified**: `src/components/auth/LoginForm.tsx` — add "Sign in with passkey" button on email step
- **Modified**: `src/lib/api.ts` — add 7 passkey API methods
- **Modified**: `src/lib/types.ts` — add passkey response types
- **Modified**: `src/app/profile/page.tsx` — render PasskeyManager in security section
- **Modified**: `src/context/AuthContext.tsx` — add `passkeyLogin` method for passkey auth flow

### Routing Considerations
- No new routes needed. Passkey management lives on existing `/profile` page
- Passkey login triggers from existing `/login` page (LoginForm component)

### State Management
- **Auth Context**: Add `passkeyLogin(challengeId, credential)` method that dispatches AUTH_SUCCESS on verify
- **Local state in PasskeyManager**: Multi-view pattern (list | registering | renaming | deleting) — same pattern as MfaSetup.tsx
- **Local state in LoginForm**: Add passkey loading state for the biometric prompt phase

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch**: `feature/SCRUM-128-frontend`
- **Implementation Steps**:
  1. Ensure on latest `main`: `git checkout main && git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-128-frontend`
  3. Verify: `git branch`
- **Notes**: Must be the FIRST step before any code changes.

### Step 1: Install @simplewebauthn/browser

- **File**: `nexacore-dashboard/package.json`
- **Action**: Add the WebAuthn browser library
- **Implementation Steps**:
  1. Run `npm install @simplewebauthn/browser` in nexacore-dashboard/
  2. Verify it appears in `dependencies` (not devDependencies)
  3. Verify `npm run build` still passes
- **Dependencies**: `@simplewebauthn/browser` (MIT license, maintained by MasterKale)
- **Notes**: This is the official SimpleWebAuthn browser companion to the `@simplewebauthn/server` already used in the backend. Same author, guaranteed API compatibility.

### Step 2: Add Passkey Types

- **File**: `src/lib/types.ts`
- **Action**: Add TypeScript types matching backend response shapes
- **Types to add**:

```typescript
export type PasskeyResponse = {
  id: string;
  name: string | null;
  deviceType: string;       // 'singleDevice' | 'multiDevice'
  backedUp: boolean;
  transports: string[];     // 'usb' | 'ble' | 'nfc' | 'internal'
  lastUsedAt: string | null;
  createdAt: string;
};

export type PasskeyLoginOptionsResponse = {
  options: Record<string, unknown>;
  challengeId: string;
};

export type PasskeyRegisterResult = {
  id: string;
  name: string;
};
```

- **Implementation Notes**: `options` is typed as `Record<string, unknown>` because `@simplewebauthn/browser` functions accept the raw JSON from the server and handle deserialization internally.

### Step 3: Add Passkey API Methods

- **File**: `src/lib/api.ts`
- **Action**: Add 7 passkey methods to the ApiClient class
- **Function Signatures**:

```typescript
// Registration (authenticated)
passkeyRegisterOptions(): Promise<Record<string, unknown>>
passkeyRegisterVerify(credential: Record<string, unknown>, name?: string): Promise<PasskeyRegisterResult>

// Login (public)
passkeyLoginOptions(email?: string): Promise<PasskeyLoginOptionsResponse>
passkeyLoginVerify(challengeId: string, credential: Record<string, unknown>): Promise<AuthResponse>

// Management (authenticated)
listPasskeys(): Promise<PasskeyResponse[]>
renamePasskey(id: string, name: string): Promise<{ id: string; name: string }>
deletePasskey(id: string, password?: string): Promise<MessageResponse>
```

- **Implementation Steps**:
  1. Import `PasskeyResponse`, `PasskeyLoginOptionsResponse`, `PasskeyRegisterResult`, `AuthResponse`, `MessageResponse` from types
  2. Add methods after existing class methods, before `parseErrorResponse`
  3. For `deletePasskey`: use `this.request<MessageResponse>('/auth/passkeys/${id}', { method: 'DELETE', body: JSON.stringify({ password }) })` since the existing `delete()` helper doesn't support body
  4. For `passkeyLoginVerify`: must handle the `Set-Cookie` response for refresh token (already works via `credentials: 'include'`)
- **Implementation Notes**:
  - All POST/PATCH/DELETE go through `this.post()` / `this.patch()` / `this.request()` which auto-attach CSRF token
  - Login verify response matches existing `AuthResponse` type (`{ accessToken, user }`)
  - The `credentials: 'include'` in the base request method ensures refresh_token cookie is set

### Step 4: Add passkeyLogin to AuthContext

- **File**: `src/context/AuthContext.tsx`
- **Action**: Add a `passkeyLogin` function that handles the complete passkey login flow result
- **Function Signature**:

```typescript
passkeyLogin: (challengeId: string, credential: Record<string, unknown>) => Promise<void>
```

- **Implementation Steps**:
  1. Add `passkeyLogin` to the `AuthContextType` type
  2. Implement in provider: calls `apiClient.passkeyLoginVerify(challengeId, credential)`
  3. On success: dispatch `AUTH_SUCCESS` with `{ user, accessToken }`, set `apiClient.setAccessToken(data.accessToken)`
  4. On error: dispatch `AUTH_ERROR`, handle `RateLimitError`
  5. Add to the context value object
- **Implementation Notes**:
  - Follows the exact same success pattern as `login()` and `handleOAuthCallback()` — dispatch AUTH_SUCCESS + set token
  - Does NOT need to handle MFA challenge — passkey login is already a second factor, so backend returns tokens directly

### Step 5: Create usePasskey Hook

- **File**: `src/hooks/usePasskey.ts` (NEW)
- **Action**: Custom hook that encapsulates WebAuthn browser API calls + backend API calls
- **Exports**:

```typescript
export function usePasskey() {
  return {
    // Browser support
    isSupported: boolean,

    // Registration
    registerPasskey: (name?: string) => Promise<PasskeyRegisterResult>,
    isRegistering: boolean,

    // Login
    loginWithPasskey: (email?: string) => Promise<void>,
    isLoggingIn: boolean,

    // Management
    passkeys: PasskeyResponse[],
    isLoadingList: boolean,
    fetchPasskeys: () => Promise<void>,
    renamePasskey: (id: string, name: string) => Promise<void>,
    deletePasskey: (id: string, password?: string) => Promise<void>,

    // Error
    error: string | null,
    clearError: () => void,
  };
}
```

- **Implementation Steps**:
  1. Check WebAuthn support: `const isSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential`
  2. **registerPasskey(name?)**:
     - Call `apiClient.passkeyRegisterOptions()` → get options
     - Call `startRegistration(options)` from `@simplewebauthn/browser` → triggers biometric prompt
     - Call `apiClient.passkeyRegisterVerify(credential, name)` → stores credential
     - Refresh passkey list on success
     - Catch `NotAllowedError` (user cancelled) → silently ignore
  3. **loginWithPasskey(email?)**:
     - Call `apiClient.passkeyLoginOptions(email)` → get `{ options, challengeId }`
     - Call `startAuthentication(options)` from `@simplewebauthn/browser` → triggers biometric prompt
     - Call `passkeyLogin(challengeId, credential)` from AuthContext → sets auth state
     - Catch `NotAllowedError` → silently ignore
  4. **fetchPasskeys()**: Call `apiClient.listPasskeys()`, store in state
  5. **renamePasskey/deletePasskey**: Call respective API methods, refresh list
- **Dependencies**: `@simplewebauthn/browser` (`startRegistration`, `startAuthentication`), `apiClient`, `useAuth`
- **Error Mapping**:
  - `NotAllowedError` → ignore (user cancelled biometric)
  - 400 "Maximum of 10 passkeys reached" → "Maximum passkeys reached. Remove one before adding another."
  - 400 "challenge not found or expired" → "Session expired. Please try again."
  - 401 "cloned" → "This passkey was rejected for security reasons. It may have been compromised."
  - 429 → throw `RateLimitError` (handled by calling component)

### Step 6: Create PasskeyManager Component

- **File**: `src/components/profile/PasskeyManager.tsx` (NEW)
- **Action**: Multi-view profile section for passkey management
- **Component**: `export default function PasskeyManager()`
- **Views**: `list` | `registering` | `renaming` | `deleting`

- **Implementation Steps**:
  1. **List view (default)**:
     - Section card with header "Passkeys" (same card style as MfaSetup.tsx: `rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card`)
     - If `!isSupported`: show info banner "Passkeys are not supported in this browser" + hide add button
     - If passkeys.length === 0: show "No passkeys registered" message + "Add Passkey" button
     - If passkeys exist: render list with:
       - Passkey name (or "Passkey" default)
       - Device type icon: `Smartphone` for multiDevice, `Monitor` for singleDevice (from lucide-react)
       - Backed-up badge: small "Synced" label if `backedUp === true`
       - Transports: show as subtle text (e.g., "internal, usb")
       - Last used: relative time ("2 hours ago", "Never" if null) using existing date formatting
       - Created: date string
       - Actions: rename (Pencil icon), delete (Trash2 icon)
     - "Add Passkey" button (disabled if passkeys.length >= 10, show tooltip "Maximum 10 passkeys")
     - Rate limit banner if needed
  2. **Registering view**:
     - After clicking "Add Passkey": optional name input (max 64 chars, placeholder "My MacBook")
     - "Register" button → calls `registerPasskey(name)` → shows InfinitySpinner during biometric prompt
     - On success: toast "Passkey registered" + return to list
     - On error: show error message
  3. **Renaming view**:
     - Input pre-filled with current name, max 64 chars
     - Save / Cancel buttons
  4. **Deleting view**:
     - Warning banner (error-border/error-bg, same as MfaSetup disable)
     - "This action cannot be undone"
     - Password input for confirmation
     - Delete / Cancel buttons
- **Dependencies**: `usePasskey` hook, `Button`, `Input`, `InfinitySpinner`, `RateLimitBanner`, lucide icons (`Key`, `Smartphone`, `Monitor`, `Pencil`, `Trash2`, `Plus`, `AlertTriangle`, `Shield`)
- **Pattern Reference**: Follow MfaSetup.tsx multi-view pattern exactly

### Step 7: Add PasskeyManager to Profile Page

- **File**: `src/app/profile/page.tsx`
- **Action**: Import and render PasskeyManager in the security section
- **Implementation Steps**:
  1. Import: `import PasskeyManager from '@/components/profile/PasskeyManager';`
  2. Add `<PasskeyManager />` after `<MfaSetup />` (logical grouping: MFA → Passkeys → Account Info → Connected Accounts → Sessions)
- **New order**:
  ```
  <ProfileForm />
  <ChangePasswordForm />
  <MfaSetup />
  <PasskeyManager />      ← NEW
  <AccountInfo />
  <ConnectedAccounts />
  <ActiveSessions />
  ```

### Step 8: Add Passkey Login to LoginForm

- **File**: `src/components/auth/LoginForm.tsx`
- **Action**: Add "Sign in with passkey" button on the email step, between the Create Account/Next buttons and the OAuth section
- **Implementation Steps**:
  1. Import `usePasskey` hook
  2. Extract `isSupported`, `loginWithPasskey`, `isLoggingIn` from hook
  3. Add state: `const [passkeyError, setPasskeyError] = useState<string | null>(null)`
  4. Add handler:
     ```typescript
     const handlePasskeyLogin = async () => {
       setPasskeyError(null);
       try {
         await loginWithPasskey(formData.email || undefined);
         // On success → isAuthenticated → useEffect redirects
       } catch (err) {
         if (err instanceof RateLimitError) {
           setRateLimit(err.retryAfter, err.message, 'throttle');
         } else {
           setPasskeyError((err as Error).message || 'Passkey authentication failed');
         }
       }
     };
     ```
  5. In the email step JSX, add between the buttons div and OAuthButtons:
     ```tsx
     {isSupported && (
       <div className="mt-2">
         <div className="relative flex items-center py-2">
           <div className="flex-grow border-t border-border-default" />
           <span className="mx-3 shrink-0 text-xs text-content-tertiary">or</span>
           <div className="flex-grow border-t border-border-default" />
         </div>
         <button
           type="button"
           onClick={handlePasskeyLogin}
           disabled={isLoggingIn || rateLimitInfo.isRateLimited}
           className="relative flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50"
         >
           <Key size={18} />
           <span className={isLoggingIn ? 'opacity-30' : ''}>Sign in with passkey</span>
           {isLoggingIn && <InfinitySpinner />}
         </button>
         {passkeyError && (
           <div className="mt-2 flex items-center gap-2">
             <AlertTriangle size={14} className="shrink-0 text-error" />
             <span className="text-xs text-error">{passkeyError}</span>
           </div>
         )}
       </div>
     )}
     ```
  6. The button is completely hidden if `!isSupported` — graceful degradation
- **Implementation Notes**:
  - `loginWithPasskey(email)` passes the email to filter server-side credentials for this user (optional optimization)
  - If user has no passkeys, the browser prompt will still appear for discoverable credentials (resident keys)
  - User cancelling the biometric prompt is handled silently in the hook (NotAllowedError)
  - Passkey login bypasses MFA — backend returns tokens directly

### Step 9: Write Tests

- **File**: `tests/hooks/usePasskey.test.ts` (NEW)
- **File**: `tests/components/profile/PasskeyManager.test.tsx` (NEW)
- **Action**: Unit tests for hook and component

- **usePasskey.test.ts**:
  1. Test `isSupported` returns false when `window.PublicKeyCredential` is undefined
  2. Test `registerPasskey` calls API methods in correct order
  3. Test `registerPasskey` handles user cancel (NotAllowedError) silently
  4. Test `loginWithPasskey` calls API methods in correct order
  5. Test error mapping for backend errors (max passkeys, expired challenge, cloned)
  6. Test `fetchPasskeys` populates passkeys list
  7. Test `deletePasskey` calls API and refreshes list

- **PasskeyManager.test.tsx**:
  1. Test renders "not supported" message when WebAuthn unavailable
  2. Test renders empty state when no passkeys
  3. Test renders passkey list with correct fields
  4. Test "Add Passkey" button disabled when at max (10)
  5. Test rename flow: click edit → input → save
  6. Test delete flow: click delete → password → confirm
  7. Test error states display correctly

- **Dependencies**: `@testing-library/react`, `jest`, mock `@simplewebauthn/browser`
- **Mock Strategy**: Mock `apiClient` methods and `@simplewebauthn/browser` functions. Use `jest.mock('@simplewebauthn/browser')`.

### Step 10: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made
- **Implementation Steps**:
  1. **Review Changes**: Analyze all code changes from steps 1-9
  2. **Update `frontend-standards.mdc`**: Add passkey hook and component to project structure section
  3. **Verify `api-spec.yml`**: Passkey endpoints should already be documented from backend sprint — verify frontend consumption matches
  4. **Update `integration-state.md`**: Add SCRUM-128 changelog entry documenting frontend passkey integration
  5. **Verify Documentation**: Confirm all changes accurately reflected, English only
- **References**: Follow `documentation-standards.mdc`
- **Notes**: MANDATORY step before considering implementation complete

## 4. Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-128-frontend`
2. **Step 1**: Install `@simplewebauthn/browser`
3. **Step 2**: Add passkey types to `types.ts`
4. **Step 3**: Add passkey API methods to `api.ts`
5. **Step 4**: Add `passkeyLogin` to AuthContext
6. **Step 5**: Create `usePasskey` hook
7. **Step 6**: Create `PasskeyManager` component
8. **Step 7**: Add PasskeyManager to profile page
9. **Step 8**: Add passkey login to LoginForm
10. **Step 9**: Write tests
11. **Step 10**: Update technical documentation

## 5. Testing Checklist

### Unit Tests
- [ ] `usePasskey` hook: browser support detection
- [ ] `usePasskey` hook: registration flow (options → biometric → verify)
- [ ] `usePasskey` hook: login flow (options → biometric → verify)
- [ ] `usePasskey` hook: error mapping (cancel, max, expired, cloned)
- [ ] `PasskeyManager`: empty state rendering
- [ ] `PasskeyManager`: passkey list rendering with fields
- [ ] `PasskeyManager`: add button disabled at max limit
- [ ] `PasskeyManager`: rename flow
- [ ] `PasskeyManager`: delete with password confirmation

### Manual Verification
- [ ] Registration: Add Passkey → biometric prompt → appears in list
- [ ] Registration: Cancel biometric → no error shown
- [ ] Registration: 11th passkey shows "Maximum reached"
- [ ] Login: Sign in with passkey → biometric → redirects to dashboard
- [ ] Login: Cancel biometric → can still use email/password
- [ ] Management: Rename passkey → new name persists
- [ ] Management: Delete passkey → password required → removed from list
- [ ] Rate limiting: Rapid registration attempts show RateLimitBanner
- [ ] Browser support: Chrome/Edge/Safari show passkey UI; unsupported browsers hide it
- [ ] Build: `next build` passes with zero errors

## 6. Error Handling Patterns

| Error Source | Error | Frontend Behavior |
|-------------|-------|-------------------|
| Browser | `NotAllowedError` (user cancelled) | Silently ignored, user can retry |
| Browser | `NotSupportedError` | `isSupported = false`, UI hidden |
| Backend 400 | "Maximum of 10 passkeys reached" | Show error in PasskeyManager, disable add button |
| Backend 400 | "challenge not found or expired" | Show "Session expired, please try again" |
| Backend 400 | "Password confirmation required" | Show password input in delete modal |
| Backend 401 | "verification failed" | Show "Passkey authentication failed. Try again." |
| Backend 401 | "cloned" | Show "Passkey rejected for security reasons" |
| Backend 401 | "Invalid password" | Show error on password input in delete view |
| Backend 403 | "Account is deactivated" | Redirect to login |
| Backend 404 | "Passkey not found" | Refresh list, show toast |
| Backend 429 | Rate limited | Throw `RateLimitError` → `RateLimitBanner` with countdown |

## 7. UI/UX Considerations

### TailwindCSS & Theme
- Card: `rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card` (matches MfaSetup)
- Section header: `text-body-sm font-semibold uppercase tracking-wider text-content-primary` (matches MfaSetup)
- Error banner: `border-error-border bg-error-bg` with `AlertTriangle` icon
- Warning banner: `border-warning-border bg-warning-bg` with `AlertTriangle` icon
- Use existing `Button` component (variants: default, outline, danger)
- Use existing `Input` component (with `error` prop)

### Responsive Design
- PasskeyManager: full width within `max-w-2xl` container (profile page constraint)
- Passkey list items: stack vertically on mobile, horizontal info on desktop
- Login passkey button: full width matching other buttons

### Accessibility
- Passkey login button: `aria-label="Sign in with passkey"`
- Biometric prompts are OS-native (no custom UI needed)
- Passkey list items: keyboard navigable action buttons
- Delete confirmation: focus trap in delete view

### Loading States
- Registration: InfinitySpinner during biometric prompt with "Waiting for biometric..." text
- Login: InfinitySpinner on passkey button during biometric prompt
- List loading: Skeleton or spinner on mount
- Rename/Delete: Button loading state during API call

## 8. Dependencies

### External Libraries
- `@simplewebauthn/browser` — WebAuthn browser API wrapper (functions: `startRegistration`, `startAuthentication`, `browserSupportsWebAuthn`)

### Internal Components Used
- `Button` (`@/components/ui/Button`) — primary, outline, danger variants
- `Input` (`@/components/ui/Input`) — with label, error, placeholder
- `InfinitySpinner` (`@/components/ui/InfinitySpinner`) — loading indicator
- `RateLimitBanner` (`@/components/ui/RateLimitBanner`) — rate limit countdown
- `apiClient` (`@/lib/api`) — API singleton
- `useAuth` (`@/hooks/useAuth`) — auth context hook
- `useToast` (`@/context/ToastContext`) — toast notifications

### Lucide Icons
- `Key` — passkey login button icon
- `Smartphone` / `Monitor` — device type icons in list
- `Pencil` — rename action
- `Trash2` — delete action
- `Plus` — add passkey
- `Shield` / `ShieldCheck` — section status icon
- `AlertTriangle` — error/warning banners

## 9. Notes

- **WebAuthn Config must match backend**: RP ID = `localhost`, Origin = `http://localhost:3001`. These are handled server-side; the frontend just passes the options through to the browser API.
- **No credential data stored client-side**: Raw credentials pass through to the backend and are never persisted in localStorage/sessionStorage.
- **CSRF auto-handled**: All API calls go through `apiClient` which attaches `X-CSRF-Token` on POST/PATCH/DELETE automatically.
- **Passkey login skips MFA**: Backend returns tokens directly on successful passkey auth (passkey IS a second factor). No MFA challenge response handling needed.
- **Token refresh works automatically**: `credentials: 'include'` ensures the `refresh_token` httpOnly cookie is set on passkey login verify response.
- **All code and documentation in English**.
- **Challenge TTL is 5 minutes**: If user takes >5 min on biometric prompt, they'll get "expired" error and need to retry.

## 10. Next Steps After Implementation

1. Run full test suite: `npm test` in nexacore-dashboard/
2. Run build: `npm run build` — must pass with zero errors
3. Manual E2E testing with backend running (localhost:3000 + localhost:3001)
4. Create PR: `feature/SCRUM-128-frontend` → `main`
5. Update Jira ticket SCRUM-128 status

## 11. Implementation Verification

### Code Quality
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No ESLint warnings
- [ ] Consistent naming conventions (PascalCase components, camelCase functions)
- [ ] No `any` types — all properly typed

### Functionality
- [ ] Registration flow end-to-end working
- [ ] Login flow end-to-end working
- [ ] List/rename/delete operations working
- [ ] Rate limiting and error states handled
- [ ] Browser support check hides UI when unsupported

### Testing
- [ ] All new tests pass
- [ ] Existing tests still pass
- [ ] No test regressions

### Integration
- [ ] CSRF tokens sent on all mutations
- [ ] Auth token refresh works after passkey login
- [ ] Profile page renders PasskeyManager correctly
- [ ] Login page shows passkey button when supported

### Documentation
- [ ] `integration-state.md` updated with SCRUM-128 changelog
- [ ] `frontend-standards.mdc` updated if new patterns introduced
- [ ] Implementation record created after completion
