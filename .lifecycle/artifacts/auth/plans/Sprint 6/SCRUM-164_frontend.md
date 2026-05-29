# Frontend Implementation Plan: SCRUM-164 — Frontend error message sync

## 1. Overview

Follow-up to SCRUM-140 (backend error message standardization, Sprint 5). The backend `ErrorMessages` constants were changed but the frontend was never updated to match, causing silent breakage in string-based behavior detection (resend verification button, CSRF retry, inline vs toast error display).

This ticket audits all 14 frontend files that handle backend errors and:
- Replaces fragile string matching with centralized constants
- Consolidates duplicated `extractMessage` helpers into a single shared utility
- Ensures inline vs toast behavior is correct for every error scenario
- Absorbs the 2 pending working-tree fixes (LoginForm.tsx + AuthContext.tsx)

## 2. Architecture Context

### Files to modify
| File | Category | Current Issue |
|------|----------|---------------|
| `src/lib/error-constants.ts` | **NEW** | Centralized error detection constants |
| `src/lib/error-utils.ts` | **NEW** | Shared error extraction utilities (DRY) |
| `src/context/AuthContext.tsx` | CRITICAL | String match `'check your email'` — already partially fixed in working tree |
| `src/components/auth/LoginForm.tsx` | CRITICAL | String match `'check your email'` — already partially fixed in working tree |
| `src/lib/api.ts` | CRITICAL | String match `'CSRF'` for retry logic |
| `src/components/profile/ConnectedAccounts.tsx` | SECONDARY | Inline `extractMessage` with statusCode 429/401 |
| `src/components/profile/DeleteAccount.tsx` | SECONDARY | Inline `extractMessage` with statusCode 429/403/401 |
| `src/components/profile/ChangeEmailForm.tsx` | SECONDARY | Inline `extractMessage` with statusCode 429 |
| `src/hooks/useTrustedDevices.ts` | SECONDARY | Inline `extractMessage` with statusCode 429 |
| `src/components/auth/RegisterForm.tsx` | VERIFY | RateLimitError instanceof only — OK |
| `src/components/auth/ResetPasswordForm.tsx` | VERIFY | RateLimitError instanceof only — OK |
| `src/components/auth/ForgotPasswordForm.tsx` | VERIFY | RateLimitError instanceof only — OK |
| `src/components/auth/MfaTotpStep.tsx` | VERIFY | RateLimitError instanceof only — OK |
| `src/components/auth/OAuthCallbackHandler.tsx` | VERIFY | URL param pass-through — OK |
| `src/components/profile/MfaSetup.tsx` | VERIFY | Raw message extraction — OK |
| `src/components/profile/ActiveSessions.tsx` | VERIFY | Catch-all — OK |

### Backend error response format (reference)
```json
{
  "success": false,
  "error": {
    "message": "string",
    "code": "VALIDATION_ERROR|UNAUTHORIZED|FORBIDDEN|NOT_FOUND|CONFLICT|RATE_LIMIT_EXCEEDED|INTERNAL_SERVER_ERROR",
    "statusCode": number,
    "details": ["string[]"],
    "retryAfter": number
  }
}
```

### Backend ErrorMessages constants (source of truth)
```typescript
// nexacore-api/src/common/constants/error-messages.ts
auth.CHECK_EMAIL = 'Please check your email to continue'
auth.INVALID_CREDENTIALS = 'Invalid credentials'
auth.AUTHENTICATION_FAILED = 'Authentication failed'
csrf.VALIDATION_FAILED = 'CSRF validation failed'
oauth.LINK_FAILED = 'Unable to link this provider'
oauth.PASSWORD_REQUIRED_FOR_UNLINK = 'You must set a password before unlinking your OAuth provider'
user.INVALID_PASSWORD = 'Invalid password'
```

## 3. Error Detection Methods Audit

### Current detection methods (from full codebase audit)

| Method | Usage Count | Reliability | Files |
|--------|-------------|-------------|-------|
| `retryAfter` property check | 5 | HIGH | AuthContext (login, register, mfa, forgot, reset, resend) |
| `instanceof RateLimitError` | 4 | HIGH | LoginForm, RegisterForm, ResetPasswordForm, ForgotPasswordForm, MfaTotpStep |
| `error.code === 'FORBIDDEN'` | 1 | HIGH | AuthContext.detectRateLimitKind |
| `statusCode === 429/401/403` | 4 | MEDIUM | ConnectedAccounts, DeleteAccount, ChangeEmailForm, useTrustedDevices |
| `message.includes('check your email')` | 2 | **LOW** | AuthContext:197, LoginForm:354 |
| `message.includes('CSRF')` | 1 | **LOW** | api.ts:60 |
| Pass-through (no detection) | 7 | N/A | RegisterForm, ResetPasswordForm, ForgotPasswordForm, MfaTotpStep, OAuthCallbackHandler, MfaSetup, ActiveSessions |

