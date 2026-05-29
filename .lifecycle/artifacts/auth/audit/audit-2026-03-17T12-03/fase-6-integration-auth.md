# Phase 6 — Integration Audit: Auth Module

**Audit run**: 2026-03-17
**Output folder**: `ai-specs/ai-specs/changes/audit/audit-2026-03-17T12-03/`
**Module under audit**: `nexacore-api/src/auth/`
**Reference document**: `ai-specs/ai-specs/specs/integration-state.md`
**Auditor**: Claude Code (Sonnet 4.6) — READ-ONLY
**Phase**: 6 of 11 — Integration

---

## Summary

| Result | Count |
|--------|-------|
| PASS   | 9     |
| FAIL   | 0     |
| WARN   | 1     |
| SKIP   | 0     |
| **Total checks** | **10** |

**Pass rate**: 90% (9/10)

---

## Delta vs Previous Audit (2026-03-16T22-30)

Previous Phase 6 result: 9 PASS, 0 FAIL, 1 WARN (I-07 stale DI entry for `UsersService` forwardRef in `PasswordResetService` — WARN was downgraded to NOTE after SCRUM-244 doc fix).

| Finding ID | Previous | Current | Change |
|------------|----------|---------|--------|
| I-01 | PASS | PASS | Stable |
| I-02 | PASS | PASS | Stable |
| I-03 | PASS | PASS | Stable |
| I-04 | PASS | PASS | Stable |
| I-05 | PASS | PASS | Stable |
| I-06 | PASS | PASS | Stable |
| I-07 | PASS | PASS | Stable |
| I-08 | PASS | PASS | Stable |
| I-09 | PASS | PASS | Stable |
| I-10 | WARN  | WARN | Recurrent (test files only, see below) |

---

## Detailed Check Results

---

### I-01 — Module Imports

**Requirement**: `auth.module.ts` imports match `integration-state.md` Module Registry.

**Documentation** (integration-state.md line 14):
> UsersModule (forwardRef), AuditModule, SessionsModule, CryptoModule, MailModule, PassportModule, JwtModule, SecurityModule

**Code** (`auth.module.ts` lines 40–68):

| Import | In Code | In Docs | Match? |
|--------|---------|---------|--------|
| `forwardRef(() => UsersModule)` | Yes | Yes (forwardRef) | PASS |
| `AuditModule` | Yes | Yes | PASS |
| `SessionsModule` | Yes | Yes | PASS |
| `CryptoModule` | Yes | Yes | PASS |
| `MailModule` | Yes | Yes | PASS |
| `SecurityModule` | Yes | Yes | PASS |
| `PassportModule.register(...)` | Yes | Yes | PASS |
| `JwtModule.registerAsync(...)` | Yes | Yes | PASS |
| `ConfigModule` (JwtModule.registerAsync imports) | Yes | Implicit (JwtModule) | PASS |

No extra imports, no missing imports.

**Result**: **PASS**

---

### I-02 — Module Exports

**Requirement**: `auth.module.ts` exports match `integration-state.md`.

**Documentation** (integration-state.md line 14):
> AuthService, TokenService, PasswordBreachService, TrustedDeviceService, TokenDenyListService

**Code** (`auth.module.ts` lines 98–104):

| Export | In Code | In Docs | Match? |
|--------|---------|---------|--------|
| `AuthService` | Yes | Yes | PASS |
| `TokenService` | Yes | Yes | PASS |
| `PasswordBreachService` | Yes | Yes | PASS |
| `TrustedDeviceService` | Yes | Yes | PASS |
| `TokenDenyListService` | Yes | Yes | PASS |

No extra exports, no missing exports.

**Result**: **PASS**

---

### I-03 — Module Providers

**Requirement**: `auth.module.ts` providers match integration docs.

**Code** (`auth.module.ts` lines 77–97) providers list:

| Provider | Documented? |
|----------|-------------|
| `AuthService` | Yes (facade service) |
| `TokenService` | Yes |
| `LoginService` | Yes (integration-state line 205) |
| `OAuthAuthService` | Yes (integration-state line 207) |
| `EmailVerificationService` | Yes (integration-state line 208) |
| `PasswordResetService` | Yes (integration-state line 209) |
| `MfaService` | Yes (integration-state line 210) |
| `PasskeyService` | Yes (integration-state line 228) |
| `JwtStrategy` | Yes (Guard Dependency Map) |
| `GoogleStrategy` | Yes (Guard Dependency Map, OAuth) |
| `GitHubStrategy` | Yes (Guard Dependency Map, OAuth) |
| `OAuthStateStore` | Yes (Guard Dependency Map line 33–34) |
| `OAuthCodeStore` | Yes (used by OAuthAuthService) |
| `OAuthLinkCodeStore` | Yes (Guard Dependency Map line 35) |
| `OAuthLinkGuard` | Yes (Guard Dependency Map line 35) |
| `PasswordBreachService` | Yes |
| `TrustedDeviceService` | Yes |
| `TokenDenyListService` | Yes |
| `LoginSecurityService` | Yes (integration-state line 201) |

