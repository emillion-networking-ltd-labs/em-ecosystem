# Backend Implementation Plan: SCRUM-221 — Enforce Database TLS in Production (V8.3.7)

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-218 (Replace JWT query param with short-lived link code)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/.env.example` — DATABASE_URL at line 18: `postgresql://user:password@localhost:5432/em_ecosystem?schema=public` (no sslmode)
  - `nexacore-api/src/common/utils/validate-production-secrets.ts` — 94 lines, validates: JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET, GOOGLE_CALLBACK_URL, GITHUB_CALLBACK_URL, JWT_ACCESS_EXPIRATION. No DATABASE_URL check.
  - `nexacore-api/src/tests/validate-production-secrets.spec.ts` — 213 lines, 18 tests across 7 describe blocks. Uses `jest.resetModules()` + dynamic `require()` pattern to reload the module with fresh env vars.
- **Constructor signatures verified**: N/A (no class modifications — utility function only)
- **Methods verified to exist**: `validateProductionSecrets()` — exported function at line 28, called in `main.ts`
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None relevant to this ticket

## Overview

Add database TLS enforcement to the production startup validation. The `.env.example` template will document the `sslmode=require` parameter, and `validateProductionSecrets()` will reject startup if DATABASE_URL lacks a TLS-enforcing sslmode (`require`, `verify-ca`, or `verify-full`). This prevents accidental plaintext database connections in production.

**Standard**: OWASP ASVS V8.3.7, SOC 2 CC6.7

## Architecture Context

