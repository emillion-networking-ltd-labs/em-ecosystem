# SCRUM-297 — Migrate ALL Inline Elements to Reusable UI Components

## Scope: FRONTEND (project-wide)

## Objective
Create a component system where the Design System showcase is the SINGLE SOURCE OF TRUTH. Any change in a UI component auto-propagates to every page. Zero inline HTML that duplicates component behavior.

## Current state — Project-wide audit

| Module | Inline `<button>` | `<Button>` comp | `addToast` hardcoded |
|--------|-------------------|-----------------|---------------------|
| Auth | 24 | 0 | 7 |
| Profile | 13 | 20 | 25 |
| Settings | 4 | 0 | 0 |
| Admin | 20 | 0 | 0 |
| Layout | 9 | 0 | 0 |
| App pages | 3 | 0 | 0 |
| Showcase | 12 (demos, OK) | ~10 | 0 |
| **Total** | **85 to migrate** | **49 correct** | **32 to extract** |

Additional inline elements:
- 10 inline errors (AlertTriangle + span) in auth
- 2 inline checkboxes in auth (MfaTotpStep)
- 5 inline MFA digit inputs
- 1 inline email dropdown (LoginForm)

## Phase 0 — Component enhancements (pre-requisite)

### 0.1 Button loading pattern — overlay style
Auth uses overlay (opacity-30 text + absolute spinner). Button currently replaces children.
```tsx
// Target:
<span className={loading ? "opacity-30" : ""}>{children}</span>
{loading && <span className="absolute inset-0 flex items-center justify-center"><InfinitySpinner /></span>}
```
File: `ui/Button.tsx`

### 0.2 Button `as` prop (polymorphic rendering)
Auth uses `<Link>` styled as button. Button needs to render as any element.
```tsx
<Button as={Link} href="/register" variant="outline">Create Account</Button>
```
File: `ui/Button.tsx`

### 0.3 Button `variant="link"` and `variant="link-underline"`
Auth has 12 link-style buttons. Add 2 new variants to Button.
```tsx
<Button variant="link">Help</Button>
<Button variant="link-underline">Forgot password?</Button>
```
File: `ui/Button.tsx`

### 0.4 InlineError component
Create reusable component for 10 inline error patterns.
```tsx
<InlineError message="Invalid email" />
// Renders: AlertTriangle 16px + text-caption text-error
```
New file: `ui/InlineError.tsx`

### 0.5 Toast messages constants
Extract all 32 hardcoded addToast() strings to shared constants.
```tsx
// lib/toast-messages.ts
export const TOAST = {
  LOGIN_FAILED: { variant: "error", title: "Sign in failed" },
  ACCOUNT_CREATED: { variant: "success", title: "Account created", description: "..." },
  ...
}
```
New file: `lib/toast-messages.ts`

## Phase 1 — Auth: simple forms (4 files, 4 buttons)
Lowest risk — forms with 1-2 buttons each.

### 1.1 ForgotPasswordForm.tsx (1 primary)
### 1.2 RegisterForm.tsx (1 primary + 1 outline Link)
### 1.3 ResetPasswordForm.tsx (1 primary)
### 1.4 AuthErrorFallback.tsx (1 outline)

## Phase 2 — Auth: LoginForm (6 buttons + dropdown + links + errors)
Most complex auth form — multi-step.

### 2.1 Buttons: 2 primary (submit) + 2 outline (Link) + 2 OAuth
### 2.2 Email dropdown → EmailSelector component or Select variant
### 2.3 Link buttons: "Forgot password?", "Change email" → Button variant="link-underline"
### 2.4 Errors: 3 inline → InlineError
### 2.5 Toasts: 2 hardcoded → TOAST constants

## Phase 3 — Auth: MfaSetupStep (9 buttons + icon + errors)

### 3.1 Buttons: 4 primary + 5 outline
### 3.2 Icon button: copy secret → Button variant="icon"
### 3.3 Errors: 2 inline + 1 boxed → InlineError + BoxedError
### 3.4 Toasts: hardcoded → TOAST constants

## Phase 4 — Auth: MfaTotpStep (6 buttons + 2 checkboxes + links)

### 4.1 Buttons: 2 primary + 4 outline
### 4.2 Checkboxes: 2 trust device → `<Checkbox>`
### 4.3 Link buttons: 2 → Button variant="link-underline"
### 4.4 Errors: 3 inline → InlineError

## Phase 5 — Auth: remaining (OAuthButtons, AuthFooter, GoBackSection, VerifyEmailStatus)

### 5.1 OAuthButtons.tsx: 2 outline buttons
### 5.2 AuthFooter.tsx: 3 link buttons → Button variant="link"
### 5.3 GoBackSection.tsx: 1 link button
### 5.4 VerifyEmailStatus.tsx: 1 outline button

## Phase 6 — Auth: MFA digit inputs review

