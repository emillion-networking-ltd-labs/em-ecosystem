# Frontend Implementation Plan: SCRUM-18 NexaCore Dashboard - Project Scaffold, Theming and Base Layout

## Overview

- **Epic**: SCRUM-17 (EM NexaCore Dashboard - Frontend Authentication System)
- **Ticket**: SCRUM-18
- **Type**: Story
- **Scope**: Frontend
- **Status**: DONE
- **What this delivers**: Complete `nexacore-dashboard` Next.js 14 App Router application scaffold, including: design system foundation (CSS custom properties, Tailwind config, dark/light theming), auth card layout, all auth UI screens (Login Email Step, Login Password Step, Register, Forgot Password), shared UI component library, and FOUC-prevention inline script. All screens aligned pixel-perfect with Figma via the three-layer workflow: Figma extract (exact values) > ui-design-system.md (tokens) > Code.

---

## Architecture Context

### Application

- **Package**: `@em-ecosystem/nexacore-dashboard`
- **Framework**: Next.js 14 App Router (`'use client'` only where interactivity required)
- **Styling**: TailwindCSS v3 with CSS custom properties (light/dark theme via `class` strategy on `<html>`)
- **Dev server**: `next dev -p 3001` (port 3001 to avoid conflict with API on 3000)

### Pages

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Root redirect to `/login` |
| `/login` | `src/app/login/page.tsx` | Auth login page (two-step: email then password) |
| `/register` | `src/app/register/page.tsx` | Auth register page |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Password recovery page |

### Component Tree

```
RootLayout (app/layout.tsx)
└── Providers (app/providers.tsx)           — ThemeProvider (SCRUM-18 snapshot; AuthProvider added by SCRUM-19)
    └── AuthLayout (layout/AuthLayout.tsx)
        ├── AuthGridLines (auth/AuthGridLines.tsx)        — decorative background grid
        ├── [auth-card]
        │   ├── Header: Logo (em-icon.png, dark:invert) + INLINE theme toggle (SunDim/Moon icons)
        │   ├── children (LoginForm | RegisterForm | ForgotPasswordForm)
        │   │   ├── LoginForm (auth/LoginForm.tsx)
        │   │   │   ├── EmailStep — email input + System Message + Create Account/Next buttons + OAuthButtons
        │   │   │   └── PasswordStep — email selector trigger (bordered pill dropdown) + password input + System Message + Forgot password? link + Sign In button
        │   │   ├── RegisterForm (auth/RegisterForm.tsx)
        │   │   │   └── email + password inputs + Password Check (5 icons with green check badges) + System Message + Back to Sign In/Create Account buttons + OAuthButtons
        │   │   └── ForgotPasswordForm (auth/ForgotPasswordForm.tsx)
        │   │       └── email input + System Message + Back to Sign In link + Send Recovery Email button
        │   └── AuthFooter (auth/AuthFooter.tsx)
        │       ├── LanguageSelector (ui/LanguageSelector.tsx)
        │       └── Nav links (Help, Privacy, Terms)
        └── GoBackSection (auth/GoBackSection.tsx)
```

### State Management

| Context | Provider | Scope |
|---|---|---|
| `ThemeContext` | `ThemeProvider` | Light/dark theme with `localStorage` persistence and `class` toggle on `<html>` |

> **Note**: `AuthContext`/`AuthProvider` was added to `Providers` by SCRUM-19. The SCRUM-18 snapshot of `providers.tsx` contained only `ThemeProvider`.

### Design System

- CSS custom properties defined in `globals.css` (:root for light, .dark for dark)
- Tailwind config maps all tokens via `var()` references
- `--color-error` and `--content-primary` stored as RGB channels (e.g., `138 17 17`) to support Tailwind opacity modifiers (`text-error/75`, `text-content-primary/50`)
- `--content-secondary` defined as pre-mixed `rgba()` due to existing usage pattern
- FOUC prevention via inline `<script>` in `layout.tsx` that checks localStorage/system preference before paint

### Shared UI Components

| Component | Path | Description |
|---|---|---|
| `Button` | `ui/Button.tsx` | Base button with variants (primary/secondary/outline/danger), sizes (sm/md/lg), loading state via Spinner |
| `Input` | `ui/Input.tsx` | Text/email/password input with label, error state, eye toggle, spinner, left icon slot |
| `Spinner` | `ui/Spinner.tsx` | CSS border-spin loading indicator (sm/md/lg) |
| `InfinitySpinner` | `ui/InfinitySpinner.tsx` | DaisyUI-style infinity loading indicator (inline SVG + CSS keyframes, xs-xl sizes) |
| `RingSpinner` | `ui/RingSpinner.tsx` | DaisyUI-style ripple/sonar ring indicator (inline SVG + SMIL animation, xs-xl sizes) |
| `Divider` | `ui/Divider.tsx` | Horizontal rule with optional centered label |
| `ErrorAlert` | `ui/ErrorAlert.tsx` | Error alert block with icon, message, and optional dismiss button |
| `ThemeToggle` | `ui/ThemeToggle.tsx` | Standalone theme toggle button with mounted guard (used in dashboard pages, NOT in AuthLayout) |
| `LanguageSelector` | `ui/LanguageSelector.tsx` | Borderless selector trigger with upward popover, search, localStorage persistence |
| `GoogleIcon` | `icons/GoogleIcon.tsx` | Monochrome Google "G" SVG icon (currentColor) |

