# Backend Implementation Plan: SCRUM-245 Audit Fix Batch 3 — Refactoring

## Codebase State Snapshot

- **Date**: 2026-03-15
- **Last completed ticket**: SCRUM-244 (Documentation batch)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/token.service.ts` — constructor lines 50-60 (10 deps), all methods
  - `nexacore-api/src/auth/auth.service.ts` — constructor lines 44-53 (9 deps), 19 public methods
  - `nexacore-api/src/auth/login.service.ts` — constructor lines 41-50 (9 deps), all methods
  - `nexacore-api/src/auth/passkey.service.ts` — verifyAuthentication lines 221-349 (129 lines)
  - `nexacore-api/src/auth/oauth-auth.service.ts` — constructor lines 18-24 (5 deps)
  - `nexacore-api/src/sessions/sessions.service.ts` — constructor lines 52-56 (3 deps), all methods
  - `nexacore-api/src/auth/auth.module.ts` — providers, exports, imports
- **Constructor signatures verified**:
  - `TokenService(jwtService, sessionsService, usersService, prisma, mailService, tokenDenyListService, auditService, impossibleTravelService, suspiciousLoginService, configService)` — 10 deps
  - `AuthService(loginService, tokenService, oauthAuthService, emailVerificationService, passwordResetService, sessionsService, tokenDenyListService, auditService, jwtService)` — 9 deps
  - `LoginService(usersService, tokenService, emailVerificationService, passwordBreachService, trustedDeviceService, impossibleTravelService, suspiciousLoginService, auditService, mailService)` — 9 deps
  - `SessionsService(prisma, auditService, geolocationService)` — 3 deps
- **Methods verified to exist**:
  - `TokenService.checkImpossibleTravel()` — line 319
  - `TokenService.handleTravelBlock()` — line 342
  - `TokenService.checkSuspiciousLoginSuccess()` — line 359
  - `TokenService.notifyIfNewDevice()` — line 285
  - `TokenService.generateTokensForMfa()` — line 217
  - `TokenService.logAuditEvent()` — line 375 (private)
  - `LoginService.checkSuspiciousLoginFailure()` — line 340 (private)
  - `LoginService.logAuditEvent()` — line 354 (private, DUPLICATE of TokenService)
  - `AuthService.logout()` — line 138
  - `AuthService.logoutAll()` — line 164
  - `PasskeyService.verifyAuthentication()` — line 221 (129 lines)
- **Discrepancies with integration-state.md**:
  - LoginService lists `ImpossibleTravelService` as dependency — but `this.impossibleTravelService` is NEVER called in code. Dead dependency.

## Overview

Structural refactoring to resolve 5 audit findings: reduce DI fan-out in 3 services below 8 deps (CX-05), extract shared helpers (DU-04), delegate session operations properly (SD-06), decompose long method (SM-03), and reduce AuthService surface (SD-01). Pure refactoring — no behavioral changes.

## Architecture Context

- **Modules involved**: AuthModule (new provider: LoginSecurityService), SessionsModule (new methods)
- **Components affected**: TokenService, LoginService, AuthService, PasskeyService, SessionsService
- **New file**: `nexacore-api/src/auth/login-security.service.ts`
- **New file**: `nexacore-api/src/auth/utils/audit-log.helper.ts`

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-245-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-245-backend`

### Step 1: Add SessionsService Methods (SD-06)

- **File**: `nexacore-api/src/sessions/sessions.service.ts`
- **Action**: Add 2 methods to eliminate TokenService's direct Prisma calls

**1a. `revokeSessionDirect(sessionId: string)`** — replaces TokenService line 153
```typescript
async revokeSessionDirect(sessionId: string): Promise<void> {
  await this.prisma.session.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });
}
```

**1b. `findPreviousActiveSessions(userId: string, excludeSessionId: string)`** — replaces TokenService lines 290-298
```typescript
async findPreviousActiveSessions(
  userId: string,
  excludeSessionId: string,
): Promise<{ ipAddress: string | null; userAgent: string | null }[]> {
  return this.prisma.session.findMany({
    where: {
      userId,
      id: { not: excludeSessionId },
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    select: { ipAddress: true, userAgent: true },
  });
}
```

