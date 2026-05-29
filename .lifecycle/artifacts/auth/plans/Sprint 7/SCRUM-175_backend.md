# Backend Implementation Plan: SCRUM-175 Create E2E Tests for Auth Critical Flows

## 1. Header

- **Ticket**: SCRUM-175
- **Sprint**: Sprint 7 - Audit Remediation
- **Parent**: SCRUM-174 (Auth Module Audit Epic)
- **Audit Finding**: T-14 (FAIL, MEDIUM) — No E2E tests for auth critical flows

---

## 2. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: 3277d16 (frontend auth UI refinements)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `test/jest-e2e.json` — E2E Jest config (9 lines, testRegex: `.e2e-spec.ts$`, ts-jest transform)
  - `test/app.e2e-spec.ts` — Existing E2E tests (369 lines, mocked Prisma, basic register/login/refresh/me/admin/logout)
  - `src/main.ts` — App bootstrap (82 lines: validateProductionSecrets, helmet, CORS, cookie-parser, ValidationPipe, HttpExceptionFilter, Swagger)
  - `src/app.module.ts` — Root module (43 lines: RedisModule, ThrottlerModule, PrismaModule, AuthModule, UsersModule, AuditModule, SecurityModule, MailModule, PermissionsModule, GeolocationModule + APP_GUARD CustomThrottlerGuard)
  - `src/auth/auth.module.ts` — Auth module (69 lines: 8 imports, 3 controllers, 13 providers)
  - `src/auth/auth.service.ts` — AuthService constructor (12 deps: UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService, TrustedDeviceService, ImpossibleTravelService, SuspiciousLoginService, TokenDenyListService)
  - `src/auth/auth.controller.ts` — Auth controller (28 endpoints, imports verified)
  - `src/security/security.module.ts` — Security module (CsrfGuard as APP_GUARD, TurnstileService, TurnstileGuard, SuspiciousLoginService)
  - `src/common/guards/csrf.guard.ts` — CsrfGuard (constructor: Reflector, checks x-csrf-token header, skips safe methods + @SkipCsrf)
  - `src/security/turnstile.guard.ts` — TurnstileGuard (constructor: TurnstileService, validates turnstileToken from body)
  - `src/common/guards/custom-throttler.guard.ts` — CustomThrottlerGuard (extends ThrottlerGuard)
  - `src/mail/mail.service.ts` — MailService (constructor: MailerService, methods: sendVerificationEmail, sendPasswordResetEmail, sendLoginNotification)
  - `package.json` — test:e2e script: `jest --config ./test/jest-e2e.json`, supertest ^7.0.0, @nestjs/testing ^11.0.1
- **Discrepancies with integration-state.md**: None relevant to this ticket

---

## 3. Overview

Create comprehensive E2E integration tests for the auth module covering 5 critical multi-step flows that are currently untested:

1. **Register → Verify Email → Login** (full onboarding)
2. **Login → MFA Challenge → Verify** (MFA authentication)
3. **OAuth Code Exchange** (OAuth token flow)
4. **Session Lifecycle** (list, revoke, revoke-all)
5. **Password Reset** (forgot → validate → reset → login)

The existing `test/app.e2e-spec.ts` uses an in-memory mock Prisma and covers only basic register/login/refresh/me/admin/logout. It will be preserved as-is. The new E2E tests will also use mocked Prisma but with extended mock coverage for email verification tokens, MFA fields, sessions, password reset tokens, and OAuth flows.

**Rationale for mocked Prisma approach**: The existing E2E infrastructure uses in-memory mocks. A real database E2E setup is a separate infrastructure concern (CI docker-compose, test database provisioning). This ticket focuses on **testing multi-step auth flows end-to-end through the NestJS HTTP layer** — the current gap. The mock approach tests controller → service → response chains across multiple requests, which is the critical missing coverage.

---

## 4. Architecture Context

### Modules Involved
- **AppModule** (root) — bootstraps all modules
- **AuthModule** — 3 controllers, 13 providers
- **SecurityModule** — CsrfGuard (APP_GUARD), TurnstileGuard, TurnstileService
- **MailModule** — MailService (must be mocked to capture tokens)
- **PrismaModule** — PrismaService (mocked with extended in-memory store)
- **RedisModule** — Redis client (mocked with in-memory Map)

### Components Affected
- No production code changes
- New test files only

### Files Referenced
- `test/app.e2e-spec.ts` — existing pattern to follow
- `test/jest-e2e.json` — E2E Jest config
- `src/auth/auth.controller.ts` — 28 endpoints under test
- `src/auth/mfa.controller.ts` — 6 MFA endpoints under test
- `src/auth/auth.service.ts` — business logic under test

