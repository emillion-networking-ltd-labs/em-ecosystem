# Backend Implementation Plan: SCRUM-223 — Migrate token.service.ts to ConfigService (I-10)

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-221 (Enforce database TLS in production)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/token.service.ts` — 388 lines, 9 constructor deps, 6 `process.env` reads at lines 59, 62, 81, 188, 269, 283
  - `nexacore-api/src/config/auth.config.ts` — registers `auth` namespace with `jwtSecret`, `jwtAccessExpiration`, `jwtRefreshExpiration` (+ 7 more keys)
  - `nexacore-api/src/config/app.config.ts` — registers `app` namespace with `nodeEnv`, `frontendUrl`, `oauthAllowedRedirectUrls`, `isProduction`
  - `nexacore-api/src/auth/tests/auth-test.helpers.ts` — 237 lines, `createAuthTestModule()` with 15 providers, does NOT include ConfigService mock
  - `nexacore-api/src/auth/mfa.service.ts` — uses `this.configService.get<string>('auth.jwtSecret')` (reference pattern)
  - `nexacore-api/src/auth/auth.module.ts` — uses `configService.get<string>('auth.jwtSecret')` in JwtModule.registerAsync
- **Constructor signatures verified**:
  - `TokenService(jwtService: JwtService, sessionsService: SessionsService, usersService: UsersService, prisma: PrismaService, mailService: MailService, tokenDenyListService: TokenDenyListService, auditService: AuditService, impossibleTravelService: ImpossibleTravelService, suspiciousLoginService: SuspiciousLoginService)` — 9 deps, ConfigService will be 10th
- **Methods verified to exist**:
  - `generateTokens()` — L69 (uses `process.env.JWT_ACCESS_EXPIRATION` at L81)
  - `refreshTokens()` — L120 (uses `process.env.JWT_ACCESS_EXPIRATION` at L188)
  - `buildRefreshCookie()` — L263 (uses `process.env.NODE_ENV` at L269)
  - `buildClearCookie()` — L277 (uses `process.env.NODE_ENV` at L283)
  - Constructor — L47-67 (uses `process.env.JWT_REFRESH_EXPIRATION` at L59, `process.env.JWT_SECRET` at L62)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None relevant

## Overview

Complete the ConfigService migration for `token.service.ts`, the last auth service file that still uses direct `process.env` reads. This was missed during the SCRUM-179 migration. All 6 `process.env` reads will be replaced with `configService.get()` calls using existing config keys from `auth.config.ts` and `app.config.ts`. No new config keys needed.

**Standard**: OWASP ASVS V14.2.1

## Architecture Context

- **Module**: AuthModule (no changes — ConfigModule is @Global)
- **Files affected**: 2 source + 1 test helper
  - `nexacore-api/src/auth/token.service.ts` — inject ConfigService, replace 6 process.env reads
  - `nexacore-api/src/auth/tests/auth-test.helpers.ts` — add ConfigService mock
  - `nexacore-api/src/auth/tests/auth-token.spec.ts` — may need updates if tests rely on process.env

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-223-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-223-backend`
  3. Verify: `git branch`

### Step 1: Inject ConfigService into TokenService

- **File**: `nexacore-api/src/auth/token.service.ts`
- **Action**: Add ConfigService as 10th constructor dependency
- **Implementation Steps**:
  1. Add import: `import { ConfigService } from '@nestjs/config';`
  2. Add to constructor as last parameter: `private readonly configService: ConfigService`
  3. Constructor becomes 10 deps total

### Step 2: Replace process.env Reads in Constructor

- **File**: `nexacore-api/src/auth/token.service.ts`
- **Action**: Replace 2 process.env reads in constructor (lines 59, 62)
- **Implementation Steps**:
  1. **Line 59** — Replace:
     ```typescript
     // Before:
     this.refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '12h';
     // After:
     this.refreshExpiration = this.configService.get<string>('auth.jwtRefreshExpiration')!;
     ```
  2. **Line 62** — Replace:
     ```typescript
     // Before:
     const jwtSecret = process.env.JWT_SECRET || 'default-dev-secret-change-in-production';
     // After:
     const jwtSecret = this.configService.get<string>('auth.jwtSecret')!;
     ```

### Step 3: Replace process.env Reads in generateTokens() and refreshTokens()

- **File**: `nexacore-api/src/auth/token.service.ts`
- **Action**: Replace 2 process.env reads for JWT_ACCESS_EXPIRATION (lines 81, 188)
- **Implementation Steps**:
  1. **Line 81** (generateTokens) — Replace:
     ```typescript
     // Before:
     expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
     // After:
     expiresIn: this.configService.get<string>('auth.jwtAccessExpiration')! as StringValue,
     ```
  2. **Line 188** (refreshTokens) — Replace:
     ```typescript
     // Before:
     expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
     // After:
     expiresIn: this.configService.get<string>('auth.jwtAccessExpiration')! as StringValue,
     ```
  - **Notes**: Both reads are identical — the access token expiration is used when signing new access tokens in both methods. Consider extracting to a private readonly field in constructor for DRY (like `refreshExpiration`), but this is optional.

### Step 4: Replace process.env Reads in Cookie Methods

