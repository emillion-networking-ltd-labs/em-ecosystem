# Phase 6 — Integration Audit: AuthModule

> **Module**: AuthModule
> **Date**: 2026-03-16
> **Auditor**: Claude Opus 4.6 (automated)
> **Standards**: ISO 25010 Modularity, NestJS Architecture, CWE-1047 (Modules with Circular Dependencies)
> **Scope**: 10 integration checks (I-01 through I-10)

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 10    |
| FAIL    | 0     |
| WARN    | 0     |
| N/A     | 0     |

---

## I-01 — Module Imports Match Documentation

**Verdict**: PASS
**Severity**: HIGH
**Standard**: ISO 25010 Modularity, NestJS Architecture

**Evidence**: `src/auth/auth.module.ts` lines 40-67 imports array:

| Code (auth.module.ts) | integration-state.md AuthModule row |
|---|---|
| `forwardRef(() => UsersModule)` | UsersModule (forwardRef) |
| `AuditModule` | AuditModule |
| `SessionsModule` | SessionsModule |
| `CryptoModule` | CryptoModule |
| `MailModule` | MailModule |
| `SecurityModule` | SecurityModule |
| `PassportModule.register(...)` | PassportModule |
| `JwtModule.registerAsync(...)` | JwtModule |

All 8 imports match exactly. No undocumented imports; no documented imports missing from code.

---

## I-02 — Module Exports Match Documentation

**Verdict**: PASS
**Severity**: HIGH
**Standard**: ISO 25010 Modularity

**Evidence**: `src/auth/auth.module.ts` lines 98-104 exports array:

| Code | integration-state.md |
|---|---|
| `AuthService` | AuthService |
| `TokenService` | **TokenService** |
| `PasswordBreachService` | PasswordBreachService |
| `TrustedDeviceService` | TrustedDeviceService |
| `TokenDenyListService` | **TokenDenyListService** |

All 5 exports match exactly. Bold entries in docs match code.

---

## I-03 — Module Providers Match Documentation

**Verdict**: PASS
**Severity**: MEDIUM
**Standard**: NestJS Architecture

**Evidence**: `src/auth/auth.module.ts` lines 77-97 providers array (20 providers):

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
14. OAuthLinkCodeStore
15. OAuthLinkGuard
16. PasswordBreachService
17. TrustedDeviceService
18. TokenDenyListService
19. LoginSecurityService

Note: integration-state.md documents this at the Service Dependency Chains level (not an exhaustive providers list). All 19 providers are accounted for in either the dependency chains or the guard/controller tables. No undocumented providers found.

---

## I-04 — Module Controllers Match Documentation

**Verdict**: PASS
**Severity**: HIGH
**Standard**: NestJS Architecture

**Evidence**: `src/auth/auth.module.ts` lines 69-76 controllers array:

| Code | integration-state.md Controller Guard Chains table |
|---|---|
| `AuthController` | AuthController (AuthModule) |
| `OAuthController` | OAuthController (AuthModule) |
| `AccountController` | AccountController (AuthModule) |
| `SessionController` | SessionController (AuthModule) |
| `MfaController` | MfaController (AuthModule) |
| `PasskeyController` | PasskeyController (AuthModule) |

All 6 controllers match exactly.

---

## I-05 — @Global() Decorator Match

**Verdict**: PASS
**Severity**: HIGH
**Standard**: NestJS Architecture, CWE-1047

**Evidence**: `src/auth/auth.module.ts` line 39 — `@Module({` decorator only, no `@Global()` present.
integration-state.md Module Registry row: `AuthModule | No` in the @Global? column.

Code and docs agree: AuthModule is NOT global.

---

## I-06 — Controller Guard Chains Match Documentation

**Verdict**: PASS
**Severity**: HIGH
**Standard**: ISO 25010 Modularity, OWASP ASVS

### AuthController (`src/auth/auth.controller.ts`)

| Method | Code Guards | Docs Guards | Match |
|---|---|---|---|
| GET /csrf-token | — | — | Yes |
| POST /register | TurnstileGuard | TurnstileGuard | Yes |
| POST /login | TurnstileGuard | TurnstileGuard | Yes |
| POST /refresh | — | — | Yes |
| POST /logout | — | — | Yes |
| POST /logout-all | JwtAuthGuard | JwtAuthGuard | Yes |
| GET /me | JwtAuthGuard | JwtAuthGuard | Yes |
| GET /admin | JwtAuthGuard, RolesGuard | JwtAuthGuard, RolesGuard | Yes |

