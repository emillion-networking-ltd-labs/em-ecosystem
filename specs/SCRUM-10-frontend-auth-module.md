# SCRUM-10: Frontend Authentication Module — Technical Specification

**Ticket**: SCRUM-10
**Epic**: SCRUM-5 (Authentication System)
**Dependencies**: SCRUM-6, SCRUM-7, SCRUM-8, SCRUM-9
**Stack**: Next.js 14 (App Router) · TypeScript · TailwindCSS v4 · React Context API

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 (App Router)                   │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Pages    │  │  Components  │  │  Context / Providers   │ │
│  │  /login   │  │  AuthCard    │  │  AuthProvider          │ │
│  │  /register│  │  OAuthBtns   │  │  ThemeProvider         │ │
│  │  /profile │  │  ThemeToggle │  │                        │ │
│  │  /admin   │  │  NavBar      │  │                        │ │
│  │  /callback│  │  Guards      │  │                        │ │
│  └──────────┘  └──────────────┘  └────────────────────────┘ │
│                         │                                    │
│                  ┌──────┴───────┐                            │
│                  │  lib/api.ts  │  ← Fetch wrapper           │
│                  └──────┬───────┘                            │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP (JSON)
┌─────────────────────────┼───────────────────────────────────┐
│              NestJS Backend  :3000                           │
│              POST /auth/register                             │
│              POST /auth/login                                │
│              POST /auth/refresh                              │
│              POST /auth/logout                               │
│              GET  /auth/me                                   │
│              GET  /auth/admin                                │
│              GET  /auth/google → OAuth redirect              │
│              GET  /auth/github → OAuth redirect              │
└─────────────────────────────────────────────────────────────┘
```

### Principles

- **Server Components by default**, Client Components only where interactivity is needed (forms, context consumers).
- **No external state library** — React Context + `useReducer` for auth state.
- **No component library** — TailwindCSS utility classes only, matching Google's flat design language.
- **Token security** — Access token in memory (React state), refresh token in `httpOnly` cookie via Next.js API route proxy.
- **Zero runtime CSS** — TailwindCSS compiles to static CSS at build time.

---

## 2. Project Structure

```
em-ecosystem-frontend/
├── public/
│   └── emillion-logo.svg              # Brand logo
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout: Providers, ThemeToggle, metadata
│   │   ├── page.tsx                    # Landing redirect → /login
│   │   ├── globals.css                 # Tailwind directives + CSS custom properties
│   │   ├── login/
│   │   │   └── page.tsx               # Login page
│   │   ├── register/
│   │   │   └── page.tsx               # Register page
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── page.tsx           # OAuth callback handler
│   │   ├── profile/
│   │   │   └── page.tsx               # User profile (protected)
│   │   ├── admin/
│   │   │   └── page.tsx               # Admin dashboard (protected, ADMIN only)
│   │   └── api/
│   │       └── auth/
│   │           ├── refresh/
│   │           │   └── route.ts       # Proxy: reads httpOnly cookie, calls backend
│   │           ├── logout/
│   │           │   └── route.ts       # Proxy: clears httpOnly cookie, calls backend
│   │           └── set-tokens/
│   │               └── route.ts       # Proxy: sets refresh token as httpOnly cookie
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthCard.tsx           # Centered card container (Google-style)
│   │   │   ├── LoginForm.tsx          # Email + password form
│   │   │   ├── RegisterForm.tsx       # Email + password + validation
│   │   │   ├── OAuthButtons.tsx       # Google + GitHub sign-in buttons
│   │   │   ├── PasswordStrength.tsx   # Real-time password requirement indicator
│   │   │   └── ErrorAlert.tsx         # Inline error banner
│   │   ├── layout/
│   │   │   ├── NavBar.tsx             # Top navigation bar
│   │   │   └── Footer.tsx             # Minimal footer
│   │   ├── guards/
│   │   │   ├── ProtectedRoute.tsx     # Requires authentication
│   │   │   └── AdminRoute.tsx         # Requires ADMIN role
│   │   └── ui/
│   │       ├── Button.tsx             # Reusable button (primary, secondary, outline)
│   │       ├── Input.tsx              # Styled text input with label + error
│   │       ├── ThemeToggle.tsx        # Light/Dark mode switcher
│   │       ├── Spinner.tsx            # Loading indicator
│   │       └── Divider.tsx            # "or" separator line
│   ├── context/
│   │   ├── AuthContext.tsx            # Auth state, actions, provider
│   │   └── ThemeContext.tsx           # Theme state, toggle, provider
│   ├── lib/
│   │   ├── api.ts                     # Fetch wrapper with auth headers + refresh
│   │   ├── constants.ts               # API_BASE_URL, token keys, routes
│   │   └── types.ts                   # Shared TypeScript types
│   └── hooks/
│       ├── useAuth.ts                 # Convenience hook for AuthContext
│       └── useTheme.ts               # Convenience hook for ThemeContext
├── tailwind.config.ts                 # Custom theme: colors, fonts, dark mode
├── next.config.ts                     # Rewrites, env vars
├── tsconfig.json
├── package.json
├── .env.local                         # NEXT_PUBLIC_API_URL, etc.
└── .env.example
```

---

## 3. Routes and Pages

| Route | File | Auth | Role | Description |
|-------|------|------|------|-------------|
| `/` | `app/page.tsx` | No | — | Redirects to `/login` |
| `/login` | `app/login/page.tsx` | No | — | Email/password login + OAuth buttons |
| `/register` | `app/register/page.tsx` | No | — | Registration form with password validation |
| `/auth/callback` | `app/auth/callback/page.tsx` | No | — | OAuth callback: extracts tokens from URL |
| `/profile` | `app/profile/page.tsx` | Yes | Any | User profile display |
| `/admin` | `app/admin/page.tsx` | Yes | ADMIN | Admin dashboard |

### Route Behavior

- **Unauthenticated user** visits `/profile` or `/admin` → redirect to `/login?redirect=/profile`
- **Authenticated user** visits `/login` or `/register` → redirect to `/profile`
- **Non-admin user** visits `/admin` → redirect to `/profile` with error toast
- **OAuth callback** at `/auth/callback` → extracts tokens → stores → redirects to `/profile`

---

## 4. Components Specification

### 4.1 AuthCard

The primary container for all authentication forms. Inspired by Google Sign-In.

```
┌─────────────────────────────────────────┐
│                                         │
│          [EMILLION LOGO]                │
│                                         │
│          Sign in                        │
│          to continue to EM Ecosystem    │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  Email                          │   │
│   └─────────────────────────────────┘   │
│   ┌─────────────────────────────────┐   │
│   │  Password                       │   │
│   └─────────────────────────────────┘   │
│                                         │
│   [ Forgot password? ]                  │
│                                         │
│             ┌───────────┐               │
│             │  Sign in  │               │
│             └───────────┘               │
│                                         │
│        ──── or continue with ────       │
│                                         │
│   ┌──────────┐    ┌──────────────┐      │
│   │ G Google │    │ ◆ GitHub     │      │
│   └──────────┘    └──────────────┘      │
│                                         │
│   Don't have an account? Sign up        │
│                                         │
└─────────────────────────────────────────┘
```

**Properties:**
- `max-w-md` (448px), centered horizontally and vertically
- `rounded-lg` border radius
- Light: `bg-white border border-gray-200`
- Dark: `bg-gray-900 border border-gray-700`
- `px-10 py-12` padding
- No box-shadow (flat Google style)

### 4.2 LoginForm

| Element | Details |
|---------|---------|
| Email input | type="email", required, validates format client-side |
| Password input | type="password", required, show/hide toggle |
| Submit button | "Sign in", primary green accent, disabled while loading |
| Error display | Inline red banner below form on 401/403 |
| Loading state | Spinner replaces button text during API call |

### 4.3 RegisterForm

| Element | Details |
|---------|---------|
| Email input | type="email", required |
| Password input | type="password", required |
| Confirm password | Must match password field |
| PasswordStrength | Real-time indicator showing 5 requirements |
| Submit button | "Create account", disabled until all requirements met |

### 4.4 PasswordStrength

Displays live validation status for each requirement:

```
Password requirements:
  ✓ At least 8 characters
  ✗ One uppercase letter
  ✓ One lowercase letter
  ✗ One number
  ✗ One special character (@$!%*?&)
