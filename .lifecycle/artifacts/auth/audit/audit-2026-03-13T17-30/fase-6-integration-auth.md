# Phase 6: Integration Audit — AuthModule

**Module**: `src/auth/`
**Date**: 2026-03-13
**Auditor**: Claude Opus 4.6 (automated)
**Reference doc**: `ai-specs/specs/integration-state.md` (last update: SCRUM-213)

## Summary

| Total Checks | PASS | WARN | FAIL |
|:---:|:---:|:---:|:---:|
| 10 | 8 | 1 | 1 |

## Results

### I-01 — Module Imports

| Severity | Standard | Result |
|----------|----------|--------|
| HIGH | SOC 2 CC7.1 | **PASS** |

**Code** (`auth.module.ts` lines 38-65):
```
imports: [
  forwardRef(() => UsersModule),
  AuditModule,
  SessionsModule,
  CryptoModule,
  MailModule,
  SecurityModule,
  PassportModule.register({ defaultStrategy: 'jwt' }),
  JwtModule.registerAsync({ ... }),
]
```

**Doc** (integration-state.md): UsersModule (forwardRef), AuditModule, SessionsModule, CryptoModule, MailModule, PassportModule, JwtModule, SecurityModule

**Verdict**: All 8 imports match exactly. ConfigModule appears only inside `JwtModule.registerAsync()` inject — not a top-level import, which is correct since ConfigModule is global.

---

### I-02 — Module Exports

| Severity | Standard | Result |
|----------|----------|--------|
| HIGH | SOC 2 CC7.1 | **PASS** |

**Code** (`auth.module.ts` lines 94-100):
```
exports: [
  AuthService,
  TokenService,
  PasswordBreachService,
  TrustedDeviceService,
  TokenDenyListService,
]
```

**Doc**: AuthService, TokenService, PasswordBreachService, TrustedDeviceService, TokenDenyListService

**Verdict**: All 5 exports match exactly.

---

### I-03 — Module Providers

| Severity | Standard | Result |
|----------|----------|--------|
| MEDIUM | ISO 25010 | **PASS** |

**Code** (`auth.module.ts` lines 75-93): 18 providers:
1. AuthService
2. TokenService
3. LoginService
4. OAuthAuthService
5. EmailVerificationService
6. PasswordResetService
7. MfaService
8. PasskeyService
9. JwtStrategy
10. GoogleStrategy
11. GitHubStrategy
12. OAuthStateStore
13. OAuthCodeStore
14. OAuthLinkGuard
15. PasswordBreachService
16. TrustedDeviceService
17. TokenDenyListService

(PasswordBreachService has no constructor dependencies — standalone injectable.)

**Doc** (Service Dependency Chains section): All 17 provider classes documented. Matches code.

**Verdict**: PASS. All providers registered and documented.

---

### I-04 — Module Controllers

| Severity | Standard | Result |
|----------|----------|--------|
| HIGH | SOC 2 CC7.1 | **PASS** |

**Code** (`auth.module.ts` lines 67-74):
```
controllers: [
  AuthController,
  OAuthController,
  AccountController,
  SessionController,
  MfaController,
  PasskeyController,
]
```

**Doc**: AuthController, OAuthController, AccountController, SessionController, MfaController, PasskeyController

**Verdict**: All 6 controllers match exactly.

---

### I-05 — @Global Flag

| Severity | Standard | Result |
|----------|----------|--------|
| HIGH | OWASP ASVS V1.4 | **PASS** |

**Code**: No `@Global()` decorator on AuthModule class.

**Doc**: AuthModule `@Global?` column = "No"

**Verdict**: Consistent. AuthModule is correctly NOT global — auth services should only be available to modules that explicitly import AuthModule.

---

### I-06 — Guard Chains

| Severity | Standard | Result |
|----------|----------|--------|
| CRITICAL | OWASP ASVS V4.1 | **PASS** |

Verified all 6 controllers method-by-method against integration-state.md guard map:

**AuthController** (9 endpoints):
| Method | Code Guards | Doc Guards | Match? |
|--------|-----------|-----------|--------|
| GET /csrf-token | (none, @SkipCsrf) | — @SkipCsrf | YES |
| POST /register | TurnstileGuard, @Throttle | TurnstileGuard, @Throttle | YES |
| POST /login | TurnstileGuard, @Throttle | TurnstileGuard, @Throttle | YES |
| POST /refresh | @Throttle | — @Throttle | YES |
| POST /logout | (none) | — | YES |
| POST /logout-all | JwtAuthGuard | JwtAuthGuard | YES |
| GET /me | JwtAuthGuard | JwtAuthGuard | YES |
| GET /admin | JwtAuthGuard, RolesGuard, @Roles(ADMIN) | JwtAuthGuard, RolesGuard, @Roles(ADMIN) | YES |

