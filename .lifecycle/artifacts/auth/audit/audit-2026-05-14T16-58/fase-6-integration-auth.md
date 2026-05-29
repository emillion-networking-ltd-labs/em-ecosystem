---
schema: ai-specs/schemas/audit-phase-report.schema.yml
phase: integration
module: auth
audit_folder: ai-specs/changes/auth/audit/audit-2026-05-14T16-58
date: 2026-05-14T16:58:00Z
framework_version: audit-standards.mdc v1.0
auditor: Claude (automated)
standards_covered:
  - ISO 25010 §4.2.1 Modularity
  - NestJS Module Architecture
  - CWE-1047
checks_summary:
  pass: 10
  fail: 0
  warn: 0
  na: 0
  total: 10
overall_verdict: PASS
checks:
  - check_id: I-01
    requirement: AuthModule imports match integration-state.md
    verdict: PASS
    severity: HIGH
    standard: NestJS Architecture
    evidence: "src/auth/auth.module.ts:46-54 imports: forwardRef(()=>UsersModule), AuditModule, forwardRef(()=>SessionsModule), CryptoModule, MailModule, SecurityModule, PassportModule.register(...), JwtModule.registerAsync(...). integration-state.md:14 lists for AuthModule: 'UsersModule (forwardRef), AuditModule, SessionsModule (forwardRef) [SCRUM-347], CryptoModule, MailModule, PassportModule, JwtModule, SecurityModule'. Exact match."
  - check_id: I-02
    requirement: AuthModule exports match integration-state.md
    verdict: PASS
    severity: HIGH
    standard: NestJS Architecture
    evidence: "src/auth/auth.module.ts:96-102 exports: [AuthService, TokenService, PasswordBreachService, TrustedDeviceService, TokenDenyListService]. integration-state.md:14 lists exports: 'AuthService, TokenService, PasswordBreachService, TrustedDeviceService, TokenDenyListService'. Exact match (5 elements)."
  - check_id: I-03
    requirement: Provider array vs docs
    verdict: PASS
    severity: HIGH
    standard: NestJS Architecture
    evidence: "src/auth/auth.module.ts:75-95 providers: 21 entries (AuthService, TokenService, LoginService, OAuthAuthService, EmailVerificationService, PasswordResetService, MfaService, PasskeyService, JwtStrategy, GoogleStrategy, GitHubStrategy, OAuthStateStore, OAuthCodeStore, OAuthLinkCodeStore, OAuthLinkGuard, MfaSetupGuard, JwtOrMfaSetupGuard, PasswordBreachService, TrustedDeviceService, TokenDenyListService, LoginSecurityService). integration-state.md does not enumerate providers exhaustively (doc style: imports/exports/controllers only). Guard registrations cross-checked in integration-state.md:34-39 (OAuthLinkGuard, MfaSetupGuard, JwtOrMfaSetupGuard all marked 'Only in AuthModule context')."
  - check_id: I-04
    requirement: Controllers match docs
    verdict: PASS
    severity: MEDIUM
    standard: NestJS Architecture
    evidence: "src/auth/auth.module.ts:68-74 controllers: [AuthController, OAuthController, AccountController, SessionController, MfaController, PasskeyController]. integration-state.md:14 lists same 6 controllers. integration-state.md:55-60 also enumerates each one with metadata."
  - check_id: I-05
    requirement: '@Global() flag'
    verdict: PASS
    severity: MEDIUM
    standard: NestJS Architecture
    evidence: "src/auth/auth.module.ts:43 module decorator is @Module (no @Global). integration-state.md:14 column 'No' confirms not @Global. Match."
  - check_id: I-06
    requirement: Guard chains match guard map
    verdict: PASS
    severity: HIGH
    standard: ISO 25010 Modularity
    evidence: "grep -rEn '@UseGuards' src/auth/*.controller.ts: 28 lines matching. Cross-check against integration-state.md:55-122 (AuthController/OAuthController/SessionController/MfaController/PasskeyController method guard tables). Examples: src/auth/auth.controller.ts:208:@UseGuards(JwtAuthGuard) (logout-all), :250:@UseGuards(JwtAuthGuard, RolesGuard) (admin). integration-state.md AuthController section confirms. mfa.controller.ts:52,64:@UseGuards(JwtOrMfaSetupGuard) covered in integration-state.md:38 + line 60 controller summary. All chains accounted for."
  - check_id: I-07
    requirement: Constructor DI vs docs
    verdict: PASS
    severity: HIGH
    standard: ISO 25010 Modularity
    evidence: "Spot-check AuthService, TokenService, LoginService, MfaService, PasskeyService, OAuthAuthService constructor injections. integration-state.md controller-row 'Service dependencies' column (lines 55-60): e.g. SessionController deps = 'SessionsService, TrustedDeviceService, JwtService' — verified in src/auth/session.controller.ts:30-37 constructor (sessionsService, trustedDeviceService, jwtService). MfaController deps = 'MfaService, TokenService, TrustedDeviceService' verified in src/auth/mfa.controller.ts:31-37. PasskeyController deps = 'PasskeyService, TokenService' verified in src/auth/passkey.controller.ts:32-36."
  - check_id: I-08
    requirement: Permissions registry centralized
    verdict: PASS
    severity: MEDIUM
    standard: NestJS Architecture
    evidence: "Permissions defined in src/permissions/constants/default-permissions.ts. PermissionsModule is @Global (src/permissions/permissions.module.ts:8:@Global()) — provides PermissionsService project-wide. AuthController uses @RequirePermissions('users:read|write|delete'); integration-state.md row 'AuthController' (line 55) records the dependency 'PermissionsService'. Default permissions seeded via prisma/seed.ts:3-58."
  - check_id: I-09
    requirement: Cross-module boundary violations
    verdict: PASS
    severity: HIGH
    standard: ISO 25010 Modularity, CWE-1047
    evidence: "All cross-module imports from src/auth/ resolve to EXPORTED services or enums/interfaces (which are inherently public TypeScript shape). Verified all 7 imported modules export the symbols auth imports: UsersModule→UsersService; AuditModule→AuditService; SessionsModule→SessionsService; MailModule→MailService; SecurityModule→SuspiciousLoginService+TurnstileService+TurnstileGuard; GeolocationModule→GeolocationService+ImpossibleTravelService; CryptoModule→CryptoService. PermissionsService is reachable because PermissionsModule is @Global. Enum/interface imports (Role, Provider, JwtPayload, etc.) are pure type imports — no runtime boundary."
  - check_id: I-10
    requirement: ConfigService centralization (no direct process.env in module)
    verdict: PASS
    severity: MEDIUM
    standard: NestJS best practices
    evidence: "grep -rEn 'process\\.env\\.' src/auth/ --include=*.ts (excluding tests/): 0 matches. All env access goes through ConfigService (e.g., src/auth/auth.module.ts:57-66 ConfigService.get('auth.jwtSecret'), src/auth/token.service.ts:56-59 configService.get('auth.jwtRefreshExpiration'))."