```

Green check = met, gray X = not met. Updates on every keystroke.

### 4.5 OAuthButtons

Two buttons rendered side by side:

- **"Continue with Google"** — triggers `GET /auth/google` (full page redirect)
- **"Continue with GitHub"** — triggers `GET /auth/github` (full page redirect)

Both use outline style with provider icon on the left. On hover: subtle background fill.

### 4.6 ThemeToggle

- Sun icon (light mode active) / Moon icon (dark mode active)
- Positioned in the top-right corner of the NavBar
- Persists preference in `localStorage` under key `theme`
- On first load: respects `prefers-color-scheme` system preference
- Toggles `dark` class on `<html>` element

### 4.7 ProtectedRoute / AdminRoute

```tsx
// ProtectedRoute wraps pages requiring authentication
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading]);

  if (isLoading) return <Spinner />;
  if (!user) return null;
  return <>{children}</>;
}

// AdminRoute extends ProtectedRoute with role check
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/profile');
    }
  }, [user]);

  if (!user || user.role !== 'ADMIN') return null;
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
```

---

## 5. AuthContext — State Management

### 5.1 State Shape

```typescript
interface AuthState {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: SafeUser; accessToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: SafeUser }
  | { type: 'CLEAR_ERROR' };
```

### 5.2 Context API

```typescript
interface AuthContextValue {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
  clearError: () => void;
}
```

### 5.3 Token Management Flow

```
Application Start
       │
       ▼
  AuthProvider mounts
       │
       ▼
  Call Next.js API route /api/auth/refresh
  (sends httpOnly cookie automatically)
       │
       ├── Success → dispatch AUTH_SUCCESS (user + accessToken in memory)
       │
       └── Failure (no cookie / expired) → dispatch LOGOUT → user stays on public page


