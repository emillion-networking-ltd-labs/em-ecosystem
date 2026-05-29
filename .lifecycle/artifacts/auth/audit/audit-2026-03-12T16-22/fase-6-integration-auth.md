# Fase 6: INTEGRATION — Auth

**Date**: 2026-03-12 16:22 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 §4.2.1, NestJS Module Architecture, CWE-1047

---

## Summary

| Result | Count |
|--------|-------|
| PASS   | 5     |
| FAIL   | 5     |
| WARN   | 0     |

---

## I-01: Module Imports

**Status**: FAIL
**Severity**: Medium
**Standard**: NestJS Module Architecture, CWE-1047

### integration-state.md says:
> AuthModule imports: UsersModule (forwardRef), AuditModule, SessionsModule, CryptoModule, MailModule, PassportModule, JwtModule, SecurityModule

### Actual `auth.module.ts` imports:
```
forwardRef(() => UsersModule),
AuditModule,
SessionsModule,
CryptoModule,
MailModule,
SecurityModule,
PassportModule.register({ defaultStrategy: 'jwt' }),
JwtModule.register({ ... })
```

### Finding:
The actual imports **match** the documented imports. However, the integration-state changelog (SCRUM-179) claims `JwtModule.register()` was migrated to `JwtModule.registerAsync()` with ConfigService — this is **NOT true in the actual code**. `JwtModule.register()` is still used with direct `process.env` access. The integration-state document describes a state that does not exist in the codebase.

**Discrepancy**: integration-state.md changelog (SCRUM-179) documents ConfigModule migration that has NOT been implemented. The Service Dependency Chains section references `ConfigService` as a dependency of MfaService, PasskeyService, TrustedDeviceService — none of which actually inject ConfigService.

---

## I-02: Module Exports

**Status**: FAIL
**Severity**: Medium
**Standard**: NestJS Module Architecture

### integration-state.md says:
> AuthModule exports: AuthService, **TokenService**, PasswordBreachService, TrustedDeviceService, **TokenDenyListService**

### Actual `auth.module.ts` exports:
```typescript
exports: [AuthService, PasswordBreachService, TrustedDeviceService, TokenDenyListService]
```

### Finding:
- `TokenService` is listed in docs as an export but **does not exist** in the codebase. There is no `src/auth/token.service.ts` file.
- The SCRUM-181 changelog claims AuthService was decomposed into sub-services (TokenService, LoginService, OAuthAuthService, etc.) — this refactoring has **NOT been implemented**.
- The remaining 4 exports (AuthService, PasswordBreachService, TrustedDeviceService, TokenDenyListService) match correctly.

**Discrepancy**: `TokenService` documented as export but does not exist. Remove from docs or implement.

---

## I-03: Module Providers

**Status**: FAIL
**Severity**: Medium
**Standard**: NestJS Module Architecture

### integration-state.md says (via Service Dependency Chains and Test Mock Requirements):
Implies providers include: AuthService (facade), TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService, MfaService, PasskeyService, JwtStrategy, GoogleStrategy, GitHubStrategy, OAuthStateStore, OAuthCodeStore, OAuthLinkGuard, PasswordBreachService, TrustedDeviceService, TokenDenyListService, ConfigService

### Actual `auth.module.ts` providers:
```typescript
providers: [
  AuthService,
  MfaService,
  PasskeyService,
  JwtStrategy,
  GoogleStrategy,
  GitHubStrategy,
  OAuthStateStore,
  OAuthCodeStore,
  OAuthLinkGuard,
  PasswordBreachService,
  TrustedDeviceService,
  TokenDenyListService,
]
```

### Finding:
- **Missing from actual code**: TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService (all documented in SCRUM-181 changelog but never implemented)
- The 12 actual providers are correct and functional.
- No ConfigService in providers (it would come from ConfigModule if it existed, which it does not).

**Discrepancy**: integration-state.md documents 5 sub-services that do not exist (SCRUM-181 facade decomposition never implemented).

