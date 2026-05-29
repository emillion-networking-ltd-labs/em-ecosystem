# Fase 4: API CONTRACT — Auth Module

**Date**: 2026-03-03 16:50
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OpenAPI 3.0 (api-spec.yml)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 4     |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 0     |

**Overall**: PASS

---

## Detailed Findings

### A-01: Read Spec Paths
- **Verdict**: PASS
- **Evidence**: api-spec.yml contains **39 auth operations** across 4 controllers:
  - AuthController: 26 operations
  - MfaController: 6 operations
  - PasskeyController: 7 operations

### A-02: Scan Controllers
- **Verdict**: PASS
- **Evidence**: Source code contains **39 route handlers** across 3 controller files:
  - `src/auth/auth.controller.ts`: 26 routes
  - `src/auth/mfa.controller.ts`: 6 routes
  - `src/auth/passkey.controller.ts`: 7 routes

### A-03: Endpoint Classification
- **Verdict**: PASS
- **Evidence**: **39 Aligned, 0 Spec-only, 0 Code-only, 0 Mismatched**

| # | Method | Path | Classification |
|---|--------|------|----------------|
| 1 | POST | /auth/register | ALIGNED |
| 2 | POST | /auth/login | ALIGNED |
| 3 | POST | /auth/refresh | ALIGNED |
| 4 | POST | /auth/logout | ALIGNED |
| 5 | GET | /auth/me | ALIGNED |
| 6 | GET | /auth/admin | ALIGNED |
| 7 | GET | /auth/google | ALIGNED |
| 8 | GET | /auth/google/callback | ALIGNED |
| 9 | GET | /auth/github | ALIGNED |
| 10 | GET | /auth/github/callback | ALIGNED |
| 11 | POST | /auth/oauth/exchange | ALIGNED |
| 12 | GET | /auth/csrf-token | ALIGNED |
| 13 | POST | /auth/logout-all | ALIGNED |
| 14 | GET | /auth/sessions | ALIGNED |
| 15 | DELETE | /auth/sessions/{id} | ALIGNED |
| 16 | POST | /auth/trusted-devices | ALIGNED |
| 17 | GET | /auth/trusted-devices | ALIGNED |
| 18 | DELETE | /auth/trusted-devices | ALIGNED |
| 19 | DELETE | /auth/trusted-devices/{id} | ALIGNED |
| 20 | GET | /auth/verify-email | ALIGNED |
| 21 | GET | /auth/verify-email-change | ALIGNED |
| 22 | POST | /auth/resend-verification | ALIGNED |
| 23 | POST | /auth/forgot-password | ALIGNED |
| 24 | POST | /auth/reset-password | ALIGNED |
| 25 | GET | /auth/validate-reset-token | ALIGNED |
| 26 | POST | /auth/resend-verification-public | ALIGNED |
| 27 | POST | /auth/mfa/setup | ALIGNED |
| 28 | POST | /auth/mfa/verify-setup | ALIGNED |
| 29 | POST | /auth/mfa/verify-login | ALIGNED |
| 30 | DELETE | /auth/mfa | ALIGNED |
| 31 | POST | /auth/mfa/recovery-codes | ALIGNED |
| 32 | GET | /auth/mfa/status | ALIGNED |
| 33 | POST | /auth/passkeys/register/options | ALIGNED |
| 34 | POST | /auth/passkeys/register/verify | ALIGNED |
| 35 | POST | /auth/passkeys/login/options | ALIGNED |
| 36 | POST | /auth/passkeys/login/verify | ALIGNED |
| 37 | GET | /auth/passkeys | ALIGNED |
| 38 | PATCH | /auth/passkeys/{id} | ALIGNED |
| 39 | DELETE | /auth/passkeys/{id} | ALIGNED |

**100% alignment — 39:39 spec-to-code match.**

### A-04: DTO / Schema Alignment
- **Verdict**: PASS
- **Evidence**: 5 key endpoints verified:
  | Endpoint | Fields | Types | Constraints | Verdict |
  |----------|--------|-------|-------------|---------|
  | POST /auth/register | Match | Match | maxLength:128 undocumented in spec (INFO) | Clean |
  | POST /auth/login | Match | Match | Full | Clean |
  | POST /auth/forgot-password | Match | Match | Full | Clean |
  | POST /auth/mfa/verify-login | Match | Match | code length/pattern undocumented (INFO) | Clean |
  | POST /auth/passkeys/register/verify | Match | Match | Full | Clean |
- No field name or type mismatches. 2 minor spec documentation gaps (constraints in code not reflected in spec).

### A-05: Error Response Alignment
- **Verdict**: WARN | **Severity**: LOW
- **Evidence**:
  | Endpoint | Spec Errors | Code Errors | Verdict |
  |----------|------------|-------------|---------|
  | POST /auth/login | 401, 403, 429 | 401, 403 (3 variants), 429 | WARN: 403 description underspecified |
  | POST /auth/register | 400, 409, 429 | 400, 409, 429 | PASS |
  | POST /auth/forgot-password | 200, 429 | 200, 429 | PASS |
- **Finding**: Login spec documents 403 only as "Account locked". Code also throws 403 for email-not-verified and impossible-travel-block. Spec description is under-specified.

---

## Recommendations

1. **A-05 (LOW)**: Update api-spec.yml login 403 description to enumerate all three causes: account locked, email not verified, impossible travel blocked.
2. **A-04 (INFO)**: Add `maxLength: 128` to register password schema and `length: 6, pattern: '^\d{6}$'` to mfa code schema in api-spec.yml.