---

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch
- **Branch Naming**: `feature/SCRUM-175-backend`
- **Implementation Steps**:
  1. Ensure on latest `main`: `git checkout main && git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-175-backend`
  3. Verify: `git branch`

---

### Step 1: Create E2E Test Setup Module

- **File**: `nexacore-api/test/auth-e2e/setup.ts`
- **Action**: Create shared app initialization and mock factories
- **Implementation Steps**:

1. **Create extended mock Prisma factory** — extend the existing `createMockPrisma` pattern from `app.e2e-spec.ts` to support:
   - `user` — findUnique (by email, id), create, update (with emailVerified, mfaEnabled, mfaSecret, mfaRecoveryCodes, failedAttempts, lockedUntil, pendingEmail, passwordHash)
   - `emailVerificationToken` — create, findFirst (by token hash), update (usedAt)
   - `passwordResetToken` — create, findFirst (by token hash), update (usedAt)
   - `session` — create, findMany (by userId), findUnique (by id), delete, deleteMany
   - `oAuthAccount` — findFirst, create
   - `permission` — findMany
   - `rolePermission` — findMany (with include permission)
   - `$transaction` — execute callback with prisma instance
   - `$connect`, `$disconnect` — jest.fn()

2. **Create mock Redis factory** — return an object implementing the Redis interface methods used by auth:
   - `get(key)`, `set(key, value, 'EX', ttl)`, `del(key)` — backed by `Map<string, string>`
   - `setex(key, ttl, value)` — alias for set with EX
   - Used by: OAuthStateStore, OAuthCodeStore, TokenDenyListService, TrustedDeviceService, PasskeyService

3. **Create mock MailService** — jest mock that captures email arguments:
   - `sendVerificationEmail(email, token, firstName?)` → store `{ email, token }` in captured array
   - `sendPasswordResetEmail(email, token, firstName?)` → store `{ email, token }`
   - `sendLoginNotification(email, ...)` → no-op
   - `sendEmailChangeVerification(...)` → store token
   - Export `getLastCapturedEmail()` helper to retrieve the most recent token

4. **Create mock TurnstileService** — always returns `{ success: true }`

5. **Create mock PasswordBreachService** — `isBreached()` always returns `false`

6. **Create `createE2EApp()` function**:
   ```typescript
   export async function createE2EApp(): Promise<{
     app: INestApplication;
     mockPrisma: ReturnType<typeof createMockPrisma>;
     mockMail: MockMailService;
     mockRedis: MockRedis;
   }>
   ```
   - Use `Test.createTestingModule({ imports: [AppModule] })`
   - `.overrideProvider(PrismaService).useValue(mockPrisma)`
   - `.overrideProvider('REDIS_CLIENT').useValue(mockRedis)` (check the actual injection token)
   - `.overrideProvider(GoogleStrategy).useValue({})`
   - `.overrideProvider(GitHubStrategy).useValue({})`
   - `.overrideProvider(MailService).useValue(mockMail)`
   - `.overrideProvider(TurnstileService).useValue(mockTurnstile)`
   - `.overrideProvider(PasswordBreachService).useValue(mockBreach)`
   - Apply same global pipes/filters as `main.ts`: `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`, `HttpExceptionFilter()`
   - Apply `cookieParser()`
   - Call `app.init()`

---

### Step 2: Create E2E Test Helpers

- **File**: `nexacore-api/test/auth-e2e/helpers.ts`
- **Action**: Create reusable test helper functions
- **Implementation Steps**:

1. **`registerUser(server, overrides?)`** — POST /auth/register with default email/password, returns response body

2. **`loginUser(server, email, password)`** — POST /auth/login, returns response body + extracts cookies from `set-cookie` header

3. **`getCsrfToken(server)`** — GET /auth/csrf-token with @SkipCsrf, returns the token string. Note: the CSRF guard reads from `x-csrf-token` header and compares against cookie/session.

4. **`verifyEmailInMock(mockPrisma, email)`** — directly update the mock user store to set `emailVerified: true` (simulates clicking the verification link)

5. **`enableMfaInMock(mockPrisma, email, secret)`** — directly update user in mock store: `mfaEnabled: true`, `mfaSecret: encryptedSecret` (use the same encryption as `mfa.service.ts`)

6. **`generateTotpCode(secret)`** — use `otplib.authenticator.generate(secret)` to produce a valid 6-digit code

7. **`hashToken(token)`** — SHA-256 hash to match how auth.service.ts stores verification/reset tokens

8. **`createVerificationTokenInMock(mockPrisma, userId, rawToken)`** — insert hashed token into emailVerificationToken store