### Decision: keep string matching but centralize

The backend `error.code` maps to HTTP exception type (FORBIDDEN, UNAUTHORIZED), not to business error (EMAIL_NOT_VERIFIED, CSRF_FAILED). Adding business error codes would require backend changes outside this ticket's scope. Therefore:

- **String matching is unavoidable** for `check your email` and `CSRF` detection
- **Centralize all matched strings** in `error-constants.ts` so changes propagate from one place
- **StatusCode checks** are acceptable (429, 401, 403 are stable HTTP semantics)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-164-frontend`
- **Base**: `main` (latest, after SCRUM-161 fix push)
- **Steps**:
  1. `git pull origin main`
  2. `git checkout -b feature/SCRUM-164-frontend`

### Step 1: Create `src/lib/error-constants.ts`

- **File**: `nexacore-dashboard/src/lib/error-constants.ts` (NEW)
- **Action**: Centralize all backend error message substrings used for frontend behavior detection
- **Implementation**:

```typescript
/**
 * Error detection constants — mirrors backend ErrorMessages substrings
 * used for UI behavior branching.
 *
 * When the backend changes an error message, update the corresponding
 * constant here. All detection logic imports from this file.
 *
 * Source: nexacore-api/src/common/constants/error-messages.ts
 */

// --- String detection (used with message.toLowerCase().includes()) ---

/** Backend: ErrorMessages.auth.CHECK_EMAIL = 'Please check your email to continue' */
export const DETECTION_EMAIL_VERIFICATION = 'check your email';

/** Backend: ErrorMessages.csrf.VALIDATION_FAILED = 'CSRF validation failed' */
export const DETECTION_CSRF_ERROR = 'csrf';

// --- HTTP status code constants (for readability) ---
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOO_MANY_REQUESTS: 429,
} as const;