- **Dependencies**: None new — PrismaService already injected
- **Tests**: Add tests to `sessions/tests/sessions.service.spec.ts`

### Step 2: Extract Shared Audit Log Helper (DU-04)

- **File**: `nexacore-api/src/auth/utils/audit-log.helper.ts` (NEW)
- **Action**: Extract the identical `logAuditEvent` pattern from LoginService and TokenService

```typescript
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';

export function createAuditLogger(auditService: AuditService) {
  return function logAuditEvent(
    action: AuditAction,
    ctx?: { ipAddress?: string | null; userAgent?: string | null },
    userId?: string,
    metadata?: Record<string, unknown>,
  ): void {
    auditService
      .log({
        action,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        ...(metadata && { metadata }),
      })
      .catch(() => {});
  };
}
```

- **Implementation Steps**:
  1. Create the helper file
  2. In `LoginService`: replace `private logAuditEvent(...)` with `private readonly logAuditEvent = createAuditLogger(this.auditService);`
  3. In `TokenService`: same replacement
  4. Update test files if they spy on logAuditEvent

### Step 3: Create LoginSecurityService (CX-05)

- **File**: `nexacore-api/src/auth/login-security.service.ts` (NEW)
- **Action**: Extract security-check methods from TokenService

```typescript
@Injectable()
export class LoginSecurityService {
  constructor(
    private readonly impossibleTravelService: ImpossibleTravelService,
    private readonly suspiciousLoginService: SuspiciousLoginService,
    private readonly mailService: MailService,
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
  ) {}
  // 5 deps — well under threshold

  // Methods moved from TokenService:
  async checkImpossibleTravel(user, requestMeta): Promise<ImpossibleTravelResult | null>
  handleTravelBlock(travelResult, userId, requestMeta): void
  checkSuspiciousLoginSuccess(user, requestMeta): void
  async notifyIfNewDevice(user, sessionId, requestMeta): Promise<void>

  // Method moved from LoginService:
  checkSuspiciousLoginFailure(userId, requestMeta): void
}
```

- **Implementation Steps**:
  1. Create `login-security.service.ts` with the 5 methods moved verbatim
  2. `notifyIfNewDevice`: replace `this.prisma.session.findMany(...)` with `this.sessionsService.findPreviousActiveSessions(...)`
  3. Use `createAuditLogger` for the handleTravelBlock audit call
  4. Register `LoginSecurityService` in `auth.module.ts` providers

### Step 4: Refactor TokenService (CX-05 + SD-06)

- **File**: `nexacore-api/src/auth/token.service.ts`
- **Action**: Remove extracted methods and dependencies

- **Implementation Steps**:
  1. Remove from constructor: `PrismaService`, `MailService`, `ImpossibleTravelService`, `SuspiciousLoginService` (4 removed)
  2. Add to constructor: `LoginSecurityService` (1 added)
  3. Remove methods: `checkImpossibleTravel`, `handleTravelBlock`, `checkSuspiciousLoginSuccess`, `notifyIfNewDevice`, `logAuditEvent`
  4. Add `private readonly logAuditEvent = createAuditLogger(this.auditService);`
  5. In `refreshTokens()` line 153: replace `this.prisma.session.update(...)` with `this.sessionsService.revokeSessionDirect(payload.sessionId)`
  6. In `generateTokensForMfa()`: replace `this.checkImpossibleTravel(...)` → `this.loginSecurityService.checkImpossibleTravel(...)`, same for `handleTravelBlock`, `notifyIfNewDevice`, `checkSuspiciousLoginSuccess`
  7. Remove unused imports (PrismaService, MailService, ImpossibleTravelService, SuspiciousLoginService, ImpossibleTravelResult)
- **Result**: 10 → 7 deps (JwtService, SessionsService, UsersService, TokenDenyListService, AuditService, ConfigService, LoginSecurityService) ✓

### Step 5: Refactor LoginService (CX-05)

- **File**: `nexacore-api/src/auth/login.service.ts`
- **Action**: Remove dead dependency and extracted methods

