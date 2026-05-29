# Phase 4: API CONTRACT — Auth Module

**Date**: 2026-03-16
**Module**: auth
**Standards**: OpenAPI 3.0, NestJS decorators, SOC 2 CC8.1
**Framework version**: audit-standards.mdc v6

## Summary

| Verdict | Count |
|---------|-------|
| PASS | 7 |
| FAIL | 0 |
| WARN | 1 |

## Recurrence Analysis (vs audit-2026-03-15T19-49)

| Finding | Previous | Current | Delta |
|---------|----------|---------|-------|
| A-03 | WARN | PASS | Fixed — DTOs now have @ApiProperty |
| A-05 | WARN | PASS | Fixed — same fix |
| A-07 | FAIL | PASS | **Fixed** — @HttpCode(HttpStatus.OK) at mfa.controller.ts:50 (SCRUM-243) |

## Detailed Findings

### A-01: Endpoint Inventory (PASS)
- **Evidence**: 42 auth endpoints extracted from `api-spec.yml:82-1298`
- **Severity**: HIGH | **Standard**: SOC 2 CC8.1

### A-02: Controller Endpoint Count (PASS)
- **Evidence**: 42 endpoints from 6 controllers: `auth.controller.ts` (8), `account.controller.ts` (7), `oauth.controller.ts` (8), `mfa.controller.ts` (6), `session.controller.ts` (6), `passkey.controller.ts` (7)
- **Severity**: HIGH | **Standard**: SOC 2 CC8.1

### A-03: Spec-Code Alignment (PASS)
- **Evidence**: 42/42 aligned. Zero Code-only, zero Spec-only, zero Mismatched
- **Severity**: HIGH | **Standard**: SOC 2 CC8.1

### A-04: Request Schema Documentation (WARN — LOW)
- **Evidence**: `turnstileToken` optional field in `RegisterDto` (register.dto.ts:27-30), `LoginDto` (login.dto.ts:16-19), `ForgotPasswordDto` (forgot-password.dto.ts:12-15) not documented in api-spec.yml
- **Recommendation**: Add turnstileToken to request schemas in api-spec.yml

### A-05: DTO @ApiProperty Decorators (PASS)
- **Evidence**: All DTOs now have `@ApiProperty` decorators including previously flagged `PasskeyLoginVerifyDto`, `PasskeyRegisterVerifyDto`, `TrustDeviceDto`
- **Severity**: MEDIUM | **Standard**: OpenAPI 3.0

### A-06: Response Shape Alignment (PASS)
- **Evidence**: Response shapes match spec. No sensitive field leaks
- **Severity**: HIGH | **Standard**: OWASP ASVS V8.3.4

### A-07: HTTP Status Code Alignment (PASS — MEDIUM)
- **Evidence**: `mfa.controller.ts:50` — `@HttpCode(HttpStatus.OK)` present on setup method. Fixed by SCRUM-243
- **Standard**: RFC 7231, OpenAPI 3.0
- **Previous**: FAIL

### A-08: Pagination Parameters (PASS)
- **Evidence**: No pagination needed (bounded datasets)
- **Severity**: LOW | **Standard**: REST best practices

## Recommendations

1. **A-07**: Add `@HttpCode(HttpStatus.OK)` to `POST /auth/mfa/setup` — tracked as SCRUM-243
2. **A-04**: Document `turnstileToken` field in api-spec.yml request schemas

---
*Generated: 2026-03-16 | Auditor: Claude (automated) | Standards: OpenAPI 3.0, SOC 2 CC8.1, RFC 7231*
