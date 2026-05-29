# Frontend Implementation Plan: SCRUM-94 — Toast Notification System

## Codebase State Snapshot

- **Date**: 2026-02-28
- **Last completed ticket**: SCRUM-93 backend (users + DTO coverage gaps on `feature/SCRUM-93-backend`)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/context/AuthContext.tsx` (361 lines) — authReducer with 7 actions, 10 auth methods
  - `src/components/auth/LoginForm.tsx` (320 lines) — 2-step login with PasswordStep subcomponent
  - `src/components/auth/RegisterForm.tsx` (168 lines) — email + password form
  - `src/lib/api.ts` (160 lines) — ApiClient class with CSRF handling, token management
  - `src/lib/types.ts` (65 lines) — SafeUser, AuthResponse, ErrorResponse types
  - `src/app/providers.tsx` (16 lines) — ThemeProvider > AuthProvider > PermissionsProvider
- **Constructor signatures verified**: N/A — no backend changes
- **Guard dependency chain verified**: N/A — frontend only

## Overview

- **Epic**: N/A — standalone UX enhancement
- **Ticket**: SCRUM-94
- **Priority**: Medium
- **What this implements**: A toast notification system for the dashboard, replacing inline `AUTH_ERROR` dispatch with contextual toast messages. Also introduces a `RateLimitBanner` component for rate-limited states (429/403) with countdown timer, and integrates both into the `LoginForm` as the reference implementation.

### Motivation

During SCRUM-22 (auth security hardening), rate limiting and account lockout were added to the backend. The frontend's `AuthContext` had a basic `error` state that couldn't distinguish between recoverable errors (toast-worthy) and rate-limited states (banner-worthy). Additionally, errors were displayed inconsistently — some inline, some not shown at all.

### Scope

| Area | Change |
|------|--------|
| Toast system | New context, provider, UI components |
| Rate limit UI | New countdown banner component |
| Auth error handling | Replace `AUTH_ERROR` with toasts + `RATE_LIMITED` dispatch |
| LoginForm | Reference integration of RateLimitBanner |
| Type system | Add `RateLimitInfo` type |
| API client | Parse `Retry-After` header on 429 responses |

## Architecture Context

### Components affected

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| ToastContext | `src/context/ToastContext.tsx` | **New** | Toast state management via useReducer |
| Toast | `src/components/ui/Toast.tsx` | **New** | Individual toast UI with auto-dismiss |
| ToastContainer | `src/components/ui/ToastContainer.tsx` | **New** | Fixed-position toast portal |
| RateLimitBanner | `src/components/ui/RateLimitBanner.tsx` | **New** | Rate limit countdown banner |
| useAuth hook | `src/hooks/useAuth.ts` | **New** | Re-export for clean import paths |
| types.ts | `src/lib/types.ts` | **Modified** | Add `RateLimitInfo` type |
| api.ts | `src/lib/api.ts` | **Modified** | Parse 429 `Retry-After` header |
| providers.tsx | `src/app/providers.tsx` | **Modified** | Mount ToastProvider + ToastContainer |
| AuthContext | `src/context/AuthContext.tsx` | **Modified** | Add `RATE_LIMITED` action, integrate `useToast`, replace `AUTH_ERROR` with toasts |
| LoginForm | `src/components/auth/LoginForm.tsx` | **Modified** | Integrate RateLimitBanner in PasswordStep |

### Provider hierarchy (after change)

```
ThemeProvider
  └─ ToastProvider
       ├─ AuthProvider          ← consumes useToast()
       │    └─ PermissionsProvider
       │         └─ {children}
       └─ ToastContainer        ← renders toasts in fixed position
```

### State flow

```
API 429 → apiClient.parseErrorResponse (extracts Retry-After header)
       → AuthContext catch block
       → errObj.error.retryAfter exists?
           Yes → dispatch RATE_LIMITED → rateLimitInfo state → RateLimitBanner renders
           No  → addToast({ variant: 'error', title: message }) → Toast renders