- **Implementation Steps**:
  1. Remove from constructor: `ImpossibleTravelService` (dead dep — never used), `SuspiciousLoginService`
  2. Add to constructor: `LoginSecurityService`
  3. Remove private method: `checkSuspiciousLoginFailure` (moved to LoginSecurityService)
  4. Remove private method: `logAuditEvent` (replaced by shared helper)
  5. Add `private readonly logAuditEvent = createAuditLogger(this.auditService);`
  6. In `handleMfaLogin()`: replace `this.tokenService.checkImpossibleTravel(...)` → `this.loginSecurityService.checkImpossibleTravel(...)`; same for `handleTravelBlock`, `notifyIfNewDevice`, `checkSuspiciousLoginSuccess`
  7. In `handleLoginSuccess()`: same replacements
  8. In `validateCredentials()` line 224: replace `this.checkSuspiciousLoginFailure(...)` → `this.loginSecurityService.checkSuspiciousLoginFailure(...)`
  9. Remove unused imports (ImpossibleTravelService, SuspiciousLoginService)
- **Result**: 9 → 8 deps (UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, LoginSecurityService, AuditService, MailService) ✓

### Step 6: Move logout/logoutAll to TokenService (SD-01)

- **File**: `nexacore-api/src/auth/auth.service.ts` and `nexacore-api/src/auth/token.service.ts`
- **Action**: Move logout logic from AuthService facade to TokenService to reduce AuthService surface and deps

- **Implementation Steps**:
  1. In `TokenService`, add `logout(refreshToken, ctx)` and `logoutAll(userId, ctx)` methods
     - These use SessionsService, TokenDenyListService, JwtService, AuditService — all already in TokenService
  2. In `AuthService`:
     - Replace `logout()` body with `return this.tokenService.logout(refreshToken, ctx);`
     - Replace `logoutAll()` body with `return this.tokenService.logoutAll(userId, ctx);`
     - Remove from constructor: `SessionsService`, `TokenDenyListService`, `AuditService`, `JwtService`
     - Remove unused imports
  3. AuthService public method count stays at 19 but deps shrink significantly
- **Result AuthService**: 9 → 5 deps (LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService) ✓
- **Result TokenService**: 7 deps unchanged (already has all needed deps)
- **Note**: `ACCESS_TOKEN_TTL_SECONDS` import moves from AuthService to TokenService (token-deny-list.service already imported there)

### Step 7: Decompose passkey.verifyAuthentication (SM-03)

- **File**: `nexacore-api/src/auth/passkey.service.ts`
- **Action**: Extract repeated audit log blocks into a private helper method

- **Implementation Steps**:
  1. Add private helper:
     ```typescript
     private logPasskeyAuthFailure(
       userId: string | null,
       ctx: { ipAddress: string; userAgent: string | null } | undefined,
       reason: string,
       metadata?: Record<string, unknown>,
     ): void {
       this.auditService
         .log({
           action: AuditAction.PASSKEY_AUTH_FAILURE,
           userId,
           ipAddress: ctx?.ipAddress ?? null,
           userAgent: ctx?.userAgent ?? null,
           metadata: { reason, ...metadata },
         })
         .catch(this.auditNoop);
     }
     ```
  2. Replace 5 identical audit blocks in `verifyAuthentication` with single-line calls:
     - Line 242-250: `this.logPasskeyAuthFailure(null, ctx, 'credential_not_found');`
     - Line 255-264: `this.logPasskeyAuthFailure(storedCredential.userId, ctx, 'account_deactivated');`
     - Line 283-292: `this.logPasskeyAuthFailure(storedCredential.userId, ctx, 'verification_failed');`
     - Line 296-306: `this.logPasskeyAuthFailure(storedCredential.userId, ctx, 'verification_not_verified');`
     - Line 314-328: `this.logPasskeyAuthFailure(storedCredential.userId, ctx, 'sign_count_replay', { expected: ..., received: ... });`
  3. Also extract success audit (lines 338-346) into `logPasskeyAuthSuccess` helper
- **Result**: `verifyAuthentication` reduces from ~129 → ~65 lines

### Step 8: Update Tests

