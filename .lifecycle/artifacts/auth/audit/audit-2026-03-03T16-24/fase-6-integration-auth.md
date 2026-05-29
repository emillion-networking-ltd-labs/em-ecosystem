# Fase 6: INTEGRATION — Auth Module

**Date**: 2026-03-03 16:50
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: integration-state.md vs source code

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 5     |
| FAIL    | 0     |
| WARN    | 3     |
| N/A     | 0     |

**Overall**: PASS (with documentation accuracy warnings)

---

## Detailed Findings

### I-01: Module Imports
- **Verdict**: PASS
- **Evidence**: `src/auth/auth.module.ts` — all 8 imports match integration-state.md exactly:
  UsersModule (forwardRef), AuditModule, SessionsModule, CryptoModule, MailModule, SecurityModule, PassportModule, JwtModule

### I-02: Module Exports
- **Verdict**: PASS
- **Evidence**: 3 exports match: AuthService, PasswordBreachService, TrustedDeviceService

### I-03: Module Providers
- **Verdict**: PASS
- **Evidence**: 10 providers consistent with documented ecosystem: AuthService, MfaService, PasskeyService, JwtStrategy, GoogleStrategy, GitHubStrategy, OAuthStateStore, OAuthCodeStore, PasswordBreachService, TrustedDeviceService

### I-04: Module Controllers
- **Verdict**: PASS
- **Evidence**: 3 controllers match: AuthController, MfaController, PasskeyController

### I-05: @Global Flag
- **Verdict**: PASS
- **Evidence**: No `@Global()` decorator. Doc says `@Global? = No`. Match.

### I-06: Guard Chains
- **Verdict**: WARN | **Severity**: LOW
- **Evidence**: All 39 routes across 3 controllers match documented guard chains. One cosmetic discrepancy:
  - `GET /auth/mfa/status`: code has `@Throttle` before `@UseGuards`, doc lists `@UseGuards` first. No behavioral impact (metadata decorators are order-independent in NestJS).

### I-07: Constructor DI
- **Verdict**: WARN | **Severity**: MEDIUM
- **Evidence**: 5 services audited. All match except AuthService:
  | Service | Code Deps | Doc Deps | Match |
  |---------|-----------|----------|-------|
  | AuthService | 11 deps | 11 deps | 2 discrepancies |
  | MfaService | 5 deps | 5 deps | Exact |
  | PasskeyService | 4 deps | 4 deps | Exact |
  | TrustedDeviceService | 2 deps | 2 deps | Exact |
  | PasswordBreachService | 0 deps | 0 deps | Exact |
- **Discrepancies**:
  1. `PrismaService` is injected into AuthService but missing from integration-state.md
  2. `CryptoService` is listed in doc for AuthService but not actually in the constructor (it's used by MfaService, not AuthService)

### I-08: Permissions Registry
- **Verdict**: WARN | **Severity**: LOW
- **Evidence**: All 9 permission keys match exactly. Default role assignments (USER: 2, ADMIN: 8, SUPERADMIN: bypass) match exactly.
- **Discrepancy**: 7 of 9 permission description strings differ between code and doc (2 materially, 5 minor wording). Keys and assignments are authoritative; descriptions are informational.

---

## Discrepancy Register

| ID | Severity | Finding |
|----|----------|---------|
| INT-01 | MEDIUM | `PrismaService` missing from AuthService chain in integration-state.md |
| INT-02 | MEDIUM | `CryptoService` listed for AuthService in doc but not actually injected |
| INT-03 | LOW | Decorator order mismatch on GET /auth/mfa/status (cosmetic) |
| INT-04 | LOW | 7 permission description strings differ between code and doc |

---

## Recommendations

1. **INT-01/INT-02**: Update integration-state.md AuthService dependency chain: add `PrismaService`, remove `CryptoService`.
2. **INT-04**: Sync permission descriptions in integration-state.md with `default-permissions.ts`.