All decorators (@SkipCsrf, @Throttle, @Roles) also verified consistent.

### AccountController (`src/auth/account.controller.ts`)

| Method | Code Guards | Docs Guards | Match |
|---|---|---|---|
| POST /verify-email | — | — | Yes |
| POST /verify-email-change | — | — | Yes |
| POST /resend-verification | JwtAuthGuard | JwtAuthGuard | Yes |
| POST /resend-verification-public | TurnstileGuard | TurnstileGuard | Yes |
| POST /forgot-password | TurnstileGuard | TurnstileGuard | Yes |
| POST /reset-password | — | — | Yes |
| POST /validate-reset-token | — | — | Yes |

@SkipCsrf and @Throttle decorators verified consistent per docs.

### OAuthController (`src/auth/oauth.controller.ts`)

| Method | Code Guards | Docs Guards | Match |
|---|---|---|---|
| GET /google | GoogleAuthGuard | GoogleAuthGuard | Yes |
| GET /google/callback | GoogleAuthGuard | GoogleAuthGuard | Yes |
| GET /github | GitHubAuthGuard | GitHubAuthGuard | Yes |
| GET /github/callback | GitHubAuthGuard | GitHubAuthGuard | Yes |
| POST /oauth/exchange | — | — | Yes |
| POST /link/code | JwtAuthGuard | JwtAuthGuard | Yes |
| GET /link/google | OAuthLinkGuard, GoogleAuthGuard | OAuthLinkGuard, GoogleAuthGuard | Yes |
| GET /link/github | OAuthLinkGuard, GitHubAuthGuard | OAuthLinkGuard, GitHubAuthGuard | Yes |

@SkipThrottle, @UseFilters(OAuthCallbackFilter), @ApiBearerAuth all verified consistent.

### SessionController (`src/auth/session.controller.ts`)

| Method | Code Guards | Docs Guards | Match |
|---|---|---|---|
| GET /sessions | JwtAuthGuard | JwtAuthGuard | Yes |
| DELETE /sessions/:id | JwtAuthGuard | JwtAuthGuard | Yes |
| POST /trusted-devices | JwtAuthGuard | JwtAuthGuard | Yes |
| GET /trusted-devices | JwtAuthGuard | JwtAuthGuard | Yes |
| DELETE /trusted-devices | JwtAuthGuard | JwtAuthGuard | Yes |
| DELETE /trusted-devices/:id | JwtAuthGuard | JwtAuthGuard | Yes |

@Throttle(5/60s) on POST /trusted-devices verified consistent.

### MfaController (`src/auth/mfa.controller.ts`)

| Method | Code Guards | Docs Guards | Match |
|---|---|---|---|
| POST /auth/mfa/setup | JwtAuthGuard | JwtAuthGuard | Yes |
| POST /auth/mfa/verify-setup | JwtAuthGuard | JwtAuthGuard | Yes |
| POST /auth/mfa/verify-login | — | — | Yes |
| DELETE /auth/mfa | JwtAuthGuard | JwtAuthGuard | Yes |
| POST /auth/mfa/recovery-codes | JwtAuthGuard | JwtAuthGuard | Yes |
| GET /auth/mfa/status | JwtAuthGuard | JwtAuthGuard | Yes |

All 5 methods with @Throttle(mfa) verified consistent.

### PasskeyController (`src/auth/passkey.controller.ts`)

| Method | Code Guards | Docs Guards | Match |
|---|---|---|---|
| POST /auth/passkeys/register/options | JwtAuthGuard | JwtAuthGuard | Yes |
| POST /auth/passkeys/register/verify | JwtAuthGuard | JwtAuthGuard | Yes |
| POST /auth/passkeys/login/options | — | — | Yes |
| POST /auth/passkeys/login/verify | — | — | Yes |
| GET /auth/passkeys | JwtAuthGuard | JwtAuthGuard | Yes |
| PATCH /auth/passkeys/:id | JwtAuthGuard | JwtAuthGuard | Yes |
| DELETE /auth/passkeys/:id | JwtAuthGuard | JwtAuthGuard | Yes |

@Throttle(mfa) on 4 methods and @Throttle(login) on 2 methods verified consistent.

**Total**: 42 route-guard combinations verified across 6 controllers. All match documentation.

---

## I-07 — Service Constructor Dependencies Match Documentation