9. **`createResetTokenInMock(mockPrisma, userId, rawToken)`** — insert hashed token into passwordResetToken store

10. **`createSessionInMock(mockPrisma, userId, refreshToken)`** — insert session record

---

### Step 3: Create Auth Flows E2E Test

- **File**: `nexacore-api/test/auth-e2e/auth-flows.e2e-spec.ts`
- **Action**: Test flows 1, 4, 5
- **Implementation Steps**:

#### Flow 1: Register → Verify Email → Login
```
describe('Flow 1: Register → Verify Email → Login')
  it('should register, verify email, and login successfully')
    1. POST /auth/register { email, password } → 201, get accessToken
    2. Verify email in mock (set emailVerified: true + create verification token)
    3. POST /auth/login { email, password } → 200, get accessToken + refreshToken
    4. GET /auth/me with Bearer token → 200, verify email in response
```

#### Flow 4: Session Lifecycle
```
describe('Flow 4: Session Lifecycle')
  it('should list, revoke individual, and revoke-all sessions')
    1. Register + verify email + login (reuse helpers)
    2. Login again from "different device" (creates 2nd session in mock)
    3. GET /auth/sessions → 200, verify 2 sessions returned
    4. DELETE /auth/sessions/:id (first session) → 200
    5. GET /auth/sessions → 200, verify 1 session remaining
    6. POST /auth/logout-all → 200
    7. GET /auth/sessions with old token → 401 (all sessions revoked)
```

#### Flow 5: Password Reset
```
describe('Flow 5: Password Reset')
  it('should complete full password reset flow')
    1. Register + verify email user
    2. POST /auth/forgot-password { email } → 200 (captures reset token via mockMail)
    3. Insert reset token in mock store (hashed)
    4. POST /auth/validate-reset-token { token } → 200
    5. POST /auth/reset-password { token, password: newPassword } → 200
    6. POST /auth/login { email, password: newPassword } → 200
    7. POST /auth/login { email, password: oldPassword } → 401
```

---

### Step 4: Create MFA Flows E2E Test

- **File**: `nexacore-api/test/auth-e2e/mfa-flows.e2e-spec.ts`
- **Action**: Test flow 2 (Login → MFA Challenge → Verify)
- **Implementation Steps**:

```
describe('Flow 2: Login → MFA Challenge → Verify')
  it('should require MFA and verify with TOTP code')
    1. Register + verify email user
    2. Login to get accessToken
    3. POST /auth/mfa/setup with Bearer → 200, get secret + qrCode
    4. Generate TOTP code from secret using otplib
    5. POST /auth/mfa/verify-setup { code } with Bearer → 200, get recoveryCodes
    6. POST /auth/logout → 200
    7. POST /auth/login { email, password } → 200, verify response has mfaRequired: true + mfaToken
    8. Generate fresh TOTP code
    9. POST /auth/mfa/verify-login { mfaToken, code } → 200, get accessToken + refreshToken
    10. GET /auth/me with Bearer → 200, verify user identity

  it('should reject invalid MFA code')
    1. Login to get mfaToken
    2. POST /auth/mfa/verify-login { mfaToken, code: '000000' } → 401

  it('should verify MFA status endpoint')
    1. Login with MFA → get accessToken
    2. GET /auth/mfa/status with Bearer → 200, verify mfaEnabled: true
```

**Note**: The MFA setup/verify flow requires the AuthService to properly handle TOTP secret encryption. The mock must support the `user.mfaSecret` field and the CryptoService encryption. If CryptoService is not mockable at the E2E level, the test should override it too.

---

### Step 5: Create OAuth Flows E2E Test

- **File**: `nexacore-api/test/auth-e2e/oauth-flows.e2e-spec.ts`
- **Action**: Test flow 3 (OAuth Code Exchange)
- **Implementation Steps**:

```
describe('Flow 3: OAuth Code Exchange')
  it('should exchange OAuth code for tokens')
    1. Pre-seed a user in mock Prisma with OAuth provider data
    2. Store an OAuth code in mock Redis (key: 'oauth:code:{code}', value: JSON with userId, provider, email)
    3. POST /auth/oauth/exchange { code, state } → 200, get accessToken + refresh cookie
    4. GET /auth/me with Bearer → 200, verify user email

  it('should reject expired/invalid OAuth code')
    1. POST /auth/oauth/exchange { code: 'invalid', state: 'x' } → 401

  it('should reject used OAuth code (replay attack)')
    1. Exchange valid code → 200
    2. Exchange same code again → 401
```

**Implementation Note**: The OAuthCodeStore uses Redis `get` + `del` pattern. The mock Redis must support this. The code format stored is: `{ userId, provider, email, accessToken?, refreshToken? }`.