Login / Register Success
       │
       ▼
  Receive { accessToken, refreshToken, user } from backend
       │
       ├── accessToken → store in React state (memory only)
       ├── refreshToken → send to /api/auth/set-tokens (sets httpOnly cookie)
       └── user → dispatch AUTH_SUCCESS


OAuth Callback
       │
       ▼
  Extract accessToken + refreshToken from URL query params
       │
       ├── accessToken → store in React state
       ├── refreshToken → send to /api/auth/set-tokens (sets httpOnly cookie)
       ├── Call GET /auth/me with accessToken → get user profile
       └── dispatch AUTH_SUCCESS → redirect to /profile


Token Refresh (automatic)
       │
       ▼
  api.ts interceptor detects accessToken nearing expiry (< 2 min)
  OR receives 401 response
       │
       ▼
  Call Next.js API /api/auth/refresh
  (httpOnly cookie sent automatically)
       │
       ├── Success → update accessToken in memory, retry original request
       └── Failure → dispatch LOGOUT → redirect to /login
```

### 5.4 Secure Token Architecture

```
┌──────────────────────────────┐
│  Browser (Client)            │
│                              │
│  accessToken: React state    │  ← In-memory only. Lost on page refresh.
│  (never in localStorage)     │     Restored via silent refresh on mount.
│                              │
│  refreshToken: httpOnly      │  ← Set by Next.js API route.
│  cookie (secure, sameSite)   │     Not accessible to JavaScript.
│                              │
└──────────────────────────────┘
         │                    │
         │ /api/auth/*        │  Direct API calls with
         │ (Next.js routes)   │  Authorization header
         ▼                    ▼
┌─────────────────┐   ┌──────────────────┐
│ Next.js Server   │   │ NestJS Backend   │
│ (API Routes)     │──▶│ :3000            │
│ Reads httpOnly   │   │                  │
│ cookie, forwards │   │                  │
│ to backend       │   │                  │
└─────────────────┘   └──────────────────┘
```

---

## 6. Backend Integration — API Client

### 6.1 Base Configuration

```typescript
// lib/constants.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```

### 6.2 API Client (`lib/api.ts`)

```typescript
class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  setAccessToken(token: string | null) { this.accessToken = token; }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.accessToken) {
      // Attempt silent refresh
      const newToken = await this.silentRefresh();
      if (newToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) throw await this.parseError(retryResponse);
        return retryResponse.json();
      }
      throw { code: 'UNAUTHORIZED', message: 'Session expired' };
    }

    if (!response.ok) throw await this.parseError(response);
    return response.json();
  }

  private async silentRefresh(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        this.refreshPromise = null;
        if (data?.accessToken) {
          this.accessToken = data.accessToken;
          return data.accessToken;
        }
        return null;
      });

    return this.refreshPromise;
  }
}
```

### 6.3 Endpoint Contracts

#### POST /auth/register

```typescript
// Request
interface RegisterRequest {
  email: string;    // Valid email format
  password: string; // 8+ chars, 1 upper, 1 lower, 1 digit, 1 special (@$!%*?&)
}

// Response 201
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

// Errors
// 400 VALIDATION_ERROR — { details: string[] }
// 409 CONFLICT — "Email already registered"
```

#### POST /auth/login

```typescript
// Request
interface LoginRequest {
  email: string;
  password: string;
}

// Response 200 — AuthResponse (same as register)

// Errors
// 401 UNAUTHORIZED — "Invalid credentials"
// 403 FORBIDDEN — "Account locked. Try again later."
```

#### POST /auth/refresh

```typescript
// Request
interface RefreshRequest {
  refreshToken: string;
}

// Response 200
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// Errors
// 401 UNAUTHORIZED — "Invalid or expired refresh token"
```

#### POST /auth/logout

```typescript
// Headers: Authorization: Bearer <accessToken>
// Response 200
{ message: "Logged out successfully" }

// Errors
// 401 UNAUTHORIZED — Missing/invalid token
```

#### GET /auth/me

```typescript
// Headers: Authorization: Bearer <accessToken>
// Response 200 — SafeUser

// Errors
// 401 UNAUTHORIZED — Missing/invalid token
```

#### GET /auth/admin

```typescript
// Headers: Authorization: Bearer <accessToken>
// Required Role: ADMIN
// Response 200
{ message: "Admin access granted" }

// Errors
// 401 UNAUTHORIZED — Missing/invalid token
// 403 FORBIDDEN — "Insufficient role"
```

#### GET /auth/google | /auth/github

```
Browser navigates to: {API_BASE_URL}/auth/google
Backend redirects to: Google consent screen
Google redirects to: {API_BASE_URL}/auth/google/callback
Backend redirects to: {FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...
```

### 6.4 Shared Types (`lib/types.ts`)

```typescript
export type Role = 'ADMIN' | 'USER';
export type Provider = 'LOCAL' | 'GOOGLE' | 'GITHUB';

export interface SafeUser {
  id: string;
  email: string;
  role: Role;
  provider: Provider;
  providerId: string | null;
  emailVerified: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: string[];
  };
}
```

---

## 7. Authentication & Authorization Flows

### 7.1 Registration Flow

```
User opens /register
       │
       ▼
Fills email + password
PasswordStrength shows live validation
       │
       ▼
Clicks "Create account"
       │
       ▼
POST /auth/register { email, password }
       │
       ├── 201 Success
       │      │
       │      ▼
       │   Store accessToken in memory
       │   Store refreshToken via /api/auth/set-tokens (httpOnly cookie)
       │   Dispatch AUTH_SUCCESS
       │   Redirect to /profile
       │
       ├── 409 Conflict → "This email is already registered. Sign in instead?"
       │
       └── 400 Validation → Show field-level errors from details[]
```

### 7.2 Login Flow

```
User opens /login
       │
       ▼
Fills email + password
       │
       ▼
Clicks "Sign in"
       │
       ▼
POST /auth/login { email, password }
       │
       ├── 200 Success → same token storage + redirect as registration
       │
       ├── 401 Unauthorized → "Invalid email or password"
       │
       └── 403 Forbidden → "Account locked. Too many failed attempts. Try again in 15 minutes."
```

### 7.3 OAuth Flow (Google / GitHub)

```
User clicks "Continue with Google"
       │
       ▼
window.location.href = "{API_BASE_URL}/auth/google"
       │
       ▼
Browser redirects to Google consent screen
       │
       ▼
User approves → Google redirects to backend callback
       │
       ▼
Backend processes → redirects to:
  /auth/callback?accessToken=xxx&refreshToken=yyy
       │
       ▼
/auth/callback page:
  1. Reads accessToken + refreshToken from URL searchParams
  2. Stores refreshToken via /api/auth/set-tokens (httpOnly cookie)
  3. Stores accessToken in memory
  4. Calls GET /auth/me to fetch user profile
  5. Dispatches AUTH_SUCCESS
  6. Cleans URL (removes tokens from query string)
  7. Redirects to /profile (or saved redirect path)
```

### 7.4 Silent Refresh Flow

```
App initializes (page load / refresh)
       │
       ▼
AuthProvider.useEffect()
       │
       ▼
POST /api/auth/refresh  (Next.js API route)
       │
       ▼
Next.js route reads httpOnly cookie → calls backend POST /auth/refresh
       │
       ├── Success → returns new { accessToken, refreshToken }
       │      │
       │      ▼
       │   Set new httpOnly cookie with new refreshToken
       │   Return accessToken to client
       │   Client calls GET /auth/me
       │   Dispatches AUTH_SUCCESS
       │
       └── Failure → user stays unauthenticated
              No redirect (they may be on a public page)
```

### 7.5 Logout Flow

```
User clicks "Sign out"
       │
       ▼
POST /api/auth/logout (Next.js API route)
       │
       ▼
Next.js route:
  1. Reads accessToken from request header
  2. Calls backend POST /auth/logout with Authorization header
  3. Clears httpOnly refresh cookie
  4. Returns success
       │
       ▼
Client:
  1. Clears accessToken from memory
  2. Dispatches LOGOUT
  3. Redirects to /login
```

---

## 8. Error Handling

### 8.1 Error Display Strategy

| Error Type | Display Method |
|------------|---------------|
| Field validation (400) | Inline below each field: red text, red border |
| Authentication error (401) | Banner inside AuthCard: red background alert |
| Account locked (403) | Banner inside AuthCard: amber background alert with timer |
| Conflict (409) | Banner with link: "Email already registered. [Sign in instead](/login)" |
| Network error | Banner: "Unable to connect. Check your internet connection." |
| Unknown error | Banner: "Something went wrong. Please try again." |

### 8.2 ErrorAlert Component

```
┌─────────────────────────────────────────────┐
│ ⚠  Invalid email or password.               │
│                                         [×] │
└─────────────────────────────────────────────┘
```

- Light mode: `bg-red-50 text-red-800 border border-red-200`
- Dark mode: `bg-red-900/20 text-red-400 border border-red-800`
- Dismiss button clears the error from AuthContext

### 8.3 Redirect Logic

| Scenario | Action |
|----------|--------|
| Login success | Redirect to `searchParams.redirect` or `/profile` |
| Register success | Redirect to `/profile` |
| OAuth callback success | Redirect to `localStorage.getItem('authRedirect')` or `/profile` |
| Unauthorized (401 after refresh fails) | Redirect to `/login?redirect={currentPath}` |
| Forbidden (non-admin on /admin) | Redirect to `/profile` |
| Already authenticated, visits /login | Redirect to `/profile` |

---

## 9. Theme System — Light/Dark Mode

### 9.1 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — EMILLION dark green
        accent: {
          DEFAULT: '#1B5E20',  // Dark green (primary actions)
          light: '#2E7D32',    // Hover state
          dark: '#0D3B12',     // Active/pressed state
          subtle: '#E8F5E9',   // Light mode backgrounds
        },
        // Neutral palette
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          elevated: 'var(--surface-elevated)',
        },
        content: {
          primary: 'var(--content-primary)',
          secondary: 'var(--content-secondary)',
          tertiary: 'var(--content-tertiary)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Google Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
      },
      maxWidth: {
        card: '448px',
      },
    },
  },
};

export default config;
```

### 9.2 CSS Custom Properties

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light mode (default) */
    --surface-primary: #FFFFFF;
    --surface-secondary: #F8F9FA;
    --surface-elevated: #FFFFFF;

    --content-primary: #202124;
    --content-secondary: #5F6368;
    --content-tertiary: #80868B;

    --border-default: #DADCE0;
    --border-subtle: #E8EAED;
  }

  .dark {
    /* Dark mode */
    --surface-primary: #111111;
    --surface-secondary: #1A1A1A;
    --surface-elevated: #1E1E1E;

    --content-primary: #E8EAED;
    --content-secondary: #9AA0A6;
    --content-tertiary: #80868B;

    --border-default: #3C4043;
    --border-subtle: #2D2D2D;
  }

  body {
    @apply bg-surface-primary text-content-primary font-sans antialiased;
    transition: background-color 150ms ease, color 150ms ease;
  }
}
```

### 9.3 ThemeContext

```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggle: () => void;
}