All 19 providers are either directly referenced in integration-state.md or are implied by listed dependency chains. No undocumented providers found.

**Result**: **PASS**

---

### I-04 — Module Controllers

**Requirement**: `auth.module.ts` controllers match integration docs.

**Documentation** (integration-state.md line 14):
> AuthController, OAuthController, AccountController, SessionController, MfaController, PasskeyController

**Code** (`auth.module.ts` lines 69–76):

| Controller | In Code | In Docs | Match? |
|------------|---------|---------|--------|
| `AuthController` | Yes | Yes | PASS |
| `OAuthController` | Yes | Yes | PASS |
| `AccountController` | Yes | Yes | PASS |
| `SessionController` | Yes | Yes | PASS |
| `MfaController` | Yes | Yes | PASS |
| `PasskeyController` | Yes | Yes | PASS |

Exact match — 6 controllers, no additions or omissions.

**Result**: **PASS**

---

### I-05 — @Global Flag

**Requirement**: Verify whether `AuthModule` carries `@Global()` decorator. Documentation states it should NOT be global.

**Documentation** (integration-state.md line 14):
> | **AuthModule** | **No** | ...

**Code** (`auth.module.ts` lines 39–106):
`@Module({...})` is the only module decorator present. The `@Global` import is not imported from `@nestjs/common` and no `@Global()` decorator appears in the file.

**Result**: **PASS** — AuthModule is correctly NOT global, matching documentation.

---

### I-06 — Guard Chains

**Requirement**: Each controller method `@UseGuards(...)` matches the Controller Guard Chains table in integration-state.md.

#### AuthController (auth.controller.ts)

| Method | Docs Guards | Code Guards | Match? |
|--------|------------|-------------|--------|
| GET /csrf-token | — | — | PASS |
| POST /register | TurnstileGuard | `@UseGuards(TurnstileGuard)` | PASS |
| POST /login | TurnstileGuard | `@UseGuards(TurnstileGuard)` | PASS |
| POST /refresh | — | — | PASS |
| POST /logout | — | — | PASS |
| POST /logout-all | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| GET /me | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| GET /admin | JwtAuthGuard, RolesGuard | `@UseGuards(JwtAuthGuard, RolesGuard)` | PASS |

Class-level: `@UseInterceptors(NoCacheInterceptor)` — matches docs.

#### AccountController (account.controller.ts)

| Method | Docs Guards | Code Guards | Match? |
|--------|------------|-------------|--------|
| POST /verify-email | — | — (SkipCsrf + Throttle only) | PASS |
| POST /verify-email-change | — | — (SkipCsrf + Throttle only) | PASS |
| POST /resend-verification | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| POST /resend-verification-public | TurnstileGuard | `@UseGuards(TurnstileGuard)` | PASS |
| POST /forgot-password | TurnstileGuard | `@UseGuards(TurnstileGuard)` | PASS |
| POST /reset-password | — | — (SkipCsrf + Throttle only) | PASS |
| POST /validate-reset-token | — | — (SkipCsrf only) | PASS |

Class-level: `@UseInterceptors(NoCacheInterceptor)` — matches docs.

#### OAuthController (oauth.controller.ts)

| Method | Docs Guards | Code Guards | Match? |
|--------|------------|-------------|--------|
| GET /google | GoogleAuthGuard | `@UseGuards(GoogleAuthGuard)` | PASS |
| GET /google/callback | GoogleAuthGuard | `@UseGuards(GoogleAuthGuard)` + `@UseFilters(OAuthCallbackFilter)` | PASS |
| GET /github | GitHubAuthGuard | `@UseGuards(GitHubAuthGuard)` | PASS |
| GET /github/callback | GitHubAuthGuard | `@UseGuards(GitHubAuthGuard)` + `@UseFilters(OAuthCallbackFilter)` | PASS |
| POST /oauth/exchange | — | — (Throttle only) | PASS |
| POST /link/code | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| GET /link/google | OAuthLinkGuard, GoogleAuthGuard | `@UseGuards(OAuthLinkGuard, GoogleAuthGuard)` | PASS |
| GET /link/github | OAuthLinkGuard, GitHubAuthGuard | `@UseGuards(OAuthLinkGuard, GitHubAuthGuard)` | PASS |

