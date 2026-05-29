# Backend Implementation Plan: SCRUM-169 Enforce Email Match on OAuth Account Linking

## 1. Codebase State Snapshot
- **Date**: 2026-03-10
- **Last completed ticket**: SCRUM-168
- **Integration state verified**: Yes
- **Files verified**:
  - `users.service.ts` lines 252-297 (`linkOAuthProvider`) — no email validation
  - `users.service.ts` lines 64-69 (`findById`) — returns User with oauthAccounts
  - `auth.service.ts` lines 595-617 (`validateOAuthLink`) — calls linkOAuthProvider without email check
  - `error-messages.ts` lines 35-40 — oauth section, no EMAIL_MISMATCH constant
  - `oauth-callback.filter.ts` — catches all exceptions, redirects with generic error (CWE-200 safe)
  - `users.service.spec.ts` — no linkOAuthProvider tests exist yet

## 2. Overview

Add email validation to `linkOAuthProvider()` to reject OAuth accounts whose email doesn't match the authenticated user's NexaCore email. The OAuthCallbackFilter already ensures generic error messages reach the frontend.

## 3. Implementation Steps

### Step 0: Create Feature Branch
- `feature/SCRUM-169-backend` from `main`

### Step 1: Add EMAIL_MISMATCH Error Constant
- **File**: `src/common/constants/error-messages.ts`
- **Action**: Add `EMAIL_MISMATCH` to the `oauth` section (after line 39)
- **Value**: `'OAuth account email must match your account email'`

### Step 2: Add Email Validation in linkOAuthProvider
- **File**: `src/users/users.service.ts`
- **Action**: At the beginning of `linkOAuthProvider()` (after line 256), add:
  1. Fetch the user: `const user = await this.findById(userId)`
  2. Guard: if !user, throw UnauthorizedException
  3. Compare: `user.email.toLowerCase() !== profile.email.toLowerCase()`
  4. If mismatch: throw `BadRequestException(ErrorMessages.oauth.EMAIL_MISMATCH)`
- **Import**: Add `BadRequestException` to NestJS imports

### Step 3: Add Unit Tests
- **File**: `tests/users/users.service.spec.ts`
- **Action**: Add tests in the linkOAuthProvider describe block (create it if absent):
  1. `rejects when OAuth email differs from user email` → expect BadRequestException
  2. `accepts matching email case-insensitively` → expect success
  3. `rejects when user not found` → expect UnauthorizedException

### Step 4: Run Tests and Verify
- Run `npm test` — all backend tests must pass
- Verify no regressions in OAuth flow tests

## 4. Implementation Order
1. Step 0: Create branch
2. Step 1: Error constant
3. Step 2: Email validation
4. Step 3: Unit tests
5. Step 4: Verify

## 5. Notes
- Frontend does NOT need changes — OAuthCallbackFilter already catches exceptions and redirects with generic "Authentication failed" message
- Case-insensitive comparison per RFC 5321 §2.4
- Error message intentionally generic per CWE-200