---

## I-04: Module Controllers

**Status**: PASS
**Severity**: N/A

### integration-state.md says:
> AuthModule controllers: AuthController, MfaController, PasskeyController

### Actual:
```typescript
controllers: [AuthController, MfaController, PasskeyController]
```

**Result**: Perfect match.

---

## I-05: @Global Flag

**Status**: PASS
**Severity**: N/A

### integration-state.md says:
> AuthModule @Global?: No

### Actual:
No `@Global()` decorator on AuthModule class.

**Result**: Perfect match.

---

## I-06: Guard Chains

**Status**: PASS
**Severity**: N/A

### Verification: AuthController Method Guards

| Method | Docs Guard | Actual Guard | Match |
|--------|-----------|--------------|-------|
| GET /csrf-token | — (SkipCsrf) | — (SkipCsrf) | YES |
| POST /register | TurnstileGuard | TurnstileGuard | YES |
| POST /login | TurnstileGuard | TurnstileGuard | YES |
| POST /refresh | — | — | YES |
| POST /logout | — | — | YES |
| POST /logout-all | JwtAuthGuard | JwtAuthGuard | YES |
| GET /sessions | JwtAuthGuard | JwtAuthGuard | YES |
| DELETE /sessions/:id | JwtAuthGuard | JwtAuthGuard | YES |
| GET /me | JwtAuthGuard | JwtAuthGuard | YES |
| GET /verify-email | — | — | YES |
| GET /verify-email-change | — | — | YES |
| POST /resend-verification | JwtAuthGuard | JwtAuthGuard | YES |
| POST /resend-verification-public | TurnstileGuard | TurnstileGuard | YES |
| POST /forgot-password | TurnstileGuard | TurnstileGuard | YES |
| POST /reset-password | — | — | YES |
| POST /validate-reset-token | — | — | YES |
| GET /admin | JwtAuthGuard, RolesGuard | JwtAuthGuard, RolesGuard | YES |
| GET /google | GoogleAuthGuard | GoogleAuthGuard | YES |
| GET /google/callback | GoogleAuthGuard | GoogleAuthGuard | YES |
| GET /github | GitHubAuthGuard | GitHubAuthGuard | YES |
| GET /github/callback | GitHubAuthGuard | GitHubAuthGuard | YES |
| POST /oauth/exchange | — | — | YES |
| GET /link/google | OAuthLinkGuard, GoogleAuthGuard | OAuthLinkGuard, GoogleAuthGuard | YES |
| GET /link/github | OAuthLinkGuard, GitHubAuthGuard | OAuthLinkGuard, GitHubAuthGuard | YES |
| POST /trusted-devices | JwtAuthGuard | JwtAuthGuard | YES |
| GET /trusted-devices | JwtAuthGuard | JwtAuthGuard | YES |
| DELETE /trusted-devices | JwtAuthGuard | JwtAuthGuard | YES |
| DELETE /trusted-devices/:id | JwtAuthGuard | JwtAuthGuard | YES |

### MfaController Method Guards

| Method | Docs Guard | Actual Guard | Match |
|--------|-----------|--------------|-------|
| POST /auth/mfa/setup | JwtAuthGuard | JwtAuthGuard | YES |
| POST /auth/mfa/verify-setup | JwtAuthGuard | JwtAuthGuard | YES |
| POST /auth/mfa/verify-login | — | — | YES |
| DELETE /auth/mfa | JwtAuthGuard | JwtAuthGuard | YES |
| POST /auth/mfa/recovery-codes | JwtAuthGuard | JwtAuthGuard | YES |
| GET /auth/mfa/status | JwtAuthGuard | JwtAuthGuard | YES |

### PasskeyController Method Guards