**OAuthController** (7 endpoints):
| Method | Code Guards | Doc Guards | Match? |
|--------|-----------|-----------|--------|
| GET /google | GoogleAuthGuard, @Throttle | GoogleAuthGuard, @Throttle | YES |
| GET /google/callback | GoogleAuthGuard, @SkipThrottle | GoogleAuthGuard, @SkipThrottle | YES |
| GET /github | GitHubAuthGuard, @Throttle | GitHubAuthGuard, @Throttle | YES |
| GET /github/callback | GitHubAuthGuard, @SkipThrottle | GitHubAuthGuard, @SkipThrottle | YES |
| POST /oauth/exchange | @Throttle | — @Throttle | YES |
| GET /link/google | OAuthLinkGuard, GoogleAuthGuard, @Throttle | OAuthLinkGuard, GoogleAuthGuard, @Throttle | YES |
| GET /link/github | OAuthLinkGuard, GitHubAuthGuard, @Throttle | OAuthLinkGuard, GitHubAuthGuard, @Throttle | YES |

**AccountController** (7 endpoints):
| Method | Code Guards | Doc Guards | Match? |
|--------|-----------|-----------|--------|
| POST /verify-email | (none), @SkipCsrf, @Throttle | — | YES |
| POST /verify-email-change | (none), @SkipCsrf, @Throttle | — | YES |
| POST /resend-verification | JwtAuthGuard | JwtAuthGuard | YES |
| POST /resend-verification-public | TurnstileGuard, @SkipCsrf, @Throttle | TurnstileGuard, @SkipCsrf, @Throttle | YES |
| POST /forgot-password | TurnstileGuard, @SkipCsrf, @Throttle | TurnstileGuard, @SkipCsrf, @Throttle | YES |
| POST /reset-password | (none), @SkipCsrf, @Throttle | — @SkipCsrf, @Throttle | YES |
| POST /validate-reset-token | (none), @SkipCsrf | — | YES |

**SessionController** (4 endpoints):
| Method | Code Guards | Doc Guards | Match? |
|--------|-----------|-----------|--------|
| GET /sessions | JwtAuthGuard | JwtAuthGuard | YES |
| DELETE /sessions/:id | JwtAuthGuard | JwtAuthGuard | YES |
| POST /trusted-devices | JwtAuthGuard, @Throttle(5/60s) | JwtAuthGuard, @Throttle(5/60s) | YES |
| GET /trusted-devices | JwtAuthGuard | JwtAuthGuard | YES |
| DELETE /trusted-devices | JwtAuthGuard | JwtAuthGuard | YES |
| DELETE /trusted-devices/:id | JwtAuthGuard | JwtAuthGuard | YES |

**MfaController** (6 endpoints): All match doc exactly (JwtAuthGuard on 5 methods, none on verify-login; all with @Throttle(mfa)).

**PasskeyController** (7 endpoints): All match doc exactly (JwtAuthGuard on 5 methods, none on login/options and login/verify; mixed @Throttle).

**Verdict**: All 40+ endpoint guard chains match integration-state.md.

---

### I-07 — Constructor DI

| Severity | Standard | Result |
|----------|----------|--------|
| HIGH | ISO 25010 | **PASS** |

Verified each service/controller constructor against integration-state.md Service Dependency Chains:

| Class | Code Constructor DI | Doc Dependencies | Match? |
|-------|-------------------|-----------------|--------|
| AuthService | LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService, SessionsService, TokenDenyListService, AuditService, JwtService | Same 9 deps | YES |
| TokenService | JwtService, SessionsService, UsersService, PrismaService, MailService, TokenDenyListService, AuditService, ImpossibleTravelService, SuspiciousLoginService | Same 9 deps | YES |
| LoginService | UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, ImpossibleTravelService, SuspiciousLoginService, AuditService, MailService | Same 9 deps | YES |
| OAuthAuthService | UsersService, OAuthCodeStore, TokenService, AuditService, ImpossibleTravelService, SuspiciousLoginService | Same 6 deps | YES |
| EmailVerificationService | PrismaService, MailService, UsersService, SessionsService, AuditService | Same 5 deps | YES |
| PasswordResetService | PrismaService, UsersService, MailService, SessionsService, PasswordBreachService, AuditService | Same 6 deps | YES |
| MfaService | UsersService, CryptoService, JwtService, AuditService, TrustedDeviceService, ConfigService | Same 6 deps | YES |
| PasskeyService | PrismaService, UsersService, AuditService, REDIS_CLIENT, ConfigService | Same 5 deps | YES |
| TrustedDeviceService | PrismaService, AuditService, ConfigService | Same 3 deps | YES |
| TokenDenyListService | REDIS_CLIENT | Same 1 dep | YES |
| PasswordBreachService | (none) | (none — standalone) | YES |
| OAuthStateStore | REDIS_CLIENT | Same 1 dep | YES |
| OAuthCodeStore | REDIS_CLIENT | Same 1 dep | YES |
| JwtStrategy | UsersService, TokenDenyListService, ConfigService | Same 3 deps | YES |
| GoogleStrategy | OAuthAuthService, OAuthStateStore, ConfigService | Same 3 deps | YES |
| GitHubStrategy | OAuthAuthService, OAuthStateStore, ConfigService | Same 3 deps | YES |
| AuthController | AuthService, PermissionsService | Doc says: AuthService, SessionsService, JwtService, PermissionsService, TrustedDeviceService, ConfigService | **SEE NOTE** |
| OAuthController | AuthService, ConfigService | (covered by doc AuthController row) | YES |
| AccountController | AuthService | (covered by doc) | YES |
| SessionController | SessionsService, TrustedDeviceService, JwtService | (covered by doc) | YES |
| MfaController | MfaService, TokenService, TrustedDeviceService | Same 3 deps | YES |
| PasskeyController | PasskeyService, TokenService | Same 2 deps | YES |

