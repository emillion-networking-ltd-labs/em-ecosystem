# Backend Implementation Plan: SCRUM-101 Production Secret Validation (JWT + MFA + CSRF)

## Codebase State Snapshot
- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-100 (per integration-state.md)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/main.ts` (84 lines, validateProductionSecrets at lines 12–27 — checks JWT_SECRET + MFA_ENCRYPTION_KEY, misses CSRF_SECRET)
  - `nexacore-api/src/security/security.config.ts` (88 lines, CSRF_SECRET runtime validation at lines 36–47)
  - `nexacore-api/src/common/services/crypto.service.ts` (51 lines, MFA_ENCRYPTION_KEY default at line 14)
  - `nexacore-api/src/auth/auth.module.ts` (JWT_SECRET default at line 29)
  - `nexacore-api/src/security/tests/security.config.spec.ts` (test pattern for env-based validation)
- **Constructor signatures verified**: N/A — no DI changes
- **Guard dependency chain verified**: N/A — no guard changes

## Overview

Harden the existing `validateProductionSecrets()` in `main.ts` to apply uniform checks (not empty, not dev default, >= 32 chars) across all 3 security-critical secrets: JWT_SECRET, MFA_ENCRYPTION_KEY, and CSRF_SECRET. Currently JWT_SECRET lacks a minimum length check, MFA_ENCRYPTION_KEY doesn't reject its dev default, and CSRF_SECRET is missing from the startup validator entirely.

## Architecture Context

- **File**: `main.ts` (bootstrap function, runs before NestFactory.create)
- **No module, service, guard, controller, or DI changes**
- **Test approach**: Extract `validateProductionSecrets()` to `src/common/utils/validate-production-secrets.ts`, test via dynamic `require()` with `process.env` manipulation (following `security.config.spec.ts` pattern)

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-101-backend`
- **Steps**:
  1. `git checkout feature/SCRUM-100-backend` (latest branch)
  2. `git checkout -b feature/SCRUM-101-backend`
  3. `git branch` to verify

### Step 1: Extract and Harden validateProductionSecrets()

- **File**: `nexacore-api/src/common/utils/validate-production-secrets.ts` (new file)
- **Action**: Extract function from main.ts to standalone utility file. Apply uniform 3-check pattern to all 3 secrets.
- **Implementation**:

  ```typescript
  export function validateProductionSecrets(): void {
    if (process.env.NODE_ENV !== 'production') return;

    const defaultJwt = 'default-dev-secret-change-in-production';
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET === defaultJwt ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error(
        'FATAL: JWT_SECRET must be set to a non-default value of at least 32 characters in production',
      );
    }

    const defaultMfa = 'dev-mfa-key-change-in-production-32ch';
    if (
      !process.env.MFA_ENCRYPTION_KEY ||
      process.env.MFA_ENCRYPTION_KEY === defaultMfa ||
      process.env.MFA_ENCRYPTION_KEY.length < 32
    ) {
      throw new Error(
        'FATAL: MFA_ENCRYPTION_KEY must be set to a non-default value of at least 32 characters in production',
      );
    }

    const defaultCsrf = 'dev-csrf-secret-change-in-production-min32chars';
    if (
      !process.env.CSRF_SECRET ||
      process.env.CSRF_SECRET === defaultCsrf ||
      process.env.CSRF_SECRET.length < 32
    ) {
      throw new Error(
        'FATAL: CSRF_SECRET must be set to a non-default value of at least 32 characters in production',
      );
    }
  }
  ```

- **File**: `nexacore-api/src/main.ts`
- **Action**: Replace inline function with import from new utility file.
- **Implementation**:
  ```typescript
  import { validateProductionSecrets } from './common/utils/validate-production-secrets';
  ```

- **Notes**: Extracting to a standalone utility file enables isolated testing without pulling in the full NestJS app module tree (which causes ESM parse failures with otplib).

### Step 2: Add Unit Tests