---

### Step 6: Verify Existing E2E Tests Still Pass

- **Action**: Run `npm run test:e2e` and verify both old and new tests pass
- **Implementation Steps**:
  1. Run `npx jest --config ./test/jest-e2e.json --verbose`
  2. Verify all suites pass (existing `app.e2e-spec.ts` + new auth-e2e tests)
  3. Verify total execution time < 120s

---

### Step 7: Update Technical Documentation

- **Action**: Update documentation to reflect E2E test coverage
- **Implementation Steps**:
  1. **integration-state.md**: Add "E2E Test Coverage" section under Auth module noting the 5 tested flows
  2. **No other doc changes needed** — this ticket adds tests only, no API/schema/architecture changes

---

## 6. Implementation Order

1. Step 0: Create feature branch `feature/SCRUM-175-backend`
2. Step 1: Create `test/auth-e2e/setup.ts` (app factory + mocks)
3. Step 2: Create `test/auth-e2e/helpers.ts` (test utilities)
4. Step 3: Create `test/auth-e2e/auth-flows.e2e-spec.ts` (flows 1, 4, 5)
5. Step 4: Create `test/auth-e2e/mfa-flows.e2e-spec.ts` (flow 2)
6. Step 5: Create `test/auth-e2e/oauth-flows.e2e-spec.ts` (flow 3)
7. Step 6: Run all E2E tests, verify pass
8. Step 7: Update documentation

---

## 7. Testing Checklist

- [ ] All 5 E2E flows pass
- [ ] Existing `app.e2e-spec.ts` tests still pass
- [ ] No unit tests broken (`npm test`)
- [ ] Total E2E suite < 120s
- [ ] Tests are deterministic (pass on repeated runs)
- [ ] Tests are isolated (no inter-test dependencies)
- [ ] Mock cleanup in afterAll (app.close())

---

## 8. Error Response Format

All error responses follow the existing `HttpExceptionFilter` pattern:
```json
{
  "success": false,
  "error": {
    "message": "string",
    "code": "ERROR_CODE",
    "statusCode": 401
  }
}
```

E2E tests should assert against this structure using the `ErrorBody` interface pattern from `app.e2e-spec.ts`.

---

## 9. Partial Update Support

N/A — this ticket adds test files only.

---

## 10. Dependencies

- **Existing** (already in devDependencies):
  - `@nestjs/testing: ^11.0.1`
  - `supertest: ^7.0.0`
  - `jest: ^30.0.0`
  - `ts-jest: ^29.2.5`

- **Required for MFA TOTP generation in tests**:
  - `otplib` — already in production dependencies (^13.3.0), available for test import

- **No new dependencies needed**

---

## 11. Notes

- **No production code changes** — this ticket creates test files only
- **Mock approach over real DB**: Matches existing `app.e2e-spec.ts` pattern. Real database E2E is a separate infrastructure ticket
- **CSRF handling**: The CsrfGuard is an APP_GUARD. For E2E tests, either:
  - Override CsrfGuard to always pass (simplest)
  - Or fetch CSRF token from `GET /auth/csrf-token` and send `x-csrf-token` header
  - Recommended: override for simplicity in E2E since CSRF is already unit tested
- **Rate limiting**: The CustomThrottlerGuard is an APP_GUARD. Override with a passthrough guard in E2E setup to prevent rate limit hits during multi-request flows
- **Cookie handling**: Use `supertest` agent to persist cookies across requests, or manually extract `set-cookie` header and send `cookie` header
- **Redis injection token**: Verify the exact injection token for Redis client in `redis.module.ts` — likely `'REDIS_CLIENT'` or `Redis` class. Use the correct token in overrideProvider
- **MFA encryption**: MFA secrets are encrypted with CryptoService (AES-256-GCM). If CryptoService is not overrideable at E2E level, consider mocking it or using the real one with a test encryption key in env

---

## 12. Next Steps After Implementation

1. PR to `main` via `gh pr create`
2. Re-run audit Phase 2 check T-14 to verify PASS
3. Consider future ticket for real database E2E (Docker + Prisma migrate + Redis container)

---

## 13. Implementation Verification

- [ ] **Code Quality**: All test files follow project conventions (kebab-case, TypeScript strict)
- [ ] **Functionality**: All 5 critical auth flows tested end-to-end through HTTP layer
- [ ] **Testing**: Both existing and new E2E suites pass, unit tests unaffected
- [ ] **Integration**: New test files discoverable by `jest --config ./test/jest-e2e.json` via testRegex
- [ ] **Documentation**: integration-state.md updated with E2E coverage note