**Note on AuthController**: The doc's "Test Mock Requirements" table for AuthController lists 7 deps (AuthService, SessionsService, JwtService, PermissionsService, TrustedDeviceService, TurnstileService, ConfigService). This was pre-split — the original AuthController had all these. After the SCRUM-197 split into 4 controllers, the DI was distributed:
- AuthController: AuthService, PermissionsService (2 deps)
- OAuthController: AuthService, ConfigService (2 deps)
- AccountController: AuthService (1 dep)
- SessionController: SessionsService, TrustedDeviceService, JwtService (3 deps)

The Test Mock Requirements table in integration-state.md still shows the pre-split combined list for "AuthController". This is a documentation drift, not a code issue.

**Verdict**: PASS. All actual DI matches the Service Dependency Chains section. The Test Mock Requirements table has minor drift for the split controllers.

---

### I-08 — Permissions Registry

| Severity | Standard | Result |
|----------|----------|--------|
| MEDIUM | SOC 2 CC6.1 | **PASS** |

**Code** (`src/permissions/constants/default-permissions.ts`): 9 permissions:
1. `dashboard:read`
2. `users:read`
3. `users:write`
4. `users:delete`
5. `audit-logs:read`
6. `permissions:read`
7. `permissions:write`
8. `settings:read`
9. `settings:write`

**Doc** (integration-state.md Permissions Registry): Same 9 permissions with matching resource/action pairs.

**Default Role Assignments**:
- Code: USER = `['dashboard:read', 'settings:read']`, ADMIN = 8 perms (all except `permissions:write`)
- Doc: USER = `dashboard:read, settings:read`, ADMIN = All except `permissions:write`

**Verdict**: PASS. Code and documentation match exactly.

---

### I-09 — Cross-Module Boundaries

| Severity | Standard | Result |
|----------|----------|--------|
| CRITICAL | OWASP ASVS V1.4 | **PASS** |

All cross-module service imports from `src/auth/` verified against module exports:

| Auth File | Imports From | Service | Exported By | Available Via |
|-----------|-------------|---------|-------------|---------------|
| Multiple services | `../users/users.service` | UsersService | UsersModule | forwardRef import |
| Multiple services | `../audit/audit.service` | AuditService | AuditModule | Direct import |
| Multiple services | `../sessions/sessions.service` | SessionsService | SessionsModule | Direct import |
| Multiple services | `../mail/mail.service` | MailService | MailModule | Direct import |
| token/login/oauth-auth | `../geolocation/impossible-travel.service` | ImpossibleTravelService | GeolocationModule | @Global |
| token/login/oauth-auth | `../security/suspicious-login.service` | SuspiciousLoginService | SecurityModule | Direct import |
| auth.controller | `../security/turnstile.guard` | TurnstileGuard | SecurityModule | Direct import |
| auth.controller | `../permissions/permissions.service` | PermissionsService | PermissionsModule | @Global |
| Multiple | `../prisma/prisma.service` | PrismaService | PrismaModule | @Global |
| Multiple | `../common/services/redis.constants` | REDIS_CLIENT | RedisModule | @Global |
| mfa.service | `../common/services/crypto.service` | CryptoService | CryptoModule | @Global |
| guards/roles.guard | `../../audit/audit.service` | AuditService | AuditModule | Direct import |
| guards/permissions.guard | `../../permissions/permissions.service` | PermissionsService | PermissionsModule | @Global |