**Verdict**: PASS
**Severity**: HIGH
**Standard**: ISO 25010 Modularity

| Service | Code Constructor Params | Docs (Service Dependency Chains) | Match |
|---|---|---|---|
| **AuthService** | LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService (5) | LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService (5) | Yes |
| **TokenService** | JwtService, SessionsService, UsersService, TokenDenyListService, AuditService, ConfigService, LoginSecurityService (7) | JwtService, SessionsService, UsersService, TokenDenyListService, AuditService, **ConfigService**, LoginSecurityService (7) | Yes |
| **LoginService** | UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, LoginSecurityService (6) | UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, LoginSecurityService (6) | Yes |
| **OAuthAuthService** | UsersService, OAuthCodeStore, TokenService, LoginSecurityService, AuditService (5) | UsersService, OAuthCodeStore, TokenService, LoginSecurityService, AuditService (5) | Yes |
| **EmailVerificationService** | PrismaService, MailService, UsersService, SessionsService, AuditService (5) | PrismaService, MailService, UsersService, SessionsService, AuditService (5) | Yes |
| **PasswordResetService** | PrismaService, UsersService, MailService, SessionsService, PasswordBreachService, AuditService (6) | PrismaService, UsersService, MailService, SessionsService, PasswordBreachService, AuditService (6) | Yes |
| **MfaService** | UsersService, CryptoService, JwtService, AuditService, TrustedDeviceService, ConfigService (6) | UsersService, CryptoService, JwtService, AuditService, TrustedDeviceService, **ConfigService** (6) | Yes |
| **PasskeyService** | PrismaService, UsersService, AuditService, REDIS_CLIENT, ConfigService (5) | PrismaService, UsersService, AuditService, REDIS_CLIENT, **ConfigService** (5) | Yes |
| **TrustedDeviceService** | PrismaService, AuditService, ConfigService (3) | PrismaService, AuditService, **ConfigService** (3) | Yes |
| **TokenDenyListService** | REDIS_CLIENT (1) | REDIS_CLIENT (1) | Yes |
| **LoginSecurityService** | ImpossibleTravelService, SuspiciousLoginService, MailService, SessionsService, AuditService (5) | ImpossibleTravelService, SuspiciousLoginService, MailService, SessionsService, AuditService (5) | Yes |
| **PasswordBreachService** | (none) | (not in chain — standalone) | Yes |
| **OAuthStateStore** | REDIS_CLIENT (1) | REDIS_CLIENT (1) | Yes |
| **OAuthCodeStore** | REDIS_CLIENT (1) | REDIS_CLIENT (1) | Yes |
| **OAuthLinkCodeStore** | REDIS_CLIENT (1) | (implicit, created by SCRUM-218) | Yes |
| **JwtStrategy** | UsersService, TokenDenyListService, ConfigService (3) | UsersService, **TokenDenyListService**, **ConfigService** (3) | Yes |
| **GoogleStrategy** | OAuthAuthService, OAuthStateStore, ConfigService (3) | (strategies not in chain) | N/A |
| **GitHubStrategy** | OAuthAuthService, OAuthStateStore, ConfigService (3) | (strategies not in chain) | N/A |

All documented dependency chains match actual constructor parameters.

---

## I-08 — Permissions Registry Match Documentation

**Verdict**: PASS
**Severity**: MEDIUM
**Standard**: ISO 25010

**Evidence**: The Permissions Registry in integration-state.md (lines 157-179) lists 9 permissions. AuthModule does not directly seed permissions — this is handled by `PermissionsService.onModuleInit()` in the PermissionsModule. However, AuthController uses `PermissionsService.getPermissionKeysForRole()` at line 227 of `auth.controller.ts`, and the admin endpoint uses `@Roles(Role.ADMIN)` — both consistent with the documented permission model.

The `@Roles(ADMIN)` decorator on `GET /admin` (line 237) is consistent with docs showing `JwtAuthGuard, RolesGuard` for that route. No `@RequirePermissions()` decorators are used on auth controllers, consistent with docs (auth endpoints use role-based, not permission-based authorization).

Permissions are managed entirely by PermissionsModule (@Global), which is correct per the architecture.

---

## I-09 — Cross-Module Import Validity

**Verdict**: PASS
**Severity**: HIGH
**Standard**: NestJS Architecture, CWE-1047

**Evidence**: Grep of `src/auth/*.ts` (non-test) for imports from other modules:

