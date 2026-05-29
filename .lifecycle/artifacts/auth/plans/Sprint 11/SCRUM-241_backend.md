# Backend Implementation Plan: SCRUM-241 Refactor: Split large test files (SM-02)

## Codebase State Snapshot

- **Date**: 2026-03-15
- **Last completed ticket**: SCRUM-240 (Eliminate CSP unsafe-inline)
- **Integration state verified**: Yes (no integration changes — test-only refactor)
- **Files verified against live code**:
  - `src/auth/tests/auth-login.spec.ts` — 906 lines, 43 tests across 12 describe blocks
  - `src/auth/tests/passkey.service.spec.ts` — 1067 lines, 45 tests across 7 describe blocks
  - `src/auth/tests/auth-test.helpers.ts` — 255 lines, exports: `mockUser`, `mockSession`, `requestMeta`, `AuthTestContext`, `createAuthTestModule()`
- **No constructor/method modifications**: This ticket only moves existing test code between files
- **Discrepancies with integration-state.md**: None (test-only change, no module/guard/service changes)

## Overview

Split 2 large test files (906 and 1067 lines) into 6 smaller files, each under 500 lines. Zero logic changes — only file reorganization. Resolves audit WARN SM-02 (ISO 25010 Maintainability/Modularity).

## Architecture Context