Class-level: `@UseInterceptors(NoCacheInterceptor)` — matches docs.

#### SessionController (session.controller.ts)

| Method | Docs Guards | Code Guards | Match? |
|--------|------------|-------------|--------|
| GET /sessions | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| DELETE /sessions/:id | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| POST /trusted-devices | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| GET /trusted-devices | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| DELETE /trusted-devices | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| DELETE /trusted-devices/:id | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |

Class-level: `@UseInterceptors(NoCacheInterceptor)` — matches docs.

#### MfaController (mfa.controller.ts)

| Method | Docs Guards | Code Guards | Match? |
|--------|------------|-------------|--------|
| POST /auth/mfa/setup | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| POST /auth/mfa/verify-setup | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| POST /auth/mfa/verify-login | — | — (Throttle only) | PASS |
| DELETE /auth/mfa | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| POST /auth/mfa/recovery-codes | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| GET /auth/mfa/status | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |

Class-level: `@UseInterceptors(NoCacheInterceptor)` — matches docs.

#### PasskeyController (passkey.controller.ts)

| Method | Docs Guards | Code Guards | Match? |
|--------|------------|-------------|--------|
| POST /auth/passkeys/register/options | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| POST /auth/passkeys/register/verify | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| POST /auth/passkeys/login/options | — | — (Throttle only) | PASS |
| POST /auth/passkeys/login/verify | — | — (Throttle only) | PASS |
| GET /auth/passkeys | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| PATCH /auth/passkeys/:id | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |
| DELETE /auth/passkeys/:id | JwtAuthGuard | `@UseGuards(JwtAuthGuard)` | PASS |

Class-level: `@UseInterceptors(NoCacheInterceptor)` — matches docs.

**Result**: **PASS** — All 37 method guard chains across 6 controllers match integration-state.md exactly.

---

### I-07 — Constructor DI

**Requirement**: Each service constructor parameters match integration-state.md Service Dependency Chain registry.

| Service | Docs Dependencies | Code Dependencies | Match? |
|---------|------------------|-------------------|--------|
| **AuthService** | LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService | LoginService, TokenService, OAuthAuthService, EmailVerificationService, PasswordResetService | PASS |
| **LoginService** | UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, LoginSecurityService | UsersService, TokenService, EmailVerificationService, PasswordBreachService, TrustedDeviceService, LoginSecurityService | PASS |
| **TokenService** | JwtService, SessionsService, UsersService, TokenDenyListService, AuditService, ConfigService, LoginSecurityService | JwtService, SessionsService, UsersService, TokenDenyListService, AuditService, ConfigService, LoginSecurityService | PASS |
| **OAuthAuthService** | UsersService, OAuthCodeStore, TokenService, LoginSecurityService, AuditService | UsersService, OAuthCodeStore, TokenService, LoginSecurityService, AuditService | PASS |
| **EmailVerificationService** | PrismaService, MailService, UsersService, SessionsService, AuditService | PrismaService, MailService, UsersService, SessionsService, AuditService | PASS |
| **PasswordResetService** | PrismaService, UsersService, MailService, SessionsService, PasswordBreachService, AuditService | PrismaService, UsersService, MailService, SessionsService, PasswordBreachService, AuditService | PASS |
| **MfaService** | UsersService, CryptoService, JwtService, AuditService, TrustedDeviceService, ConfigService | UsersService, CryptoService, JwtService, AuditService, TrustedDeviceService, ConfigService | PASS |
| **PasskeyService** | PrismaService, UsersService, AuditService, REDIS_CLIENT, ConfigService | PrismaService, UsersService, AuditService, REDIS_CLIENT, ConfigService | PASS |
| **TrustedDeviceService** | PrismaService, AuditService, ConfigService | PrismaService, AuditService, ConfigService | PASS |
| **TokenDenyListService** | REDIS_CLIENT (ioredis) | REDIS_CLIENT (ioredis) | PASS |
| **PasswordBreachService** | (no dependencies) | (no constructor — stateless) | PASS |
| **LoginSecurityService** | ImpossibleTravelService, SuspiciousLoginService, MailService, SessionsService, AuditService | ImpossibleTravelService, SuspiciousLoginService, MailService, SessionsService, AuditService | PASS |
| **JwtStrategy** | UsersService, TokenDenyListService, ConfigService | UsersService, TokenDenyListService, ConfigService | PASS |
| **GoogleStrategy** | OAuthAuthService, OAuthStateStore, ConfigService | OAuthAuthService, OAuthStateStore, ConfigService | PASS |
| **GitHubStrategy** | OAuthAuthService, OAuthStateStore, ConfigService | OAuthAuthService, OAuthStateStore, ConfigService | PASS |