- **Files**:
  - `nexacore-api/src/auth/tests/auth-login*.spec.ts` — update LoginService mock providers (remove ImpossibleTravelService, add LoginSecurityService)
  - `nexacore-api/src/auth/tests/auth.controller.spec.ts` — update AuthService mock providers (remove 4 deps)
  - `nexacore-api/src/sessions/tests/sessions.service.spec.ts` — add tests for 2 new methods
  - NEW: `nexacore-api/src/auth/tests/login-security.service.spec.ts` — test extracted methods
  - Update any token.service tests (via auth-test.helpers.ts mock setup)

- **Implementation Steps**:
  1. Update `auth-test.helpers.ts` if it has shared mock setup for TokenService/LoginService
  2. Create `login-security.service.spec.ts` with tests for all 5 methods
  3. Update existing test mocks to reflect new constructor signatures
  4. Ensure all 901+ tests still pass

### Step 9: Build & Test Verification

- **Action**: Verify no regressions
- `cd nexacore-api && npx nest build` — must compile clean
- `npx jest --maxWorkers=1 --forceExit` — all tests must pass

### Step 10: Update Integration State & Documentation

- **File**: `ai-specs/ai-specs/specs/integration-state.md`
- **Action**: Update Service Dependency Chains, add LoginSecurityService, add changelog entry

Changes:
  - TokenService: update from 10 to 7 deps
  - LoginService: update from 9 to 8 deps
  - AuthService: update from 9 to 5 deps
  - Add `LoginSecurityService → ImpossibleTravelService, SuspiciousLoginService, MailService, SessionsService, AuditService`
  - AuthModule providers: add LoginSecurityService

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add SessionsService methods (SD-06)
3. Step 2: Create shared audit log helper (DU-04)
4. Step 3: Create LoginSecurityService (CX-05)
5. Step 4: Refactor TokenService (CX-05 + SD-06)
6. Step 5: Refactor LoginService (CX-05)
7. Step 6: Move logout to TokenService (SD-01)
8. Step 7: Decompose passkey.verifyAuthentication (SM-03)
9. Step 8: Update tests
10. Step 9: Build & test verification
11. Step 10: Update documentation

## Testing Checklist

- [ ] SessionsService: `revokeSessionDirect()` test
- [ ] SessionsService: `findPreviousActiveSessions()` test
- [ ] LoginSecurityService: all 5 methods tested
- [ ] TokenService: constructor change doesn't break existing tests
- [ ] LoginService: constructor change doesn't break existing tests
- [ ] AuthService: constructor change doesn't break existing tests
- [ ] PasskeyService: `verifyAuthentication` still passes all existing tests
- [ ] All 901+ tests pass
- [ ] `nest build` compiles clean

## Error Response Format

No changes — this is a pure structural refactoring. All error responses remain identical.

## Dependencies

No new external libraries. Only internal module restructuring.

## Notes

- **Pure refactoring**: No behavioral changes. Every method produces identical output before and after.
- **Dead dependency found**: LoginService has `ImpossibleTravelService` injected but never calls it. Remove as part of CX-05.
- **AuthService remains a facade**: While SD-01 calls for reducing the 19-method surface, full elimination of the facade would require all controllers to inject specific services directly — a larger change better suited for a separate ticket. This plan reduces deps and moves the only non-delegation logic (logout) out.
- **Test impact**: Test files need mock provider updates but no test logic changes (behavior is unchanged).

## DI Dependency Summary (Before → After)

| Service | Before | After | Change |
|---------|--------|-------|--------|
| TokenService | 10 deps | 7 deps | -PrismaService, -MailService, -ImpossibleTravelService, -SuspiciousLoginService, +LoginSecurityService |
| LoginService | 9 deps | 8 deps | -ImpossibleTravelService (dead), -SuspiciousLoginService, +LoginSecurityService |
| AuthService | 9 deps | 5 deps | -SessionsService, -TokenDenyListService, -AuditService, -JwtService |
| LoginSecurityService | N/A | 5 deps | NEW: ImpossibleTravelService, SuspiciousLoginService, MailService, SessionsService, AuditService |
| SessionsService | 3 deps | 3 deps | No change (2 new methods, same deps) |
