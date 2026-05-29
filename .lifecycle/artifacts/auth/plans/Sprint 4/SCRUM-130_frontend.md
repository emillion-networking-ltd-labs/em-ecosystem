# Frontend Implementation Plan: SCRUM-130 Change Email Frontend Flow

## 1. Overview

Add the ability for LOCAL users to change their email address from the profile page, and a callback page for the backend's email change verification redirect. The backend (SCRUM-104) already implements `POST /users/me/email` and `GET /auth/verify-email-change` — this ticket is frontend only.

**Architecture**: Next.js 14 App Router, `apiClient` singleton, local component state for form/messages, TailwindCSS for styling.

## 2. Architecture Context

### Components/Pages Involved
- **New**: `src/lib/email-change-api.ts` — API function for email change request
- **New**: `src/components/profile/ChangeEmailForm.tsx` — profile card with email change form
- **New**: `src/app/verify-email-change/page.tsx` — callback page for backend redirect
- **Modified**: `src/lib/types.ts` — add `ChangeEmailDto` type
- **Modified**: `src/components/profile/ProfileForm.tsx` — add "Change" link next to locked email
- **Modified**: `src/app/profile/page.tsx` — add `<ChangeEmailForm />` to layout

### Routing Considerations
- `/profile` — existing protected page, gets new ChangeEmailForm card
- `/verify-email-change` — NEW public page (no auth required, user arrives from email link after sessions are revoked)

### State Management
- **ChangeEmailForm**: Local `useState` for form fields, loading, error, success (same pattern as ChangePasswordForm)
- **Verify page**: Local state for status read from `?status=` query param (same pattern as OAuthCallbackHandler)
- No context changes needed — `refreshSession()` already reloads user via `GET /auth/me`

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch**: `feature/SCRUM-130-frontend`
- **Implementation Steps**:
  1. Ensure on latest `main`: `git checkout main && git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-130-frontend`
  3. Verify: `git branch`
- **Notes**: Must be the FIRST step before any code changes.

### Step 1: Add ChangeEmailDto Type

- **File**: `src/lib/types.ts`
- **Action**: Add TypeScript type matching backend DTO
- **Type to add**:

```typescript
export type ChangeEmailDto = {
  newEmail: string;
  password: string;
};
```

- **Implementation Notes**:
  - Response type is `MessageResponse` (already exists from SCRUM-129)
  - No new response types needed

### Step 2: Create Email Change API Module

- **File**: `src/lib/email-change-api.ts` (NEW)
- **Action**: Single API function for email change request
- **Exports**:

```typescript
import { apiClient } from './api';
import type { MessageResponse } from './types';

export function requestEmailChange(newEmail: string, password: string): Promise<MessageResponse> {
  return apiClient.post<MessageResponse>('/users/me/email', { newEmail, password });
}
```

- **Implementation Notes**:
  - Only one function needed — the verify endpoint is a backend redirect, not a frontend API call
  - Uses existing `apiClient.post()` — no new methods on ApiClient needed
  - Rate limited 5/60s on backend; frontend handles 429 error

### Step 3: Create ChangeEmailForm Component

