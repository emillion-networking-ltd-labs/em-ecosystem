# Backend Implementation Plan: SCRUM-181 Decompose AuthService God Class

## Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-180 (Trust Device on MFA Login)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.service.ts` (1,259 LOC, 12 DI deps, 19 public + 9 private methods)
  - `src/auth/auth.module.ts` (69 LOC — providers, exports, JwtModule.register still uses process.env)
  - `src/auth/auth.controller.ts` (constructor: AuthService, SessionsService, JwtService, PermissionsService, TrustedDeviceService — 5 deps)
  - `src/auth/mfa.controller.ts` (constructor: MfaService, AuthService, TrustedDeviceService — 3 deps, uses `authService.generateTokensForMfa()` at L109)
  - `src/auth/passkey.controller.ts` (constructor: PasskeyService, AuthService — 2 deps, uses `authService.generateTokensForMfa()` at L133)
  - `src/auth/strategies/google.strategy.ts` (constructor: AuthService, OAuthStateStore — uses `authService.validateOAuthUser()`, `authService.validateOAuthLink()`)
  - `src/auth/strategies/github.strategy.ts` (constructor: AuthService, OAuthStateStore — uses `authService.validateOAuthUser()`, `authService.validateOAuthLink()`)
  - `src/auth/tests/auth.service.spec.ts` (2,860 LOC, 149 tests)

- **Constructor signature verified**:
  ```
  AuthService(
    usersService: UsersService,           // 1
    sessionsService: SessionsService,     // 2
    jwtService: JwtService,               // 3
    oauthCodeStore: OAuthCodeStore,       // 4
    auditService: AuditService,           // 5
    passwordBreachService: PasswordBreachService, // 6
    prisma: PrismaService,                // 7
    mailService: MailService,             // 8
    trustedDeviceService: TrustedDeviceService,   // 9
    impossibleTravelService: ImpossibleTravelService, // 10
    suspiciousLoginService: SuspiciousLoginService,   // 11
    tokenDenyListService: TokenDenyListService,       // 12
  )
  ```

- **Methods verified to exist** (all in `src/auth/auth.service.ts`):
  - Public: register (L133), login (L196), refreshTokens (L453), validateOAuthUser (L549), validateOAuthLink (L601), generateOAuthCode (L625), exchangeOAuthCode (L634), logout (L649), logoutAll (L674), generateTokensForMfa (L694), verifyEmail (L880), verifyEmailChange (L925), resendVerificationEmail (L1013?), resendVerificationByEmail (L1042?), forgotPassword (L1068), resetPassword (L1114), validateResetToken (L1190), buildRefreshCookie (L1232), buildClearCookie (L1246)
  - Private: generateTokens, notifyIfNewDevice, checkImpossibleTravel, handleTravelBlock, checkSuspiciousLoginSuccess, checkSuspiciousLoginFailure, createAndSendVerificationEmail, hashToken
  - Top-level: parseDurationMs (L49)

- **Guard dependency chain verified**: N/A (no guard changes in this ticket)
- **Discrepancies with integration-state.md**: None — AuthService shows 12 deps matching integration-state.md (13 listed there includes ConfigService from SCRUM-179, but live code still uses `process.env` directly — SCRUM-179 may have been partially applied or ConfigService is injected elsewhere; confirmed constructor has 12 deps without ConfigService in live code)

## Overview

Decompose the 1,259-line AuthService god class into 5 focused services + a thin facade. Pure structural refactor — zero behavioral changes. This resolves 5 Phase 10 audit FAILs (SM-01, SM-03, CX-03, CX-05, SD-01).

**Strategy**: Facade pattern. AuthService becomes a thin delegator that re-exports methods from sub-services. AuthController continues injecting AuthService (no controller changes). Only OAuth strategies, MfaController, and PasskeyController switch to direct injection for the specific methods they need.

## Architecture Context