- **File**: `nexacore-api/src/tests/validate-production-secrets.spec.ts` (new file)
- **Action**: Test all validation branches following the `security.config.spec.ts` env manipulation pattern
- **Implementation**:

  ```typescript
  describe('validateProductionSecrets', () => {
    const originalEnv = process.env;

    const VALID_SECRETS = {
      JWT_SECRET: 'production-jwt-secret-at-least-32-characters-long',
      MFA_ENCRYPTION_KEY: 'production-mfa-key-at-least-32-characters-long',
      CSRF_SECRET: 'production-csrf-secret-at-least-32-chars-long',
    };

    beforeEach(() => {
      jest.resetModules();
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        ...VALID_SECRETS,
      };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    function loadValidator(): () => void {
      return require('../common/utils/validate-production-secrets').validateProductionSecrets;
    }
  ```

  **Test cases** (12 tests):

  **Non-production bypass (1 test)**:
  - `it('should skip validation when NODE_ENV is not production')` — set NODE_ENV to 'development', delete all secrets, expect no throw

  **JWT_SECRET (3 tests)**:
  - `it('should throw when JWT_SECRET is missing')` — delete env var
  - `it('should throw when JWT_SECRET is the dev default')` — set to `'default-dev-secret-change-in-production'`
  - `it('should throw when JWT_SECRET is shorter than 32 chars')` — set to `'short-secret'`

  **MFA_ENCRYPTION_KEY (3 tests)**:
  - `it('should throw when MFA_ENCRYPTION_KEY is missing')` — delete env var
  - `it('should throw when MFA_ENCRYPTION_KEY is the dev default')` — set to `'dev-mfa-key-change-in-production-32ch'`
  - `it('should throw when MFA_ENCRYPTION_KEY is shorter than 32 chars')` — set to `'short-key'`

  **CSRF_SECRET (3 tests)**:
  - `it('should throw when CSRF_SECRET is missing')` — delete env var
  - `it('should throw when CSRF_SECRET is the dev default')` — set to `'dev-csrf-secret-change-in-production-min32chars'`
  - `it('should throw when CSRF_SECRET is shorter than 32 chars')` — set to `'short-csrf-secret'`

  **Valid case (1 test)**:
  - `it('should not throw when all secrets are valid')` — all 3 set to valid 32+ char non-default values

  **Fail-fast order (1 test)**:
  - `it('should throw for JWT_SECRET before checking MFA or CSRF')` — delete all 3, verify JWT error thrown first

- **Notes**: `jest.resetModules()` ensures fresh import on each test. `process.env` is restored in `afterAll`. Each test sets all 3 valid secrets in `beforeEach`, then overrides only the one being tested.

### Step 3: Create tests/ Directory

- **Action**: Create `nexacore-api/src/tests/` directory if it doesn't exist
- **Notes**: This is the root-level test directory for bootstrap/utility code that doesn't belong to a specific module. Jest's `rootDir: src` and `testRegex: .*\.spec\.ts$` will pick it up automatically.

### Step 4: Update integration-state.md

- **File**: `ai-specs/ai-specs/specs/integration-state.md`
- **Action**: Update changelog with SCRUM-101 entry
- **Implementation**:
  1. Update header: "Last update: SCRUM-101 (2026-03-02)"
  2. Add changelog entry:
     ```
     | 2026-03-02 | SCRUM-101 | validateProductionSecrets() in main.ts hardened: JWT_SECRET now requires >= 32 chars, MFA_ENCRYPTION_KEY now rejects its dev default, CSRF_SECRET added to startup validator. Uniform 3-check pattern (not empty, not default, >= 32 chars) for all 3 secrets. Function exported for testability. 12 new tests. |
     ```

### Step 5: Verify Implementation

- **Action**: Build, test, and verify
- **Steps**:
  1. `cd nexacore-api && npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all tests must pass
  3. Verify test count increased by 12 (from 466 to 478)
  4. Verify the app still starts in dev mode: `npx nest start` (should NOT throw since NODE_ENV != production)

## Implementation Order

1. Step 0: Create feature branch
2. Step 3: Create `src/tests/` directory (if needed)
3. Step 1: Extract and harden validateProductionSecrets()
4. Step 2: Add unit tests
5. Step 4: Update integration-state.md
6. Step 5: Verify (build + test)

## Testing Checklist

- [x] Non-production: validation skipped (no throw)
- [x] JWT_SECRET: throws when missing, default, or < 32 chars
- [x] MFA_ENCRYPTION_KEY: throws when missing, default, or < 32 chars
- [x] CSRF_SECRET: throws when missing, default, or < 32 chars
- [x] All 3 valid: no throw
- [x] Fail-fast order: JWT -> MFA -> CSRF
- [x] All existing 466 tests still pass
- [x] `nest build` compiles clean
- [x] `nest start` loads in development mode without errors

## Error Response Format

No HTTP error responses — these are fatal startup errors that prevent the application from starting:
```
Error: FATAL: JWT_SECRET must be set to a non-default value of at least 32 characters in production
Error: FATAL: MFA_ENCRYPTION_KEY must be set to a non-default value of at least 32 characters in production
Error: FATAL: CSRF_SECRET must be set to a non-default value of at least 32 characters in production
```

## Dependencies

- No new packages needed
- No DI, module, or constructor changes

## Notes

- **Extraction for testability**: Moving `validateProductionSecrets()` to `src/common/utils/validate-production-secrets.ts` isolates it from the NestJS app module tree. Testing via `require('../main')` caused ESM parse failures because main.ts imports AppModule -> AuthModule -> MfaService -> otplib (ESM).
- **Dev experience preserved**: All 3 default values continue to work in non-production. The validation only runs when `NODE_ENV === 'production'`.
- **CSRF_SECRET dual validation**: After this change, CSRF_SECRET is validated both at startup (validate-production-secrets.ts) and at runtime (security.config.ts). The startup check is the primary defense; the runtime check remains as a fallback.

## Implementation Verification

- [x] **Code Quality**: Uniform 3-check pattern for all 3 secrets
- [x] **Functionality**: App refuses to start in production with bad secrets
- [x] **Testing**: 12 new tests covering all branches (478 total, 36 suites)
- [x] **Integration**: `nest build` + `nest start` clean in dev mode
- [x] **Documentation**: integration-state.md updated