// On mount:
// 1. Check localStorage('theme')
// 2. Fallback to window.matchMedia('(prefers-color-scheme: dark)')
// 3. Apply 'dark' class to document.documentElement
// 4. Persist choice to localStorage on toggle
```

### 9.4 Component Theme Adaptation

Every component uses semantic color tokens, not raw colors:

```tsx
// Button example
<button className="
  bg-accent text-white hover:bg-accent-light active:bg-accent-dark
  rounded-card px-6 py-2.5 text-sm font-medium
  transition-colors duration-150
">
  Sign in
</button>

// Input example
<input className="
  w-full px-4 py-3 rounded-card
  bg-surface-primary text-content-primary
  border border-border-default
  focus:border-accent focus:ring-1 focus:ring-accent
  placeholder:text-content-tertiary
" />

// Card example
<div className="
  w-full max-w-card mx-auto
  bg-surface-elevated border border-border-default rounded-card
  px-10 py-12
">
```

---

## 10. Design Specification — Google-Inspired

### 10.1 Core Visual Principles

| Principle | Implementation |
|-----------|---------------|
| Flat design | No `box-shadow` on cards or buttons. Use borders only. |
| Minimalist | Maximum whitespace. No decorative elements. |
| Clean typography | Inter/Google Sans. 14px body, 24px headings. Regular 400, Medium 500. |
| Generous spacing | `py-12 px-10` card padding. `space-y-6` between form elements. |
| Subtle borders | 1px solid borders in neutral gray. No gradients. |
| Focus on content | Single column layout. Card centered vertically and horizontally. |

### 10.2 Color System

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `accent` | `#1B5E20` | `#1B5E20` | Primary buttons, links, focus rings |
| `accent-light` | `#2E7D32` | `#2E7D32` | Hover states |
| `surface-primary` | `#FFFFFF` | `#111111` | Page background |
| `surface-elevated` | `#FFFFFF` | `#1E1E1E` | Card background |
| `content-primary` | `#202124` | `#E8EAED` | Headings, body text |
| `content-secondary` | `#5F6368` | `#9AA0A6` | Subtext, labels |
| `border-default` | `#DADCE0` | `#3C4043` | Card borders, input borders |

