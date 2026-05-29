# Fase 6: INTEGRATION — Auth

**Date**: 2026-03-12 02:25
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 §4.2.1, NestJS Module Architecture, CWE-1047

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 8     |
| FAIL    | 2     |
| WARN    | 0     |
| N/A     | 0     |

**Overall**: FAIL (2 FAIL findings)

---

## Detailed Findings

### I-01: Module imports
- **Verdict**: PASS
- **Evidence**: All 8 documented imports present in `auth.module.ts`: JwtModule, PassportModule, UsersModule, SessionsModule, MailModule, AuditModule, SecurityModule, PermissionsModule.

### I-02: Module exports
- **Verdict**: PASS
- **Evidence**: 4 exports match docs: AuthService, OAuthCodeStore, OAuthStateStore, TokenDenyListService.

### I-03: Module providers
- **Verdict**: PASS
- **Evidence**: All 12 providers present: AuthService, MfaService, PasskeyService, TrustedDeviceService, PasswordBreachService, TokenDenyListService, OAuthCodeStore, OAuthStateStore, JwtStrategy, GoogleStrategy, GitHubStrategy, OAuthCallbackFilter.

### I-04: Module controllers
- **Verdict**: PASS
- **Evidence**: 3 controllers: AuthController, MfaController, PasskeyController.

### I-05: @Global flag
- **Verdict**: PASS
- **Evidence**: No @Global decorator, matches docs.

### I-06: Guard chains
- **Verdict**: FAIL
- **Severity**: LOW
- **Evidence**: 2 undocumented endpoints (`GET /link/google`, `GET /link/github`) absent from integration-state.md guard map. `POST /validate-reset-token` has undocumented `@SkipCsrf()`.
- **Expected**: All controller methods documented in integration-state.md
- **Actual**: 3 documentation gaps
- **Standard**: NestJS Architecture

### I-07: Constructor DI
- **Verdict**: PASS
- **Evidence**: All service constructor dependencies match integration-state.md dependency chains exactly.

### I-08: Permissions registry
- **Verdict**: PASS
- **Evidence**: All 9 permissions in `default-permissions.ts` match docs. Role assignments correct: USER (2), ADMIN (8), SUPERADMIN bypasses.

### I-09: Cross-module boundaries
- **Verdict**: PASS
- **Evidence**: All 12 cross-module imports are from exported services. No boundary violations.

### I-10: ConfigService centralization
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: 28 direct `process.env` accesses across 11 production files. `ConfigService` not injected anywhere in auth module. Files: auth.module.ts, auth.service.ts, auth.controller.ts, mfa.service.ts, trusted-device.service.ts, passkey.service.ts, jwt.strategy.ts, google.strategy.ts, github.strategy.ts, oauth-callback.filter.ts, auth.constants.ts.
- **Expected**: All env var access via ConfigService
- **Actual**: Raw `process.env` reads bypass NestJS validation pipeline
- **Standard**: NestJS best practices

---

## Recommendations

1. **I-06** (FAIL): Add `/link/google`, `/link/github` guard chains to integration-state.md. Add `@SkipCsrf` annotation to `/validate-reset-token`.
2. **I-10** (FAIL): Introduce validated `ConfigModule` schema. Replace all 28 `process.env` reads with `ConfigService` injection. Use `JwtModule.registerAsync()` with ConfigService factory.