| Method | Docs Guard | Actual Guard | Match |
|--------|-----------|--------------|-------|
| POST /auth/passkeys/register/options | JwtAuthGuard | JwtAuthGuard | YES |
| POST /auth/passkeys/register/verify | JwtAuthGuard | JwtAuthGuard | YES |
| POST /auth/passkeys/login/options | — | — | YES |
| POST /auth/passkeys/login/verify | — | — | YES |
| GET /auth/passkeys | JwtAuthGuard | JwtAuthGuard | YES |
| PATCH /auth/passkeys/:id | JwtAuthGuard | JwtAuthGuard | YES |
| DELETE /auth/passkeys/:id | JwtAuthGuard | JwtAuthGuard | YES |

**Result**: All guard chains match between docs and actual code.

**Note**: Docs claim `@UseInterceptors(NoCacheInterceptor)` at class level for all 3 controllers — this is **NOT present** in actual code. This is a non-guard decorator discrepancy tracked under I-01/I-03 (SCRUM-176 changelog vs reality).

---

## I-07: Constructor DI

**Status**: FAIL
**Severity**: Medium
**Standard**: NestJS Module Architecture, ISO 25010 §4.2.1

### AuthController

| Docs Says | Actual | Match |
|-----------|--------|-------|
| AuthService | AuthService | YES |
| SessionsService | SessionsService | YES |
| JwtService | JwtService | YES |
| PermissionsService | PermissionsService | YES |
| TrustedDeviceService | TrustedDeviceService | YES |
| **ConfigService** | — | **NO** |

**Discrepancy**: Docs list ConfigService as injected dependency. Actual code does NOT inject ConfigService.

### MfaController

| Docs Says | Actual | Match |
|-----------|--------|-------|
| MfaService | MfaService | YES |
| **TokenService** | — | **NO** |
| **TrustedDeviceService** | — | **NO** |
| — | AuthService | **NOT IN DOCS** |

**Discrepancy**: Docs say MfaController injects TokenService (does not exist) and TrustedDeviceService. Actual code injects MfaService + AuthService. The SCRUM-181 refactoring that would replace AuthService with TokenService was never implemented.

### PasskeyController

| Docs Says | Actual | Match |
|-----------|--------|-------|
| PasskeyService | PasskeyService | YES |
| **TokenService** | — | **NO** |
| — | AuthService | **NOT IN DOCS** |

**Discrepancy**: Docs say PasskeyController injects TokenService (does not exist). Actual code injects PasskeyService + AuthService.

### AuthService

| Docs Says (Service Dependency Chains) | Actual Constructor | Match |
|---------------------------------------|-------------------|-------|
| (facade) → LoginService, TokenService... | UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService, TrustedDeviceService, ImpossibleTravelService, SuspiciousLoginService, TokenDenyListService | **NO** |

**Discrepancy**: Docs describe AuthService as a thin facade delegating to 5 sub-services. Actual AuthService is a monolithic class with 12 direct dependencies — the decomposition (SCRUM-181) was never implemented.

### MfaService

| Docs Says | Actual | Match |
|-----------|--------|-------|
| UsersService | UsersService | YES |
| CryptoService | CryptoService | YES |
| JwtService | JwtService | YES |
| AuditService | AuditService | YES |
| TrustedDeviceService | TrustedDeviceService | YES |
| **ConfigService** | — | **NO** |

### PasskeyService

| Docs Says | Actual | Match |
|-----------|--------|-------|
| PrismaService | PrismaService | YES |
| UsersService | UsersService | YES |
| AuditService | AuditService | YES |
| REDIS_CLIENT | REDIS_CLIENT | YES |
| **ConfigService** | — | **NO** |

### TrustedDeviceService

| Docs Says | Actual | Match |
|-----------|--------|-------|
| PrismaService | PrismaService | YES |
| AuditService | AuditService | YES |
| **ConfigService** | — | **NO** |

### TokenDenyListService

| Docs Says | Actual | Match |
|-----------|--------|-------|
| REDIS_CLIENT | REDIS_CLIENT | YES |

### PasswordBreachService

Actual: no constructor dependencies (pure utility). Docs do not list it separately. Consistent.

