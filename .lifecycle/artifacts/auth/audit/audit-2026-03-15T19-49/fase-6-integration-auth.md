# Fase 6: INTEGRATION — Auth Module

**Date**: 2026-03-15 21:15 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC8.2 (Configuration Management), NestJS Module Architecture

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 7     |
| FAIL    | 1     |
| WARN    | 2     |
| N/A     | 0     |

**Overall**: FAIL

---

## Detailed Findings

### I-01: Module imports match
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.module.ts:39-67` — All 8 expected imports present: `forwardRef(() => UsersModule)`, `AuditModule`, `SessionsModule`, `CryptoModule`, `MailModule`, `SecurityModule`, `PassportModule.register(...)`, `JwtModule.registerAsync(...)`. Matches `integration-state.md:14`.

### I-02: Module exports match
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.module.ts:96-102` — Exports: `AuthService`, `TokenService`, `PasswordBreachService`, `TrustedDeviceService`, `TokenDenyListService`. Exact match with `integration-state.md`.

### I-03: Module providers match
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.module.ts:76-95` — 18 providers registered: all services (AuthService, TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService, MfaService, PasskeyService), all strategies (JwtStrategy, GoogleStrategy, GitHubStrategy), all stores (OAuthStateStore, OAuthCodeStore, OAuthLinkCodeStore), OAuthLinkGuard, PasswordBreachService, TrustedDeviceService, TokenDenyListService.

### I-04: Module controllers match
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.module.ts:68-75` — 6 controllers: `AuthController`, `OAuthController`, `AccountController`, `SessionController`, `MfaController`, `PasskeyController`. Exact match with `integration-state.md`.

### I-05: Guard registration
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `CustomThrottlerGuard` registered as `APP_GUARD` in `app.module.ts:50-53`. `CsrfGuard` registered as `APP_GUARD` in `security.module.ts:13-16`. `JwtAuthGuard` and `RolesGuard` are NOT global APP_GUARDs — applied per-method via `@UseGuards()`. This is an intentional opt-in pattern but means new routes default to unprotected.

### I-06: DI chain valid
- **Verdict**: FAIL
- **Severity**: HIGH
- **Evidence**: Two issues found:
  1. **Implicit dependency**: `token.service.ts:22,58` and `login.service.ts:16,47` inject `ImpossibleTravelService` from `GeolocationModule`, but `GeolocationModule` is NOT in `auth.module.ts` imports. Works at runtime only because `GeolocationModule` has `@Global()` decorator (`geolocation.module.ts:7`). Fragile — removing `@Global()` would silently break auth.
  2. **Stale documentation**: `integration-state.md:193` lists `ImpossibleTravelService` as a dependency of `OAuthAuthService`, but `oauth-auth.service.ts:18-24` constructor does NOT inject it. Confirmed stale entry.

### I-07: Cross-module boundaries
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: 5 direct file imports across module boundaries: `token.service.ts:22-23` imports from `../geolocation/` and `../security/`, `login.service.ts:16-17` same, `oauth-auth.service.ts:8` imports from `../security/`. Standard NestJS practice (TypeScript requires class import for type), but creates coupling to internal file layout.

### I-08: Permission seeding
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `permissions.service.ts:30-32` — `seedPermissions()` upserts all 9 permissions from `default-permissions.ts:10-65`. Auth controllers use `@Roles(ADMIN)` only (no `@RequirePermissions`). All seeded permissions match `integration-state.md:143-153`.

### I-09: ConfigService usage
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All auth services use `ConfigService.get<T>(key)`. Zero `process.env` references in production files. Confirmed in: `jwt.strategy.ts:22`, `google.strategy.ts:22-24`, `token.service.ts:63`, `mfa.service.ts:40,42-43`, `trusted-device.service.ts:22,24`, `passkey.service.ts:49,51-53`. `process.env` only in test spec files (acceptable).

### I-10: No circular imports
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: Bidirectional `forwardRef()` between `AuthModule` (`auth.module.ts:40`) and `UsersModule` (`users.module.ts:10`). Correctly handled — `users.service.ts:49,51,53` uses `@Inject(forwardRef(...))` for 3 auth services. Functional but represents technical debt (shared services could be extracted to a common module).

---

## Recommendations

1. **I-06 (FAIL)**: Update `integration-state.md` — remove `ImpossibleTravelService` from `OAuthAuthService` dependency chain. Either add `GeolocationModule` to `auth.module.ts` imports explicitly, or add a comment documenting the `@Global()` reliance.
2. **I-05 (WARN)**: Consider migrating to default-deny global `JwtAuthGuard` with `@Public()` decorator for open routes — prevents accidental endpoint exposure.
3. **I-10 (WARN)**: Long-term, extract `PasswordBreachService`, `TrustedDeviceService`, `TokenDenyListService` to a shared `CoreAuthModule` to break the Auth↔Users circular dependency.