- **File**: `nexacore-api/src/auth/token.service.ts`
- **Action**: Replace 2 process.env reads for NODE_ENV (lines 269, 283)
- **Implementation Steps**:
  1. Add a private readonly field in the class: `private readonly isProduction: boolean;`
  2. In constructor, set: `this.isProduction = this.configService.get<boolean>('app.isProduction')!;`
  3. **Line 269** (buildRefreshCookie) — Replace:
     ```typescript
     // Before:
     secure: process.env.NODE_ENV === 'production',
     // After:
     secure: this.isProduction,
     ```
  4. **Line 283** (buildClearCookie) — Replace:
     ```typescript
     // Before:
     secure: process.env.NODE_ENV === 'production',
     // After:
     secure: this.isProduction,
     ```

### Step 5: Update Test Helpers with ConfigService Mock

- **File**: `nexacore-api/src/auth/tests/auth-test.helpers.ts`
- **Action**: Add ConfigService mock to the test module provider list
- **Implementation Steps**:
  1. Add import: `import { ConfigService } from '@nestjs/config';`
  2. Add to providers array (after TokenDenyListService mock):
     ```typescript
     {
       provide: ConfigService,
       useValue: {
         get: jest.fn((key: string) => {
           const config: Record<string, unknown> = {
             'auth.jwtSecret': 'test-jwt-secret-at-least-32-characters',
             'auth.jwtAccessExpiration': '15m',
             'auth.jwtRefreshExpiration': '12h',
             'auth.mfaAppName': 'EM NexaCore',
             'app.nodeEnv': 'test',
             'app.isProduction': false,
             'app.frontendUrl': 'http://localhost:3001',
           };
           return config[key];
         }),
       },
     },
     ```
  3. This mock follows the same `configService.get()` pattern used by other auth services
- **Notes**: The mock covers all config keys used by TokenService plus common keys used by other services sharing this test module (MfaService, etc.)

### Step 6: Verify Zero process.env Remaining

- **Action**: Grep `token.service.ts` for `process.env` — must return zero results
- **Implementation Steps**:
  1. Run: `grep -n 'process.env' nexacore-api/src/auth/token.service.ts`
  2. Expected: no results

### Step 7: Run Tests and Verify

- **Action**: Run the full backend test suite
- **Implementation Steps**:
  1. Run targeted test: `npx jest --testPathPatterns auth-token`
  2. Run full suite: `npx jest --maxWorkers=1 --forceExit` (expect 870+ passed, 0 failed)
  3. Run build: `npx nest build` (must compile clean)

### Step 8: Update Technical Documentation

- **Action**: No API or data model changes. Integration-state.md needs a changelog entry noting the DI change.
- **Implementation Steps**:
  1. No `api-spec.yml` changes (no endpoints modified)
  2. No `data-model.md` changes (no schema changes)
  3. `integration-state.md`: No structural changes needed (ConfigService is @Global, not a new module import). Add changelog entry.

## Implementation Order

1. Step 0: Create feature branch `feature/SCRUM-223-backend`
2. Step 1: Inject ConfigService into TokenService constructor
3. Step 2: Replace constructor process.env reads (JWT_REFRESH_EXPIRATION, JWT_SECRET)
4. Step 3: Replace method process.env reads (JWT_ACCESS_EXPIRATION x2)
5. Step 4: Replace cookie method process.env reads (NODE_ENV x2)
6. Step 5: Update test helpers with ConfigService mock
7. Step 6: Verify zero process.env remaining
8. Step 7: Run tests and build
9. Step 8: Documentation (changelog only)

## Testing Checklist

- [ ] `token.service.ts` has zero `process.env` references
- [ ] ConfigService is 10th constructor dependency
- [ ] `configService.get('auth.jwtSecret')` used for MFA challenge secret derivation
- [ ] `configService.get('auth.jwtRefreshExpiration')` used for refresh token expiry
- [ ] `configService.get('auth.jwtAccessExpiration')` used in generateTokens() and refreshTokens()
- [ ] `configService.get('app.isProduction')` used in buildRefreshCookie() and buildClearCookie()
- [ ] Test helpers provide ConfigService mock with test values
- [ ] All existing 870+ tests still pass
- [ ] `nest build` compiles clean

## Error Response Format

N/A — no endpoint or error handling changes.

## Dependencies

- None — ConfigService is already globally available via ConfigModule.forRoot() in AppModule

## Notes

- `app.config.ts` already has `isProduction: process.env.NODE_ENV === 'production'` — use this boolean directly instead of comparing strings
- The `!` non-null assertion on `configService.get()` is safe because these config keys have defaults in their respective config factories
- AuthModule does NOT need to import ConfigModule — it's `@Global`
- The `StringValue` type cast (`as StringValue`) is retained for the `ms` library type compatibility
- This completes the ConfigService migration started in SCRUM-179 — all auth services now use ConfigService

## Next Steps After Implementation

1. Run `/verify SCRUM-223` to validate implementation
2. Run `/commit SCRUM-223` to commit changes
3. Run `/update-docs SCRUM-223` to create implementation record

## Implementation Verification

- [ ] Zero `process.env` reads in `token.service.ts`
- [ ] ConfigService follows existing pattern (`this.configService.get<string>('auth.xxx')!`)
- [ ] Test helpers mock ConfigService.get() with all needed keys
- [ ] Full test suite passes with 0 failures
- [ ] Build compiles clean
- [ ] No module import changes needed (ConfigModule is @Global)