**Root Cause**: integration-state.md was updated for SCRUM-179 (ConfigService migration) and SCRUM-181 (AuthService decomposition) but the code changes for those tickets were never actually implemented. The changelog entries describe phantom changes.

---

## I-08: Permissions Registry

**Status**: PASS
**Severity**: N/A

### integration-state.md says (9 permissions):
| Key | Resource | Action |
|-----|----------|--------|
| dashboard:read | dashboard | read |
| users:read | users | read |
| users:write | users | write |
| users:delete | users | delete |
| audit-logs:read | audit-logs | read |
| permissions:read | permissions | read |
| permissions:write | permissions | write |
| settings:read | settings | read |
| settings:write | settings | write |

### Actual `default-permissions.ts`:
9 permissions defined matching exactly the above keys, resources, and actions.

### Default Role Assignments:
| Role | Docs | Actual | Match |
|------|------|--------|-------|
| USER | dashboard:read, settings:read | dashboard:read, settings:read | YES |
| ADMIN | All except permissions:write | 8 permissions (all except permissions:write) | YES |
| SUPERADMIN | Bypasses all checks | Not stored (comment confirms bypass) | YES |

**Result**: Perfect match.

---

## I-09: Cross-Module Boundaries

**Status**: PASS
**Severity**: N/A

### Cross-module imports from `src/auth/`:

| File | Import | Source Module | Available Via | Valid? |
|------|--------|---------------|---------------|--------|
| auth.module.ts | UsersModule | UsersModule | forwardRef import | YES |
| auth.module.ts | AuditModule | AuditModule | Direct import | YES |
| auth.module.ts | SessionsModule | SessionsModule | Direct import | YES |
| auth.module.ts | CryptoModule | CryptoModule | @Global | YES |
| auth.module.ts | MailModule | MailModule | Direct import | YES |
| auth.module.ts | SecurityModule | SecurityModule | Direct import | YES |
| auth.service.ts | UsersService | UsersModule | UsersModule imported | YES |
| auth.service.ts | SessionsService | SessionsModule | SessionsModule imported | YES |
| auth.service.ts | PrismaService | PrismaModule | @Global | YES |
| auth.service.ts | MailService | MailModule | MailModule imported | YES |
| auth.service.ts | AuditService | AuditModule | AuditModule imported | YES |
| auth.service.ts | ImpossibleTravelService | GeolocationModule | @Global | YES |
| auth.service.ts | SuspiciousLoginService | SecurityModule | SecurityModule imported (exported) | YES |
| auth.controller.ts | SessionsService | SessionsModule | SessionsModule imported | YES |
| auth.controller.ts | PermissionsService | PermissionsModule | @Global | YES |
| auth.controller.ts | TurnstileGuard | SecurityModule | SecurityModule imported (exported) | YES |
| auth.controller.ts | CsrfGuard | common/guards | NestJS core / APP_GUARD | YES |
| auth.controller.ts | SecurityConfig | security/ | Static config (no DI) | YES |
| mfa.service.ts | UsersService | UsersModule | UsersModule imported | YES |
| mfa.service.ts | CryptoService | CryptoModule | @Global | YES |
| mfa.service.ts | AuditService | AuditModule | AuditModule imported | YES |
| passkey.service.ts | PrismaService | PrismaModule | @Global | YES |
| passkey.service.ts | UsersService | UsersModule | UsersModule imported | YES |
| passkey.service.ts | AuditService | AuditModule | AuditModule imported | YES |
| passkey.service.ts | REDIS_CLIENT | RedisModule | @Global | YES |

**Result**: All cross-module references access only exported services, either via direct module import or @Global availability.

---

## I-10: ConfigService Centralization (process.env usage)

**Status**: FAIL
**Severity**: High
**Standard**: NestJS ConfigModule best practices, CWE-1047, ISO 25010 §4.2.1

### integration-state.md says (SCRUM-179 changelog):
> "Migrated all process.env reads in auth module to NestJS ConfigService... zero process.env in auth source files."

### Actual count of `process.env` in `src/auth/` (excluding tests):