### 10.3 Typography Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | `text-2xl` (24px) | `font-normal` (400) | `content-primary` |
| Subtitle | `text-base` (16px) | `font-normal` (400) | `content-secondary` |
| Input label | `text-sm` (14px) | `font-medium` (500) | `content-primary` |
| Input text | `text-base` (16px) | `font-normal` (400) | `content-primary` |
| Button text | `text-sm` (14px) | `font-medium` (500) | White on accent |
| Link text | `text-sm` (14px) | `font-medium` (500) | `accent` |
| Error text | `text-xs` (12px) | `font-normal` (400) | `red-600` / `red-400` |

### 10.4 Spacing System

```
Page padding:   px-4 (mobile) → px-0 (desktop, card handles width)
Card padding:   px-10 py-12
Form gap:       space-y-6 between groups
Input gap:      space-y-1.5 (label to input)
Section gap:    space-y-8 (between form and OAuth)
Button height:  py-2.5 (40px total with text)
Input height:   py-3 (44px total with text)
```

### 10.5 Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< 640px` (mobile) | Card fills width with `mx-4` margin. Padding reduces to `px-6 py-8`. |
| `≥ 640px` (tablet+) | Card uses `max-w-card` (448px), centered. Full padding. |
| All sizes | Single-column layout. No sidebar. |