---

# Fase 6: INTEGRATION — auth

**Date**: 2026-05-14 16:58 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 §4.2.1 (Modularity), NestJS Module Architecture, CWE-1047 (Circular Dependencies)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 10    |
| FAIL    | 0     |
| WARN    | 0     |
| N/A     | 0     |

**Overall**: PASS

---

## Detailed Findings

### I-01: Module imports
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/auth.module.ts:46-54` imports `[forwardRef(()=>UsersModule), AuditModule, forwardRef(()=>SessionsModule), CryptoModule, MailModule, SecurityModule, PassportModule.register(), JwtModule.registerAsync()]` — exact match with `integration-state.md:14`. The forwardRef on SessionsModule was added in SCRUM-347 and is documented as such in `integration-state.md:257`.

### I-02: Module exports
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `src/auth/auth.module.ts:96-102` exports `[AuthService, TokenService, PasswordBreachService, TrustedDeviceService, TokenDenyListService]` — exact 5-element match with docs.

### I-03: Providers
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 21 providers in `auth.module.ts:75-95`. Per-provider docs are not exhaustive in `integration-state.md` (style: imports/exports/controllers only), but guards `OAuthLinkGuard`, `MfaSetupGuard`, `JwtOrMfaSetupGuard` are explicitly attributed to AuthModule at `integration-state.md:34-39`.

### I-04: Controllers
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: 6 controllers (`AuthController`, `OAuthController`, `AccountController`, `SessionController`, `MfaController`, `PasskeyController`). Each documented with metadata at `integration-state.md:55-60`.

### I-05: @Global flag
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/auth/auth.module.ts:43` decorator is `@Module` (not `@Global`). Docs row column "No" — match.

### I-06: Guard chains
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 28 `@UseGuards` annotations across the 6 auth controllers. Cross-checked the method-level guard map at `integration-state.md:55-122`. No drift detected.

### I-07: Constructor DI
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Spot-check SessionController (`sessionsService`, `trustedDeviceService`, `jwtService`), MfaController (`mfaService`, `tokenService`, `trustedDeviceService`), PasskeyController (`passkeyService`, `tokenService`) — all match docs.

### I-08: Permissions registry centralized
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `src/permissions/constants/default-permissions.ts` is the single source. `PermissionsModule` is `@Global` (`src/permissions/permissions.module.ts:8`), so `PermissionsService` is reachable in any module without explicit imports. Default rows seeded via `prisma/seed.ts:3-58`.

### I-09: Cross-module boundary violations
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All imports from `src/auth/` of other-module paths resolve to EXPORTED services. Auth doesn't reach into internal/private files of other modules. Enum/interface imports (Role, JwtPayload, OAuthProfile) are pure type imports and not a boundary concern.

### I-10: ConfigService centralization
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `grep -rEn 'process\.env\.' src/auth/`: 0 matches (excluding tests). All env access via `ConfigService.get('auth.<key>')`.

---

## Recommendations

No actions required. AuthModule's wiring is consistent with `integration-state.md`. The SCRUM-347 bidirectional forwardRef cycle is intentional and documented.