| File | Count | Variables |
|------|-------|-----------|
| auth.module.ts | 2 | JWT_SECRET, JWT_ACCESS_EXPIRATION |
| auth.controller.ts | 4 | FRONTEND_URL (x3), OAUTH_ALLOWED_REDIRECT_URLS |
| auth.service.ts | 5 | JWT_REFRESH_EXPIRATION, JWT_SECRET, JWT_ACCESS_EXPIRATION (x2), NODE_ENV (x2) |
| mfa.service.ts | 2 | MFA_APP_NAME, JWT_SECRET |
| passkey.service.ts | 3 | WEBAUTHN_RP_ID, WEBAUTHN_RP_NAME, WEBAUTHN_ORIGIN |
| trusted-device.service.ts | 1 | JWT_SECRET |
| constants/auth.constants.ts | 3 | SESSION_IDLE_TIMEOUT_HOURS, MAX_CONCURRENT_SESSIONS, TRUSTED_DEVICE_TTL_DAYS |
| strategies/google.strategy.ts | 3 | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL |
| strategies/github.strategy.ts | 3 | GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL |
| strategies/jwt.strategy.ts | 1 | JWT_SECRET |
| guards/oauth-callback.filter.ts | 1 | FRONTEND_URL |
| **Total (source only)** | **28** | |

**Finding**: The SCRUM-179 ConfigService migration was **never implemented**. There are 28 `process.env` reads across 11 source files in the auth module. No `ConfigService` is imported or injected anywhere in `src/auth/`. No `src/config/` directory exists.

This is the most significant discrepancy: the integration-state document claims a completed migration that never happened.

---

## Consolidated Findings

### FAIL Items Requiring Remediation

| ID | Finding | Severity | Root Cause |
|----|---------|----------|------------|
| I-01 | integration-state.md changelog describes ConfigModule migration (SCRUM-179) that was never implemented | Medium | Phantom changelog entry |
| I-02 | `TokenService` listed as AuthModule export but does not exist | Medium | Phantom SCRUM-181 decomposition |
| I-03 | Docs list 5 sub-services (TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService) as providers — none exist | Medium | Phantom SCRUM-181 decomposition |
| I-07 | 11 constructor DI mismatches across 6 classes (ConfigService phantom, TokenService phantom, AuthService monolith vs facade) | Medium | Phantom SCRUM-179 + SCRUM-181 |
| I-10 | 28 `process.env` reads in auth source files; ConfigService migration never implemented | High | SCRUM-179 never implemented |

### Root Cause Analysis

All 5 FAILs trace to the same root cause: **integration-state.md was updated to reflect the planned outcomes of SCRUM-176 (NoCacheInterceptor), SCRUM-179 (ConfigService migration), and SCRUM-181 (AuthService decomposition), but the corresponding code changes were never committed to the codebase.**

The integration-state changelog entries for these tickets describe implementation details at a level of specificity that suggests they were written as part of planning (pre-implementation) rather than after verification of actual code changes.

### Recommended Actions

1. **Revert integration-state.md** — Remove or mark as "PLANNED" the changelog entries for SCRUM-179, SCRUM-181, and SCRUM-176 that describe unimplemented changes. Update Module Registry exports, Service Dependency Chains, and Test Mock Requirements to match actual code.
2. **Re-open or create tickets** — If ConfigService migration and AuthService decomposition are still desired, create new Jira tickets with accurate scope.
3. **Alternatively, implement the changes** — If the tickets were meant to be implemented, do so and then the docs will be correct.

### PASS Items

| ID | Finding |
|----|---------|
| I-04 | Controllers array matches: AuthController, MfaController, PasskeyController |
| I-05 | @Global flag matches: AuthModule is NOT @Global |
| I-06 | All 41 method-level guard chains across 3 controllers match docs exactly |
| I-08 | All 9 permissions, descriptions, and role assignments match exactly |
| I-09 | All cross-module imports reference only exported or @Global services |