---

## Endpoint Specification

No API endpoints created or consumed in this story. API integration (login, register, OAuth) deferred to SCRUM-19. Form components include placeholder handlers (`console.log` / empty `async` functions) and `TODO` comments marking future API call sites.

> **Note**: The current codebase shows `useAuth()` hooks and `apiClient` calls inside LoginForm/RegisterForm/ForgotPasswordForm. These were wired up by SCRUM-19 and SCRUM-20, not SCRUM-18.

---

## Database Changes

No database changes. Frontend-only story.

---

## Files to Create

| # | File Path | Description |
|---|---|---|
| 1 | `package.json` | Project manifest: `@em-ecosystem/nexacore-dashboard`, Next 14.2.21, React ^18.3.1, lucide-react ^0.575.0, TailwindCSS, TypeScript |
| 2 | `tsconfig.json` | TypeScript configuration with `@/` path alias |
| 3 | `tailwind.config.ts` | Tailwind config: darkMode 'class', design tokens (surface, content, border, error, accent, etc.), custom fontSize, boxShadow, borderRadius, spacing scales |
| 4 | `next.config.mjs` | Next.js config: `images.remotePatterns` for Google/GitHub OAuth avatars |
| 5 | `postcss.config.mjs` | PostCSS with Tailwind and Autoprefixer plugins |
| 6 | `public/em-icon.png` | EM logo asset (supports `dark:invert`) |
| 7 | `src/app/globals.css` | Full design token system: `:root` (light) + `.dark` CSS custom properties, `@layer base/components/utilities`, `.auth-card` and `.card` component classes, autofill override, infinity-spinner keyframes |
| 8 | `src/app/layout.tsx` | Root layout: Inter font, metadata, FOUC prevention `THEME_INIT_SCRIPT` inline script, `Providers` wrapper |
| 9 | `src/app/providers.tsx` | Client provider wrapper: `ThemeProvider` (SCRUM-18 snapshot; AuthProvider added later by SCRUM-19) |
| 10 | `src/app/page.tsx` | Root page: server-side `redirect('/login')` |
| 11 | `src/app/login/page.tsx` | Login page: `AuthLayout` + `LoginForm` (GuestRoute and Suspense wrapping added by SCRUM-19) |
| 12 | `src/app/register/page.tsx` | Register page: `AuthLayout` + `RegisterForm` (GuestRoute wrapping added by SCRUM-19) |
| 13 | `src/app/forgot-password/page.tsx` | Password recovery page: `AuthLayout` + `ForgotPasswordForm` |
| 14 | `src/components/layout/AuthLayout.tsx` | Auth card layout: grid background, card container with inner border, INLINE theme toggle (SunDim/Moon from lucide-react), logo, children slot, AuthFooter, GoBackSection |
| 15 | `src/components/auth/LoginForm.tsx` | Two-step login: EmailStep (email input, System Message, Create Account + Next buttons, OAuthButtons) and PasswordStep (email selector trigger bordered pill, password input, System Message, Forgot password? link, Sign In button with InfinitySpinner) |
| 16 | `src/components/auth/RegisterForm.tsx` | Registration form: email + password inputs, Password Check (5 requirement icons with green check badges: length>=8, digit, special, uppercase, lowercase), System Message, Back to Sign In + Create Account buttons with InfinitySpinner, OAuthButtons |
| 17 | `src/components/auth/ForgotPasswordForm.tsx` | Password recovery: email input, System Message, Back to Sign In link, Send Recovery Email button with InfinitySpinner, success state with confirmation message |
| 18 | `src/components/auth/OAuthButtons.tsx` | OR divider + Google (`<a href>` to backend) + GitHub (`<a href>` to backend) buttons. Uses anchor tags with `href` pointing to `API_BASE_URL/auth/{provider}`, NOT click handlers |
| 19 | `src/components/auth/AuthFooter.tsx` | Footer: LanguageSelector (flex-1) + Help/Privacy/Terms nav links |
| 20 | `src/components/auth/AuthGridLines.tsx` | Decorative SVG grid background (percentage-based positions from Figma 1440x1024 artboard), `aria-hidden="true"` |
| 21 | `src/components/auth/GoBackSection.tsx` | Below-card link: House icon + "Go back to the Home Page" (Link/Simple style, 75% opacity) |
| 22 | `src/components/ui/Button.tsx` | Reusable button: variants (primary/secondary/outline/danger), sizes (sm/md/lg), loading state with Spinner |
| 23 | `src/components/ui/Input.tsx` | Reusable input: label, error state (label + outline + eye icon + error message all at error/75 opacity), password eye toggle, loading spinner, leftIcon slot, ARIA attributes |
| 24 | `src/components/ui/Spinner.tsx` | CSS border-spin loading indicator (sm/md/lg sizes) |
| 25 | `src/components/ui/InfinitySpinner.tsx` | DaisyUI loading-infinity replica: inline SVG with CSS @keyframes, figure-8 lemniscate path, xs-xl size scale |
| 26 | `src/components/ui/RingSpinner.tsx` | DaisyUI loading-ring replica: inline SVG with SMIL animate elements, staggered ripple circles, xs-xl size scale |
| 27 | `src/components/ui/Divider.tsx` | Horizontal rule with optional centered label text |
| 28 | `src/components/ui/ErrorAlert.tsx` | Error alert block: icon + message + optional dismiss button, error-bg/error-border styling |
| 29 | `src/components/ui/ThemeToggle.tsx` | Standalone theme toggle with mounted guard (prevents hydration mismatch), SVG sun/moon icons |
| 30 | `src/components/ui/LanguageSelector.tsx` | Borderless selector trigger, upward popover with search bar and results card, localStorage persistence (`nexacore-language` key), EN/ES/FR initial set |
| 31 | `src/components/icons/GoogleIcon.tsx` | Monochrome Google "G" SVG icon using `currentColor` (maps Figma's lucide/chromium placeholder) |
| 32 | `src/context/ThemeContext.tsx` | React context: light/dark theme, localStorage persistence, class toggle on `<html>`, system preference detection |
| 33 | `src/hooks/useTheme.ts` | Convenience hook consuming `ThemeContext` with guard for missing provider |
| 34 | `src/lib/api.ts` | `ApiClient` class: fetch wrapper with Authorization header, silent refresh, error parsing (wired up by SCRUM-19) |
| 35 | `src/lib/types.ts` | Shared TypeScript types: `SafeUser`, `AuthResponse`, `ErrorResponse`, `PaginatedResponse`, DTOs |
| 36 | `src/lib/constants.ts` | App constants: `APP_NAME`, `APP_DESCRIPTION` |

---

## Files to Modify

| File | Change Description |
|---|---|
| `next.config.mjs` | Added `images.remotePatterns` for `lh3.googleusercontent.com` (Google) and `avatars.githubusercontent.com` (GitHub) to support OAuth avatar rendering via `next/image` |

> **Note**: This is a new project scaffold so virtually all files are "created". The `next.config.mjs` entry documents the specific modification to the default Next.js config generated by `create-next-app`.

---

## Implementation Steps

### Step 0: Project Scaffold

- **Action**: Initialize `nexacore-dashboard` as Next.js 14 App Router application inside monorepo
- **Package**: `@em-ecosystem/nexacore-dashboard`
- **Config files**: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.mjs`, `postcss.config.mjs`
- **Public assets**: `em-icon.png` (logo, supports `dark:invert`)
- **Dev port**: 3001 (`next dev -p 3001`)

### Step 1: Design System Foundation

- **File**: `src/app/globals.css`
- **Action**: Define all CSS custom properties for light and dark themes
- **Key decisions**:
  - `:root` (light) and `.dark` scopes with full token set: surface, content, border, error, warning, info, success, hover, accent, input states, dashboard metrics
  - `--color-error` stored as RGB channels (`138 17 17` light / `239 68 68` dark) to support Tailwind opacity modifiers (`text-error/75`)
  - `--content-primary` stored as RGB channels (`28 28 28` light / `245 245 245` dark) for `text-content-primary/50` etc.
  - `--content-secondary` defined as pre-mixed `rgba()` (not raw channels) due to existing usage pattern
  - All text/icon colors use `#1c1c1c` (not `#000000`) with opacity variants (light mode)
  - `.auth-card` CSS class: `max-width: 750px`, `border`, `shadow-card`, `rounded-3xl`, flex column
  - `.card` CSS class: generic card pattern with `rounded-2xl`, `p-6`, `shadow-card`
  - Autofill override: `-webkit-box-shadow` inset trick for consistent autofill background
  - `@keyframes infinity-spin`: CSS animation for InfinitySpinner component

- **File**: `tailwind.config.ts`
- **Action**: Map all CSS tokens to Tailwind utilities
- **Key decisions**:
  - `darkMode: 'class'` strategy
  - `error` and `content.primary` use `rgb(var(...) / <alpha-value>)` pattern for opacity modifier support
  - Other colors use `var()` directly
  - Custom `fontSize` scale: display, heading-lg/md/sm, body-lg/md/sm, caption
  - Custom `boxShadow`: card, avatar
  - Custom `borderRadius`: xs through full/circle
  - Custom `spacing` scale aligned with design system

### Step 2: Theme System

- **File**: `src/context/ThemeContext.tsx`
- **Action**: React context with `theme`, `toggleTheme`, `setTheme`
- **Features**: localStorage persistence, system preference detection via `matchMedia`, class toggle on `<html>`

- **File**: `src/hooks/useTheme.ts`
- **Action**: Convenience hook consuming `ThemeContext` with error guard

- **File**: `src/app/layout.tsx`
- **Action**: FOUC prevention via `THEME_INIT_SCRIPT` — inline `<script>` in `<head>` that reads localStorage/system preference and adds `dark` class BEFORE first paint. Uses `suppressHydrationWarning` on `<html>` to prevent React mismatch.

### Step 3: Auth Layout

- **File**: `src/components/layout/AuthLayout.tsx`
- **Figma**: Auth Card (Login Card / Register Card)
- **Key decisions**:
  - Card uses `.auth-card` CSS class (defined in `globals.css`): `max-width: 750px`
  - Inner container: `style={{ borderRadius: '24px 24px 0 0' }}` (top rounded, footer square-top), `border border-border-default bg-surface-primary p-6`
  - Mobile safe-area: `px-2 py-2` on outer wrapper to prevent card touching viewport edges
  - AuthFooter uses bottom rounded corners
  - **INLINE theme toggle**: AuthLayout renders SunDim/Moon icons directly from lucide-react via `useTheme()` hook. It does NOT use the `ThemeToggle` component (which is a standalone reusable component for dashboard pages). The inline toggle uses `text-content-primary/50` with hover to full opacity, 16px icon size.
  - Logo: `next/image` with `dark:invert`, 60x24 dimensions, priority loading

### Step 4: Auth Pages

- **Files**: `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/forgot-password/page.tsx`
- **Action**: Thin page components wrapping `AuthLayout` + form components with metadata
- **SCRUM-18 snapshot**: Pages wrap `AuthLayout` + Form directly, without `GuestRoute` or `Suspense`
  > **Note**: `GuestRoute` wrapping on login/register and `Suspense` on login were added by SCRUM-19. The forgot-password page never received `GuestRoute`.

### Step 5: LoginForm -- Email Step

- **File**: `src/components/auth/LoginForm.tsx` (EmailStep branch)
- **Figma**: Auth-Login-Step-Email
- **Layout**: Horizontal body (`flex-col gap-6 md:flex-row`), Title Group (330px) + Form (348px)
- **Key measurements**: Email Field container `h-[116px]` (fixed), System Message `h-6` (24px)
- **Buttons**: `flex gap-2` with `flex-1` each -- Create Account (Secondary/Outline, `<Link href="/register">`) + Next (Primary, `type="submit"`)
- **`whitespace-nowrap`** on "Create Account" to prevent text wrapping on mobile
- **OAuthButtons**: Below buttons with `mt-2`

### Step 6: LoginForm -- Password Step

- **File**: `src/components/auth/LoginForm.tsx` (PasswordStep component)
- **Figma**: Auth-Login-Step-Password
- **Key feature**: Email Selector Trigger replacing the subtitle
  - Pattern: **Selector Trigger (Bordered variant)** from ui-design-system.md
  - Closed state: `border-border-default`, `bg-transparent`, `text-content-primary`
  - Open state: `border-border-default`, `bg-surface-primary`, `text-content-primary`
  - Pill shape: `rounded-full`, `h-10`, `px-4`
  - Dropdown: `rounded-3xl`, `p-4`, `shadow-card`, `w-[300px]` (simple, no search bar)
  - Row item: `h-10`, avatar circle (32px, initial letter), `text-[15px]`
  - Action link: "Try a different email address" -- Link/Simple pattern (`mt-4`, 75% > 100%, hover:underline), calls `onChangeEmail()` to reset to email step
  - Click-outside: `useRef` + `mousedown` event listener
  - Text centering: `leading-none` on email span to eliminate line-height asymmetry
- **Password Field**: `min-h-[146px]` (not fixed, allows System Message expansion), System Message `h-6` with error display, "Forgot password?" link (Link/Simple pattern, right-aligned, `<Link href="/forgot-password">`)
- **Sign In button**: Full width, Primary style, InfinitySpinner loading overlay
  > **Note**: The current code wires up `useAuth()` login call, which was added by SCRUM-19. SCRUM-18 snapshot had a placeholder handler.

### Step 7: RegisterForm

- **File**: `src/components/auth/RegisterForm.tsx`
- **Figma**: Auth-Register
- **Layout**: Horizontal body (`flex-col gap-6 md:flex-row`), Title Group (330px, inner max-w-[300px]) + Form (348px)
- **Title Group**: "Create Account" title + subtitle only (no "Already have an account?" link -- removed per Figma update)
- **Form Fields**: `min-h-[204px]` (not fixed, allows System Message expansion) containing email + password inputs + System Message slot
- **Password Check** (System Message slot): 5 requirement icons with green check badges
  - Icons: `RulerDimensionLine` (length >= 8), `Hash` (digit), `Asterisk` (special char), `CaseUpper` (uppercase), `CaseLower` (lowercase)
  - Each icon: 24x24 container with rounded-lg border, 14px icon at content-primary/50
  - Met state: 14x14 green check badge at bottom-right (`Check` icon, 8px, `text-green-800`)
  - Shown only while password has content and no error is active
- **Buttons**: `flex gap-2` with `flex-1` each -- "Back to Sign In" (Secondary/Outline, `<Link href="/login">`) + "Create Account" (Primary with InfinitySpinner loading overlay)
- **OAuthButtons**: Below buttons with `mt-2`
  > **Note**: The current code wires up `useAuth()` register call, which was added by SCRUM-19. SCRUM-18 snapshot had a placeholder handler.

### Step 8: ForgotPasswordForm

- **File**: `src/components/auth/ForgotPasswordForm.tsx`
- **Figma**: Auth-Forgot-Password
- **Layout**: Same horizontal pattern as LoginForm/RegisterForm
- **Form**: Email input + System Message + "Back to Sign In" link (right-aligned) + "Send Recovery Email" button with InfinitySpinner
- **Success state**: Replaces form after submission with confirmation message: "Recovery email sent. If an account exists for {email}..."
- **Field container**: `min-h-[146px]` matching PasswordStep layout
  > **Note**: ForgotPasswordForm uses `apiClient.post('/auth/forgot-password', ...)` which was wired to the real API by SCRUM-19. SCRUM-18 snapshot may have had a placeholder.

### Step 9: Shared Auth Components

- **OAuthButtons** (`auth/OAuthButtons.tsx`): OR divider (1px lines + "OR" text) + Google + GitHub buttons (Secondary/Outline style, `gap-2`, `px-6 py-2.5`). Uses `<a href={API_BASE_URL/auth/{provider}}>` anchor tags for full-page redirect to backend OAuth initiation. NOT click handlers with `fetch()`/`router.push()`.
- **AuthFooter** (`auth/AuthFooter.tsx`): LanguageSelector (flex-1) + Help/Privacy/Terms nav links (`text-content-primary/75` with hover to full)
- **AuthGridLines** (`auth/AuthGridLines.tsx`): Decorative grid background with percentage-based line positions from Figma 1440x1024 artboard. `aria-hidden="true"`, `pointer-events-none`.
- **GoBackSection** (`auth/GoBackSection.tsx`): Below-card navigation: House icon (16px) + "Go back to the Home Page" link (Link/Simple style, `text-content-primary/75`). `z-[1]` to render above grid lines.

### Step 10: Input Component

- **File**: `src/components/ui/Input.tsx`
- **States**: default / hover / focus / error / disabled / loading
- **Error unification**: All error elements use `--color-error` at 75% opacity:
  - Label: `text-error/75`
  - Outline: `outline-error/75`
  - Eye icon: `text-error/75`
  - Error message icon (`TriangleAlert`): `text-error/75`
  - Error message text: `text-error/75`
- **Outline**: `outline-2 outline-offset-2` (OUTSIDE, Figma convention), transparent by default, `outline-content-primary/75` on hover/focus
- **Eye icon**: toggles `Eye`/`EyeOff` (lucide-react), inherits error color
- **ARIA**: `aria-invalid` on input, `aria-describedby` linking to error message, `aria-label` on eye toggle button
- **Autofill**: Handled by global CSS rule in `globals.css`

### Step 11: LanguageSelector Component

- **File**: `src/components/ui/LanguageSelector.tsx`
- **Pattern**: Selector Trigger (Borderless variant) -- `border-transparent` in closed state, visible border in open state
- **Popover**: Opens upward (`bottom-full`), Results card above Search Bar (footer context)
- **Search**: Live filter on name + code via `useMemo`, clears on close, auto-focuses on open
- **Persistence**: `localStorage` with key `nexacore-language`
- **Languages**: EN (English UK), ES (Espanol), FR (Francais) -- initial set
- **Click-outside**: `useRef` + `mousedown` event listener (same pattern as email selector)

### Step 12: Additional UI Components

- **Button** (`ui/Button.tsx`): Variants (primary/secondary/outline/danger), sizes (sm/md/lg), loading state with Spinner, fullWidth option
- **Spinner** (`ui/Spinner.tsx`): CSS border-spin, 3 sizes (sm=16px, md=20px, lg=32px)
- **InfinitySpinner** (`ui/InfinitySpinner.tsx`): DaisyUI loading-infinity replica with inline SVG + CSS @keyframes (`infinity-spin` defined in globals.css). Figure-8 S-curve path. 5 sizes (xs=16, sm=20, md=24, lg=28, xl=32). `vectorEffect="non-scaling-stroke"` for consistent 2px stroke at all sizes.
- **RingSpinner** (`ui/RingSpinner.tsx`): DaisyUI loading-ring replica with inline SVG + SMIL `<animate>` elements. Two staggered ripple circles (offset by -0.9s of 1.8s period). Same 5-size scale.
- **Divider** (`ui/Divider.tsx`): Horizontal rule or labeled divider with `bg-border-default`
- **ErrorAlert** (`ui/ErrorAlert.tsx`): Alert block with error icon, message, optional dismiss button. Uses `error-bg`, `error-border`, `error` color tokens.
- **ThemeToggle** (`ui/ThemeToggle.tsx`): Standalone theme toggle with `mounted` guard to prevent hydration mismatch. Uses inline SVG sun/moon icons. Intended for dashboard pages (AuthLayout uses its own inline toggle).
- **GoogleIcon** (`icons/GoogleIcon.tsx`): Monochrome Google "G" using `currentColor` fill. Maps Figma's lucide/chromium placeholder to actual Google brand mark.

### Step 13: Configuration

- **File**: `next.config.mjs` (NOTE: `.mjs` extension, NOT `.ts`)
- **Action**: Added `images.remotePatterns` allowing `lh3.googleusercontent.com` (Google OAuth avatars) and `avatars.githubusercontent.com` (GitHub OAuth avatars) for `next/image` rendering
- **File**: `src/lib/constants.ts` — App-level constants (`APP_NAME`, `APP_DESCRIPTION`)
- **File**: `src/lib/types.ts` — Shared TypeScript types (`SafeUser`, `AuthResponse`, `ErrorResponse`, `PaginatedResponse`, DTOs)
- **File**: `src/lib/api.ts` — `ApiClient` singleton with fetch wrapper, Authorization header, silent refresh, error parsing

### Step 14: Design System Documentation Alignment

- **File**: `ai-specs/specs/ui-design-system.md`
- **Updates**:
  - Added **Selector Trigger** section with two variants (Borderless / Bordered) comparison table
  - Documented **Action Link** pattern within popovers
  - Marked **Search Bar** as optional
  - Corrected text overflow from `truncate` to `whitespace-nowrap`
  - Added popover positioning rules for both upward and downward expansion

---

## Testing Checklist

- [x] Login email step renders correctly in light and dark mode
- [x] Login password step renders with email selector trigger (bordered pill)
- [x] Email selector dropdown opens/closes, click-outside dismisses
- [x] "Try a different email address" navigates back to email step
- [x] Register page renders with two-button layout (Back to Sign In + Create Account)
- [x] Register Password Check shows 5 icons with green check badges as criteria are met
- [x] Forgot password page renders with email input and recovery button
- [x] Forgot password success state replaces form with confirmation message
- [x] Input error state: label, outline, eye icon, message all use error/75
- [x] Dark mode: all tokens resolve correctly, logo inverts, links remain visible
- [x] FOUC prevention: no flash of light mode when dark is persisted (inline script)
- [x] Mobile: card has safe-area padding (`px-2 py-2`), button text does not wrap (`whitespace-nowrap`)
- [x] LanguageSelector persists selection to localStorage
- [x] LanguageSelector popover opens upward (footer context)
- [x] System Message section (24px) present in all auth forms
- [x] OAuthButtons use `<a href>` anchors to backend OAuth URLs
- [x] InfinitySpinner renders as loading overlay on submit buttons
- [x] ThemeToggle inline in AuthLayout works (SunDim/Moon toggle)
- [ ] Unit tests -- deferred to SCRUM-19 alongside AuthContext integration

---

## Error Handling Patterns

| Pattern | Implementation |
|---|---|
| Input validation | `error`/`hasError` props on `<Input>` trigger full error state (label + outline + icon + message at error/75 opacity) |
| Form submission guards | `if (!formData.email \|\| !formData.password) return` before API calls |
| Email validation | Regex check (`/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`) with inline error message |
| System Message slot | Fixed-height (24px) section in all forms: shows error OR password check, never both. `min-h-6` when error active (allows expansion for long messages), `h-6` when empty |
| Auth API errors | Deferred to SCRUM-19 (`AuthContext` integration -- `TODO` comments in place at SCRUM-18 snapshot) |
| Loading state | `isLoading` disables submit button with `disabled:pointer-events-none`, shows InfinitySpinner overlay with content at `opacity-30` |
| OAuth error | `?error=oauth_failed` URL parameter read by LoginForm (wired by SCRUM-19) |

---

## Non-Functional Requirements

### Performance
- **First paint**: < 2 seconds target on localhost dev server
- **FOUC prevention**: Inline `<script>` in `<head>` reads localStorage theme before first paint, preventing flash of wrong theme
- **Font loading**: Inter loaded via `next/font/google` with `subsets: ['latin']` for optimal loading
- **Logo**: Priority loading via `next/image` `priority` attribute
- **No JavaScript-dependent layout**: Auth card dimensions are CSS-driven (`.auth-card` class), not JS-computed

### Accessibility
- **Semantic HTML**: `<form>`, `<label>`, `<button>`, `<nav>` elements used correctly
- **Keyboard navigation**: All interactive elements are focusable, forms submit on Enter
- **ARIA attributes**: `aria-invalid`, `aria-describedby` on inputs; `aria-label` on icon buttons; `aria-hidden="true"` on decorative elements (AuthGridLines, spinner SVGs)
- **Error announcements**: Error messages use `role="alert"` in Input component
- **Focus management**: Auto-focus on first input of each form/step, search input auto-focuses when LanguageSelector opens

### Responsiveness
- **Mobile-first**: `flex-col` default, `md:flex-row` for desktop two-column layout
- **Breakpoints**: Tailwind `md:` (768px) for horizontal form layout
- **Safe area**: `px-2 py-2` padding on AuthLayout prevents card touching viewport edges
- **Text wrapping prevention**: `whitespace-nowrap` on two-button layouts to prevent label wrapping at narrow widths
- **Truncation**: `truncate` on email/language display in selector dropdowns

---

## Dependencies

### Runtime Dependencies (from `package.json`)

| Package | Version | Purpose |
|---|---|---|
| `next` | `14.2.21` | App Router framework |
| `react` | `^18.3.1` | UI library |
| `react-dom` | `^18.3.1` | React DOM renderer |
| `lucide-react` | `^0.575.0` | Icons: ChevronDown, Eye, EyeOff, TriangleAlert, AlertTriangle, Search, X, SunDim, Moon, Github, House, RulerDimensionLine, Hash, Asterisk, CaseUpper, CaseLower, Check |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | `^3.4.4` | Utility-first CSS framework |
| `autoprefixer` | `^10.4.19` | CSS vendor prefixing |
| `postcss` | `^8.4.38` | CSS processing pipeline |
| `typescript` | `^5.4.5` | Type checking |
| `eslint` | `^8.57.0` | Linting |
| `eslint-config-next` | `14.2.21` | Next.js ESLint rules |
| `@types/node` | `^20.14.0` | Node.js type definitions |
| `@types/react` | `^18.3.3` | React type definitions |
| `@types/react-dom` | `^18.3.0` | React DOM type definitions |

### Built-in Next.js Modules Used

- `next/image` -- logo rendering with `dark:invert`
- `next/link` -- client-side navigation between auth pages
- `next/font/google` -- Inter font loading
- `next/navigation` -- `redirect()` (server), `useRouter()`/`useSearchParams()` (client)

> **Note**: `recharts` (`^3.7.0`) is present in the current `package.json` but was added by SCRUM-21 (dashboard charts), NOT by SCRUM-18.

---

## Documentation Updates

| File | Change |
|---|---|
| `ai-specs/specs/ui-design-system.md` | Added Selector Trigger section (Borderless/Bordered variants), Action Link pattern, Search Bar optional flag, popover positioning rules, text overflow correction |
| `ai-specs/changes/plans/SCRUM-18_frontend.md` | This plan document (original created with SCRUM-18, now enriched to 14-section template) |

---

## Definition of Done

- [x] Project scaffold created with Next.js 14 App Router, TailwindCSS, TypeScript
- [x] Design system foundation: all CSS custom properties defined for light and dark themes
- [x] Tailwind config maps all design tokens with opacity modifier support where needed
- [x] Theme system: ThemeContext, useTheme hook, localStorage persistence, FOUC prevention inline script
- [x] AuthLayout component with card, inline theme toggle, footer, grid background, go-back section
- [x] Login page: two-step flow (email step with validation, password step with email selector trigger)
- [x] Register page: email + password with 5-icon password check and green check badges
- [x] Forgot Password page: email input with success state
- [x] OAuthButtons using `<a href>` anchor pattern to backend OAuth URLs
- [x] All shared UI components created: Button, Input, Spinner, InfinitySpinner, RingSpinner, Divider, ErrorAlert, ThemeToggle, LanguageSelector, GoogleIcon
- [x] LanguageSelector with upward popover, search, localStorage persistence
- [x] Mobile responsive: safe-area padding, horizontal-to-vertical layout, whitespace-nowrap on buttons
- [x] Dark mode fully functional across all components and pages
- [x] Accessibility: semantic HTML, ARIA attributes, keyboard navigation, focus management
- [x] `next.config.mjs` configured with remotePatterns for OAuth avatars
- [x] ui-design-system.md updated with Selector Trigger documentation
- [x] Code quality: TypeScript strict (no `any`), `'use client'` only on interactive components, no unused imports
- [x] Three-layer workflow verified: Figma > ui-design-system.md > Code aligned

---

## UI/UX Decisions

| Decision | Rationale |
|---|---|
| Two-step login (email > password) | Matches Google/Microsoft auth pattern; allows email-based routing in future (SSO, magic link) |
| Email selector trigger (Bordered variant) | Standalone selector context -- border always visible per design system |
| Inline theme toggle in AuthLayout (not ThemeToggle component) | AuthLayout renders SunDim/Moon directly for simpler integration; ThemeToggle component is reusable for dashboard pages with mounted guard |
| `whitespace-nowrap` on two-button layouts | Prevents text wrapping when both buttons share equal `flex-1` width on narrow viewports |
| `leading-none` on email trigger span | Eliminates Inter font line-height asymmetry causing perceived misalignment in pill trigger |
| `--color-error` as RGB channels | Enables Tailwind opacity modifier syntax (`text-error/75`) across all error elements |
| System Message always rendered (even empty) | Fixed 24px section ensures layout stability -- no height shift when error/hint appears |
| Mobile `px-2 py-2` on AuthLayout | Prevents auth card from touching viewport edges; GoBackSection also benefits |
| `min-h-[146px]` (not fixed `h-[117px]`) for password field | Allows System Message section to expand for multi-line errors without clipping |
| `min-h-[204px]` for register form fields | Accommodates email + password + System Message (Password Check or error) |
| `h-[116px]` for email field in login | Fixed height for single-input + System Message layout (email step only) |
| OAuthButtons via `<a href>` anchors | Full-page redirect to backend OAuth initiation; avoids CORS and cookie issues of fetch-based approach |
| 5 password requirement icons with check badges | Visual password strength indicator matching Figma "Password Check" component |
| FOUC prevention inline script | Prevents flash of light mode when user has dark preference; must execute before React hydration |
| InfinitySpinner for button loading | Lightweight SVG-based animation matching DaisyUI style without DaisyUI dependency |

---

## Notes

### Scope Boundary

This plan documents SCRUM-18's deliverables exclusively. The codebase has evolved through four stories (SCRUM-18 through SCRUM-21). Where the current code includes features from later stories, these are noted:

- **SCRUM-19 additions**: `AuthContext`/`AuthProvider` in providers.tsx, `useAuth()` hook usage in forms, `GuestRoute` wrapping on login/register pages, `Suspense` boundary on login page, `apiClient` method wiring, real API call handlers in LoginForm/RegisterForm
- **SCRUM-20 additions**: OAuth callback page, `OAuthCallbackHandler` component, OAuth exchange flow
- **SCRUM-21 additions**: `recharts` dependency in package.json, dashboard/profile/admin pages, `ThemeToggle` usage in dashboard sidebar

### Implementation Order

1. Step 0 -- Project scaffold
2. Step 1 -- Design system (globals.css + tailwind.config.ts)
3. Step 2 -- Theme system (ThemeContext + useTheme + FOUC prevention)
4. Step 3 -- AuthLayout
5. Step 4 -- Auth pages (thin wrappers)
6. Step 9 -- Shared auth components (AuthGridLines, AuthFooter, GoBackSection, OAuthButtons)
7. Step 10 -- Input component
8. Step 11 -- LanguageSelector
9. Step 12 -- Additional UI components (Button, Spinner, InfinitySpinner, RingSpinner, Divider, ErrorAlert, ThemeToggle, GoogleIcon)
10. Step 5 -- LoginForm Email Step
11. Step 6 -- LoginForm Password Step
12. Step 7 -- RegisterForm
13. Step 8 -- ForgotPasswordForm
14. Step 13 -- Configuration (next.config.mjs, lib files)
15. Step 14 -- Documentation alignment

### Next Stories

- **SCRUM-19**: Auth pages, ApiClient and AuthContext -- wire up real API calls, implement auth state management
- **SCRUM-20**: OAuth integration and callback handling
- **SCRUM-21**: Protected routes, profile and admin dashboard