### 6.1 MfaSetupStep + MfaTotpStep: 5 special digit inputs
- Auto-advance between digits, backspace handling
- Decision: create MfaDigitInput component or leave (special behavior)

## Phase 7 — Profile module (13 inline buttons + 25 toasts)

### 7.1 ActiveSessions.tsx: 1 inline → Button
### 7.2 ConnectedAccounts.tsx: 4 inline → Button
### 7.3 DeleteAccount.tsx: 2 inline → Button
### 7.4 MfaSetup.tsx: 1 inline → Button
### 7.5 PasskeyManager.tsx: 2 inline → Button
### 7.6 ProfileForm.tsx: 2 inline → Button
### 7.7 TrustedDevices.tsx: 1 inline → Button
### 7.8 All profile toasts (25) → TOAST constants

## Phase 8 — Settings module (4 inline buttons)

### 8.1 GlobalSettings.tsx: 1 inline → Button
### 8.2 UserPreferences.tsx: 3 inline → Button

## Phase 9 — Admin module (20 inline buttons)

### 9.1 ActionDropdown.tsx: 4 inline → Button
### 9.2 PermissionsMatrix.tsx: 2 inline → Button
### 9.3 LayoutTemplates.tsx: 2 inline → Button (showcase, may keep inline for demo)

## Phase 10 — Layout module (9 inline buttons)

### 10.1 NavBar.tsx: 7 inline icon buttons → Button variant="icon" or keep (icon-only)
### 10.2 Sidebar.tsx: 1 inline → Button
### 10.3 AuthLayout.tsx: 1 inline (theme toggle) → Button variant="icon"

## Phase 11 — App pages (3 inline buttons)

### 11.1 global-error.tsx: 1 → Button
### 11.2 dashboard/page.tsx: 1 → Button
### 11.3 design-system/page.tsx: 1 → keep (accordion trigger)

## Phase 12 — Showcase update

### 12.1 Update ComponentShowcase with new variants (link, link-underline, icon)
### 12.2 Add InlineError to Feedback section
### 12.3 Update Button loading demo to overlay pattern
### 12.4 Update specs with all new exports
### 12.5 Verify all component specs auto-update

## Verification checklist
- [ ] 0 inline `<button>` in auth/profile/settings/admin/layout (except showcase demos + MFA digits)
- [ ] 0 inline `<input type="checkbox">`
- [ ] 0 hardcoded `addToast()` strings
- [ ] 0 inline AlertTriangle error patterns
- [ ] All Button variants match showcase
- [ ] Loading overlay pattern on all submit buttons
- [ ] Link buttons navigate correctly with `as={Link}`
- [ ] TypeScript 0 errors
- [ ] Visual regression check on all pages

## Files changed (estimated)
- **Enhanced**: ui/Button.tsx (loading, as, link variants)
- **New**: ui/InlineError.tsx, lib/toast-messages.ts
- **Auth** (11 files): LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, AuthErrorFallback, MfaSetupStep, MfaTotpStep, OAuthButtons, AuthFooter, GoBackSection, VerifyEmailStatus
- **Profile** (8 files): ActiveSessions, ConnectedAccounts, DeleteAccount, MfaSetup, PasskeyManager, ProfileForm, TrustedDevices, ChangeEmailForm, ChangePasswordForm
- **Settings** (2 files): GlobalSettings, UserPreferences
- **Admin** (3 files): ActionDropdown, PermissionsMatrix, LayoutTemplates
- **Layout** (3 files): NavBar, Sidebar, AuthLayout
- **App** (2 files): global-error, dashboard/page
- **Showcase** (2 files): ComponentShowcase, TokenInspector
- **Total**: ~35 files

## Phase 12 — Showcase update (MFA Components + new variants)

### 12.1 MFA Components section in Molecules (DONE)
- MfaDigitInput: 6-cell auto-advance with paste, light/dark
- Recovery Code Input: monospace with placeholder
- QR Code Card: border + white bg container
- Recovery Codes Grid: 2×5 grid with monospace codes
- Secret Key: copyable code with icon button

### 12.2 Button table update
- Add link, link-underline variants to showcase table
- Update loading demo to overlay pattern (opacity-30 + spinner)

### 12.3 InlineError in Feedback section
- Add InlineError demo with AlertTriangle + text-caption text-error

### 12.4 Catalog update
- Add MFA Components card to catalog
- Update component count

### 12.5 Specs update
- Button: add link, link-underline, as prop to specs
- InlineError: export inlineErrorSpecs
- MfaDigitInput: export mfaDigitInputSpecs

## Acceptance criteria
- Design System showcase is SINGLE SOURCE OF TRUTH
- Changing a variant/color/size in any UI component auto-updates ALL usage sites
- No inline HTML that duplicates component behavior anywhere in the project
- All components export specs constants for TokenInspector auto-update
- Toast messages centralized — change once, propagate everywhere
