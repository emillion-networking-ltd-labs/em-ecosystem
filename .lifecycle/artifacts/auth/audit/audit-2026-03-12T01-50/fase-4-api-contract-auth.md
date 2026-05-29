# Fase 4: API CONTRACT — Auth

**Date**: 2026-03-12 02:20
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OpenAPI 3.0, REST constraints, SOC 2 CC8.1

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 7     |
| FAIL    | 1     |
| WARN    | 0     |
| N/A     | 0     |

**Overall**: FAIL (1 FAIL — 2 undocumented endpoints)

---

## Detailed Findings

### A-01: Spec paths extracted
- **Verdict**: PASS
- **Evidence**: 39 spec paths for auth module extracted from api-spec.yml

### A-02: Controller endpoints scanned
- **Verdict**: PASS
- **Evidence**: 41 controller endpoints: AuthController (28), MfaController (6), PasskeyController (7)

### A-03: Endpoint classification
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: 39 Aligned, 0 Spec-only, **2 Code-only**, 0 Mismatched
- **Code-only endpoints**:
  - `GET /auth/link/google` (`auth.controller.ts:622-654`) — OAuth account-link initiation
  - `GET /auth/link/github` (`auth.controller.ts:622-654`) — OAuth account-link initiation
- **Expected**: 0 Code-only endpoints
- **Actual**: 2 undocumented endpoints from Sprint 6 OAuth linking feature
- **Standard**: SOC 2 CC8.1

### A-04: DTO vs spec schemas
- **Verdict**: PASS
- **Evidence**: All 16 DTOs checked align with spec schemas. Extra `turnstileToken` fields are implementation-internal (consumed by guard, not contract-visible).

### A-05: Error responses
- **Verdict**: PASS (with observations)
- **Evidence**: 20 endpoints fully aligned. 14 endpoints have minor `@ApiResponse` decorator gaps (mostly missing 429). Runtime behavior is correct — throttle guards do return 429. LOW severity documentation gaps.

### A-06: Response schema validation
- **Verdict**: PASS (with observations)
- **Evidence**: 2 spec documentation discrepancies:
  1. `GET /auth/me` returns `permissions[]` not in spec SafeUser schema (additive, non-breaking)
  2. `POST /auth/oauth/exchange` spec erroneously lists `refreshToken` in body (code uses httpOnly cookie)

### A-07: HTTP method semantics
- **Verdict**: PASS
- **Evidence**: 0 `@All()` decorators. All methods map correctly to REST semantics. `GET /auth/verify-email` side-effect is industry-standard email verification pattern.

### A-08: Pagination consistency
- **Verdict**: PASS
- **Evidence**: All list endpoints (sessions, trusted-devices, passkeys) are user-scoped and bounded by design limits. No pagination needed.

---

## Recommendations

1. **A-03** (FAIL): Add `GET /auth/link/google` and `GET /auth/link/github` to api-spec.yml under OAuth Account Linking section.
2. **A-06**: Update SafeUser schema to include `permissions[]`. Remove `refreshToken` from oauth/exchange response schema.
3. **A-05**: Add missing `@ApiResponse(429)` decorators to 14 endpoints (systematic pass, low urgency).
