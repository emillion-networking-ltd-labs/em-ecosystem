# Frontend Implementation Plan: SCRUM-20 NexaCore Dashboard - OAuth Integration and Callback Handling

> **Retroactive Note**: This plan was written retroactively after implementation and has been enriched to follow the 14-section template used by SCRUM-23 through SCRUM-30. All content reflects the actual implemented code (source of truth). See `changes/records/SCRUM-20_frontend.md` for the implementation record.

## 1. Overview

- **Epic**: SCRUM-17 (EM NexaCore Dashboard Frontend Authentication System)
- **Ticket**: SCRUM-20
- **Type**: Story
- **Scope**: Frontend (nexacore-dashboard)
- **Priority**: HIGH -- Story 3 of 4 in the epic
- **What this delivers**: OAuth integration connecting the NexaCore Dashboard frontend to the backend OAuth flows (Google + GitHub). This converts the scaffolded no-op OAuth buttons (SCRUM-18) into full page redirects to backend OAuth initiation endpoints, creates an OAuth callback page to receive and process tokens returned by the backend after provider authentication, wires up `handleOAuthCallback` (defined in SCRUM-19's AuthContext) for consumption by the callback handler, and surfaces OAuth error states on the login page. The implementation follows Next.js 14 App Router conventions with TailwindCSS and the project's Context + Reducer state management pattern.
- **Branch**: `feature/SCRUM-20-frontend` from `main`
- **Scope boundaries**:
  - **SCRUM-20 delivers**: OAuthCallbackHandler component, `/auth/callback` page, OAuthButtons modification (`<button>` to `<a href>`), consumption of `handleOAuthCallback` in callback handler, LoginForm OAuth error display (`?error=oauth_failed`), `login/page.tsx` Suspense wrapping for `useSearchParams()`
  - **SCRUM-19 delivered**: AuthContext (including `handleOAuthCallback` definition), ApiClient, GuestRoute, Route Handlers (set-tokens, refresh, logout), RingSpinner, LoginForm/RegisterForm wiring
  - **SCRUM-21 adds**: ProtectedRoute, AdminRoute, dashboard/profile/admin pages

---

## 2. Architecture Context

### OAuth Flow (Frontend Perspective)

```
1. User clicks "Continue with Google" or "Continue with GitHub" on /login or /register
   -> <a href="{NEXT_PUBLIC_API_URL}/auth/google">  (full page redirect to backend)

2. Backend (NestJS Passport) initiates OAuth
   -> Redirects browser to Google/GitHub consent screen

3. Provider authenticates user, redirects to backend callback
   -> GET /auth/google/callback?code=...  (backend handles this)

4. Backend Passport strategy validates code, creates/finds user, generates JWT pair
   -> Redirects to frontend: /auth/callback?accessToken=...&refreshToken=...

5. OAuthCallbackHandler (client component) extracts tokens from URL
   -> Stores refreshToken in httpOnly cookie (POST /api/auth/set-tokens)
   -> Sets accessToken in ApiClient memory
   -> Fetches user profile (GET /auth/me)
   -> Dispatches AUTH_SUCCESS -> redirect to /dashboard

6. On failure at any step
   -> Backend ?error= in callback URL -> 2s delay -> redirect to /login?error=oauth_failed
   -> Missing tokens in callback URL -> immediate redirect to /login?error=oauth_failed
   -> handleOAuthCallback catch -> redirect to /login?error=oauth_failed
   -> LoginForm reads ?error=oauth_failed param and shows "Sign in with provider failed. Please try again."
```

### Token Storage (same pattern as email login)

| Token | Storage | Security |
|---|---|---|
| Access Token | In-memory (`apiClient.accessToken`) | Lost on page refresh, restored via silent refresh |
| Refresh Token | httpOnly cookie (Next.js API Route Handler) | Not accessible from JavaScript |

### Component/Page Map

| Component/Page | Type | Role |
|---|---|---|
| `OAuthButtons` | Server component (no `'use client'`) | Static `<a href>` links to backend OAuth initiation endpoints. Rendered by both `LoginForm` and `RegisterForm`. |
| `OAuthCallbackHandler` | Client component (`'use client'`) | Extracts tokens from URL, calls `handleOAuthCallback`, handles errors |
| `auth/callback/page.tsx` | Server component | Suspense boundary wrapping client `OAuthCallbackHandler` |
| `AuthContext` | Client component (SCRUM-19) | Defines `handleOAuthCallback()` -- consumed by SCRUM-20's `OAuthCallbackHandler` |
| `LoginForm` | Client component | Extended with `useSearchParams()` to read `?error=oauth_failed` from URL |
| `login/page.tsx` | Server component | Wraps `LoginForm` in `<Suspense>` (no explicit fallback). GuestRoute wrapper was added by SCRUM-19. |
| `register/page.tsx` | Server component (unmodified) | Already renders `OAuthButtons` via `RegisterForm` -- no changes needed for SCRUM-20 |

### Routing

| Route | Type | Purpose |
|---|---|---|
| `/auth/callback` | New page (SCRUM-20) | Receives OAuth redirect with tokens in URL params |
| `/login?error=oauth_failed` | Existing page (modified) | Displays OAuth failure message |
| `/dashboard` | Existing page | Success redirect target |

### State Management

- **AuthContext + Reducer**: Existing pattern from SCRUM-19. `handleOAuthCallback` is defined in SCRUM-19's AuthContext and consumed by SCRUM-20's OAuthCallbackHandler.
- **Actions used**: `AUTH_START` -> `AUTH_SUCCESS` (on success) or `AUTH_ERROR` (on failure)
- **No new context needed**: OAuth callback integrates into existing `AuthContext`.

---

## 3. Endpoint Specification

Backend endpoints **consumed** by the frontend in this story (not created -- these are backend endpoints from SCRUM-5/SCRUM-8):

| Method | Endpoint | Purpose | Called By |
|---|---|---|---|
| GET | `/auth/google` | Initiates Google OAuth flow (Passport redirect) | `OAuthButtons` (`<a href>`) |
| GET | `/auth/github` | Initiates GitHub OAuth flow (Passport redirect) | `OAuthButtons` (`<a href>`) |
| GET | `/auth/google/callback` | Backend-internal: Google provider redirects here with auth code | Backend only (not called by frontend) |
| GET | `/auth/github/callback` | Backend-internal: GitHub provider redirects here with auth code | Backend only (not called by frontend) |
| GET | `/auth/me` | Returns authenticated user profile (`SafeUser`) | `handleOAuthCallback` in AuthContext |
| POST | `/api/auth/set-tokens` | Next.js internal Route Handler: stores refreshToken in httpOnly cookie | `handleOAuthCallback` in AuthContext |

> **Note**: `/api/auth/set-tokens` is a Next.js API Route Handler (internal to nexacore-dashboard), not a backend NestJS endpoint. It was created by SCRUM-19.

---

## 4. Database Changes

No database changes. Frontend-only story.

---

## 5. Files to Create

| File | Type | Purpose |
|---|---|---|
| `src/components/auth/OAuthCallbackHandler.tsx` | Client component (`'use client'`) | Processes OAuth redirect: extracts tokens from URL, calls `handleOAuthCallback`, handles errors, redirects on success/failure |
| `src/app/auth/callback/page.tsx` | Server component | Suspense boundary wrapping `OAuthCallbackHandler`. Fallback renders centered "Loading..." text with `text-content-primary/50` |

---

## 6. Files to Modify

| File | Changes |
|---|---|
| `src/components/auth/OAuthButtons.tsx` | Changed `<button>` (no-op) to `<a href>` pointing to `{NEXT_PUBLIC_API_URL}/auth/google` and `/auth/github`. Remains a server component (no `'use client'`). |
| `src/context/AuthContext.tsx` | Added `handleOAuthCallback(accessToken, refreshToken)` method to `AuthContextType` interface and `AuthProvider`. **Note**: `handleOAuthCallback` is _defined_ in SCRUM-19's AuthContext delivery but _consumed_ by SCRUM-20's `OAuthCallbackHandler`. |
| `src/components/auth/LoginForm.tsx` | Added `useSearchParams()` to read `?error=oauth_failed` from URL. Added `oauthError` local state. Error displays in System Message slot with `AlertTriangle` icon. Clears on user typing. |
| `src/app/login/page.tsx` | Wrapped `<LoginForm />` in `<Suspense>` (no explicit fallback) to support `useSearchParams()` usage in LoginForm. |

---

## 7. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-20-frontend` from `main`
- **Steps**:
  1. Ensure on latest `main`: `git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-20-frontend`
  3. Verify: `git branch`

---

### Step 1: Modify OAuthButtons -- Full Page Redirect to Backend

- **File**: `src/components/auth/OAuthButtons.tsx`
- **Action**: Replace no-op `<button>` elements with `<a href>` anchor links pointing to backend OAuth initiation endpoints
- **Steps**:
  1. Define `API_BASE_URL` from `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'`
  2. Replace Google `<button>` with `<a href={API_BASE_URL}/auth/google>`
  3. Replace GitHub `<button>` with `<a href={API_BASE_URL}/auth/github>`
  4. Retain existing styling (Secondary/Outline button appearance): `h-10`, `rounded-md`, `border border-border-default`, `bg-transparent`, `px-6 py-2.5`, `text-base font-medium`
  5. Add hover state: `hover:bg-surface-subtle`
  6. Keep icon + text layout: `flex items-center justify-center gap-2`
- **Dependencies**: `GoogleIcon` (custom SVG), `Github` (lucide-react)
- **Implementation Notes**:
  - Full page redirect (`<a href>`) is required because OAuth requires the browser to navigate to the provider's consent screen. This cannot be done via AJAX/fetch.
  - The component remains a **server component** (no `'use client'` directive) since it contains no interactivity -- only static anchor links.
  - `OAuthButtons` is rendered by both `LoginForm` and `RegisterForm`. Changing from `<button>` to `<a href>` affects both pages simultaneously.

> **Naming clarification**: The Jira ticket description references "SocialLoginButtons" but the actual implemented component is named `OAuthButtons`. This plan uses the correct code name.

---

### Step 2: Extend AuthContext with handleOAuthCallback

- **File**: `src/context/AuthContext.tsx`
- **Action**: Add `handleOAuthCallback(accessToken, refreshToken)` method to AuthContext
- **Function Signature**:
  ```typescript
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>
  ```
- **Steps**:
  1. Add `handleOAuthCallback` to `AuthContextType` interface
  2. Implement as `useCallback` inside `AuthProvider`:
     - Dispatch `AUTH_START`
     - POST refreshToken to `/api/auth/set-tokens` (Next.js Route Handler) to store in httpOnly cookie
     - Set accessToken in `apiClient.setAccessToken()`
     - Fetch user profile via `apiClient.get<SafeUser>('/auth/me')`
     - Dispatch `AUTH_SUCCESS` with `{ user, accessToken }`
     - On error: dispatch `AUTH_ERROR` with extracted error message
  3. Expose `handleOAuthCallback` in context value
- **Dependencies**: Existing `apiClient`, `SafeUser` type, `extractErrorMessage` helper
- **Implementation Notes**:
  - Unlike `login()` and `register()`, OAuth tokens come from URL params (backend redirect), not from an API response body. The method receives pre-generated tokens and must fetch the user profile separately.
  - The `/api/auth/set-tokens` Route Handler was already created in SCRUM-19.

---

### Step 3: Create OAuthCallbackHandler Component

- **File**: `src/components/auth/OAuthCallbackHandler.tsx` (NEW)
- **Action**: Create client component that processes the OAuth redirect
- **Component Signature**:
  ```typescript
  'use client';
  export default function OAuthCallbackHandler(): JSX.Element
  ```
- **Steps**:
  1. Mark as `'use client'` (uses hooks: `useSearchParams`, `useRouter`, `useAuth`, `useEffect`, `useRef`, `useState`)
  2. Read `accessToken`, `refreshToken`, and `error` from `useSearchParams()`
  3. Use `useRef(false)` as `processed` guard to prevent double-processing in React 18 Strict Mode
  4. In `useEffect`:
     - If `processed.current` is true, return early
     - Set `processed.current = true`
     - If URL contains `?error=`, set error state to "Authentication failed. Please try again." and redirect to `/login?error=oauth_failed` after 2-second delay via `setTimeout`
     - If `accessToken` or `refreshToken` is missing, redirect immediately to `/login?error=oauth_failed`
     - Otherwise, call `handleOAuthCallback(accessToken, refreshToken)` from AuthContext
     - On `.catch()`, redirect to `/login?error=oauth_failed`
  5. In separate `useEffect`: when `isAuthenticated` becomes true, `router.replace('/dashboard')`
  6. Render loading state: centered `RingSpinner` (size `xl`) with "Completing sign in..." text (`text-content-primary/50`)
  7. Render error state: centered error text in `text-error`
- **Dependencies**: `useAuth` hook, `RingSpinner` component, `next/navigation` (`useRouter`, `useSearchParams`)
- **Implementation Notes**:
  - The `useRef(false)` guard is critical for React 18 Strict Mode, which runs effects twice in development. Without it, the callback would be processed twice, potentially causing token storage race conditions or duplicate API calls.
  - Two separate `useEffect` hooks: one for processing (runs once via ref guard), one for redirect (reacts to `isAuthenticated` state change).

---

### Step 4: Create OAuth Callback Page with Suspense

- **File**: `src/app/auth/callback/page.tsx` (NEW)
- **Action**: Create App Router page that wraps `OAuthCallbackHandler` in `<Suspense>`
- **Steps**:
  1. Import `Suspense` from React and `OAuthCallbackHandler` from components
  2. Export default server component `OAuthCallbackPage`
  3. Wrap `<OAuthCallbackHandler />` in `<Suspense fallback={...}>`
  4. Fallback: `<div>` with `flex min-h-screen items-center justify-center` containing `<p>` with "Loading..." text styled `text-sm text-content-primary/50`
- **Implementation Notes**:
  - `<Suspense>` boundary is required because `useSearchParams()` in `OAuthCallbackHandler` triggers a client-side rendering bailout during Next.js static generation. Without Suspense, the build would fail.
  - The page itself is a **server component**; only the child `OAuthCallbackHandler` is a client component. This is the standard Next.js 14 pattern for wrapping client components that use `useSearchParams()`.

---

### Step 5: Add OAuth Error Display to LoginForm

- **File**: `src/components/auth/LoginForm.tsx`
- **Action**: Read `?error=oauth_failed` from URL search params and display error in the System Message slot
- **Steps**:
  1. Import `useSearchParams` from `next/navigation`
  2. Add `oauthError` local state: `useState<string | null>(null)`
  3. In `useEffect`, read `searchParams.get('error')`:
     - If value is `'oauth_failed'`, set `oauthError` to `'Sign in with provider failed. Please try again.'`
  4. Display `oauthError` in the System Message slot (same position as `emailError`), using the existing `AlertTriangle` icon + `text-error` styling. The active error is computed as `emailError || oauthError`.
  5. Clear `oauthError` when user types (in `handleChange` via `setOauthError(null)`)
- **Dependencies**: `useSearchParams` (from `next/navigation`)
- **Implementation Notes**:
  - `useSearchParams()` in a client component requires the parent page to wrap it in `<Suspense>`. This is handled in Step 6.

---

### Step 6: Wrap LoginForm in Suspense on Login Page

- **File**: `src/app/login/page.tsx`
- **Action**: Wrap `<LoginForm />` in `<Suspense>` to support `useSearchParams()` usage
- **Steps**:
  1. Import `Suspense` from React
  2. Wrap `<LoginForm />` inside `<Suspense>` within the `AuthLayout`, inside the existing `GuestRoute` wrapper
- **Actual structure**:
  ```tsx
  <GuestRoute>
    <AuthLayout>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  </GuestRoute>
  ```
- **Implementation Notes**:
  - This is required by Next.js 14 App Router. Any client component that calls `useSearchParams()` must be wrapped in a `<Suspense>` boundary at the page level, or static generation will bail out entirely.
  - The `<Suspense>` has **no explicit fallback** prop. This means React uses `null` as the fallback -- the component area renders empty while suspending. This is acceptable because the LoginForm resolves almost instantly and there is no visible flash.
  - The `GuestRoute` wrapper was already present on this page from SCRUM-19. SCRUM-20 only adds the `<Suspense>` wrapper.

---

### Step 7: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made
- **Steps**:
  1. **Review Changes**: Analyze all code changes -- new callback page, modified OAuthButtons, extended AuthContext, modified LoginForm
  2. **Identify Documentation Files**:
     - `ai-specs/specs/frontend-standards.mdc` -- verify routing table includes `/auth/callback`
     - `ai-specs/specs/ui-design-system.md` -- no changes needed (OAuthButtons styling unchanged)
  3. **Create Implementation Record**: Write `changes/records/SCRUM-20_frontend.md` documenting:
     - All files created/modified
     - Architecture decisions (anchor links vs buttons, useRef guard, Suspense requirements)
     - OAuth provider configuration details
     - Testing results
  4. **Verify Documentation**: Confirm all changes accurately reflected
- **References**: Follow process in `ai-specs/specs/documentation-standards.mdc`
- **Notes**: All documentation in English

---

## 8. Testing Checklist

### Google OAuth
- [x] Click "Continue with Google" on `/login` redirects to Google consent screen
- [x] Click "Continue with Google" on `/register` redirects to Google consent screen
- [x] After consent, backend callback redirects to `/auth/callback` with tokens in URL
- [x] OAuthCallbackHandler processes tokens, stores refreshToken in httpOnly cookie
- [x] User profile loaded correctly in AuthContext via `GET /auth/me`
- [x] Redirect to `/dashboard` on success

### GitHub OAuth
- [x] Click "Continue with GitHub" on `/login` redirects to GitHub authorization
- [x] Click "Continue with GitHub" on `/register` redirects to GitHub authorization
- [x] After authorization, backend callback redirects to `/auth/callback` with tokens
- [x] OAuthCallbackHandler processes tokens, redirect to `/dashboard`

### Error Handling
- [x] Missing tokens in callback URL redirects immediately to `/login?error=oauth_failed`
- [x] URL `?error=` parameter in callback shows "Authentication failed. Please try again." for 2s, then redirects to `/login?error=oauth_failed`
- [x] `handleOAuthCallback` catch redirects to `/login?error=oauth_failed`
- [x] OAuth error message "Sign in with provider failed. Please try again." displays in LoginForm System Message slot with `AlertTriangle` icon
- [x] Error clears when user types in email field

### Session Persistence
- [x] `refreshToken` from OAuth stored in httpOnly cookie (same as email login)
- [x] Session restoration works after OAuth login (page refresh triggers silent refresh)

### Build
- [x] `next build` succeeds with no errors
- [x] Suspense boundaries resolve `useSearchParams()` static generation bailout

---

## 9. Error Handling

### Complete Error Chain

The OAuth error flow follows a deterministic chain depending on where the failure occurs:

**Path A -- Backend returns `?error=` in callback URL**:
```
Backend error -> redirect to /auth/callback?error=<reason>
  -> OAuthCallbackHandler reads ?error= from searchParams
  -> Sets error state: "Authentication failed. Please try again."
  -> Renders error text in text-error
  -> setTimeout(2000) -> router.replace('/login?error=oauth_failed')
  -> LoginForm reads ?error=oauth_failed from searchParams
  -> Sets oauthError: "Sign in with provider failed. Please try again."
  -> Displays in System Message slot with AlertTriangle icon
  -> User types in email field -> oauthError cleared
```

**Path B -- Missing tokens in callback URL**:
```
Backend redirect with missing accessToken or refreshToken
  -> OAuthCallbackHandler detects !accessToken || !refreshToken
  -> Immediate router.replace('/login?error=oauth_failed')
  -> LoginForm displays "Sign in with provider failed. Please try again."
```

**Path C -- handleOAuthCallback API failure**:
```
Tokens present but API call fails (set-tokens or /auth/me)
  -> handleOAuthCallback throws
  -> OAuthCallbackHandler .catch() -> router.replace('/login?error=oauth_failed')
  -> LoginForm displays "Sign in with provider failed. Please try again."
```

**Path D -- React 18 Strict Mode double-effect**:
```
React 18 development mode runs useEffect twice
  -> First run: processed.current = false -> sets to true -> processes callback
  -> Second run: processed.current = true -> returns early (no-op)
  -> Prevents duplicate API calls and token storage race conditions
```

### Error Scenarios Table

| Scenario | Handling |
|---|---|
| Missing tokens in callback URL | Immediate redirect to `/login?error=oauth_failed` |
| Backend returns `?error=` in callback URL | Show "Authentication failed..." for 2s, then redirect to `/login?error=oauth_failed` |
| `handleOAuthCallback` API call fails | Catch block redirects to `/login?error=oauth_failed` |
| OAuth error displayed on `/login` | `useSearchParams()` reads `?error=oauth_failed`, sets local `oauthError` state |
| User types after seeing OAuth error | `handleChange` clears `oauthError` (and `emailError`) via `setOauthError(null)` |
| Account conflict (OAuth email matches password account) | Backend handles via SCRUM-8; frontend displays backend error message |
| React 18 Strict Mode double-effect | `useRef(false)` guard prevents double-processing |

---

## 10. Non-Functional Requirements

### Performance
- **Callback page processing time**: < 1 second from page load to `/dashboard` redirect under normal conditions. The callback page is a transient page -- users see `RingSpinner` + "Completing sign in..." briefly before redirect.
- **Error redirect delay**: 2-second deliberate delay on backend error path (Path A) to allow user to read the error message before redirect.

### Security
- **Tokens in URL are one-time-use**: Once `OAuthCallbackHandler` processes the tokens from URL params, they are consumed (stored in httpOnly cookie / in-memory). The URL params are not re-read due to the `useRef(false)` guard.
- **No tokens stored in localStorage**: Consistent with the email login pattern. Access token is in-memory only; refresh token is httpOnly cookie only.
- **OAuth credentials frontend-isolated**: The frontend only knows `NEXT_PUBLIC_API_URL` to construct OAuth initiation URLs. Google/GitHub Client IDs and Secrets are stored exclusively in the backend `.env` file.
- **`router.replace()`**: Used instead of `router.push()` for all redirects to avoid leaving `/auth/callback?accessToken=...` in browser history.

### Accessibility
- **OAuth buttons use `<a href>`**: Semantically correct for navigation. Accessible by default (keyboard focusable, screen reader announces as link).
- **Error messages**: Displayed with `AlertTriangle` icon + `text-error` color. Icon provides visual redundancy beyond color alone.
- **Loading state**: "Completing sign in..." text accompanies spinner for screen reader context.

---

## 11. Dependencies

### npm Packages
No new npm packages introduced. All functionality built with existing packages:

| Package | Usage |
|---|---|
| `next` 14 | App Router, `useSearchParams`, `useRouter`, `Suspense` |
| `react` 18 | `Suspense`, `useRef`, `useEffect`, `useState`, `useCallback` |
| `lucide-react` | `Github` icon, `AlertTriangle` icon |

### Internal Components (existing)
| Component | Created By | Used In |
|---|---|---|
| `GoogleIcon` | SCRUM-18 | `OAuthButtons` |
| `RingSpinner` | SCRUM-19 | `OAuthCallbackHandler` |
| `apiClient` | SCRUM-19 | `AuthContext.handleOAuthCallback` |
| `GuestRoute` | SCRUM-19 | `login/page.tsx` (already present, not added by SCRUM-20) |

### Upstream Story Dependencies
| Dependency | Status | What It Provides |
|---|---|---|
| SCRUM-18 | Completed | OAuthButtons scaffold, login/register page layouts, auth card UI |
| SCRUM-19 | Completed | AuthContext (with `handleOAuthCallback` definition), ApiClient, LoginForm, RegisterForm, `/api/auth/set-tokens` Route Handler, GuestRoute, RingSpinner |
| SCRUM-5 to SCRUM-9 (backend) | Completed | OAuth endpoints (`GET /auth/google`, `GET /auth/github`, callbacks), JWT generation, user creation |

### Downstream
| Dependency | What It Needs |
|---|---|
| SCRUM-21 | Full auth flow (including OAuth) working. Protected routes, profile, admin dashboard. |

---

## 12. Documentation Updates

| File | Update |
|---|---|
| `ai-specs/specs/frontend-standards.mdc` | Verify routing table includes `/auth/callback` |
| `ai-specs/specs/ui-design-system.md` | No changes needed (OAuthButtons styling unchanged from SCRUM-18) |
| `changes/records/SCRUM-20_frontend.md` | Implementation record with full details |
| `changes/plans/SCRUM-20_frontend.md` | This document (retroactive) |

---

## 13. Definition of Done

### Code Quality
- [x] TypeScript strict -- no `any`, all props typed
- [x] `'use client'` only on interactive components (`OAuthCallbackHandler`, `LoginForm`)
- [x] `OAuthButtons` remains a server component (static anchor links, no `'use client'` directive)
- [x] No unused imports
- [x] Inline Tailwind classes follow design system tokens

### Functionality
- [x] Google OAuth end-to-end flow works (login -> consent -> callback -> dashboard)
- [x] GitHub OAuth end-to-end flow works (login -> authorization -> callback -> dashboard)
- [x] OAuth flows work from both `/login` and `/register` pages (both render `OAuthButtons`)
- [x] OAuth error states display correctly on login page
- [x] Token storage follows same pattern as email login (httpOnly cookie + in-memory)
- [x] Session restoration works after OAuth login (silent refresh on page reload)

### Integration
- [x] AuthContext extended cleanly -- no breaking changes to existing `login`/`register` methods
- [x] OAuthCallbackHandler uses existing `handleOAuthCallback` from AuthContext
- [x] LoginForm OAuth error display integrates with existing System Message slot
- [x] Suspense boundaries correctly placed for `useSearchParams()` usage (both `/auth/callback` and `/login`)
- [x] `useRef(false)` guard prevents React 18 Strict Mode double-processing

### Documentation
- [x] `changes/records/SCRUM-20_frontend.md` -- implementation record with full details
- [x] `changes/plans/SCRUM-20_frontend.md` -- this document (retroactive, enriched to 14-section template)