- **Module**: None (standalone utility function, no NestJS DI)
- **Files affected**: 3
  - `nexacore-api/.env.example` — template update
  - `nexacore-api/src/common/utils/validate-production-secrets.ts` — add validation
  - `nexacore-api/src/tests/validate-production-secrets.spec.ts` — add test cases

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-221-backend`
- **Implementation Steps**:
  1. Ensure on `main`: `git checkout main && git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-221-backend`
  3. Verify: `git branch`

### Step 1: Update `.env.example` DATABASE_URL

- **File**: `nexacore-api/.env.example`
- **Action**: Add `&sslmode=require` to the DATABASE_URL template value
- **Implementation Steps**:
  1. Change line 18 from:
     ```
     DATABASE_URL="postgresql://user:password@localhost:5432/em_ecosystem?schema=public"
     ```
     to:
     ```
     DATABASE_URL="postgresql://user:password@localhost:5432/em_ecosystem?schema=public&sslmode=require"
     ```
  2. Add a comment above or inline noting that `sslmode=require` is mandatory in production
- **Notes**: Do NOT modify `.env` (developer's local config)

### Step 2: Add DATABASE_URL sslmode Validation

- **File**: `nexacore-api/src/common/utils/validate-production-secrets.ts`
- **Action**: Add a DATABASE_URL sslmode check after the existing JWT_ACCESS_EXPIRATION validation block (after line 93)
- **Implementation Steps**:
  1. After the JWT_ACCESS_EXPIRATION block, add a new validation block:
     ```typescript
     // OWASP ASVS V8.3.7: Database connections must use TLS in production
     const databaseUrl = process.env.DATABASE_URL;
     if (!databaseUrl) {
       throw new Error(
         'FATAL: DATABASE_URL must be set in production',
       );
     }
     const sslModeMatch = databaseUrl.match(/[?&]sslmode=([^&]*)/);
     const sslMode = sslModeMatch?.[1];
     const SECURE_SSL_MODES = ['require', 'verify-ca', 'verify-full'];
     if (!sslMode || !SECURE_SSL_MODES.includes(sslMode)) {
       throw new Error(
         'FATAL: DATABASE_URL must include sslmode=require (or verify-ca/verify-full) in production (OWASP ASVS V8.3.7)',
       );
     }
     ```
  2. The regex `[?&]sslmode=([^&]*)` handles both `?sslmode=` and `&sslmode=` positions in the query string
  3. Three secure modes accepted: `require` (encrypts, no cert verification), `verify-ca` (verifies CA), `verify-full` (verifies CA + hostname)
  4. Insecure modes rejected: `disable`, `allow`, `prefer` (all permit plaintext), or absent sslmode
- **Dependencies**: None (pure string parsing, no new imports)

### Step 3: Add Unit Tests for DATABASE_URL Validation

- **File**: `nexacore-api/src/tests/validate-production-secrets.spec.ts`
- **Action**: Add a new `describe('DATABASE_URL')` block with 7 test cases
- **Implementation Steps**:
  1. Add `DATABASE_URL` to the `VALID_SECRETS` object:
     ```typescript
     DATABASE_URL: 'postgresql://user:pass@db.prod.com:5432/em_ecosystem?schema=public&sslmode=require',
     ```
  2. Add a new describe block after the JWT_ACCESS_EXPIRATION block:
     ```typescript
     describe('DATABASE_URL', () => {
       it('should throw when DATABASE_URL is missing', () => {
         delete process.env.DATABASE_URL;
         const validate = loadValidator();
         expect(() => validate()).toThrow('FATAL: DATABASE_URL');
       });

       it('should throw when DATABASE_URL has no sslmode', () => {
         process.env.DATABASE_URL = 'postgresql://user:pass@db:5432/em?schema=public';
         const validate = loadValidator();
         expect(() => validate()).toThrow('FATAL: DATABASE_URL must include sslmode');
       });

       it('should throw when sslmode=prefer (insecure)', () => {
         process.env.DATABASE_URL = 'postgresql://user:pass@db:5432/em?schema=public&sslmode=prefer';
         const validate = loadValidator();
         expect(() => validate()).toThrow('FATAL: DATABASE_URL must include sslmode');
       });

       it('should throw when sslmode=disable (insecure)', () => {
         process.env.DATABASE_URL = 'postgresql://user:pass@db:5432/em?schema=public&sslmode=disable';
         const validate = loadValidator();
         expect(() => validate()).toThrow('FATAL: DATABASE_URL must include sslmode');
       });

       it('should not throw when sslmode=require', () => {
         process.env.DATABASE_URL = 'postgresql://user:pass@db:5432/em?schema=public&sslmode=require';
         const validate = loadValidator();
         expect(() => validate()).not.toThrow();
       });

       it('should not throw when sslmode=verify-ca', () => {
         process.env.DATABASE_URL = 'postgresql://user:pass@db:5432/em?schema=public&sslmode=verify-ca';
         const validate = loadValidator();
         expect(() => validate()).not.toThrow();
       });

       it('should not throw when sslmode=verify-full', () => {
         process.env.DATABASE_URL = 'postgresql://user:pass@db:5432/em?schema=public&sslmode=verify-full';
         const validate = loadValidator();
         expect(() => validate()).not.toThrow();
       });
     });
     ```
  3. The existing "should not throw when all secrets are valid" test will also pass because `VALID_SECRETS` now includes a valid DATABASE_URL
  4. The existing "skip validation when NODE_ENV is not production" test remains unchanged — the DATABASE_URL check is inside the production-only guard
- **Notes**: Follow existing test patterns: `loadValidator()` via dynamic `require()`, `delete process.env.X` for missing checks

### Step 4: Run Tests and Verify

- **Action**: Run the full backend test suite to confirm no regressions
- **Implementation Steps**:
  1. Run targeted test: `npx jest --testPathPatterns validate-production-secrets`
  2. Run full suite: `npx jest` (expect 863+ passed, 0 failed, plus 7 new = 870+)
  3. Run build: `npx nest build` (must compile clean)

### Step 5: Update Technical Documentation

- **Action**: No documentation updates required for this ticket
- **Implementation Steps**:
  1. **api-spec.yml**: No changes (no new endpoints)
  2. **data-model.md**: No changes (no schema changes)
  3. **integration-state.md**: No changes (no module/guard/controller changes — this is a standalone utility function)
  4. Documentation updates will be handled via `/update-docs` post-implementation

## Implementation Order

1. Step 0: Create feature branch `feature/SCRUM-221-backend`
2. Step 1: Update `.env.example` DATABASE_URL with `&sslmode=require`
3. Step 2: Add DATABASE_URL sslmode validation to `validateProductionSecrets()`
4. Step 3: Add 7 unit tests for DATABASE_URL validation
5. Step 4: Run tests and verify (full suite + build)
6. Step 5: Documentation review (no updates needed for this ticket)

## Testing Checklist

- [ ] DATABASE_URL missing in production → throws FATAL
- [ ] DATABASE_URL without sslmode → throws FATAL
- [ ] sslmode=prefer → throws FATAL
- [ ] sslmode=disable → throws FATAL
- [ ] sslmode=require → passes
- [ ] sslmode=verify-ca → passes
- [ ] sslmode=verify-full → passes
- [ ] Non-production (NODE_ENV=development) → skips all checks
- [ ] All existing 18 tests still pass
- [ ] Full backend suite passes (863+)
- [ ] `nest build` compiles clean

## Error Response Format

N/A — `validateProductionSecrets()` runs at startup before NestFactory.create(). Errors are fatal `throw new Error('FATAL: ...')` that crash the process.

## Dependencies

- None — pure string validation, no new packages

## Notes

- The `.env` file (developer's local config) is NOT modified — only `.env.example` (template)
- Validation only runs when `NODE_ENV=production` — local dev on localhost is unaffected
- The `sslmode` parameter is a PostgreSQL libpq connection string option, not Prisma-specific
- `sslmode=prefer` is explicitly rejected because it silently falls back to plaintext if TLS negotiation fails
- Three secure modes accepted: `require` (minimum TLS), `verify-ca` (TLS + CA cert), `verify-full` (TLS + CA + hostname)

## Next Steps After Implementation

1. Run `/verify SCRUM-221` to validate implementation
2. Run `/commit SCRUM-221` to commit changes
3. Run `/update-docs SCRUM-221` to create implementation record

## Implementation Verification

- [ ] Code follows existing `validateProductionSecrets()` pattern (fatal throw, standard reference in message)
- [ ] Regex correctly parses sslmode from both `?sslmode=` and `&sslmode=` positions
- [ ] `.env.example` updated but `.env` untouched
- [ ] 7 new tests added following existing test patterns
- [ ] Full test suite passes with 0 failures
- [ ] Build compiles clean
