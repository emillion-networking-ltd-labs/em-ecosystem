# Frontend Implementation Plan: SCRUM-19 NexaCore Dashboard - Auth Pages, ApiClient and AuthContext

> **Retroactive Note**: This plan was written retroactively after implementation and has been enriched to follow the 14-section template used by SCRUM-23 through SCRUM-30. All content reflects the actual implemented code (source of truth). See `changes/records/SCRUM-19_frontend.md` for the implementation record.

## 1. Overview

- **Epic**: SCRUM-17 (EM NexaCore Dashboard Frontend Authentication System)
- **Ticket**: SCRUM-19
- **Type**: Story
- **Scope**: Frontend (nexacore-dashboard)
- **Priority**: HIGH -- Story 2 of 4 in the epic
- **What this delivers**: The authentication integration layer connecting SCRUM-18's scaffolded UI to the backend API (SCRUM-5 through SCRUM-9). This includes AuthContext state management with `useReducer`, the ApiClient HTTP service with CRUD convenience methods and silent token refresh, client-side form validation, error message extraction from backend responses, Next.js API Route Handlers for secure token management (httpOnly cookies), the ForgotPasswordForm component, GuestRoute guard, and InfinitySpinner/RingSpinner loading components.
- **Branch**: `feature/SCRUM-19-frontend` from `main`
- **Scope boundaries**:
  - **SCRUM-19 delivers**: AuthContext, useAuth, ApiClient integration, Route Handlers (set-tokens, refresh, logout), GuestRoute, InfinitySpinner, RingSpinner, form wiring (LoginForm, RegisterForm, ForgotPasswordForm), Input enhancements, CSS additions, LanguageSelector color fix
  - **SCRUM-20 adds**: OAuthCallbackHandler component, `/auth/callback` page, consumption of `handleOAuthCallback` (which is defined in SCRUM-19's AuthContext but consumed by SCRUM-20)
  - **SCRUM-21 adds**: ProtectedRoute, AdminRoute, dashboard/profile/admin pages, recharts, additional types (`PaginatedResponse`, `UpdateProfileDto`, `ChangePasswordDto`, `AdminUpdateUserDto`)

---

## 2. Architecture Context

### Application

- **Package**: `@em-ecosystem/nexacore-dashboard`
- **Framework**: Next.js 14 App Router (`'use client'` only where interactivity required)
- **Styling**: TailwindCSS v3 with CSS custom properties (light/dark theme via `class` strategy)

### Auth Flow

```
User fills form
  -> LoginForm / RegisterForm (client-side email validation)
  -> AuthContext.login() / register()
    -> ApiClient.post('/auth/login' | '/auth/register')
      -> Backend validates (class-validator DTOs)
      -> Returns { accessToken, refreshToken, user }
    -> POST /api/auth/set-tokens (Next.js API route, stores refreshToken in httpOnly cookie)
    -> apiClient.setAccessToken(accessToken) (in-memory)
    -> dispatch AUTH_SUCCESS -> isAuthenticated = true -> redirect /dashboard
```

### Token Storage Strategy

| Token | Storage | Security |
|---|---|---|
| Access Token | In-memory (`apiClient.accessToken`) | Not persisted, lost on page refresh |
| Refresh Token | httpOnly cookie via Next.js API route | Not accessible from JS, secure |

### Cookie Configuration (actual values)

| Property | Value |
|---|---|
| Cookie name | `refresh_token` (underscore) |
| `httpOnly` | `true` |
| `secure` | `process.env.NODE_ENV === 'production'` |
| `sameSite` | `'strict'` |
| `maxAge` | `60 * 60 * 24 * 30` (30 days) |
| `path` | `'/'` |

### State Management: AuthContext + useReducer

```typescript
type AuthState = {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;   // tracks whether initial refresh attempt completed
  error: string | null;
};
```

**Reducer Actions**:

| Action | Trigger | Effect |
|---|---|---|
| `AUTH_START` | Before API call | `isLoading: true, error: null` |
| `AUTH_SUCCESS` | Successful auth | Stores user + token, sets `isInitialized: true`, clears loading |
| `AUTH_ERROR` | Failed auth | Sets error message, sets `isInitialized: true`, clears loading |
| `LOGOUT` | User logout or failed refresh | Clears all state, sets `isInitialized: true` |
| `CLEAR_ERROR` | User types / navigates | Clears error only |

**Public API**:

```typescript
type AuthContextType = AuthState & {
  isAuthenticated: boolean;          // computed: !!user && !!accessToken
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
};
```

> **Note on `handleOAuthCallback`**: This method is _defined_ in SCRUM-19's AuthContext (stores tokens, fetches user via `GET /auth/me`, dispatches AUTH_SUCCESS) but is _consumed_ by SCRUM-20's OAuthCallbackHandler component.

### Component Tree (Auth Integration Layer)

```
AuthProvider (context/AuthContext.tsx)                  -- NEW
+-- [wraps entire app via providers.tsx]
    +-- GuestRoute (components/guards/GuestRoute.tsx)   -- NEW
    |   +-- LoginForm (components/auth/LoginForm.tsx)   -- MODIFIED
    |   |   +-- EmailStep: client-side email validation, error display
    |   |   +-- PasswordStep: AuthContext.login(), InfinitySpinner, error display
    |   +-- RegisterForm (components/auth/RegisterForm.tsx) -- MODIFIED
    |   |   +-- AuthContext.register(), email validation, password strength icons
    |   +-- ForgotPasswordForm (components/auth/ForgotPasswordForm.tsx) -- NEW
    |       +-- apiClient.post('/auth/forgot-password'), success state, error display
```

### Pages

| Route | File | Description |
|---|---|---|
| `/login` | `src/app/login/page.tsx` | Auth login page (two-step) -- MODIFIED (added Suspense + GuestRoute) |
| `/register` | `src/app/register/page.tsx` | Auth register page -- MODIFIED (added GuestRoute) |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Password recovery page -- NEW |

---

## 3. Endpoint Specification

SCRUM-19 does not create any backend endpoints. It **consumes** the following existing backend endpoints:

| Method | URL | Request Body | Response Body | Purpose |
|---|---|---|---|---|
| `POST` | `/auth/login` | `{ "email": string, "password": string }` | `{ "user": SafeUser, "accessToken": string, "refreshToken": string }` | User login |
| `POST` | `/auth/register` | `{ "email": string, "password": string }` | `{ "user": SafeUser, "accessToken": string, "refreshToken": string }` | User registration (email + password only, no name, no confirm-password) |
| `POST` | `/auth/refresh` | `{ "refreshToken": string }` | `{ "accessToken": string, "refreshToken"?: string }` | Token refresh (supports rotation) |
| `POST` | `/auth/logout` | -- | `{ "success": true }` | Logout (server-side) |
| `GET` | `/auth/me` | -- (Bearer token) | `SafeUser` | Fetch current user profile |
| `POST` | `/auth/forgot-password` | `{ "email": string }` | `{ "message": string }` | Initiate password reset |

**Next.js API Route Handlers** (BFF layer, created by SCRUM-19):

| Method | URL | Purpose |
|---|---|---|
| `POST` | `/api/auth/set-tokens` | Receives `{ refreshToken }`, stores in httpOnly cookie |
| `POST` | `/api/auth/refresh` | Reads cookie, calls backend `/auth/refresh`, returns `{ accessToken }` |
| `POST` | `/api/auth/logout` | Deletes the `refresh_token` cookie |

---

## 4. Database Changes

No database changes. Frontend-only story.

---

## 5. Files to Create

| # | File | Purpose | Key Details |
|---|---|---|---|
| 1 | `src/context/AuthContext.tsx` | Auth state management (reducer pattern), AuthProvider component, useAuth hook | `useReducer` with 5 actions; exports `AuthProvider` and `useAuth`; includes `extractErrorMessage` helper and `handleOAuthCallback` (for SCRUM-20 consumption) |
| 2 | `src/hooks/useAuth.ts` | Re-export hook for cleaner import paths | `export { useAuth } from '@/context/AuthContext'` -- mirrors `useTheme.ts` pattern from SCRUM-18 |
| 3 | `src/app/api/auth/set-tokens/route.ts` | Stores refreshToken in httpOnly cookie | Cookie name: `refresh_token`, sameSite: `strict`, maxAge: 30 days |
| 4 | `src/app/api/auth/refresh/route.ts` | Refreshes access token using cookie | Reads `refresh_token` cookie, calls backend `POST /auth/refresh`, supports token rotation |
| 5 | `src/app/api/auth/logout/route.ts` | Clears auth cookie | Deletes `refresh_token` cookie, returns `{ success: true }` |
| 6 | `src/components/guards/GuestRoute.tsx` | Redirect authenticated users away from auth pages | Uses `isInitialized` + `isAuthenticated` from `useAuth`; shows `RingSpinner` during session check; redirects to `/dashboard` if authenticated |
| 7 | `src/components/ui/InfinitySpinner.tsx` | DaisyUI-style infinity loading animation (SVG + CSS keyframes) | Sizes: xs=16, sm=20, md=24, lg=28, xl=32; `vectorEffect="non-scaling-stroke"` for consistent 2px stroke |
| 8 | `src/components/ui/RingSpinner.tsx` | DaisyUI-style ring/ripple loading animation (SVG + SMIL) | Two staggered circles with `<animate>` elements; no CSS keyframes needed; same size scale as InfinitySpinner |
| 9 | `src/app/forgot-password/page.tsx` | Forgot password page wrapper | Server component; metadata: `'Password Recovery -- EM NexaCore'`; wraps `ForgotPasswordForm` in `AuthLayout` |
| 10 | `src/components/auth/ForgotPasswordForm.tsx` | Forgot password form -- fully functional | Calls `apiClient.post('/auth/forgot-password', { email })`; success state replaces form with confirmation message; uses `apiClient` directly (not AuthContext) because forgot-password is not part of the auth state lifecycle |

---

## 6. Files to Modify

| # | File | Changes |
|---|---|---|
| 1 | `src/components/auth/LoginForm.tsx` | Wire to AuthContext: replace `console.log` with `login()` call; add client-side email validation (`isValidEmail` regex, TLD >= 2); add `emailError` and `oauthError` local state; read `?error=oauth_failed` from URL params; replace "Signing in..." with InfinitySpinner; change `disabled:opacity-60` to `disabled:pointer-events-none`; change "Forgot password?" from `<button>` to `<Link href="/forgot-password">`; import `useSearchParams` (requires `<Suspense>` wrapper in page) |
| 2 | `src/components/auth/RegisterForm.tsx` | Wire to AuthContext: replace `console.log` with `register()` call; add email validation; add PASSWORD_REQUIREMENTS array (5 criteria with lucide icons); add Password Check UI (5 icon boxes 24x24 with green check badges 14x14); change `h-[204px]` to `min-h-[204px]`; add InfinitySpinner; `activeError = emailError \|\| error` for unified display |
| 3 | `src/components/auth/ForgotPasswordForm.tsx` | (Created as new file -- see Files to Create) |
| 4 | `src/components/ui/Input.tsx` | Add `hasError?: boolean` prop (default `false`); error state: `isErrorState = !!(error \|\| hasError)`; add `cursor-text` class when not disabled; add `onClick={() => inputRef.current?.focus()}` on container; add `useRef<HTMLInputElement>` for click-to-focus |
| 5 | `src/app/providers.tsx` | Import `AuthProvider` from `@/context/AuthContext`; nest inside `<ThemeProvider>`: `<ThemeProvider><AuthProvider>{children}</AuthProvider></ThemeProvider>` |
| 6 | `src/app/login/page.tsx` | Wrap `LoginForm` in `<Suspense>` (required by `useSearchParams`); wrap page content in `<GuestRoute>` |
| 7 | `src/app/register/page.tsx` | Wrap page content in `<GuestRoute>` |
| 8 | `src/app/globals.css` | Add `input:-webkit-autofill` override (box-shadow inset trick for theme background matching); add `@keyframes infinity-spin` (dashoffset 0 -> 256.589); add `.infinity-spinner` class applying the animation |
| 9 | `src/components/ui/LanguageSelector.tsx` | Fix dropdown item colors: `surface-subtle` -> `surface-tertiary` for selected/hover background (to match Figma spec) |
| 10 | `src/lib/api.ts` | Add `getAccessToken()`, `clearAccessToken()`, `get<T>()`, `post<T>()`, `put<T>()`, `patch<T>()`, `delete<T>()` convenience methods; add `silentRefresh()` private method with deduplication via `refreshPromise`; add `parseErrorResponse()` private method; add network error handling throwing structured `{ error: { message, code, statusCode } }` objects |
| 11 | `src/lib/types.ts` | Add SCRUM-19 types: `UserRole`, `SafeUser`, `AuthResponse`, `ErrorResponse` (note: `PaginatedResponse`, `UpdateProfileDto`, `ChangePasswordDto`, `AdminUpdateUserDto` were added by SCRUM-21, not SCRUM-19) |

---

## 7. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch for frontend auth integration
- **Branch Naming**: `feature/SCRUM-19-frontend`
- **Implementation Steps**:
  1. Ensure on the latest `main` branch
  2. Pull latest changes: `git pull origin main`
  3. Create new branch: `git checkout -b feature/SCRUM-19-frontend`
  4. Verify branch creation: `git branch`
- **Notes**: Must be the first step before any code changes. Refer to `ai-specs/specs/frontend-standards.mdc` section "Development Workflow" for branch naming conventions.

### Step 1: TypeScript Type Definitions

- **File**: `src/lib/types.ts`
- **Action**: Define shared TypeScript interfaces for auth data structures
- **SCRUM-19 type definitions only**:
  ```typescript
  export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'USER';

  export type SafeUser = {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    role: UserRole;
    provider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
    providerId: string | null;
    emailVerified: boolean;
    isActive: boolean;
    failedAttempts: number;
    lockedUntil: string | null;
    createdAt: string;
    updatedAt: string;
  };

  export type AuthResponse = {
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
  };

  export type ErrorResponse = {
    success: false;
    error: { message: string; code: string; statusCode: number };
  };
  ```
- **Implementation Notes**: `SafeUser` fields must match the backend's safe user projection exactly. The `provider` field uses a union type for `LOCAL | GOOGLE | GITHUB` to support OAuth providers in SCRUM-20. Types added later by SCRUM-21 (`PaginatedResponse`, `UpdateProfileDto`, `ChangePasswordDto`, `AdminUpdateUserDto`) are out of scope for this story.
- **Dependencies**: None

### Step 2: ApiClient CRUD Methods

- **File**: `src/lib/api.ts`
- **Action**: Add convenience CRUD methods, `getAccessToken()`, and `clearAccessToken()` to the existing `ApiClient` class
- **Function Signatures**:
  ```typescript
  getAccessToken(): string | null
  clearAccessToken(): void
  get<T>(endpoint: string, options?: RequestInit): Promise<T>
  post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T>
  put<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T>
  patch<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T>
  delete<T>(endpoint: string, options?: RequestInit): Promise<T>
  ```
- **Implementation Steps**:
  1. Add `getAccessToken()` method that returns `this.accessToken`
  2. Add `clearAccessToken()` method that sets `this.accessToken = null`
  3. Add `get<T>()` delegating to `request<T>()` with `method: 'GET'`
  4. Add `post<T>()` delegating to `request<T>()` with `method: 'POST'` and `JSON.stringify(body)`
  5. Add `put<T>()`, `patch<T>()`, `delete<T>()` following the same pattern
  6. Add `silentRefresh()` private method with deduplication via `refreshPromise`
  7. Add network error handling in `request<T>()` that throws structured error objects
  8. Add `parseErrorResponse()` private method for non-ok response error extraction
- **Dependencies**: Existing `ApiClient` class from SCRUM-18 scaffold
- **Implementation Notes**:
  - The `request<T>()` method handles: Authorization header injection, 401 silent refresh + retry, error parsing
  - `silentRefresh()` calls `POST /api/auth/refresh` (Next.js Route Handler) to avoid exposing the refresh token to client-side JS
  - Deduplication via `this.refreshPromise` prevents concurrent refresh requests when multiple 401s arrive simultaneously
  - Network errors throw structured `{ error: { message, code, statusCode } }` objects for consistent error handling

### Step 3: Next.js API Route Handlers (Token Management)

- **Files**: `src/app/api/auth/set-tokens/route.ts`, `src/app/api/auth/refresh/route.ts`, `src/app/api/auth/logout/route.ts`
- **Action**: Create server-side API Route Handlers that manage the refresh token in an httpOnly cookie

#### 3a: POST /api/auth/set-tokens
- **Implementation Steps**:
  1. Parse `{ refreshToken }` from request body
  2. Set `refresh_token` httpOnly cookie with options: `secure` in production, `sameSite: 'strict'`, `maxAge: 30 days`, `path: '/'`
  3. Return `{ success: true }`
- **Cookie Configuration** (actual values from code):
  ```typescript
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  ```

#### 3b: POST /api/auth/refresh
- **Implementation Steps**:
  1. Read `refresh_token` from request cookies
  2. If missing, return 401 with `{ error: 'No refresh token' }`
  3. Call backend `POST /auth/refresh` with the refresh token
  4. If backend returns error, delete the cookie and return 401
  5. If backend returns new refresh token (rotation), update the cookie with same settings
  6. Return `{ accessToken }` to the client
- **Implementation Notes**: Supports refresh token rotation -- if the backend issues a new refresh token alongside the access token, it is stored in the cookie with the same configuration (httpOnly, strict, 30 days).

#### 3c: POST /api/auth/logout
- **Implementation Steps**:
  1. Delete the `refresh_token` cookie
  2. Return `{ success: true }`

- **Security Rationale**: Refresh tokens in httpOnly cookies are not accessible via JavaScript, preventing XSS token theft. Access tokens are kept in-memory only -- never persisted to localStorage or sessionStorage.

### Step 4: AuthContext and AuthProvider

- **File**: `src/context/AuthContext.tsx`
- **Action**: Create React context with `useReducer` for global auth state management
- **Implementation Steps**:
  1. Define `AuthState` type (including `isInitialized`) and `AuthAction` discriminated union
  2. Implement `authReducer` switch-case for all 5 action types
  3. Create `extractErrorMessage(err, fallback)` helper that checks `error.details[0]` first, then `error.message`, then fallback
  4. Create `AuthProvider` component with `useReducer`
  5. Implement `refreshSession()`: calls `/api/auth/refresh`, then `GET /auth/me` for user data
  6. Implement `login(email, password)`: calls `POST /auth/login`, stores refresh token via `/api/auth/set-tokens`, sets access token in memory, dispatches AUTH_SUCCESS
  7. Implement `register(email, password)`: same flow as login but calls `POST /auth/register`
  8. Implement `handleOAuthCallback(accessToken, refreshToken)`: stores tokens via set-tokens route, sets access token in memory, fetches user via `GET /auth/me`, dispatches AUTH_SUCCESS -- prepared for SCRUM-20 consumption
  9. Implement `logout()`: calls `/api/auth/logout`, clears access token via `apiClient.clearAccessToken()`, dispatches LOGOUT (uses try/finally to ensure cleanup)
  10. Implement `clearError()`: dispatches CLEAR_ERROR
  11. Add `useEffect` on mount to call `refreshSession()` for silent session restoration
  12. Export `AuthProvider` component and `useAuth()` hook
- **Dependencies**: `apiClient` from `src/lib/api.ts`, `SafeUser` and `AuthResponse` from `src/lib/types.ts`
- **Implementation Notes**:
  - `isAuthenticated` is a computed value: `!!state.user && !!state.accessToken`
  - `isInitialized` tracks whether the initial refresh attempt has completed (prevents flash of login page on mount)
  - `extractErrorMessage` checks `error.details[0]` first because the backend `HttpExceptionFilter` puts validation messages in `error.details[]` and uses generic `"Validation failed"` as `error.message`
  - All methods wrapped in `useCallback` for stable references
  - `handleOAuthCallback` is included proactively for SCRUM-20 (OAuth integration) -- it is defined here but consumed by the OAuthCallbackHandler component in SCRUM-20

### Step 5: useAuth Hook Re-export

- **File**: `src/hooks/useAuth.ts`
- **Action**: Re-export the `useAuth` hook from AuthContext for cleaner import paths
- **Implementation**: `export { useAuth } from '@/context/AuthContext';`
- **Notes**: Follows the same pattern as `useTheme.ts` from SCRUM-18

### Step 6: Wire AuthProvider into Providers

- **File**: `src/app/providers.tsx`
- **Action**: Wrap children with `<AuthProvider>` inside the existing `<ThemeProvider>`
- **Implementation Steps**:
  1. Import `AuthProvider` from `@/context/AuthContext`
  2. Nest `<AuthProvider>` inside `<ThemeProvider>` (auth depends on theme being available)
- **Result**:
  ```tsx
  <ThemeProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
  ```

### Step 7: GuestRoute Guard Component

- **File**: `src/components/guards/GuestRoute.tsx`
- **Action**: Create a route guard that redirects authenticated users away from auth pages
- **Implementation Steps**:
  1. Import `useAuth` hook and `useRouter`
  2. Read `isAuthenticated` and `isInitialized` from auth context
  3. While `!isInitialized`: render full-screen `RingSpinner` (centered, `bg-surface-secondary`)
  4. If `isAuthenticated` after initialization: redirect to `/dashboard` via `router.replace()`, return `null`
  5. Otherwise: render `{children}`
- **Dependencies**: `useAuth`, `RingSpinner`, `next/navigation`
- **Implementation Notes**: Uses `RingSpinner` (not InfinitySpinner) for page-level loading because the ripple effect is more appropriate for full-screen loading states. The `isInitialized` check prevents rendering the login form before the silent refresh attempt completes.

### Step 8: InfinitySpinner Component

- **File**: `src/components/ui/InfinitySpinner.tsx`
- **Action**: Create DaisyUI-compatible infinity loading animation
- **Implementation Steps**:
  1. Extract DaisyUI v5 infinity spinner SVG path and animation values
  2. Define size scale matching DaisyUI: xs=16, sm=20, md=24, lg=28, xl=32
  3. Implement as inline SVG with `viewBox="0 0 100 100"`, figure-8 lemniscate path
  4. Use `strokeDasharray="205.271 51.318"` with `dashoffset` animation (0 -> 256.589)
  5. Apply `vectorEffect="non-scaling-stroke"` for consistent 2px stroke at all sizes
  6. Apply `scale(0.8)` transform matching DaisyUI's built-in padding
  7. Reference CSS `@keyframes infinity-spin` defined in globals.css via `.infinity-spinner` class
- **Dependencies**: None (pure SVG component)

### Step 9: RingSpinner Component

- **File**: `src/components/ui/RingSpinner.tsx`
- **Action**: Create DaisyUI-compatible ring/ripple loading animation
- **Implementation Steps**:
  1. Extract DaisyUI v5 ring spinner SVG values
  2. Use same size scale as InfinitySpinner: xs=16, sm=20, md=24, lg=28, xl=32
  3. Implement as inline SVG with `viewBox="0 0 44 44"`, two concentric circles
  4. Use SMIL `<animate>` elements for radius (1->20) and stroke-opacity (1->0)
  5. Stagger Circle 2 by `-0.9s` (half of 1.8s duration) for continuous ripple
  6. Use `stroke="currentColor"` to inherit text color from parent
- **Dependencies**: None (pure SVG component with SMIL animation, no CSS keyframes needed)
- **Implementation Notes**: Used by `GuestRoute` for page-level loading state. Separate from InfinitySpinner because the ripple effect is more appropriate for full-page loading contexts.

### Step 10: Input Component Enhancements

- **File**: `src/components/ui/Input.tsx`
- **Action**: Add `hasError` prop for external error state control
- **Implementation Steps**:
  1. Add `hasError?: boolean` to `InputProps` interface (default `false`)
  2. Update error state logic: `isErrorState = !!(error || hasError)`
  3. Error outline, label color, and eye icon color all react to `isErrorState`
  4. Add `cursor-text` to container when not disabled
  5. Add `onClick={() => inputRef.current?.focus()}` to container for click-to-focus
  6. Add `useRef<HTMLInputElement>` for click-to-focus implementation
- **Implementation Notes**: The `hasError` prop allows parent forms to show error outline without providing error text (text shown separately in the System Message slot, not inside Input). This is needed because auth forms display errors via AlertTriangle icon + span in a shared System Message area, not via Input's built-in error display.

### Step 11: CSS Additions

- **File**: `src/app/globals.css`
- **Action**: Add autofill override and infinity spinner keyframes
- **Implementation Steps**:
  1. Add `input:-webkit-autofill` rule (including `:hover` and `:focus` variants) with `box-shadow inset` trick to match theme background
  2. Add `@keyframes infinity-spin` for the InfinitySpinner animation (dashoffset 0 -> 256.589)
  3. Add `.infinity-spinner` class applying the keyframes with `2s linear infinite`
- **CSS Details**:
  ```css
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px var(--surface-primary) inset;
    -webkit-text-fill-color: rgb(var(--content-primary));
    caret-color: rgb(var(--content-primary));
  }

  @keyframes infinity-spin {
    0%   { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: 256.589; }
  }

  .infinity-spinner {
    animation: infinity-spin 2s linear infinite;
  }
  ```
- **Rationale**: Browser autofill applies its own background only to the `<input>` element, causing a narrower colored area than the container. The `box-shadow inset` trick fills the entire input with the theme background.

### Step 12: LoginForm Integration

- **File**: `src/components/auth/LoginForm.tsx`
- **Action**: Replace console.log placeholders with real AuthContext integration
- **Implementation Steps**:
  1. Import `useAuth` hook, `useRouter`, `useSearchParams`, `InfinitySpinner`
  2. Add `isValidEmail()` regex helper (TLD min 2 chars: `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`)
  3. Add `emailError` local state for client-side email validation
  4. Add `oauthError` local state for OAuth redirect error display (reads `?error=oauth_failed` from URL)
  5. **Email step**: Validate email before proceeding to password step
     - Empty -> `"Enter your email address"` (emailError)
     - Invalid format -> `"Enter a valid email address"` (emailError)
  6. **Password step**: Call `login(email, password)` via AuthContext
  7. Add `useEffect` to redirect to `/dashboard` when `isAuthenticated` becomes true
  8. Add `useEffect` to clear errors on mount and read OAuth error from URL params
  9. Call `clearError()` on input change, step change, and mount
  10. Replace "Signing in..." text with `InfinitySpinner` during loading
  11. Use `disabled:pointer-events-none` instead of `disabled:opacity-60` (spinner provides visual feedback)
  12. Change "Forgot password?" from `<button>` to `<Link href="/forgot-password">`
  13. Display errors using inline pattern: `AlertTriangle` icon (16px, `text-error`) + `<span>` (text-xs, text-error) -- NOT an ErrorAlert component
  14. `emailError` and `oauthError` take priority over AuthContext `error` in the display slot
- **Dependencies**: `useAuth`, `InfinitySpinner`, `next/navigation`, `lucide-react`

### Step 13: RegisterForm Integration

- **File**: `src/components/auth/RegisterForm.tsx`
- **Action**: Replace console.log placeholders with real AuthContext integration and add password strength indicators
- **Implementation Steps**:
  1. Import `useAuth` hook, `useRouter`, `InfinitySpinner`, password requirement icons from lucide-react
  2. Define `PASSWORD_REQUIREMENTS` array with 5 criteria: length >= 8, digit, special char, uppercase, lowercase
  3. Each requirement has: `key`, `Icon` (lucide component), `test` function
  4. Add `emailError` local state for client-side email validation (same regex as LoginForm)
  5. Replace `handleRegister` to call `register(email, password)` via AuthContext
  6. Register only takes email + password (no name field, no confirm-password field)
  7. Add `useEffect` to redirect to `/dashboard` when `isAuthenticated` becomes true
  8. Add `useEffect` to clear errors on mount
  9. Implement System Message slot logic: `activeError = emailError || error`
     - Error showing -> display `AlertTriangle` icon + `<span>` error text (inline pattern, NOT ErrorAlert component)
     - No error + password has content -> display Password Check icons
     - No error + no password -> empty slot (h-6 reserved height)
  10. Password Check UI: 5 icon boxes (24x24, rounded-lg, border), each with green check badge (14x14, bottom-right) when met
  11. InfinitySpinner on submit button during loading
  12. Change form fields container from `h-[204px]` to `min-h-[204px]` to allow expansion for long error messages
  13. Call `clearError()` on input change and mount
- **Dependencies**: `useAuth`, `InfinitySpinner`, `lucide-react` (RulerDimensionLine, Hash, Asterisk, CaseUpper, CaseLower, Check, AlertTriangle)

### Step 14: ForgotPasswordForm

- **File**: `src/components/auth/ForgotPasswordForm.tsx`
- **Action**: Create fully functional forgot password form component
- **Implementation Steps**:
  1. Create component with local state: `email`, `isLoading`, `error`, `emailSent`
  2. On submit: call `apiClient.post('/auth/forgot-password', { email })`
  3. On success: set `emailSent = true`, show success message with submitted email address
  4. On error: extract error message and display using inline pattern (`AlertTriangle` icon + `<span>`, NOT ErrorAlert)
  5. Success state replaces form entirely with confirmation text ("Recovery email sent." + explanation)
  6. Follow the same auth form layout pattern: Title Group (330px) + Form (348px) horizontal
  7. Include "Back to Sign In" link (Link/Simple pattern, right-aligned)
  8. InfinitySpinner on submit button during loading
- **Dependencies**: `apiClient`, `Input`, `InfinitySpinner`, `lucide-react` (AlertTriangle)
- **Implementation Notes**: This form uses `apiClient` directly instead of AuthContext because forgot-password is not part of the auth state lifecycle. The form is fully functional -- it calls `apiClient.post('/auth/forgot-password')` and handles both success and error states. It is NOT a stub.

### Step 15: Page Wiring and LanguageSelector Fix

- **Files**: `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/forgot-password/page.tsx`, `src/components/ui/LanguageSelector.tsx`
- **Implementation Steps**:
  1. **login/page.tsx**: Wrap `LoginForm` in `<Suspense>` (required because LoginForm uses `useSearchParams`); wrap entire page content in `<GuestRoute>`
  2. **register/page.tsx**: Wrap page content in `<GuestRoute>`
  3. **forgot-password/page.tsx**: Create server component page with metadata `{ title: 'Password Recovery -- EM NexaCore' }`, wrap `ForgotPasswordForm` in `AuthLayout`
  4. **LanguageSelector.tsx**: Fix dropdown item background colors from `surface-subtle` to `surface-tertiary` for selected and hover states (to match Figma spec)

### Step 16: Backend Compatibility Fixes

- **Files**: `nexacore-api/src/main.ts`, `nexacore-api/src/prisma/prisma.service.ts`, `nexacore-api/package.json`, `nexacore-api/src/auth/dto/register.dto.ts`
- **Action**: Fix Prisma 7 compatibility and dotenv loading for end-to-end auth testing
- **Implementation Steps**:
  1. Add `import 'dotenv/config'` as first line in `main.ts` (NestJS does not auto-load `.env`)
  2. Install `@prisma/adapter-pg` and `pg` for Prisma 7 driver adapter pattern
  3. Refactor `PrismaService` to use `PrismaPg` adapter instead of `datasourceUrl`
  4. Shorten register DTO special character validation message for better UI display

### Step 17: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made
- **Implementation Steps**:
  1. **Review Changes**: Analyze all code changes from Steps 1-16
  2. **Create Implementation Record**: Write `ai-specs/changes/records/SCRUM-19_frontend.md` documenting all decisions, architecture, and implementation details
  3. **Verify Documentation**: Confirm all changes are accurately reflected in the record
- **References**: Follow process described in `ai-specs/specs/documentation-standards.mdc`
- **Notes**: This step is MANDATORY before considering the implementation complete.

---

## 8. Implementation Order

1. Step 0 -- Create feature branch (`feature/SCRUM-19-frontend`)
2. Step 1 -- TypeScript type definitions (`src/lib/types.ts`)
3. Step 2 -- ApiClient CRUD methods (`src/lib/api.ts`)
4. Step 3 -- Next.js API Route Handlers (set-tokens, refresh, logout)
5. Step 4 -- AuthContext and AuthProvider (`src/context/AuthContext.tsx`)
6. Step 5 -- useAuth hook re-export (`src/hooks/useAuth.ts`)
7. Step 6 -- Wire AuthProvider into providers.tsx
8. Step 8 -- InfinitySpinner component (needed by forms in Steps 12-14)
9. Step 9 -- RingSpinner component (needed by GuestRoute in Step 7)
10. Step 7 -- GuestRoute guard component (depends on RingSpinner + useAuth)
11. Step 10 -- Input component enhancements (`hasError` prop)
12. Step 11 -- CSS additions (autofill override, infinity-spin keyframes)
13. Step 12 -- LoginForm integration (AuthContext, email validation, error display)
14. Step 13 -- RegisterForm integration (AuthContext, password strength, error display)
15. Step 14 -- ForgotPasswordForm component
16. Step 15 -- Page wiring (Suspense, GuestRoute, forgot-password page, LanguageSelector fix)
17. Step 16 -- Backend compatibility fixes (Prisma 7, dotenv)
18. Step 17 -- Update technical documentation

---

## 9. Testing Checklist

### Client-Side Validation
- [x] Empty email -> "Enter your email address" error
- [x] Invalid email format (`user@gmail.c`) -> "Enter a valid email address" error
- [x] Valid email -> proceeds to password step (login) / allows submission (register)
- [x] Error clears when user types in email field

### Auth Integration
- [x] Register with valid data (email + password only, no name/confirm) -> user created, redirect to /dashboard
- [x] Register with existing email -> "Email already registered" error
- [x] Register with weak password -> specific message (e.g., "Password must be at least 8 characters")
- [x] Login with valid credentials -> tokens stored, redirect to /dashboard
- [x] Login with wrong password -> "Invalid credentials" error
- [x] Error clears on input change, form navigation, and mount
- [x] InfinitySpinner shows during loading state
- [x] Button disabled during loading (pointer-events-none)

### Password Strength UI
- [x] Icons appear when password field has content
- [x] Green check badge appears as each requirement is met
- [x] Icons hidden when error message is showing
- [x] Icons return when error is cleared (user types)

### Token Management
- [x] Refresh token stored in httpOnly cookie (name: `refresh_token`, sameSite: `strict`, maxAge: 30 days)
- [x] Access token stored in-memory only (via `apiClient.setAccessToken`)
- [x] Silent refresh attempted on page mount (restores session via `refreshSession()`)
- [x] Logout clears cookie (via `/api/auth/logout`) and in-memory token (via `apiClient.clearAccessToken()`)

### GuestRoute Guard
- [x] RingSpinner shown while `isInitialized === false`
- [x] Authenticated user redirected to `/dashboard` from `/login` and `/register`
- [x] Unauthenticated user sees auth pages normally

### Forgot Password
- [x] Form renders with email input and submit button
- [x] On submit: calls `apiClient.post('/auth/forgot-password', { email })` -- fully functional
- [x] Success state replaces form with confirmation message (shows submitted email)
- [x] Error state displays using inline pattern (AlertTriangle + span)
- [x] "Back to Sign In" link navigates to /login

### Backend Compatibility
- [x] Prisma 7 adapter pattern works with PostgreSQL
- [x] dotenv loads before NestJS bootstrap
- [x] Validation error details reach frontend as specific messages

### Visual & Theme
- [x] All auth pages render correctly in both light and dark themes
- [x] Autofill override matches theme background
- [x] InfinitySpinner animation runs smoothly
- [x] RingSpinner ripple animation runs smoothly
- [x] TypeScript compilation passes with zero errors

---

## 10. Error Handling

### Error Display Pattern

All auth forms use an **inline error display pattern**: `AlertTriangle` icon (16px, `shrink-0 text-error`) + `<span>` (text-xs, leading-6, text-error). They do **NOT** use an `ErrorAlert` component. The inline pattern is rendered directly in each form's System Message slot.

```tsx
{showError && (
  <>
    <AlertTriangle size={16} className="shrink-0 text-error" />
    <span className="flex-1 text-xs leading-6 text-error">{activeError}</span>
  </>
)}
```

### Client-Side Validation Errors

- `emailError` local state in LoginForm and RegisterForm
- Validated before API call: empty email, invalid email format
- Displayed in System Message slot with AlertTriangle icon + span
- Cleared on input change (`onChange` handler calls `setEmailError(null)`)

### Backend API Errors

- AuthContext `error` state, set via `AUTH_ERROR` action
- `extractErrorMessage(err, fallback)` helper extracts from backend response:
  1. Checks `error.details[0]` first (validation-specific messages)
  2. Falls back to `error.message` (generic error)
  3. Falls back to hardcoded fallback string
- Cleared via `clearError()` on input change, mount, and navigation

### Error Display Priority

- `emailError` (local) takes priority over AuthContext `error` (backend)
- `oauthError` (from URL params) takes priority in LoginForm email step
- Only one error message shown at a time in the System Message slot
- Password Check icons hidden when any error is showing

### Network Errors

- ApiClient throws structured `{ error: { message, code, statusCode } }` objects
- Network failures: `"Network error. Please check your connection."` (code: `NETWORK_ERROR`, statusCode: 0)
- Server errors: `"Server error ({status})"` when response body cannot be parsed (code: `SERVER_ERROR`)

### Token Refresh Errors

- Failed silent refresh on mount -> dispatches `LOGOUT` (no error shown, user sees login page)
- Failed silent refresh on 401 retry -> returns null, original error propagates

### ForgotPasswordForm Errors

- Uses direct `apiClient.post()` error handling (not AuthContext)
- Extracts `error.message` from caught error, falls back to `"Something went wrong. Please try again."`
- Clears error on input change

---

## 11. Non-Functional Requirements

### Security

| Requirement | Implementation |
|---|---|
| httpOnly cookies | Refresh token stored in httpOnly cookie, not accessible from JavaScript |
| sameSite strict | Cookie `sameSite: 'strict'` provides CSRF protection |
| 30-day maxAge | Cookie expires after 30 days (`60 * 60 * 24 * 30` seconds) |
| Secure flag | Cookie `secure: true` in production (HTTPS only) |
| In-memory access token | Not persisted to localStorage/sessionStorage; lost on page refresh |
| No token in URLs | Tokens passed via request body and httpOnly cookies only |
| XSS protection | Refresh token in httpOnly cookie prevents XSS token theft |
| No email enumeration | Client-side email validation checks format only, no existence check |

### Performance

| Requirement | Implementation |
|---|---|
| Silent refresh deduplication | `refreshPromise` instance variable prevents concurrent refresh requests |
| In-memory token access | No storage API calls for access token retrieval |
| Computed `isAuthenticated` | Derived from `!!user && !!accessToken`, no separate state |
| Stable references | All AuthContext methods wrapped in `useCallback` |

### Token Lifecycle

| Event | Access Token | Refresh Token | UI Effect |
|---|---|---|---|
| Login/Register success | Stored in `apiClient` memory | Stored in httpOnly cookie via set-tokens route | Redirect to `/dashboard` |
| Page mount | Restored via `/api/auth/refresh` -> `apiClient.setAccessToken()` | Read from cookie by Next.js route handler | Flash of RingSpinner (GuestRoute), then content |
| 401 response | Refreshed via `silentRefresh()` | Used by Next.js route handler, possibly rotated | Transparent to user |
| Logout | Cleared via `apiClient.clearAccessToken()` | Cookie deleted via `/api/auth/logout` | Redirect to `/login` |
| Refresh failure | Not set | Cookie deleted by refresh route handler | Dispatches LOGOUT, user sees login page |

---

## 12. Dependencies

### No New npm Packages for nexacore-dashboard

All new functionality built with existing packages:
- `react` / `react-dom` 18 -- `useReducer`, `useContext`, `useCallback`, `useEffect`, `useRef`, `useState`
- `next` 14 -- App Router, `NextResponse`, `NextRequest`, cookies API, `useRouter`, `useSearchParams`, `Link`
- `lucide-react` -- AlertTriangle, RulerDimensionLine, Hash, Asterisk, CaseUpper, CaseLower, Check, ChevronDown, Eye, EyeOff
- `tailwindcss` v3 -- utility classes

### Internal Dependencies

| Dependency | From | Used By |
|---|---|---|
| SCRUM-18 scaffold | `nexacore-dashboard` | All auth components build on SCRUM-18's UI components (`AuthLayout`, `OAuthButtons`, `Input`, `Spinner`) and infrastructure (`ThemeProvider`, `providers.tsx`, page shells) |
| SCRUM-5 backend auth | `nexacore-api` | Auth endpoints consumed: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/forgot-password` |

### Custom UI Components Used

- `Input` (enhanced with `hasError` prop in this story)
- `InfinitySpinner` (new in this story)
- `RingSpinner` (new in this story)
- `OAuthButtons` (from SCRUM-18)
- `AuthLayout` (from SCRUM-18)
- `Spinner` (from SCRUM-18, used internally by Input)

### New Production Dependencies (nexacore-api only)

| Package | Purpose |
|---|---|
| `@prisma/adapter-pg` | Prisma 7 PostgreSQL driver adapter |
| `pg` | PostgreSQL client for Node.js |

### New Dev Dependencies (nexacore-api only)

| Package | Purpose |
|---|---|
| `@types/pg` | TypeScript types for pg |

---

## 13. Documentation Updates

| File | Update |
|---|---|
| `ai-specs/changes/records/SCRUM-19_frontend.md` | Implementation record documenting all decisions, architecture, and implementation details |
| `ai-specs/changes/plans/SCRUM-19_frontend.md` | This plan (retroactive, enriched to 14-section template) |

---

## 14. Definition of Done

### Code Quality
- [x] TypeScript strict -- no `any`, all props typed
- [x] `'use client'` only on interactive components (pages are server components where possible)
- [x] No unused imports
- [x] Inline Tailwind classes follow design system tokens
- [x] All `useCallback` / `useEffect` dependencies correct

### Functionality
- [x] Login two-step flow works end-to-end (email -> password -> API -> redirect)
- [x] Register flow works end-to-end (email + password -> API -> redirect)
- [x] Forgot password form fully functional (calls `apiClient.post('/auth/forgot-password')`, shows success state)
- [x] Client-side email validation catches empty and invalid emails
- [x] Password strength indicators react in real-time
- [x] Silent refresh restores session on page reload
- [x] Logout clears all auth state and cookies
- [x] GuestRoute redirects authenticated users, shows RingSpinner during init

### Integration
- [x] AuthProvider wraps entire application via providers.tsx
- [x] ApiClient CRUD methods (`get`, `post`, `put`, `patch`, `delete`, `getAccessToken`, `clearAccessToken`) integrate with AuthContext
- [x] Token flow: backend -> set-tokens route -> httpOnly cookie (`refresh_token`, strict, 30 days) -> refresh route -> access token
- [x] Error messages from backend reach UI with specific details (via `extractErrorMessage`)
- [x] Backend Prisma 7 compatibility resolved for end-to-end testing

### Documentation
- [x] Implementation record created: `changes/records/SCRUM-19_frontend.md`
- [x] Implementation plan enriched: `changes/plans/SCRUM-19_frontend.md` (this document)