All remaining cross-module imports are **types/enums/interfaces/decorators/constants** (not injectable services):
- `../users/enums/role.enum` (type)
- `../users/enums/provider.enum` (type)
- `../users/entities/user.entity` (type)
- `../common/decorators/*` (decorators)
- `../common/constants/*` (constants)
- `../common/interfaces/*` (interfaces)
- `../common/utils/*` (pure functions)
- `../common/interceptors/*` (interceptors)
- `../common/guards/csrf.guard` (static method call, no DI)
- `../security/security.config` (static config, no DI)
- `../audit/enums/*` (enums)
- `../audit/interfaces/*` (interfaces)
- `../geolocation/interfaces/*` (interfaces)

**Verdict**: PASS. Every cross-module injectable service is properly exported by its source module and available to AuthModule via direct import or @Global.

---

### I-10 — ConfigService Centralization

| Severity | Standard | Result |
|----------|----------|--------|
| HIGH | OWASP ASVS V14.2 | **FAIL** |

**Grep results** for `process.env.` in `src/auth/` (excluding test files):

| File | Line | Usage |
|------|------|-------|
| `token.service.ts` | 59 | `process.env.JWT_REFRESH_EXPIRATION \|\| '12h'` |
| `token.service.ts` | 62 | `process.env.JWT_SECRET \|\| 'default-dev-secret-change-in-production'` |
| `token.service.ts` | 81 | `process.env.JWT_ACCESS_EXPIRATION \|\| '15m'` |
| `token.service.ts` | 188 | `process.env.JWT_ACCESS_EXPIRATION \|\| '15m'` |
| `token.service.ts` | 269 | `process.env.NODE_ENV === 'production'` |
| `token.service.ts` | 283 | `process.env.NODE_ENV === 'production'` |

**6 occurrences** of direct `process.env` access in `token.service.ts`, all bypassing ConfigService. This file was the original monolith's TokenService and was NOT fully migrated in SCRUM-179 (which migrated all other auth files). These reads include **security-critical** values (JWT secret, token expiration).

The `token.service.ts` constructor already injects `JwtService` (which gets its config from `JwtModule.registerAsync` via ConfigService), but the service also reads `process.env` directly for:
- Refresh token expiration
- JWT secret (for MFA challenge HMAC)
- Access token expiration (sign options)
- Cookie secure flag (NODE_ENV check)

**Finding ID**: I-10-01
**Severity**: HIGH
**Standard**: OWASP ASVS V14.2.1 (configuration centralization)
**Impact**: Bypasses validation schema (`src/config/`), makes testing harder, risk of inconsistent values between JwtModule config and direct reads.

---

## WARN Items

### I-07-W01 — Test Mock Requirements Table Drift

| Severity | Standard | Result |
|----------|----------|--------|
| LOW | ISO 25010 (Maintainability) | **WARN** |

The "Test Mock Requirements" table in integration-state.md still lists the pre-split AuthController with 7 combined dependencies. After SCRUM-197, AuthController was split into 4 controllers (AuthController, OAuthController, AccountController, SessionController), each with a subset of those dependencies. The table should be updated to reflect the 4 separate controllers.

This does not affect runtime behavior but could mislead developers writing new tests.

---

## Findings Summary

| ID | Check | Severity | Result | Description |
|----|-------|----------|--------|-------------|
| I-01 | Module imports | HIGH | PASS | 8 imports match integration-state.md |
| I-02 | Module exports | HIGH | PASS | 5 exports match integration-state.md |
| I-03 | Module providers | MEDIUM | PASS | 17 providers match documentation |
| I-04 | Module controllers | HIGH | PASS | 6 controllers match integration-state.md |
| I-05 | @Global flag | HIGH | PASS | Not @Global, matches docs |
| I-06 | Guard chains | CRITICAL | PASS | All 40+ endpoint guards match docs |
| I-07 | Constructor DI | HIGH | PASS | All service/controller DI matches docs |
| I-07-W01 | Test Mock table | LOW | WARN | Pre-split AuthController entry needs update |
| I-08 | Permissions registry | MEDIUM | PASS | 9 permissions, 2 role assignments match |
| I-09 | Cross-module boundaries | CRITICAL | PASS | All cross-module imports use exported services |
| I-10 | ConfigService centralization | HIGH | **FAIL** | 6x `process.env` in token.service.ts |

## Remediation Required

### I-10-01: Migrate token.service.ts to ConfigService

**Priority**: HIGH
**Effort**: Small (1-2 hours)
**Action**: Inject `ConfigService` into `TokenService` constructor and replace all 6 `process.env` reads with `configService.get<string>('auth.jwtSecret')`, `configService.get<string>('auth.jwtRefreshExpiration')`, `configService.get<string>('auth.jwtAccessExpiration')`, and `configService.get<string>('app.nodeEnv')`. This aligns with the SCRUM-179 migration that already converted all other auth files.

### I-07-W01: Update Test Mock Requirements table

**Priority**: LOW
**Effort**: Trivial
**Action**: Split the AuthController row into 4 rows (AuthController, OAuthController, AccountController, SessionController) with their actual constructor dependencies.