---

## 11. Next.js API Route Proxies

### 11.1 POST /api/auth/set-tokens

Sets the refresh token as an httpOnly cookie.

```typescript
// src/app/api/auth/set-tokens/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { refreshToken } = await request.json();

  const response = NextResponse.json({ ok: true });
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches backend JWT_REFRESH_EXPIRATION)
  });

  return response;
}
```

### 11.2 POST /api/auth/refresh

Reads httpOnly cookie and proxies to backend.

```typescript
// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const backendResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!backendResponse.ok) {
    const response = NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    response.cookies.delete('refreshToken');
    return response;
  }

  const data = await backendResponse.json();

  const response = NextResponse.json({ accessToken: data.accessToken });
  response.cookies.set('refreshToken', data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
```

### 11.3 POST /api/auth/logout

Calls backend logout and clears the cookie.

```typescript
// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (authHeader) {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: authHeader },
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('refreshToken');
  return response;
}
```

---

## 12. Manual Test Plan

### 12.1 Registration Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| R1 | Successful registration | Enter valid email + strong password → Submit | 201, redirected to /profile, user data displayed |
| R2 | Duplicate email | Register with existing email | 409, error banner: "This email is already registered" |
| R3 | Weak password | Enter password "abc" | Submit button disabled, requirements shown in red |
| R4 | Invalid email | Enter "notanemail" | Client-side validation prevents submit |
| R5 | Password mismatch | Confirm password differs | Error shown: "Passwords do not match" |
| R6 | Empty form submission | Click submit with empty fields | Required field indicators shown |