| Auth file imports from | Service/Type imported | Exported by source module? |
|---|---|---|
| `users/users.service` → UsersService | UsersModule exports: `[UsersService]` | Yes |
| `users/entities/user.entity` → SafeUser, User, toSafeUser | Type/interface (no DI needed) | N/A (types) |
| `users/enums/role.enum` → Role | Enum (no DI needed) | N/A (types) |
| `users/enums/provider.enum` → Provider | Enum (no DI needed) | N/A (types) |
| `audit/audit.service` → AuditService | AuditModule exports: `[AuditService]` | Yes |
| `audit/enums/*`, `audit/interfaces/*` | Types/enums (no DI needed) | N/A (types) |
| `sessions/sessions.service` → SessionsService | SessionsModule exports: `[SessionsService]` | Yes |
| `mail/mail.service` → MailService | MailModule exports: `[MailService]` | Yes |
| `security/turnstile.guard` → TurnstileGuard | SecurityModule exports: `[..., TurnstileGuard]` | Yes |
| `security/security.config` → SecurityConfig | Static config (no DI needed) | N/A (static) |
| `security/suspicious-login.service` → SuspiciousLoginService | SecurityModule exports: `[SuspiciousLoginService, ...]` | Yes |
| `geolocation/impossible-travel.service` → ImpossibleTravelService | GeolocationModule (@Global) exports: `[..., ImpossibleTravelService]` | Yes |
| `geolocation/interfaces/*` | Type/interface (no DI needed) | N/A (types) |
| `prisma/prisma.service` → PrismaService | PrismaModule (@Global) exports: `[PrismaService]` | Yes |
| `permissions/permissions.service` → PermissionsService | PermissionsModule (@Global) exports: `[PermissionsService, ...]` | Yes |
| `common/services/redis.constants` → REDIS_CLIENT | RedisModule (@Global) provides REDIS_CLIENT | Yes |
| `common/services/crypto.service` → CryptoService | CryptoModule (@Global) exports: `[CryptoService]` | Yes |

All service imports reference EXPORTED services from their respective modules. Type/interface/enum imports do not require DI and are correctly used as TypeScript-only imports. No violations found.

---

## I-10 — No Direct process.env Access in Auth Source Files

**Verdict**: PASS
**Severity**: HIGH
**Standard**: OWASP ASVS V14.2.1, NestJS ConfigService Pattern

**Evidence**: Grep for `process.env.` in `src/auth/` returned matches ONLY in test files:

- `src/auth/tests/github.strategy.spec.ts` (lines 52-53, 114-115) — test setup/teardown
- `src/auth/tests/google.strategy.spec.ts` (lines 52-53, 114-115) — test setup/teardown

Zero `process.env` references in any auth source file (services, controllers, guards, strategies, stores, utils). All environment variable access uses `ConfigService`:

| Service | Config access method |
|---|---|
| TokenService | `configService.get('auth.jwtRefreshExpiration')`, `configService.get('auth.jwtAccessExpiration')`, `configService.get('app.isProduction')`, `configService.get('auth.jwtSecret')` |
| MfaService | `configService.get(...)` |
| PasskeyService | `configService.get('auth.webauthnRpId')`, `configService.get('auth.webauthnRpName')`, `configService.get('auth.webauthnOrigin')` |
| TrustedDeviceService | `configService.get('auth.jwtSecret')` |
| JwtStrategy | `configService.get('auth.jwtSecret')` |
| GoogleStrategy | `configService.get('oauth.googleClientId')`, etc. |
| GitHubStrategy | `configService.get('oauth.githubClientId')`, etc. |
| OAuthController | `configService.get('app.frontendUrl')`, `configService.get('app.nodeEnv')`, `configService.get('app.oauthAllowedRedirectUrls')` |

Exceptions in non-auth files (allowed per audit scope): `main.ts` (3 refs), `validate-production-secrets.ts`, config files (`auth.config.ts`, `app.config.ts`, `oauth.config.ts`).

---

## Overall Assessment

AuthModule integration is **fully compliant** with documentation in integration-state.md. All 10 checks pass:

- Module metadata (imports, exports, providers, controllers, @Global) matches docs exactly
- All 42 route-guard combinations across 6 controllers match docs
- All 16+ service constructor dependency chains match docs
- Cross-module imports only reference exported services (or types/enums which are DI-independent)
- Zero process.env usage in auth source files; all config via ConfigService

No FAIL or WARN findings. No corrective actions required.
