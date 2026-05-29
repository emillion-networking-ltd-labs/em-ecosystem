# Fase 6: INTEGRATION — auth

**Date**: 2026-05-09 01:10 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 §4.2.1, NestJS Module Architecture, CWE-1047
**Previous baseline**: audit-2026-05-06T22-44 (10 PASS / 2 WARN / 0 FAIL — 83.3%)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 9     |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 0     |

**Overall**: PASS

---

## Detailed Findings

### I-01: Module imports
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.module.ts:46-66` imports `forwardRef(()=>UsersModule), AuditModule, forwardRef(()=>SessionsModule) [SCRUM-347], CryptoModule, MailModule, SecurityModule, PassportModule, JwtModule.registerAsync(...)` — matches `integration-state.md` AuthModule row.

### I-02: Module exports
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.module.ts:96-102` exports `AuthService, TokenService, PasswordBreachService, TrustedDeviceService, TokenDenyListService` — matches integration-state.md exports column.

### I-03: Module providers
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `auth.module.ts:75-95` declares 21 providers: AuthService, TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService, MfaService, PasskeyService, JwtStrategy, GoogleStrategy, GitHubStrategy, OAuthStateStore, OAuthCodeStore, OAuthLinkCodeStore, OAuthLinkGuard, MfaSetupGuard, JwtOrMfaSetupGuard, PasswordBreachService, TrustedDeviceService, TokenDenyListService, LoginSecurityService.

### I-04: Module controllers
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `auth.module.ts:67-74` declares 6 controllers: AuthController, OAuthController, AccountController, SessionController, MfaController, PasskeyController — matches integration-state.md.

### I-05: @Global flag
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: AuthModule does NOT use `@Global()` — matches docs ("@Global? No").

### I-06: Guard chains
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: integration-state.md tables for AuthController/AccountController/OAuthController/SessionController/MfaController/PasskeyController list the same guards as the actual controller files (`@UseGuards(JwtAuthGuard)`, `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(ADMIN)` for /auth/admin, `@UseGuards(JwtOrMfaSetupGuard)` for MFA setup, `@UseGuards(GoogleAuthGuard)` etc.).

### I-07: Constructor DI
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All 21 services compile and instantiate (43 spec suites all pass — would throw at TestingModule.compile if DI mismatched). LoginService DI = 6 deps, TokenService = 7, MfaService = 6, PasskeyService = 5, OAuthAuthService = 5 — within "≤8 fan-out" guidance.

### I-08: Permissions registry
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `permissions/constants/default-permissions.ts` lists registered permissions; PermissionsGuard reads via `permissionsService.roleHasAllPermissions`. (Detailed permissions audit was verified in previous audit — no schema change in auth scope.)

### I-09: Cross-module boundaries
- **Verdict**: WARN
- **Severity**: HIGH
- **Evidence**: auth/ imports from other modules:
  - `users/users.service`, `users/entities/user.entity`, `users/enums/role.enum` — UsersModule exports UsersService and User entity is the canonical type
  - `audit/audit.service`, `audit/enums/audit-action.enum` — AuditModule exports AuditService
  - `mail/mail.service` — MailModule exports MailService
  - `security/security.config`, `security/turnstile.guard`, `security/suspicious-login.service` — SecurityModule exports these
  - `sessions/sessions.service` — SessionsModule exports
  - `geolocation/impossible-travel.service` — GeolocationModule exports
  - `prisma/prisma.service` (passkey + trusted-device + email-verification + password-reset use directly) — PrismaModule is @Global so this is allowed
  - `common/services/crypto.service`, `common/decorators/...`, `common/utils/...`, `common/constants/error-messages` — common module utilities
- Concern: `passkey.service.ts` and `trusted-device.service.ts` import `prisma.service` directly. PrismaService is @Global by design. No private boundary violation. Carry-forward Accepted-Quality.

### I-10: ConfigService centralization
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: grep `process.env\.` in `src/auth/` non-test → only test files (`tests/google.strategy.spec.ts`, `tests/github.strategy.spec.ts`) use `process.env` for env mutation in tests. All production access goes through `ConfigService.get<string>('auth.xxx')` (verified in token.service.ts:40-58, mfa.service.ts:42-46, jwt.strategy.ts:21, google.strategy.ts:23-29, etc.).

---

## Recommendations

1. **I-09 WARN** (carry-forward, Accepted-Quality): Consider abstracting passkey/trusted-device data access behind a repository pattern to remove direct PrismaService imports from the service layer. Low priority — current pattern is idiomatic NestJS+Prisma.