- **File**: `src/components/profile/ChangeEmailForm.tsx` (NEW)
- **Action**: Profile card component with email change form
- **Component**: `export default function ChangeEmailForm()`
- **Implementation Steps**:
  1. **Guard**: Get `user` from `useAuth()`. If `user.provider !== 'LOCAL'`, return `null` (OAuth users can't change email)
  2. **State**: `newEmail`, `password`, `loading`, `error`, `success` (all local useState)
  3. **Client validation**:
     - `newEmail` must be valid email format (simple regex or HTML5 `type="email"`)
     - `newEmail` must differ from `user.email` (prevent same-email submission)
     - `password` must be non-empty (min 8 chars matches backend DTO)
     - Submit disabled until both fields pass validation
  4. **Submit handler**:
     - `setLoading(true)`, `setError('')`, `setSuccess(false)`
     - Call `requestEmailChange(newEmail, password)`
     - On success: `setSuccess(true)`, clear form fields
     - On error: extract `error.message` from API error, special case 429 → "Too many requests. Try again later."
  5. **Card layout**: Same pattern as ChangePasswordForm:
     - `rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card`
     - Section header: "Change Email" (uppercase, tracking-wider)
  6. **Form fields**:
     - New Email: `<Input label="New Email" type="email" placeholder="Enter new email address" />`
     - Current Password: `<Input label="Current Password" type="password" placeholder="Enter your password" />`
  7. **Messages**:
     - Success: green text "Verification email sent to your new address. Check your inbox."
     - Error: red text with error message
  8. **Submit button**: `<Button type="submit" size="md" fullWidth={false} loading={loading}>Change Email</Button>`
- **Dependencies**: `useAuth`, `requestEmailChange`, `Input`, `Button`
- **Pattern Reference**: Follow ChangePasswordForm.tsx layout and styling exactly

### Step 4: Add "Change" Link to ProfileForm Email Field

- **File**: `src/components/profile/ProfileForm.tsx`
- **Action**: Add a small "Change" text link next to the locked email field that scrolls to the ChangeEmailForm card
- **Implementation Steps**:
  1. Get `user` from existing `useAuth()` call
  2. Replace the existing email `<div>` block (lines 82-90) with:
     - Keep the disabled email `<Input>` + `<Lock>` icon
     - Add a "Change" link (only for `user.provider === 'LOCAL'`):
       ```tsx
       {user?.provider === 'LOCAL' && (
         <a
           href="#change-email"
           className="absolute bottom-4 right-10 text-caption font-medium text-accent hover:underline"
         >
           Change
         </a>
       )}
       ```
  3. Move the `<Lock>` icon to `right-4` (keep existing position)
  4. For OAuth users, only show the lock icon (no change link)
- **Implementation Notes**:
  - The `href="#change-email"` scrolls to the ChangeEmailForm card which will have `id="change-email"`
  - The link sits to the left of the lock icon inside the same `relative` wrapper
  - Keep the email `<Input>` disabled — the actual form is in the separate ChangeEmailForm card below

### Step 5: Add ChangeEmailForm to Profile Page

- **File**: `src/app/profile/page.tsx`
- **Action**: Import and render ChangeEmailForm after ProfileForm
- **Implementation Steps**:
  1. Import: `import ChangeEmailForm from '@/components/profile/ChangeEmailForm';`
  2. Add `<ChangeEmailForm />` right after `<ProfileForm />`
- **New order**:
  ```
  <ProfileForm />
  <ChangeEmailForm />     ← NEW
  <ChangePasswordForm />
  <TrustedDevices />
  <AccountInfo />
  <ConnectedAccounts />
  ```
- **Notes**: ChangeEmailForm self-hides for OAuth users (returns null), so no conditional rendering needed in the page.

### Step 6: Create Verify Email Change Callback Page

- **File**: `src/app/verify-email-change/page.tsx` (NEW)
- **Action**: Callback page that reads `?status=` from backend redirect
- **Component**: `export default function VerifyEmailChangePage()`
- **Implementation Steps**:
  1. Mark as `'use client'`
  2. Wrap content in `<Suspense>` (required for `useSearchParams()` in Next.js 14)
  3. Create inner component `VerifyEmailChangeContent`:
     - Read `status` from `useSearchParams().get('status')`
     - **success state**: Green checkmark icon (ShieldCheck or CheckCircle from lucide), heading "Email Changed Successfully!", description "Your email has been updated. All sessions have been revoked for security. Please log in with your new email.", button "Go to Login" → `router.push('/login')`
     - **invalid/missing state**: Red warning icon (AlertTriangle from lucide), heading "Verification Failed", description "The verification link is invalid or has expired. Please request a new email change from your profile.", button "Back to Login" → `router.push('/login')`
  4. Use `AuthLayout` for visual consistency with login/register pages
  5. Center content with flex column, icon + heading + description + button
- **Implementation Notes**:
  - This is a PUBLIC page — no `ProtectedRoute` guard (user's sessions are revoked on success)
  - Uses AuthLayout (not DashboardLayout) because the user is no longer authenticated after email change
  - The backend always redirects to `/verify-email-change?status=success` or `/verify-email-change?status=invalid`
  - Pattern reference: OAuthCallbackHandler (reads query params, shows result)
  - GoBackSection in AuthLayout handles the "back" nav area

### Step 7: Build Verification

- **Action**: Verify the build passes
- **Implementation Steps**:
  1. Run `npm run build` (or `npx next build`) in nexacore-dashboard/
  2. Verify 0 TypeScript errors, all pages compile
  3. Check that `/verify-email-change` appears as a new route in the build output
  4. Check that `/profile` page size is reasonable

### Step 8: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made
- **Implementation Steps**:
  1. **Review Changes**: Analyze all code changes from steps 1-6
  2. **Update `integration-state.md`**: Add SCRUM-130 changelog entry
  3. **Verify `api-spec.yml`**: Email change endpoints should already be documented from SCRUM-104 backend — verify frontend consumption matches
  4. **Verify Documentation**: Confirm all changes accurately reflected, English only
- **References**: Follow `documentation-standards.mdc`
- **Notes**: MANDATORY step before considering implementation complete

## 4. Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-130-frontend`
2. **Step 1**: Add `ChangeEmailDto` type to `types.ts`
3. **Step 2**: Create `email-change-api.ts` module
4. **Step 3**: Create `ChangeEmailForm.tsx` component
5. **Step 4**: Add "Change" link to ProfileForm email field
6. **Step 5**: Add ChangeEmailForm to profile page
7. **Step 6**: Create verify-email-change callback page
8. **Step 7**: Build verification (`next build`)
9. **Step 8**: Update technical documentation

## 5. Testing Checklist

### Build Verification
- [ ] `next build` passes with 0 errors
- [ ] No TypeScript errors
- [ ] `/verify-email-change` route appears in build output

### Manual Verification
- [ ] Profile page shows ChangeEmailForm for LOCAL users
- [ ] ChangeEmailForm hidden for OAuth users
- [ ] "Change" link appears on email field for LOCAL users only
- [ ] Client validation: invalid email format → disabled submit
- [ ] Client validation: same email as current → disabled submit
- [ ] Client validation: empty password → disabled submit
- [ ] Successful submission → green success message + form cleared
- [ ] Wrong password → "Password is incorrect" error
- [ ] Same email → "New email must be different" error
- [ ] Email taken → "Email already registered" error
- [ ] Rate limited → "Too many requests" error
- [ ] `/verify-email-change?status=success` → success page with login link
- [ ] `/verify-email-change?status=invalid` → error page with back link
- [ ] `/verify-email-change` (no params) → error page

### End-to-End (requires backend running)
- [ ] Submit email change → verification email received at new address
- [ ] Click verification link → redirects to /verify-email-change?status=success
- [ ] All sessions revoked → must log in with new email
- [ ] Notification email sent to old address

## 6. Error Handling Patterns

| Error Source | Error | Frontend Behavior |
|-------------|-------|-------------------|
| Backend 200 | Success | Show "Verification email sent to your new address. Check your inbox." |
| Backend 400 | OAuth account | Show "Email change not available for OAuth accounts" (or hidden — form not shown) |
| Backend 400 | Same email | Show "New email must be different from current email" |
| Backend 401 | Wrong password | Show "Password is incorrect" |
| Backend 409 | Email taken | Show "Email already registered" |
| Backend 429 | Rate limited | Show "Too many requests. Try again later." |
| Client | Invalid email format | Submit disabled, Input error state |
| Client | Empty password | Submit disabled |
| Network | Connection error | Show "Network error. Please check your connection." (from ApiClient) |

## 7. UI/UX Considerations

### TailwindCSS & Theme
- ChangeEmailForm card: `rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card` (matches all profile sections)
- Section header: `text-body-sm font-semibold uppercase tracking-wider text-content-primary`
- Success message: `text-caption text-success` (matches ChangePasswordForm pattern)
- Error message: `text-caption text-error` (matches ChangePasswordForm pattern)
- "Change" link in ProfileForm: `text-caption font-medium text-accent hover:underline`
- Verify page: uses AuthLayout for consistent auth page design

### Responsive Design
- ChangeEmailForm: full width within `max-w-2xl` container (profile page constraint)
- Verify page: centered content within AuthLayout (already responsive)

### Accessibility
- Form inputs: proper `label` via Input component
- Submit button: disabled state communicated via opacity
- Verify page: semantic heading hierarchy (h1 + p)

### Loading States
- Form submit: Button `loading` prop shows spinner
- Verify page: no loading needed (static status page from redirect)

## 8. Dependencies

### External Libraries
- None needed — no new dependencies for this ticket

### Internal Components Used
- `Input` (`@/components/ui/Input`) — email and password fields
- `Button` (`@/components/ui/Button`) — submit button
- `AuthLayout` (`@/components/layout/AuthLayout`) — verify page wrapper
- `apiClient` (`@/lib/api`) — API singleton (via email-change-api.ts)

### Lucide Icons
- `Lock` — already used on email field (ProfileForm)
- `CheckCircle2` — success state on verify page
- `AlertTriangle` — error state on verify page

## 9. Notes

- **No new dependencies**: Unlike SCRUM-128 (simplewebauthn) and SCRUM-129 (fingerprintjs), this ticket uses only existing components and libraries.
- **OAuth guard**: The ChangeEmailForm component returns `null` for OAuth users. The backend also guards against this (returns 400), but frontend should prevent the attempt entirely.
- **SafeUser has no pendingEmail**: The backend omits `pendingEmail` from SafeUser, so the frontend cannot display "pending email change" state. The success message after submission is the only feedback.
- **Sessions revoked on verification**: After the user clicks the verification link, the backend revokes ALL sessions. The verify-email-change page must NOT require authentication — it's a public page.
- **No cancel functionality**: The backend does not expose a "cancel email change" endpoint. If the user doesn't click the verification link, the token expires in 24 hours.
- **Main branch state**: No Toast/ToastContext, no RateLimitBanner, no CSRF. Use local state for messages (same pattern as ChangePasswordForm).
- **All code and documentation in English**.

## 10. Next Steps After Implementation

1. Run build: `npm run build` — must pass with zero errors
2. Manual testing with backend running (localhost:3000 + localhost:3001)
3. Test full flow: change email → click verification link → log in with new email
4. Create PR: `feature/SCRUM-130-frontend` → `main`
5. Update Jira ticket SCRUM-130 status
6. Unblocks SCRUM-133 (Verify email change callback — now part of this ticket)

## 11. Implementation Verification

### Code Quality
- [ ] No TypeScript errors (`next build` passes)
- [ ] Consistent naming (PascalCase components, camelCase functions)
- [ ] No `any` types — all properly typed
- [ ] OAuth guard prevents form render for non-LOCAL users

### Functionality
- [ ] ChangeEmailForm renders correctly with validation
- [ ] API calls use correct endpoint and payload
- [ ] All error states (400, 401, 409, 429) handled with user-friendly messages
- [ ] Verify page handles success and invalid states
- [ ] "Change" link in ProfileForm scrolls to form card

### Integration
- [ ] Auth token refresh still works
- [ ] Profile page renders all sections correctly
- [ ] Verify page works without authentication (public)

### Documentation
- [ ] `integration-state.md` updated with SCRUM-130 changelog
- [ ] Implementation record created after completion
