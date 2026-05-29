# Backend Implementation Plan: SCRUM-207 Harden error messages against info disclosure

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-205
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/common/constants/error-messages.ts` — current constants (no passkey/device/audit sections)
  - `src/security/turnstile.guard.ts` — lines 24, 31-32: hard-coded "CAPTCHA" strings
  - `src/auth/mfa.service.ts` — lines 111, 148: hard-coded MFA-revealing strings
  - `src/auth/passkey.service.ts` — lines 383, 424: hard-coded "Passkey not found"
  - `src/auth/trusted-device.service.ts` — line 146: hard-coded "Trusted device not found"
  - `src/audit/audit.controller.ts` — line 58: hard-coded "Audit log not found"
  - `src/auth/tests/session.controller.spec.ts` — line 232: references "Trusted device not found"
- **Discrepancies**: None

## Overview

Replace 8 hard-coded error messages that reveal CAPTCHA mechanism, MFA internals, or use inconsistent patterns. Centralize all to ErrorMessages constants. CWE-200/209 remediation.

## Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-207-backend`

### Step 1: Add new ErrorMessages constants

- **File**: `src/common/constants/error-messages.ts`
- Add `passkey`, `device`, `audit` sections with NOT_FOUND constants
- Add `security.VERIFICATION_REQUIRED` and `security.VERIFICATION_FAILED` for Turnstile

### Step 2: Replace CAPTCHA messages in turnstile.guard.ts

- Line 24: `'CAPTCHA verification required.'` → `ErrorMessages.security.VERIFICATION_REQUIRED`
- Line 31-32: `'CAPTCHA verification failed. Please try again.'` → `ErrorMessages.security.VERIFICATION_FAILED`

### Step 3: Replace MFA messages in mfa.service.ts

- Line 111: `'MFA setup not initiated. Call POST /auth/mfa/setup first'` → `ErrorMessages.mfa.OPERATION_NOT_AVAILABLE`
- Line 148: `'Either code or recoveryCode must be provided'` → `ErrorMessages.mfa.INVALID_CODE`

### Step 4: Centralize NotFoundException messages

- passkey.service.ts lines 383, 424: → `ErrorMessages.passkey.NOT_FOUND`
- trusted-device.service.ts line 146: → `ErrorMessages.device.NOT_FOUND`
- audit.controller.ts line 58: → `ErrorMessages.audit.NOT_FOUND`

### Step 5: Update test specs

- session.controller.spec.ts line 232: update "Trusted device not found" to use ErrorMessages constant

### Step 6: Build verification + tests

- `nest build` clean
- `npm test` all pass