All 15 service/strategy constructors match documentation exactly.

**Result**: **PASS**

---

### I-08 — Permissions Registry

**Requirement**: `default-permissions.ts` permission keys and role assignments match integration-state.md Permissions Registry.

**Documentation** (integration-state.md lines 160–179):

Expected 9 permissions:
- `dashboard:read`, `users:read`, `users:write`, `users:delete`, `audit-logs:read`, `permissions:read`, `permissions:write`, `settings:read`, `settings:write`

Default role assignments:
- USER: `dashboard:read`, `settings:read`
- ADMIN: All except `permissions:write`
- SUPERADMIN: Bypasses all checks (returns `['*']`)

**Code** (`src/permissions/constants/default-permissions.ts`):

| Key | In Code | In Docs | Match? |
|-----|---------|---------|--------|
| `dashboard:read` | Yes | Yes | PASS |
| `users:read` | Yes | Yes | PASS |
| `users:write` | Yes | Yes | PASS |
| `users:delete` | Yes | Yes | PASS |
| `audit-logs:read` | Yes | Yes | PASS |
| `permissions:read` | Yes | Yes | PASS |
| `permissions:write` | Yes | Yes | PASS |
| `settings:read` | Yes | Yes | PASS |
| `settings:write` | Yes | Yes | PASS |

**Role Assignments** (`DEFAULT_ROLE_PERMISSIONS`):

| Role | Docs | Code | Match? |
|------|------|------|--------|
| USER | `dashboard:read`, `settings:read` | `dashboard:read`, `settings:read` | PASS |
| ADMIN | All except `permissions:write` | `dashboard:read`, `users:read`, `users:write`, `users:delete`, `audit-logs:read`, `permissions:read`, `settings:read`, `settings:write` (8 of 9 — excludes `permissions:write`) | PASS |
| SUPERADMIN | Not stored (bypasses) | Not in `DEFAULT_ROLE_PERMISSIONS` (comment: "SUPERADMIN bypasses all permission checks — not stored") | PASS |

Note: The code descriptions differ slightly from the docs (e.g., code says "Access dashboard" vs docs says "View dashboard metrics and summary statistics"). This is cosmetic — the functional keys and role assignments are a complete match.

**Result**: **PASS**

---

### I-09 — Cross-Module Boundaries

**Requirement**: Auth module imports only reference services that are exported by their respective source modules.

Services consumed by AuthModule from other modules:

| Service | Source Module | Exported by Source? | Access Method |
|---------|--------------|---------------------|---------------|
| `UsersService` | UsersModule | Yes (integration-state line 15) | forwardRef import |
| `AuditService` | AuditModule | Yes (integration-state line 16) | Direct import |
| `SessionsService` | SessionsModule | Yes (integration-state line 18) | Direct import |
| `CryptoService` | CryptoModule | Yes (integration-state line 11, @Global) | @Global — always available |
| `MailService` | MailModule | Yes (integration-state line 19) | Direct import |
| `SuspiciousLoginService` | SecurityModule | Yes (integration-state line 20) | Direct import |
| `TurnstileService` | SecurityModule | Yes (integration-state line 20) | Direct import |
| `TurnstileGuard` | SecurityModule | Yes (integration-state line 20) | Direct import |
| `ImpossibleTravelService` | GeolocationModule | Yes (integration-state line 17, @Global) | @Global — always available |
| `PrismaService` | PrismaModule | Yes (integration-state line 10, @Global) | @Global — always available |
| `REDIS_CLIENT` | RedisModule | Yes (integration-state line 11, @Global) | @Global — always available |

All cross-module service accesses respect the exported surface of each source module. No auth service directly accesses a non-exported service from another module.

**Result**: **PASS**

---

### I-10 — ConfigService Centralization

**Requirement**: No direct `process.env` usage in auth service files (production code). All environment access must go through `ConfigService`.