### 12.2 Login Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| L1 | Successful login | Enter valid credentials → Submit | 200, redirected to /profile |
| L2 | Invalid credentials | Enter wrong password | 401, error banner: "Invalid email or password" |
| L3 | Account locked | Fail login 5 times | 403, error banner with lockout message |
| L4 | Login after lock expires | Wait 15 min (or adjust in DB) → Login | 200, successful login |
| L5 | Redirect after login | Visit /admin while logged out → Login | Redirected to /admin after login |
| L6 | Already authenticated | Visit /login while logged in | Redirected to /profile |

### 12.3 OAuth Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| O1 | Google OAuth (new user) | Click "Continue with Google" → Approve | New account created, redirected to /profile |
| O2 | Google OAuth (existing email) | Login with Google using existing LOCAL email | Account linked to Google, login succeeds |
| O3 | GitHub OAuth (new user) | Click "Continue with GitHub" → Approve | New account created, redirected to /profile |
| O4 | GitHub OAuth (existing email) | Login with GitHub using existing LOCAL email | Account linked to GitHub, login succeeds |
| O5 | OAuth cancel | Click "Continue with Google" → Cancel on consent | Redirected back to /login, no error |

### 12.4 Token Management Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| T1 | Silent refresh on load | Login → Refresh browser page | User remains authenticated (silent refresh via cookie) |
| T2 | Token expiry refresh | Wait for access token to expire → Make API call | Token silently refreshed, call succeeds |
| T3 | Refresh token expired | Clear cookie manually → Refresh page | Redirected to /login |
| T4 | Concurrent refresh | Open 3 tabs → All trigger refresh simultaneously | Only one refresh call made (deduplication) |

### 12.5 Logout Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| LO1 | Successful logout | Click "Sign out" | Redirected to /login, cookie cleared |
| LO2 | Access protected route after logout | Logout → Navigate to /profile | Redirected to /login |

### 12.6 Protected Route Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| P1 | Access /profile (authenticated) | Login → Navigate to /profile | Profile page with user data displayed |
| P2 | Access /profile (unauthenticated) | Navigate to /profile without login | Redirected to /login?redirect=/profile |
| P3 | Access /admin (ADMIN role) | Login as admin → Navigate to /admin | Admin dashboard displayed |
| P4 | Access /admin (USER role) | Login as regular user → Navigate to /admin | Redirected to /profile |
| P5 | Access /admin (unauthenticated) | Navigate to /admin without login | Redirected to /login?redirect=/admin |

### 12.7 Theme Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| TH1 | Default theme | Open app (no localStorage) | Follows system preference |
| TH2 | Toggle to dark | Click moon/sun toggle | All elements switch to dark palette |
| TH3 | Toggle to light | Click toggle again | All elements switch to light palette |
| TH4 | Persistence | Set dark mode → Refresh page | Dark mode persists |
| TH5 | All pages consistent | Navigate through all pages in dark mode | Consistent dark styling everywhere |

### 12.8 Error Handling Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| E1 | Network error | Disconnect internet → Submit login | "Unable to connect" error banner |
| E2 | Backend down | Stop NestJS server → Submit login | "Unable to connect" error banner |
| E3 | Error dismissal | Trigger error → Click dismiss (×) | Error banner disappears |
| E4 | Error clears on navigate | Trigger error on /login → Navigate to /register | No error shown on /register |

### 12.9 Responsive Tests

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| RE1 | Mobile (375px) | Open /login at 375px width | Card fills width, padding reduced |
| RE2 | Tablet (768px) | Open /login at 768px width | Card centered, max-w-card |
| RE3 | Desktop (1440px) | Open /login at 1440px width | Card centered, generous whitespace |

---

## 13. Acceptance Criteria (Technical)

| # | Criterion | Validation |
|---|-----------|------------|
| AC1 | All auth flows work visually | Manual test plan sections 12.1–12.5 pass |
| AC2 | OAuth Google works from frontend | Tests O1, O2 pass |
| AC3 | OAuth GitHub works from frontend | Tests O3, O4 pass |
| AC4 | Protected routes enforce auth | Tests P1–P5 pass |
| AC5 | Profile page shows user data | Test P1: id, email, role, provider displayed |
| AC6 | Admin route enforces ADMIN role | Tests P3, P4 pass |
| AC7 | Light/Dark mode works | Tests TH1–TH5 pass |
| AC8 | Tokens stored securely | accessToken in memory only, refreshToken in httpOnly cookie |
| AC9 | Silent refresh on page load | Test T1 passes |
| AC10 | Responsive on all breakpoints | Tests RE1–RE3 pass |
| AC11 | TypeScript strict mode | `npx tsc --noEmit` passes with zero errors |
| AC12 | No console errors | Browser console clean during all flows |