```

## Implementation Steps

### Step 0: Create Feature Branch

- **Branch name**: `feature/SCRUM-94-frontend`
- **Base**: `feature/SCRUM-93-backend`

---

### Step 1: Add `RateLimitInfo` type to `lib/types.ts`

- **File**: `src/lib/types.ts`
- **Action**: Add new type export

```typescript
export type RateLimitInfo = {
  isRateLimited: boolean;
  retryAfter: number | null;
  message: string | null;
};
```

---

### Step 2: Add 429 `Retry-After` header parsing to `lib/api.ts`

- **File**: `src/lib/api.ts`
- **Action**: In `parseErrorResponse`, after parsing the JSON body, enrich 429 responses with the `Retry-After` HTTP header

```typescript
if (body?.error && response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter && !body.error.retryAfter) {
    body.error.retryAfter = parseInt(retryAfter, 10);
  }
}
```

- **Rationale**: The `CustomThrottlerGuard` sets `Retry-After` as an HTTP header. The JSON body also includes `retryAfter`, but parsing the header provides a fallback for edge cases.

---

### Step 3: Create ToastContext

- **File**: `src/context/ToastContext.tsx` (new)
- **Exports**: `ToastProvider`, `useToast`, types (`ToastVariant`, `Toast`, `AddToastInput`)
- **State management**: `useReducer` with `ADD_TOAST` and `REMOVE_TOAST` actions
- **Toast model**: `{ id: number, variant: ToastVariant, title: string, description?: string, duration?: number }`
- **Variants**: `'error' | 'success' | 'warning' | 'info'`
- **Auto-increment IDs**: `nextId` counter via useRef

---

### Step 4: Create Toast UI component

- **File**: `src/components/ui/Toast.tsx` (new)
- **Props**: `id`, `variant`, `title`, `description?`, `duration?`, `onClose`
- **Features**:
  - Auto-dismiss after `duration` (default 5000ms)
  - Entry/exit animations via CSS classes (`animate-toast-in`, `animate-toast-out`)
  - Manual dismiss via X button
  - Variant-specific icons: `TriangleAlert` (error), `CircleCheck` (success), `CircleAlert` (warning), `Info` (info)
  - Accessibility: `role="alert"`, `aria-live="assertive"`
- **Styling**: `w-[400px]`, rounded-full, border, shadow-card

---

### Step 5: Create ToastContainer

- **File**: `src/components/ui/ToastContainer.tsx` (new)
- **Purpose**: Fixed-position portal for rendering all active toasts
- **Position**: `fixed right-6 top-6 z-50`
- **Optimization**: Returns `null` when no toasts

---

### Step 6: Create RateLimitBanner component

- **File**: `src/components/ui/RateLimitBanner.tsx` (new)
- **Props**: `retryAfter` (seconds), `message` (string), `onExpired?` (callback)
- **Features**:
  - Countdown timer updating every 1 second
  - Time display: `MM:SS` for minutes, `Ss` for seconds only
  - Calls `onExpired()` when countdown reaches 0
  - Error-themed styling: `border-error/20`, `bg-error/5`, `text-error`
  - Icon: `AlertTriangle` from lucide-react

---

### Step 7: Create `useAuth` re-export hook

- **File**: `src/hooks/useAuth.ts` (new)
- **Purpose**: Clean import path — `import { useAuth } from '@/hooks/useAuth'`
- **Content**: Re-exports `useAuth` from `@/context/AuthContext`

---

### Step 8: Mount ToastProvider in providers.tsx

- **File**: `src/app/providers.tsx`
- **Action**: Wrap existing providers with `ToastProvider`, add `ToastContainer` as sibling
- **New hierarchy**: `ThemeProvider > ToastProvider > AuthProvider > PermissionsProvider + ToastContainer`

---

### Step 9: Integrate toast + rate limit into AuthContext

- **File**: `src/context/AuthContext.tsx`
- **Changes**:
  1. Import `useToast` from `@/context/ToastContext`
  2. Import `RateLimitInfo` from `@/lib/types`
  3. Add `rateLimitInfo: RateLimitInfo` to `AuthState`
  4. Add `RATE_LIMITED` action type with `{ retryAfter: number; message: string }` payload
  5. Add `DEFAULT_RATE_LIMIT` constant: `{ isRateLimited: false, retryAfter: null, message: null }`
  6. Add `RATE_LIMITED` case to reducer
  7. Add `CLEAR_ERROR` case to also reset `rateLimitInfo`
  8. In `login()` catch: check `errObj?.error?.retryAfter` → dispatch `RATE_LIMITED`; otherwise `addToast({ variant: 'error', ... })` + dispatch `AUTH_STOP` (NOT `AUTH_ERROR`)
  9. In `register()` catch: same pattern
  10. Expose `rateLimitInfo` in context value

---

### Step 10: Integrate RateLimitBanner into LoginForm

- **File**: `src/components/auth/LoginForm.tsx`
- **Changes**:
  1. Import `RateLimitBanner` from `@/components/ui/RateLimitBanner`
  2. Destructure `rateLimitInfo` from `useAuth()`
  3. Pass `rateLimitInfo` and `onRateLimitExpired={clearError}` to `PasswordStep`
  4. In `PasswordStep`: add `isDisabled = isLoading || rateLimitInfo.isRateLimited`
  5. In System Message slot: show `RateLimitBanner` when rate limited, error otherwise
  6. Disable submit button with `isDisabled`

---

### Step 11: Verify and test

- `npm run build` — compiles without errors
- Manual test: Login with wrong password → error toast appears (not inline error)
- Manual test: Multiple rapid login attempts → RateLimitBanner appears with countdown
- Manual test: Registration error → error toast
- Manual test: Toast auto-dismisses after 5 seconds
- Manual test: Toast can be manually dismissed via X

---

### Step 12: Update Technical Documentation

- Create implementation record at `ai-specs/ai-specs/changes/records/SCRUM-94_frontend.md`

## Implementation Order

1. Step 0: Create branch
2. Step 1: Add `RateLimitInfo` type
3. Step 2: Add 429 header parsing to API client
4. Step 3: Create ToastContext
5. Step 4: Create Toast component
6. Step 5: Create ToastContainer
7. Step 6: Create RateLimitBanner component
8. Step 7: Create useAuth re-export hook
9. Step 8: Mount ToastProvider in providers
10. Step 9: Integrate toast + rate limit into AuthContext
11. Step 10: Integrate RateLimitBanner into LoginForm
12. Step 11: Verify and test
13. Step 12: Documentation

## Testing Checklist

- [ ] Toast context provides `addToast` and `removeToast` functions
- [ ] Toast component renders with correct variant icon and styling
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Toast can be manually dismissed
- [ ] ToastContainer renders in fixed top-right position
- [ ] RateLimitBanner shows countdown timer
- [ ] RateLimitBanner calls `onExpired` when timer reaches 0
- [ ] Rate limit banner displays `MM:SS` for times >= 60s
- [ ] LoginForm shows RateLimitBanner on 429 response
- [ ] LoginForm disables submit when rate limited
- [ ] Auth errors show as toasts (not inline errors)
- [ ] `npm run build` succeeds
- [ ] No console errors or warnings

## Error Handling Patterns

### Error flow (after SCRUM-94)

| Error Type | Source | UI Treatment |
|------------|--------|-------------|
| Validation (400) | class-validator | Toast with first detail message |
| Unauthorized (401) | Invalid credentials | Toast with message |
| Forbidden (403) with `retryAfter` | Account lockout | RateLimitBanner with countdown |
| Rate limited (429) with `retryAfter` | ThrottlerGuard | RateLimitBanner with countdown |
| Conflict (409) | Email exists | Toast with message |
| Other errors | Various | Toast with fallback message |

### Key pattern

```typescript
catch (err: unknown) {
  const errObj = err as ApiError;
  if (errObj?.error?.retryAfter) {
    dispatch({
      type: 'RATE_LIMITED',
      payload: {
        retryAfter: errObj.error.retryAfter,
        message: errObj.error.message ?? 'Too many requests. Please try again later.',
      },
    });
  } else {
    addToast({ variant: 'error', title: extractErrorMessage(err, 'Fallback message') });
    dispatch({ type: 'AUTH_STOP' });
  }
}
```

## UI/UX Considerations

- **Toast position**: Fixed top-right (`right-6 top-6 z-50`)
- **Toast width**: 400px fixed
- **Toast animation**: Slide-in from right, fade-out on dismiss
- **RateLimitBanner**: Inline within form's System Message slot
- **Disabled state**: Submit button gets `disabled:pointer-events-none disabled:opacity-50` during rate limit
- **Accessibility**: Toast has `role="alert"` and `aria-live="assertive"`

## Dependencies

- `lucide-react` — already installed (icons: `TriangleAlert`, `CircleCheck`, `CircleAlert`, `Info`, `X`, `AlertTriangle`)
- No new external packages required

## Notes

- **LoginForm is the reference implementation** for RateLimitBanner integration. Other forms (Register, ForgotPassword, ResetPassword, MfaTotp) are intentionally deferred to SCRUM-95.
- **`AUTH_ERROR` action replaced by `AUTH_STOP`** in catch blocks. Errors are now shown via toasts, not stored in reducer state. The `error` state remains for form-specific inline errors.
- **ToastProvider must wrap AuthProvider** because AuthContext's catch blocks call `addToast()`.
- **`useAuth` re-export hook** at `src/hooks/useAuth.ts` provides a cleaner import path and decouples consumers from the context file location.

## Implementation Verification

- [ ] 5 new files created: ToastContext, Toast, ToastContainer, RateLimitBanner, useAuth hook
- [ ] 4 files modified: types.ts, api.ts, providers.tsx, AuthContext.tsx, LoginForm.tsx
- [ ] Provider hierarchy correct: ThemeProvider > ToastProvider > AuthProvider > PermissionsProvider
- [ ] Toast auto-dismiss works (5 second default)
- [ ] RateLimitBanner countdown works and fires onExpired
- [ ] `npm run build` completes without errors
- [ ] No unused imports or dead code