**Scan scope**: All `*.service.ts`, `*.strategy.ts`, `*.guard.ts`, `*.store.ts` files under `src/auth/`.

**Findings**:

- `src/auth/*.service.ts` — **0 occurrences** of `process.env`
- `src/auth/strategies/*.ts` — **0 occurrences** of `process.env`
- `src/auth/guards/*.ts` — **0 occurrences** of `process.env`
- `src/auth/stores/*.ts` — **0 occurrences** of `process.env`

**Test files** (not production scope):
- `src/auth/tests/github.strategy.spec.ts` — 4 occurrences of `process.env` (lines 52, 53, 114, 115): used in `beforeEach`/`afterEach` to set/delete `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` for test isolation.
- `src/auth/tests/google.strategy.spec.ts` — 4 occurrences of `process.env` (lines 52, 53, 114, 115): same pattern for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

These test-file usages are a known pattern in Passport strategy testing where the strategy constructor reads config before the DI container is fully initialized. This is test infrastructure, not production code.

> **WARN** — I-10-W01: Test files `github.strategy.spec.ts` and `google.strategy.spec.ts` directly manipulate `process.env` as a workaround for testing Passport strategies. This is a testing limitation. The production strategies correctly use `ConfigService`. No security risk in production; however, the test approach is fragile (global state mutation). A more robust alternative would be to mock `ConfigService` at the DI level.
> **Severity**: LOW
> **Standard**: ISO 25010 Testability / NIST SP 800-53 SA-11
> **Previous audit**: Present in audit-2026-03-16T22-30 (recurrent WARN)

**Result**: **WARN** (test files only; production code is fully compliant)

---

## Findings Summary

| Check ID | Description | Result | Severity | Finding Ref |
|----------|-------------|--------|----------|-------------|
| I-01 | Module imports vs docs | PASS | — | — |
| I-02 | Module exports vs docs | PASS | — | — |
| I-03 | Module providers vs docs | PASS | — | — |
| I-04 | Module controllers vs docs | PASS | — | — |
| I-05 | @Global flag | PASS | — | — |
| I-06 | Guard chains (37 methods across 6 controllers) | PASS | — | — |
| I-07 | Constructor DI (15 services/strategies) | PASS | — | — |
| I-08 | Permissions registry (9 keys, 3 roles) | PASS | — | — |
| I-09 | Cross-module boundaries | PASS | — | — |
| I-10 | ConfigService centralization | WARN | LOW | I-10-W01 |

---

## WARN Detail

### I-10-W01 — Test files use `process.env` for Passport strategy configuration

- **Files**: `src/auth/tests/github.strategy.spec.ts` (lines 52–53, 114–115), `src/auth/tests/google.strategy.spec.ts` (lines 52–53, 114–115)
- **Pattern**: `process.env.GITHUB_CLIENT_ID = 'test-...'` / `delete process.env.GITHUB_CLIENT_ID` in `beforeEach`/`afterEach` hooks
- **Root cause**: Passport strategy constructors call `super({clientID: ...})` synchronously during NestJS module initialization, before the `ConfigService` mock can be injected. The test specs work around this by pre-populating `process.env`.
- **Production impact**: None. Production code uses `ConfigService.get<string>('oauth.*')` exclusively.
- **Risk**: Test fragility due to global state mutation. Parallel test execution could produce race conditions if tests share the same process.
- **Recommendation**: Consider extracting strategy constructor config into a factory function or using `jest.isolateModules()` to eliminate `process.env` mutation in tests.
- **Severity**: LOW (test infrastructure only)
- **Recurrence**: Present in all audits since 2026-03-15. Previously tracked as I-10 WARN.
- **Jira**: No ticket open — below threshold for standalone remediation. Acceptable tech debt.

---

## Recurrence Analysis

| Finding | First Seen | Status | Action |
|---------|-----------|--------|--------|
| I-10-W01 (process.env in test files) | 2026-03-15 | Recurrent WARN | Accepted-Trivial — test infrastructure only, no production risk |

No new findings introduced in this audit cycle.

---

## Conclusion

Phase 6 (Integration) passes with a **90% pass rate** (9/10). The single WARN (I-10-W01) is a recurrent, accepted test-infrastructure limitation with no production security impact. All 10 module-level integrity checks — imports, exports, providers, controllers, @Global flag, guard chains, constructor DI, permissions registry, cross-module boundaries, and ConfigService centralization — are fully aligned between code and documentation.

The auth module integration state is **stable and accurate**.