---

## 14. Implementation Plan — Step by Step

### Phase 1: Project Scaffolding
1. Initialize Next.js 14 project with App Router and TypeScript
2. Install and configure TailwindCSS with custom theme
3. Set up CSS custom properties for Light/Dark mode
4. Create ThemeContext and ThemeToggle component
5. Set up project folder structure
6. Configure environment variables and constants
7. Create `.env.example` and `next.config.ts`

### Phase 2: UI Components
8. Build `Button`, `Input`, `Spinner`, `Divider` base components
9. Build `AuthCard` container with Google-style layout
10. Build `ErrorAlert` component
11. Build `PasswordStrength` indicator
12. Build `OAuthButtons` (Google + GitHub)
13. Build `NavBar` with ThemeToggle integration
14. Build `LoginForm` component
15. Build `RegisterForm` component

### Phase 3: API Integration
16. Create `lib/types.ts` with shared TypeScript types
17. Create `lib/api.ts` with fetch wrapper and 401 retry logic
18. Create Next.js API route `/api/auth/set-tokens`
19. Create Next.js API route `/api/auth/refresh`
20. Create Next.js API route `/api/auth/logout`

### Phase 4: Auth State Management
21. Implement `AuthContext` with useReducer
22. Implement `login()`, `register()`, `logout()`, `handleOAuthCallback()`
23. Implement silent refresh on AuthProvider mount
24. Create `useAuth` hook

### Phase 5: Pages & Routing
25. Build `/login` page with LoginForm + OAuthButtons
26. Build `/register` page with RegisterForm + OAuthButtons
27. Build `/auth/callback` page for OAuth token extraction
28. Build `ProtectedRoute` and `AdminRoute` guard components
29. Build `/profile` page (protected)
30. Build `/admin` page (admin-only)
31. Implement redirect logic (post-login, post-OAuth, unauthorized)

### Phase 6: Polish & Testing
32. Verify all manual test cases (sections 12.1–12.9)
33. Fix any visual inconsistencies in Light/Dark mode
34. Test responsive layout on mobile/tablet/desktop
35. Test error handling for all edge cases
36. Clean browser console of warnings/errors

---

## 15. EPIC SCRUM-5 Closure Checklist

### Backend (SCRUM-6, 7, 8, 9) ✅

- [x] User entity with Prisma schema and migrations
- [x] Registration with email/password and bcrypt hashing
- [x] Login with JWT access + refresh tokens
- [x] Token refresh with rotation
- [x] Logout with refresh token invalidation
- [x] Brute-force protection (5 attempts, 15-min lock)
- [x] Google OAuth integration
- [x] GitHub OAuth integration
- [x] OAuth account linking for existing LOCAL users
- [x] `@Roles()` decorator and `RolesGuard`
- [x] `GET /auth/me` endpoint
- [x] Admin-only route protection
- [x] 73 unit tests passing, coverage above thresholds
- [x] All 4 backend PRs merged to main

### Frontend (SCRUM-10)

- [ ] Next.js 14 project with App Router + TypeScript
- [ ] TailwindCSS with Light/Dark mode and custom theme
- [ ] Login page with email/password and OAuth buttons
- [ ] Register page with password strength validation
- [ ] OAuth callback handler
- [ ] AuthContext with secure token management
- [ ] Silent refresh on page load
- [ ] Protected routes (ProtectedRoute + AdminRoute)
- [ ] Profile page showing user data
- [ ] Admin page with role enforcement
- [ ] Responsive design on all breakpoints
- [ ] All manual test cases pass (42 test cases)
- [ ] No TypeScript errors, no console errors

### Documentation

- [ ] Backend README updated with all endpoints
- [ ] Frontend README with setup instructions
- [ ] Swagger/OpenAPI spec for backend
- [ ] This technical spec (SCRUM-10 spec)

### Final Sign-Off

- [ ] All acceptance criteria met
- [ ] Demo walkthrough of all auth flows
- [ ] EPIC SCRUM-5 marked as Done in Jira