// --- Backend error.code values ---
export const ERROR_CODE = {
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;
```

- **Notes**: Only include constants that are actively used for behavior branching. Do NOT mirror the entire backend ErrorMessages file — that creates unnecessary coupling.

### Step 2: Create `src/lib/error-utils.ts`

- **File**: `nexacore-dashboard/src/lib/error-utils.ts` (NEW)
- **Action**: Consolidate the 4 duplicated `extractMessage` helpers + `extractErrorMessage` + `ensurePeriod`
- **Implementation**:

```typescript
import { HTTP_STATUS } from './error-constants';

type ApiErrorShape = {
  error?: {
    message?: string;
    details?: string[];
    statusCode?: number;
    code?: string;
    retryAfter?: number;
  };
};

/** Ensure string ends with a period */
export function ensurePeriod(s: string): string {
  return s.endsWith('.') ? s : `${s}.`;
}

/**
 * Extract user-facing error message from API error.
 * Prefers validation details[0], falls back to error.message.
 */
export function extractErrorMessage(err: unknown): string {
  const errObj = err as ApiErrorShape;
  const details = errObj?.error?.details;
  if (Array.isArray(details) && details.length > 0) return ensurePeriod(details[0]);
  return ensurePeriod(errObj?.error?.message ?? 'An unexpected error occurred.');
}

/**
 * Extract error message with statusCode-specific overrides.
 * Used by profile components (ConnectedAccounts, DeleteAccount, etc.)
 *
 * @param overrides - Map of statusCode to override message
 * @param fallback - Default message if no override matches and no error.message
 */
export function extractMessageByStatus(
  err: unknown,
  overrides: Partial<Record<number, string>>,
  fallback: string,
): string {
  const errObj = err as ApiErrorShape;
  const status = errObj?.error?.statusCode;
  if (status && overrides[status]) return overrides[status]!;
  return ensurePeriod(errObj?.error?.message ?? fallback);
}
```

- **Dependencies**: `error-constants.ts`
- **Notes**: `extractMessageByStatus` replaces the 4 inline `extractMessage` functions. Each call site provides its own override map — flexible without being over-engineered.

### Step 3: Update `src/context/AuthContext.tsx`

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx`
- **Action**: Import constants, replace inline helpers, fix string detection
- **Changes**:
  1. Remove local `ensurePeriod` and `extractErrorMessage` functions
  2. Import from `@/lib/error-utils` and `@/lib/error-constants`
  3. Replace `message.toLowerCase().includes('check your email')` with `message.toLowerCase().includes(DETECTION_EMAIL_VERIFICATION)`
  4. Replace `errObj?.error?.code === 'FORBIDDEN'` with `errObj?.error?.code === ERROR_CODE.FORBIDDEN`

- **Diff summary** (line 197):
```typescript
// BEFORE:
if (message.toLowerCase().includes('check your email')) {

// AFTER:
import { DETECTION_EMAIL_VERIFICATION, ERROR_CODE } from '@/lib/error-constants';
import { extractErrorMessage } from '@/lib/error-utils';
// ...
if (message.toLowerCase().includes(DETECTION_EMAIL_VERIFICATION)) {
```

### Step 4: Update `src/components/auth/LoginForm.tsx`

- **File**: `nexacore-dashboard/src/components/auth/LoginForm.tsx`
- **Action**: Import constant, replace string detection
- **Changes**:
  1. Import `DETECTION_EMAIL_VERIFICATION` from `@/lib/error-constants`
  2. Replace `error.toLowerCase().includes('check your email')` with `error.toLowerCase().includes(DETECTION_EMAIL_VERIFICATION)`

- **Diff** (line 354):
```typescript
// BEFORE:
const isVerificationError = !!error && error.toLowerCase().includes('check your email');

// AFTER:
const isVerificationError = !!error && error.toLowerCase().includes(DETECTION_EMAIL_VERIFICATION);
```

### Step 5: Update `src/lib/api.ts`

- **File**: `nexacore-dashboard/src/lib/api.ts`
- **Action**: Import constant, replace CSRF string detection
- **Changes**:
  1. Import `DETECTION_CSRF_ERROR` from `@/lib/error-constants`
  2. Replace `body?.message?.includes('CSRF') || body?.error?.message?.includes('CSRF')` with constant

- **Diff** (line ~60):
```typescript
// BEFORE:
if (body?.message?.includes('CSRF') || body?.error?.message?.includes('CSRF')) {

// AFTER:
const csrfMsg = (body?.message || body?.error?.message || '').toLowerCase();
if (csrfMsg.includes(DETECTION_CSRF_ERROR)) {
```

### Step 6: Consolidate profile component helpers

#### 6a. Update `src/components/profile/ConnectedAccounts.tsx`
- Remove inline `extractMessage` or statusCode switch
- Import `extractMessageByStatus` from `@/lib/error-utils`
- Replace with:
```typescript
const msg = extractMessageByStatus(e, {
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Try again later.',
  [HTTP_STATUS.UNAUTHORIZED]: 'Invalid password.',
}, 'Failed to unlink OAuth provider.');
```

#### 6b. Update `src/components/profile/DeleteAccount.tsx`
- Remove inline `extractMessage` function
- Import and replace with:
```typescript
const msg = extractMessageByStatus(e, {
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Try again later.',
  [HTTP_STATUS.FORBIDDEN]: 'SUPERADMIN accounts cannot be deleted.',
  [HTTP_STATUS.UNAUTHORIZED]: 'Incorrect password.',
}, 'Account deletion failed.');
```

#### 6c. Update `src/components/profile/ChangeEmailForm.tsx`
- Remove inline `extractMessage` function
- Import and replace with:
```typescript
const msg = extractMessageByStatus(e, {
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Try again later.',
}, 'Failed to update email.');
```

#### 6d. Update `src/hooks/useTrustedDevices.ts`
- Remove inline `extractMessage` function
- Import and replace with:
```typescript
const msg = extractMessageByStatus(e, {
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Try again later.',
}, 'Operation failed.');
```

### Step 7: Verify pass-through files (no changes expected)

Read and confirm these files do NOT use string matching for behavior branching:

| File | Expected | Action |
|------|----------|--------|
| `RegisterForm.tsx` | `instanceof RateLimitError` only | Verify — no change |
| `ResetPasswordForm.tsx` | `instanceof RateLimitError` only | Verify — no change |
| `ForgotPasswordForm.tsx` | `instanceof RateLimitError` only | Verify — no change |
| `MfaTotpStep.tsx` | `instanceof RateLimitError` only | Verify — no change |
| `OAuthCallbackHandler.tsx` | URL param pass-through | Verify — no change |
| `MfaSetup.tsx` | Raw `error.message` extraction | Verify — no change |
| `ActiveSessions.tsx` | Catch-all | Verify — no change |

If any file has undocumented string matching, fix it using constants.

### Step 8: Update Technical Documentation

- **Action**: Document the new error handling pattern
- **Files to update**:
  1. `ai-specs/specs/frontend-standards.mdc` — Add section on error handling pattern: "All backend error message detection MUST use constants from `src/lib/error-constants.ts`. Never use inline string literals for behavior branching."
  2. Create implementation record at `ai-specs/ai-specs/changes/records/Sprint 6/SCRUM-164_frontend.md`

## 5. Implementation Order

1. Step 0 — Create feature branch
2. Step 1 — Create `error-constants.ts`
3. Step 2 — Create `error-utils.ts`
4. Step 3 — Update AuthContext.tsx (absorb working-tree fix + import constants)
5. Step 4 — Update LoginForm.tsx (absorb working-tree fix + import constants)
6. Step 5 — Update api.ts (CSRF detection)
7. Step 6a-6d — Consolidate profile component helpers
8. Step 7 — Verify pass-through files
9. Step 8 — Update documentation

## 6. Testing Checklist

### Manual testing
- [ ] Login with unverified email → toast shows "Sign in failed" + resend verification button appears with 60s countdown
- [ ] Click "Resend verification email" → toast confirms sent, countdown starts
- [ ] Login with wrong password → toast shows error, inline `AlertTriangle` error below password field does NOT show (toast-only for auth errors, per SCRUM-96 design)
- [ ] Login with rate limit (5+ attempts) → RateLimitBanner with countdown appears
- [ ] Login with account lockout → RateLimitBanner with lock icon appears
- [ ] CSRF token expired during session → api.ts silently refreshes CSRF and retries (no user-visible error)
- [ ] Unlink OAuth provider with wrong password → toast shows "Invalid password."
- [ ] Unlink OAuth provider rate limited → toast shows "Too many requests."
- [ ] Delete account with wrong password → toast shows "Incorrect password."
- [ ] OAuth callback failure → redirects to /login with error toast

### Code quality
- [ ] No `includes('` with inline string literals for error detection in any of the 14 files
- [ ] All string detection uses imports from `error-constants.ts`
- [ ] No duplicated `extractMessage` helpers — all use `error-utils.ts`
- [ ] ESLint clean (`npx next lint`)
- [ ] TypeScript clean (no type errors)

## 7. Error Handling Patterns

### Decision table: inline vs toast

| Error Scenario | Display | Rationale |
|---------------|---------|-----------|
| Invalid credentials | Toast only | Auth errors use toast (SCRUM-96) |
| Email not verified | Toast + resend button (inline) | Actionable — user can resend |
| Rate limit (IP throttle) | RateLimitBanner (inline) | Countdown is actionable |
| Account lockout | RateLimitBanner with lock (inline) | Countdown is actionable |
| Validation error (empty field) | Inline AlertTriangle below field | Immediate field-level feedback |
| OAuth failure | Toast only | No inline action possible |
| CSRF failure | Silent retry | Transparent to user |
| Network error | Toast only | No inline action possible |
| Profile action failure (unlink, delete, etc.) | Toast only | Modal actions use toast |

### Pattern: behavior detection hierarchy
```
1. retryAfter property → RateLimitError (highest priority)
2. error.code enum → lockout vs throttle distinction
3. statusCode → 429/401/403 overrides (profile components)
4. message.includes(CONSTANT) → verification email, CSRF (last resort)
5. Pass-through → toast with raw message (default)
```

## 8. UI/UX Considerations

- No visual changes — this ticket only fixes broken detection logic
- Resend verification button + CountdownTimer will reappear (was broken since Sprint 5)
- CSRF retry remains transparent to user
- Profile error toasts will show same messages but via centralized helper

## 9. Dependencies

- No new external libraries
- New internal files: `error-constants.ts`, `error-utils.ts`
- Existing: `RateLimitError` class, `RateLimitBanner`, `CountdownTimer`, `useRateLimit` hook

## 10. Notes

- The 2 working-tree fixes (`LoginForm.tsx` + `AuthContext.tsx`) are absorbed into Steps 3-4. The current `'check your email'` inline string will be replaced with the `DETECTION_EMAIL_VERIFICATION` constant.
- The SCRUM-163 pending migration (`20260309200000_remove_deprecated_user_provider_fields/migration.sql`) is NOT part of this ticket.
- Auth errors (invalid credentials, authentication failed) intentionally show as **toast only** — this is by design (SCRUM-96: "Toast handles the full message; inline UI should only show actionable elements"). The inline error slot in LoginForm PasswordStep is reserved for verification errors and rate limits.

## 11. Next Steps After Implementation

1. Commit + PR + merge to main
2. Update `integration-state.md` if any module dependencies changed (unlikely for this ticket)
3. Consider future improvement: add business error codes to backend (e.g., `EMAIL_NOT_VERIFIED`, `CSRF_FAILED`) to eliminate string matching entirely

## 12. Implementation Verification

- [ ] Code Quality: All 14 files audited, no inline string matching
- [ ] Functionality: All error scenarios tested (verification, rate limit, CSRF, OAuth, profile actions)
- [ ] Testing: Manual test pass for all scenarios in checklist
- [ ] Integration: No regressions in existing error flows
- [ ] Documentation: frontend-standards.mdc updated, implementation record created
