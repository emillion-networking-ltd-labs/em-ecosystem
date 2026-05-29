# Frontend Implementation Plan: SCRUM-188 Add error.tsx Boundaries to Next.js Auth Routes

## 1. Overview

Add Next.js App Router error boundaries (`error.tsx` and `global-error.tsx`) to provide graceful error recovery across the application, with particular focus on auth routes. Currently the app has **zero** error boundaries — any unhandled runtime error renders a blank screen or the default Next.js error overlay.

**Key finding**: The Jira ticket references an `(auth)` route group, but the actual codebase uses **flat auth routes** (`login/`, `register/`, `forgot-password/`, `reset-password/`, `verify-email/`, `verify-email-change/`, `auth/callback/`, `activation/check-email/`, `password-reset/check-email/`). Creating a route group would be a structural refactor outside this ticket's scope. Instead, we'll create:

1. **`src/app/global-error.tsx`** — Root layout error boundary (catches errors in `layout.tsx` itself)
2. **`src/app/error.tsx`** — App-level error boundary (catches errors in all routes, including auth)

This covers all auth routes without restructuring, since `error.tsx` at the app root catches errors from all child routes.

## 2. Architecture Context

- **Components involved**: New `error.tsx` and `global-error.tsx` pages (must be Client Components per Next.js convention)
- **Existing UI components**: `Button` (`src/components/ui/Button.tsx`), `ErrorAlert` (`src/components/ui/ErrorAlert.tsx`)
- **Layout**: Auth pages use `AuthLayout` (`src/components/layout/AuthLayout.tsx`) — the error boundary renders **outside** AuthLayout since it replaces the erroring page segment
- **Design tokens**: Error colors from `ui-design-system.md` — `--color-error` (#8a1111), `--color-error-bg` (#fef2f2), `--color-error-border` (#f5c6c6)
- **Styling**: TailwindCSS utility classes using existing semantic tokens (`text-error`, `bg-error-bg`, etc.)

### Files Referenced

| File | Purpose |
|------|---------|
| `nexacore-dashboard/src/app/layout.tsx` | Root layout — `global-error.tsx` catches its errors |
| `nexacore-dashboard/src/app/login/page.tsx` | Example auth page pattern (GuestRoute + AuthLayout) |
| `nexacore-dashboard/src/components/ui/Button.tsx` | Reusable button for "Try again" action |
| `nexacore-dashboard/src/components/ui/ErrorAlert.tsx` | Existing error display component (reference for styling) |
| `nexacore-dashboard/src/app/globals.css` | CSS variables and theme tokens |

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-188-frontend`
- **Implementation Steps**:
  1. Ensure on latest `main`: `git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-188-frontend`
  3. Verify: `git branch`

### Step 1: Create `global-error.tsx` (Root Layout Error Boundary)

- **File**: `nexacore-dashboard/src/app/global-error.tsx`
- **Action**: Create the root-level error boundary that catches errors in `layout.tsx` itself
- **Implementation Steps**:
  1. Create `global-error.tsx` as a `'use client'` component (mandatory per Next.js)
  2. **IMPORTANT**: `global-error.tsx` replaces the **entire** `<html>` and `<body>` — it must include its own `<html>` and `<body>` tags
  3. Accept `{ error, reset }` props (Next.js ErrorBoundary interface)
  4. Render a minimal, self-contained error UI (no external component imports — layout may be broken)
  5. Use inline styles or minimal Tailwind classes (CSS may not be loaded if layout errored)
  6. Include a "Try again" button calling `reset()` and a "Go to login" link as fallback
  7. Log error to console in development (`useEffect` on error)
- **Component Signature**:
  ```typescript
  'use client';
  export default function GlobalError({
    error,
    reset,
  }: {
    error: Error & { digest?: string };
    reset: () => void;
  }): JSX.Element
  ```
- **Implementation Notes**:
  - Must be self-contained: no `AuthLayout`, no `Button` import, no `useTheme` — the entire layout tree is broken
  - Use inline styles for critical styling since `globals.css` may not be available
  - Include the Inter font via `<link>` or use system font stack as fallback

### Step 2: Create `error.tsx` (App-Level Error Boundary)

- **File**: `nexacore-dashboard/src/app/error.tsx`
- **Action**: Create the app-level error boundary that catches errors in all routes (auth + dashboard + admin + profile)
- **Implementation Steps**:
  1. Create `error.tsx` as a `'use client'` component
  2. Accept `{ error, reset }` props
  3. Since the root `layout.tsx` is intact (it wraps this boundary), we CAN use:
     - TailwindCSS classes (globals.css is loaded)
     - `Button` component from `src/components/ui/Button.tsx`
     - Theme-aware tokens
  4. Render a centered error card matching the auth card visual style:
     - Centered on screen with `min-h-screen flex items-center justify-center`
     - Error icon (inline SVG, matching ErrorAlert pattern)
     - "Something went wrong" heading
     - Error message (in non-production) or generic message
     - "Try again" button (calls `reset()`)
     - "Go back home" link (navigates to `/`)
  5. Use `useEffect` to log error details in development
- **Component Signature**:
  ```typescript
  'use client';
  export default function Error({
    error,
    reset,
  }: {
    error: Error & { digest?: string };
    reset: () => void;
  }): JSX.Element
  ```
- **Implementation Notes**:
  - Do NOT expose raw error messages in production — check `process.env.NODE_ENV`
  - Error `digest` is a server-generated hash for server-side errors — display it as a reference ID
  - Style using existing design tokens: `bg-surface-primary`, `text-content-primary`, `border-border-default`
  - "Try again" button uses `Button` component with `variant="primary"`
  - "Go back home" uses `Button` component with `variant="secondary"` or a plain link

### Step 3: Write Tests

- **File**: `nexacore-dashboard/tests/components/error-boundaries.test.tsx`
- **Action**: Write Jest + RTL tests for both error boundary components
- **Implementation Steps**:
  1. **Test `error.tsx`**:
     - Renders error message
     - Calls `reset` when "Try again" is clicked
     - Shows "Go back home" link
     - Does NOT expose raw error messages when `NODE_ENV=production`
     - Shows error digest as reference ID when available
  2. **Test `global-error.tsx`**:
     - Renders with `<html>` and `<body>` tags
     - Calls `reset` when "Try again" is clicked
     - Shows "Go to login" fallback link
  3. Mock `useRouter` from `next/navigation` if needed for navigation actions
- **Dependencies**: `@testing-library/react`, `@testing-library/user-event`, `tests/test-utils.tsx`
- **Implementation Notes**:
  - Import components directly (they are Client Components with `'use client'`)
  - Use `render()` from test-utils for `error.tsx` (needs Providers)
  - Use `render()` from RTL directly for `global-error.tsx` (no providers — it's self-contained)

### Step 4: Update Technical Documentation

- **Action**: Review and update documentation
- **Implementation Steps**:
  1. **Review Changes**: Analyze all files created
  2. **Identify Documentation Files**: `frontend-standards.mdc` (project structure section — add error.tsx convention)
  3. **Update Documentation**: Add error boundary files to project structure tree
  4. **Verify**: Confirm documentation matches implementation

## 4. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create `global-error.tsx`
3. Step 2: Create `error.tsx`
4. Step 3: Write tests
5. Step 4: Update technical documentation

## 5. Testing Checklist

- [ ] `error.tsx` renders correctly with error props
- [ ] `error.tsx` "Try again" button calls `reset()`
- [ ] `error.tsx` navigation link works
- [ ] `error.tsx` hides raw error details in production
- [ ] `error.tsx` shows error digest as reference ID
- [ ] `global-error.tsx` renders self-contained HTML
- [ ] `global-error.tsx` "Try again" button calls `reset()`
- [ ] `global-error.tsx` fallback navigation works
- [ ] All existing tests still pass
- [ ] `next build` succeeds

## 6. Error Handling Patterns

- **error.tsx**: Catches all runtime errors in route segments below root layout. Renders inside the existing layout with full CSS support. Uses `reset()` to attempt re-render of the erroring segment.
- **global-error.tsx**: Last-resort boundary. Catches errors in root `layout.tsx` or `providers.tsx`. Must be fully self-contained (own `<html>`, `<body>`, inline/system styles). Uses `reset()` to attempt full app recovery.
- **Error detail exposure**: Never show `error.message` in production. Show `error.digest` as a reference ID for server errors. Full details logged to console in development only.

## 7. UI/UX Considerations

- **Visual consistency**: `error.tsx` matches auth card styling (centered, rounded corners, border, surface background)
- **Accessibility**: Error icon has `role="img"` + `aria-label`, buttons are focusable, color contrast meets WCAG AA
- **Dark mode**: Uses semantic tokens (`text-content-primary`, `bg-surface-primary`) which automatically adapt
- **Responsive**: Centered card with `max-w-md w-full mx-auto px-4` — works on mobile and desktop
- **Loading states**: No loading states needed — error boundaries render synchronously

## 8. Dependencies

- No new external dependencies required
- Uses existing: `Button` component, TailwindCSS tokens, Next.js App Router conventions

## 9. Notes

- The Jira ticket references `(auth)/error.tsx` with a route group that doesn't exist. This plan uses `src/app/error.tsx` instead, which catches errors from ALL routes including auth. This is actually **better** coverage than a route-group-scoped boundary.
- If a dedicated `(auth)` route group is created in the future, a route-group-level `error.tsx` can be added to provide auth-specific error messaging — but the app-level boundary will still serve as a fallback.
- `not-found.tsx` is out of scope for this ticket (separate concern — 404 handling).
- `global-error.tsx` is only active in **production** builds — in development, Next.js shows its own error overlay.

## 10. Next Steps After Implementation

- Run `/update-docs SCRUM-188` to update integration state
- Consider adding `not-found.tsx` in a future ticket for 404 handling
- Consider route-specific error boundaries for admin/dashboard routes if different error UX is needed

## 11. Implementation Verification

- [ ] **Code Quality**: Components follow frontend-standards.mdc (PascalCase, 'use client', TailwindCSS)
- [ ] **Functionality**: Error boundaries render correctly and `reset()` works
- [ ] **Testing**: All new tests pass, all existing tests pass
- [ ] **Build**: `next build` succeeds without errors
- [ ] **Documentation**: Project structure in frontend-standards.mdc updated
