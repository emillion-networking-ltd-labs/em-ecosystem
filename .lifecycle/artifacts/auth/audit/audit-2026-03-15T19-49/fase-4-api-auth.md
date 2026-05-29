# Fase 4: API CONTRACT — Auth Module

**Date**: 2026-03-15 21:20 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OpenAPI 3.0, SOC 2 CC8.1 (API Documentation)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 4     |
| FAIL    | 1     |
| WARN    | 3     |
| N/A     | 0     |

**Overall**: FAIL

---

## Detailed Findings

### A-01: Read spec paths
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `api-spec.yml:80-1296` — 42 auth endpoints extracted across 7 tag groups (Authentication, OAuth, Sessions, MFA, Passkeys, Email Verification, Trusted Devices).

### A-02: Read controller endpoints
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 42 endpoints extracted from 6 controllers: `auth.controller.ts` (8), `account.controller.ts` (7), `oauth.controller.ts` (8), `mfa.controller.ts` (6), `session.controller.ts` (6), `passkey.controller.ts` (7). Exact match with spec count.

### A-03: Cross-reference spec vs code
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 42/42 spec endpoints implemented, 42/42 controller endpoints documented. Zero undocumented or unimplemented endpoints. Minor cosmetic issue: all 6 controllers use `@ApiTags('auth')` instead of spec's 7 semantic tag groups — collapses Swagger UI into single group.

### A-04: DTO alignment
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 5 key endpoints checked — all core DTO fields match spec schemas. Two minor gaps: (1) `turnstileToken` optional field in `RegisterDto` (`register.dto.ts:27-30`) and `LoginDto` (`login.dto.ts:16-19`) not documented in spec schemas (`api-spec.yml:2903-2933`). (2) `PasskeyLoginVerifyDto`, `PasskeyRegisterVerifyDto`, `TrustDeviceDto` lack `@ApiProperty` decorators.

### A-05: Swagger documentation coverage
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 100% of endpoints have `@ApiOperation` + `@ApiResponse` decorators. Gaps in schema introspection: 3 DTOs (`passkey-login-verify.dto.ts`, `passkey-register-verify.dto.ts`, `trust-device.dto.ts`) missing `@ApiProperty` decorators — Swagger won't introspect request body schemas for those endpoints.

### A-06: HTTP methods match
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 42/42 endpoints — all controller HTTP method decorators match spec methods exactly.

### A-07: Response codes match
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: `mfa.controller.ts:49` — `POST /auth/mfa/setup` has no `@HttpCode` decorator. NestJS defaults POST to 201, but spec (`api-spec.yml:842`) and `@ApiResponse({ status: 200 })` both document 200. Runtime returns 201 — confirmed mismatch. All other 41 endpoints match. Additional note: `passkey.controller.ts:48` — `POST /auth/passkeys/register/options` returns 201 by NestJS default coincidentally matching spec, but lacks explicit `@HttpCode(HttpStatus.CREATED)`.

### A-08: Route params match
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 4/4 parameterized endpoints match: `DELETE /auth/sessions/:id`, `DELETE /auth/trusted-devices/:id`, `PATCH /auth/passkeys/:id`, `DELETE /auth/passkeys/:id`. All use `ParseUUIDPipe` — consistent with spec `format: uuid`.

---

## Recommendations

1. **A-07 (FAIL)**: Add `@HttpCode(HttpStatus.OK)` to `POST /auth/mfa/setup` in `mfa.controller.ts:49` — one-line fix, matches all other POST handlers in same file.
2. **A-07 (WARN)**: Add explicit `@HttpCode(HttpStatus.CREATED)` to `POST /auth/passkeys/register/options` in `passkey.controller.ts:48` to prevent accidental breakage.
3. **A-04 (WARN)**: Document `turnstileToken` optional field in spec `RegisterDto` and `LoginDto` schemas.
4. **A-05 (WARN)**: Add `@ApiProperty` decorators to `PasskeyLoginVerifyDto`, `PasskeyRegisterVerifyDto`, `TrustDeviceDto`.
5. **A-03 (WARN)**: Align `@ApiTags` per controller with spec's semantic tag groups for better Swagger UI organization.