- **Directory**: `nexacore-api/src/auth/tests/`
- **Files affected**: 2 source files split into 6 + helpers extended
- **No production code changes** — only `.spec.ts` files

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-241-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-241-backend`
  3. Verify with `git branch`

### Step 1: Split auth-login.spec.ts (906 → 3 files)

The original file has 12 describe blocks. Split by functional area:

#### Step 1a: Create auth-login-security.spec.ts (~350 lines)

- **File**: `src/auth/tests/auth-login-security.spec.ts`
- **Action**: Move security-related describe blocks from auth-login.spec.ts
- **Content** (describe blocks to move):
  1. `login - account locked` (lines 128-172, 2 tests)
  2. `login - max failed attempts triggers lockout` (lines 214-233, 1 test)
  3. `login - lockout anti-enumeration` (lines 237-262, 1 test)
  4. `login - successful login resets failed attempts` (lines 266-287, 1 test)
  5. `MFA enforcement for admin roles (OWASP ASVS V2.7.2)` (lines 641-730, 6 tests)
  6. `fire-and-forget resilience (audit log rejection)` (lines 734-905, 8 tests)
- **Total**: ~350 lines, 19 tests
- **Imports**: Same as auth-login.spec.ts — `UnauthorizedException`, `ForbiddenException`, `bcrypt`, `Role`, helpers
- **Structure**:
  ```typescript
  import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
  import * as bcrypt from 'bcrypt';
  import { Role } from '../../users/enums/role.enum';
  import {
    createAuthTestModule,
    AuthTestContext,
    mockUser,
    mockSession,
    requestMeta,
  } from './auth-test.helpers';

  jest.mock('bcrypt');

  describe('AuthService — Login Security', () => {
    let ctx: AuthTestContext;
    beforeEach(async () => {
      jest.clearAllMocks();
      ctx = await createAuthTestModule();
    });
    // ... moved describe blocks
  });
  ```

#### Step 1b: Create auth-login-device.spec.ts (~320 lines)

- **File**: `src/auth/tests/auth-login-device.spec.ts`
- **Action**: Move device/travel/detection describe blocks from auth-login.spec.ts
- **Content** (describe blocks to move):
  1. `notifyIfNewDevice (via login)` (lines 291-387, 5 tests)
  2. `impossible travel integration` (lines 391-517, 5 tests)
  3. `suspicious login detection integration` (lines 521-637, 6 tests)
- **Total**: ~320 lines, 16 tests
- **Imports**: Same as auth-login.spec.ts
- **Structure**:
  ```typescript
  import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
  import * as bcrypt from 'bcrypt';
  import {
    createAuthTestModule,
    AuthTestContext,
    mockUser,
    mockSession,
    requestMeta,
  } from './auth-test.helpers';

  jest.mock('bcrypt');

  describe('AuthService — Login Device & Travel', () => {
    let ctx: AuthTestContext;
    beforeEach(async () => {
      jest.clearAllMocks();
      ctx = await createAuthTestModule();
    });
    // ... moved describe blocks
  });
  ```

#### Step 1c: Trim auth-login.spec.ts (~240 lines)

- **File**: `src/auth/tests/auth-login.spec.ts` (modified in-place)
- **Action**: Remove the moved describe blocks, keep only core login tests
- **Remaining content**:
  1. `login - MFA challenge` (lines 25-102, 4 tests)
  2. `register - verification email failure` (lines 106-124, 1 test)
  3. `login - no password (OAuth account)` (lines 176-191, 1 test)
  4. `login - email not verified` (lines 195-210, 1 test)
- **Total**: ~240 lines, 7 tests (+ 1 empty line after removal = well under 500)
- **No import changes needed** — all retained tests use the same imports

### Step 2: Split passkey.service.spec.ts (1067 → 3 files)

The original file has self-contained setup (no shared helpers — uses its own local mocks). Each split file needs its own copy of the setup block.

#### Step 2a: Extract shared passkey test setup to helpers

- **File**: `src/auth/tests/auth-test.helpers.ts` (extend)
- **Action**: Add passkey-specific shared setup as exported factory function
- **What to extract**:
  - The `@simplewebauthn/server` mock declarations (lines 20-34) — these MUST stay in each file as `jest.mock()` calls are hoisted and must be at module level
  - The `mockUser` factory (lines 36-56) — already different from auth-test.helpers `mockUser` (this is a function, helpers has a const). Keep as local in passkey files.
  - The `mockMeta` constant (line 58) — same as `requestMeta` in helpers
  - The beforeEach setup block (lines 77-144) — extract as `createPasskeyTestSetup()` factory

- **New export in auth-test.helpers.ts**:
  ```typescript
  export interface PasskeyTestContext {
    service: PasskeyService;
    usersService: jest.Mocked<Partial<UsersService>>;
    auditService: { log: jest.Mock };
    redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };
    prisma: { webAuthnCredential: { count: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock } };
  }

  export function createPasskeyTestSetup(): PasskeyTestContext { ... }
  ```

- **Implementation note**: The passkey setup is simpler (direct instantiation, no TestingModule). Each split file will import `createPasskeyTestSetup` from helpers and call it in `beforeEach`.

#### Step 2b: Modify passkey.service.spec.ts → keep registration only (~400 lines)

- **File**: `src/auth/tests/passkey.service.spec.ts` (modified in-place)
- **Action**: Remove `generateAuthOptions`, `verifyAuthentication`, `listPasskeys`, `renamePasskey`, `deletePasskey` describe blocks. Keep only:
  1. `generateRegOptions` (lines 148-232, 5 tests)
  2. `verifyRegistration` (lines 236-439, 8 tests)
- **Total**: ~400 lines (setup ~145 + tests ~255), 13 tests
- **Refactor**: Replace inline setup with `createPasskeyTestSetup()` import from helpers

#### Step 2c: Create passkey-authentication.spec.ts (~400 lines)

- **File**: `src/auth/tests/passkey-authentication.spec.ts`
- **Action**: Move authentication describe blocks
- **Content**:
  1. `generateAuthOptions` (lines 443-512, 5 tests)
  2. `verifyAuthentication` (lines 516-863, 15 tests)
- **Total**: ~400 lines (setup ~80 + tests ~320), 20 tests
- **Imports**: Same as passkey.service.spec.ts + helper import
- **Structure**: Same jest.mock + describe wrapper, using `createPasskeyTestSetup()`

#### Step 2d: Create passkey-management.spec.ts (~280 lines)

- **File**: `src/auth/tests/passkey-management.spec.ts`
- **Action**: Move CRUD management describe blocks
- **Content**:
  1. `listPasskeys` (lines 867-907, 2 tests)
  2. `renamePasskey` (lines 911-948, 3 tests)
  3. `deletePasskey` (lines 952-1067, 7 tests)
- **Total**: ~280 lines (setup ~80 + tests ~200), 12 tests
- **Imports**: Same as passkey.service.spec.ts + helper import

### Step 3: Verify All Tests Pass

- **Action**: Run full test suite
- **Command**: `cd nexacore-api && npx jest --silent`
- **Expected**: 903 tests, 64 suites (was 60, now +4 new files), all passing
- **Verify line counts**: `wc -l src/auth/tests/auth-login*.spec.ts src/auth/tests/passkey*.spec.ts`
- **Constraint**: No file exceeds 500 lines

### Step 4: Update Technical Documentation

- **Action**: No documentation changes needed — this is a test-only structural refactor
- **Files NOT affected**: api-spec.yml, data-model.md, integration-state.md, backend-standards.mdc
- **Note**: The `/update-docs` step will update `integration-state.md` changelog only

## Implementation Order

1. Step 0: Create feature branch
2. Step 2a: Extract shared passkey setup to auth-test.helpers.ts (do this first — other steps depend on it)
3. Step 1a: Create auth-login-security.spec.ts
4. Step 1b: Create auth-login-device.spec.ts
5. Step 1c: Trim auth-login.spec.ts
6. Step 2b: Modify passkey.service.spec.ts (keep registration only)
7. Step 2c: Create passkey-authentication.spec.ts
8. Step 2d: Create passkey-management.spec.ts
9. Step 3: Verify all tests pass
10. Step 4: Documentation (changelog only)

## Testing Checklist

- [ ] `npx jest --silent` → 903 tests passing
- [ ] Suite count increased from 60 to 64 (+4 new files)
- [ ] No file in `src/auth/tests/` exceeds 500 lines
- [ ] Coverage percentages unchanged (test logic identical)
- [ ] Each new file runs independently (`npx jest auth-login-security`)
- [ ] Zero production code changes (only `.spec.ts` and helpers)

## Error Response Format

N/A — no production code changes.

## Dependencies

- No new dependencies required
- Existing: `@nestjs/testing`, `jest`, `bcrypt`, `@simplewebauthn/server` (already in project)

## Notes

- The `jest.mock('bcrypt')` and `jest.mock('@simplewebauthn/server')` calls MUST appear at the top level of each file that uses them — they cannot be extracted to helpers because Jest hoists them.
- The passkey test files use direct class instantiation (`new PasskeyService(...)`) rather than `Test.createTestingModule()`. The extracted helper preserves this pattern.
- The auth-login split files reuse the existing `createAuthTestModule()` from helpers — no duplication of module setup.
- `mockUser` in passkey tests is a factory FUNCTION (returns new object each call), while auth-test.helpers has a const object. These are intentionally different — the passkey version supports overrides via `Partial<User>`.

## Implementation Verification

- [ ] All 903 tests pass
- [ ] No file exceeds 500 lines
- [ ] Zero logic changes (diff shows only moves + imports)
- [ ] Each split file has its own `describe()` block
- [ ] `jest.mock()` calls present at top of each file that needs them
- [ ] Shared setup extracted to helpers, not duplicated