- **Module**: AuthModule (sole module affected)
- **Services created**: TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService
- **Services modified**: AuthService (rewritten as facade)
- **Files modified**: auth.module.ts (register new providers), mfa.controller.ts, passkey.controller.ts, google.strategy.ts, github.strategy.ts
- **Tests**: auth.service.spec.ts split into 6 spec files

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-181-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-181-backend`
  3. `git branch` — verify

### Step 1: Extract Shared Utilities

- **Files**:
  - `src/auth/utils/hash-token.ts` (new)
  - `src/auth/utils/parse-duration.ts` (new)
  - `src/auth/interfaces/auth.interfaces.ts` (new)

- **Action**: Extract pure utility functions and type definitions that multiple sub-services will share.

- **Implementation Steps**:
  1. **`src/auth/utils/hash-token.ts`**: Move `hashToken()` (L1228–1230 of auth.service.ts). Export as standalone function:
     ```typescript
     import * as crypto from 'crypto';
     export function hashToken(token: string): string {
       return crypto.createHash('sha256').update(token).digest('hex');
     }
     ```
  2. **`src/auth/utils/parse-duration.ts`**: Move `parseDurationMs()` (L49–66). Export as standalone function with same signature.
  3. **`src/auth/interfaces/auth.interfaces.ts`**: Move these interfaces from auth.service.ts:
     - `CookieConfig`
     - `AuthResult`
     - `RegisterResult`
     - `MfaChallengeResult`
     - `MfaSetupRequiredResult`
     - Also move `RefreshTokenPayload` import re-export if needed by multiple services.

- **Notes**: These are pure functions/types with no DI — simplest extraction, zero risk.

### Step 2: Create TokenService

- **File**: `src/auth/token.service.ts` (new)

- **Action**: Extract JWT/session token lifecycle methods.

- **Methods to move from AuthService**:
  - `generateTokens()` (private → public, L722–764)
  - `refreshTokens()` (public, L453–547)
  - `generateTokensForMfa()` (public, L694–720)
  - `buildRefreshCookie()` (public, L1232–1244)
  - `buildClearCookie()` (public, L1246–1258)
  - `notifyIfNewDevice()` (private, L766–798)

- **Constructor DI** (5 deps):
  ```typescript
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly mailService: MailService,
    private readonly tokenDenyListService: TokenDenyListService,
    private readonly auditService: AuditService,
  )
  ```

- **Implementation Steps**:
  1. Create `@Injectable()` class `TokenService`
  2. Move private fields: `refreshExpiration`, `refreshMaxAgeMs`, `mfaChallengeSecret` — initialize in constructor (read from `process.env` same as current code)
  3. Move `parseDurationMs` import from `./utils/parse-duration`
  4. Move `generateTokens()` — make it `public` (other services call it)
  5. Move `refreshTokens()` — carries over session idle check, token family rotation, theft detection logic
  6. Move `generateTokensForMfa()` — wraps `generateTokens()` with request meta
  7. Move `buildRefreshCookie()` and `buildClearCookie()` — simple cookie config builders
  8. Move `notifyIfNewDevice()` as private helper (used by `generateTokens()`)
  9. Import interfaces from `./interfaces/auth.interfaces`

- **Estimated LOC**: ~250

### Step 3: Create EmailVerificationService

- **File**: `src/auth/email-verification.service.ts` (new)

- **Action**: Extract email verification and email change flows.

- **Methods to move from AuthService**:
  - `verifyEmail()` (public, L880–923)
  - `verifyEmailChange()` (public, L925–1011)
  - `resendVerificationEmail()` (public, L1013–1040)
  - `resendVerificationByEmail()` (public, L1042–1064)
  - `createAndSendVerificationEmail()` (private, L1206–1226)

- **Constructor DI** (5 deps):
  ```typescript
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
  )
  ```

- **Implementation Steps**:
  1. Create `@Injectable()` class `EmailVerificationService`
  2. Move constants: `VERIFICATION_TOKEN_EXPIRY_HOURS`, `RESEND_COOLDOWN_SECONDS`
  3. Import `hashToken` from `./utils/hash-token`
  4. Move all 4 public methods + 1 private helper preserving exact logic
  5. `verifyEmailChange()` uses `$transaction` — preserve the atomic email swap logic exactly

- **Estimated LOC**: ~250

### Step 4: Create PasswordResetService

- **File**: `src/auth/password-reset.service.ts` (new)

- **Action**: Extract password recovery and reset flows.

- **Methods to move from AuthService**:
  - `forgotPassword()` (public, L1068–1112)
  - `resetPassword()` (public, L1114–1188)
  - `validateResetToken()` (public, L1190–1202)

- **Constructor DI** (5 deps):
  ```typescript
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly passwordBreachService: PasswordBreachService,
    private readonly auditService: AuditService,
  )
  ```

- **Implementation Steps**:
  1. Create `@Injectable()` class `PasswordResetService`
  2. Move constant: `RESET_TOKEN_EXPIRY_HOURS`
  3. Import `hashToken` from `./utils/hash-token`
  4. Move `forgotPassword()` — preserve CWE-203 timing protection (DUMMY_PASSWORD_HASH bcrypt.compare)
  5. Move `resetPassword()` — preserve lockout reset, breach check, password change notification
  6. Move `validateResetToken()` — simple token lookup
  7. Import `BCRYPT_ROUNDS`, `DUMMY_PASSWORD_HASH` from constants

- **Estimated LOC**: ~200

### Step 5: Create OAuthAuthService

- **File**: `src/auth/oauth-auth.service.ts` (new)

- **Action**: Extract OAuth provider validation and code exchange.

- **Methods to move from AuthService**:
  - `validateOAuthUser()` (public, L549–599)
  - `validateOAuthLink()` (public, L601–623)
  - `generateOAuthCode()` (public, L625–632)
  - `exchangeOAuthCode()` (public, L634–647)

- **Constructor DI** (5 deps):
  ```typescript
  constructor(
    private readonly usersService: UsersService,
    private readonly oauthCodeStore: OAuthCodeStore,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
    private readonly impossibleTravelService: ImpossibleTravelService,
  )
  ```

- **Implementation Steps**:
  1. Create `@Injectable()` class `OAuthAuthService`
  2. Move `validateOAuthUser()` — calls `usersService.findOrCreateByOAuth()`, then `tokenService.generateTokens()`
  3. Move `validateOAuthLink()` — calls `usersService.linkOAuthProvider()`
  4. Move `generateOAuthCode()` — wraps `oauthCodeStore.generate()`
  5. Move `exchangeOAuthCode()` — wraps `oauthCodeStore.exchange()`, calls `tokenService.generateTokens()`
  6. Import `checkImpossibleTravel` logic — OAuthAuthService needs the impossible travel check that's called in `validateOAuthUser()`. Copy the private helper `checkImpossibleTravel()` + `handleTravelBlock()` here as well, OR inject LoginService. **Decision**: Duplicate the 2 small private helpers (~40 lines) to avoid circular dependency. They are simple wrappers around `impossibleTravelService`.

- **Estimated LOC**: ~150

### Step 6: Create LoginService

- **File**: `src/auth/login.service.ts` (new)

- **Action**: Extract password-based login orchestration and registration.

- **Methods to move from AuthService**:
  - `login()` (public, L196–451 — **255 lines, must be decomposed**)
  - `register()` (public, L133–194)
  - `checkImpossibleTravel()` (private, L800–821)
  - `handleTravelBlock()` (private, L823–846)
  - `checkSuspiciousLoginSuccess()` (private, L848–862)
  - `checkSuspiciousLoginFailure()` (private, L864–876)

- **Constructor DI** (8 deps):
  ```typescript
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly passwordBreachService: PasswordBreachService,
    private readonly trustedDeviceService: TrustedDeviceService,
    private readonly impossibleTravelService: ImpossibleTravelService,
    private readonly suspiciousLoginService: SuspiciousLoginService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  )
  ```

- **Implementation Steps**:
  1. Create `@Injectable()` class `LoginService`
  2. Move `register()` — preserve CWE-203 timing protection exactly
  3. **Decompose `login()`** into sub-methods (SM-03 fix — each ≤50 lines):
     - `login()` becomes orchestrator (~40 lines): calls sub-methods in sequence
     - `private validateCredentials(dto, user)` — password comparison, lockout increment
     - `private checkLockout(user)` — lockout status check, return retryAfter if locked
     - `private handleLoginSuccess(user, meta, fingerprint)` — trusted device check, MFA challenge, impossible travel, token generation
     - `private handleMfaChallenge(user)` — MFA token signing
     - `private handleMfaSetupRequired(user)` — admin MFA enforcement (OWASP ASVS V2.7.2)
  4. Move 4 private security helpers (checkImpossibleTravel, handleTravelBlock, checkSuspiciousLoginSuccess, checkSuspiciousLoginFailure)
  5. Import `EmailVerificationService` for `createAndSendVerificationEmail` called during `register()` — wait, register() calls `createAndSendVerificationEmail` which is being moved to EmailVerificationService. **Solution**: LoginService injects EmailVerificationService (adds 1 more dep → 9 total) OR we make `createAndSendVerificationEmail` a standalone method in EmailVerificationService that LoginService calls. **Decision**: Add EmailVerificationService as 9th dep to LoginService. This is acceptable for the most complex service.

- **Estimated LOC**: ~350

### Step 7: Rewrite AuthService as Thin Facade

- **File**: `src/auth/auth.service.ts` (rewrite)

- **Action**: AuthService becomes a delegating facade. Preserves backward-compatible public API for AuthController.

- **Constructor DI** (7 deps):
  ```typescript
  constructor(
    private readonly loginService: LoginService,
    private readonly tokenService: TokenService,
    private readonly oauthAuthService: OAuthAuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly sessionsService: SessionsService,
    private readonly tokenDenyListService: TokenDenyListService,
  )
  ```

- **Implementation Steps**:
  1. Remove ALL method implementations
  2. Each public method becomes a one-liner delegation:
     ```typescript
     register(...args) { return this.loginService.register(...args); }
     login(...args) { return this.loginService.login(...args); }
     refreshTokens(...args) { return this.tokenService.refreshTokens(...args); }
     validateOAuthUser(...args) { return this.oauthAuthService.validateOAuthUser(...args); }
     // ... etc
     ```
  3. Keep `logout()` and `logoutAll()` as direct implementations (they only use sessionsService + tokenDenyListService + auditService — simple enough to stay)
  4. Re-export interfaces from `./interfaces/auth.interfaces`
  5. Remove all unused imports

- **Estimated LOC**: ~150

### Step 8: Update Auth Module

- **File**: `src/auth/auth.module.ts`

- **Action**: Register 5 new providers.

- **Implementation Steps**:
  1. Import: TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService
  2. Add all 5 to `providers` array
  3. Add `TokenService` to `exports` array (MfaController and PasskeyController need it via direct injection from other modules — but they're in the same module, so providers suffice)
  4. Keep `AuthService` in exports (other modules may import it)

### Step 9: Update Direct Consumers

- **Files**:
  - `src/auth/mfa.controller.ts` — replace `AuthService` with `TokenService`
  - `src/auth/passkey.controller.ts` — replace `AuthService` with `TokenService`
  - `src/auth/strategies/google.strategy.ts` — replace `AuthService` with `OAuthAuthService`
  - `src/auth/strategies/github.strategy.ts` — replace `AuthService` with `OAuthAuthService`

- **Implementation Steps**:
  1. **mfa.controller.ts**: Change constructor from `AuthService` to `TokenService`. Update L109: `this.tokenService.generateTokensForMfa(user.id, meta)`. Update import.
  2. **passkey.controller.ts**: Change constructor from `AuthService` to `TokenService`. Update L133: `this.tokenService.generateTokensForMfa(userId, meta)`. Update import.
  3. **google.strategy.ts**: Change constructor from `AuthService` to `OAuthAuthService`. Update L111+L118: `this.oauthAuthService.validateOAuthLink(...)` and `this.oauthAuthService.validateOAuthUser(...)`. Update import.
  4. **github.strategy.ts**: Same changes as google.strategy.ts.

### Step 10: Split Tests

- **Files**:
  - `src/auth/tests/token.service.spec.ts` (new)
  - `src/auth/tests/login.service.spec.ts` (new)
  - `src/auth/tests/oauth-auth.service.spec.ts` (new)
  - `src/auth/tests/email-verification.service.spec.ts` (new)
  - `src/auth/tests/password-reset.service.spec.ts` (new)
  - `src/auth/tests/auth.service.spec.ts` (rewritten — facade tests only)

- **Implementation Steps**:
  1. **Redistribute 149 tests** across spec files matching the service that now owns each method:
     - `parseDurationMs` tests (5) → move to a small utility test or keep in token.service.spec.ts
     - `register` tests (~20) → login.service.spec.ts
     - `login` tests (~40+) → login.service.spec.ts
     - `refreshTokens` tests (~15) → token.service.spec.ts
     - `validateOAuthUser` tests (~10) → oauth-auth.service.spec.ts
     - `generateOAuthCode`/`exchangeOAuthCode` tests → oauth-auth.service.spec.ts
     - `verifyEmail`/`verifyEmailChange`/`resendVerification*` tests (~20) → email-verification.service.spec.ts
     - `forgotPassword`/`resetPassword`/`validateResetToken` tests (~15) → password-reset.service.spec.ts
     - `logout`/`logoutAll` tests (~10) → auth.service.spec.ts (facade keeps these)
     - `generateTokensForMfa` tests → token.service.spec.ts
     - `buildRefreshCookie`/`buildClearCookie` tests → token.service.spec.ts
  2. **Update mock providers** in each test file — each sub-service needs only its own DI mocks (not all 12)
  3. **Update existing consumer tests** (mfa.controller.spec.ts, passkey.controller.spec.ts, google/github strategy specs) — replace AuthService mock with TokenService/OAuthAuthService mock
  4. **Run full test suite**: `npm test` — verify all 149 tests still pass (distributed across 6 files)
  5. **Run E2E tests**: `npm run test:e2e` — verify all 57 E2E tests pass

### Step 11: Update Technical Documentation

- **Action**: Run `/update-docs SCRUM-181`
- **Implementation Steps**:
  1. **integration-state.md**:
     - Update Service Dependency Chains — replace monolithic AuthService entry with 6 entries (TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService, AuthService facade)
     - Update Test Mock Requirements — replace AuthService entry, add entries for new services
     - Update Controller Guard Chains — MfaController services: MfaService, **TokenService**, TrustedDeviceService. PasskeyController services: PasskeyService, **TokenService**
     - Add changelog entry
  2. **No api-spec.yml changes** (API surface unchanged)
  3. **No data-model.md changes** (no schema changes)

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Extract shared utilities (hash-token, parse-duration, interfaces)
3. Step 2: Create TokenService
4. Step 3: Create EmailVerificationService
5. Step 4: Create PasswordResetService
6. Step 5: Create OAuthAuthService
7. Step 6: Create LoginService
8. Step 7: Rewrite AuthService as facade
9. Step 8: Update AuthModule
10. Step 9: Update direct consumers (MfaController, PasskeyController, strategies)
11. Step 10: Split tests
12. Step 11: Update documentation

## Testing Checklist

- [ ] All 149 existing auth.service.spec.ts tests pass (redistributed)
- [ ] All mfa.controller.spec.ts tests pass (mock updated)
- [ ] All passkey.controller.spec.ts tests pass (mock updated)
- [ ] All google/github strategy spec tests pass (mock updated)
- [ ] All 57 E2E tests pass (behavioral regression check)
- [ ] Full `npm test` passes (all ~835+ unit tests)
- [ ] No file exceeds 500 LOC (SM-01)
- [ ] No method exceeds 75 lines (SM-03)
- [ ] No service has >8 DI deps (CX-05) — except LoginService (9, accepted)
- [ ] No service has >18 public methods (SD-01)

## Error Response Format

No changes — all error responses preserved exactly as-is. HttpExceptionFilter behavior unchanged.

## Dependencies

- No new npm dependencies
- No new external tools

## Notes

- **CRITICAL**: This is a pure structural refactor. Zero behavioral changes. Every HTTP endpoint must return identical responses before and after.
- **Circular dependency risk**: LoginService → TokenService → (no back-ref). OAuthAuthService → TokenService → (no back-ref). No circular forwardRef between new services needed.
- **LoginService has 9 DI deps** (exceeds CX-05 threshold of 8 by 1). This is accepted because login() is inherently the most complex method in the system — it orchestrates credentials, lockout, MFA, trusted devices, impossible travel, and suspicious login detection. Further decomposition would create artificial abstractions.
- **Security preservation**: All CWE-203 timing protections, OWASP ASVS controls, fire-and-forget patterns, and audit logging must be preserved byte-for-byte in the moved methods.
- The `process.env` reads in AuthService constructor (refreshExpiration, mfaChallengeSecret) move to TokenService and LoginService constructors respectively.

## Next Steps After Implementation

- Run Phase 10 audit checks (SM-01, SM-03, CX-05, SD-01) on auth module to confirm all 5 FAILs are resolved
- Consider whether SCRUM-179 (ConfigService migration) needs to be re-applied to the new sub-services

## Implementation Verification

- [ ] Code Quality: Each service has single responsibility, ≤350 LOC, ≤8 DI deps (LoginService: 9 accepted)
- [ ] Functionality: All HTTP endpoints return identical responses
- [ ] Testing: 149 tests redistributed, all pass, E2E green
- [ ] Integration: AuthModule registers all providers, exports AuthService + TokenService
- [ ] Documentation: integration-state.md updated
