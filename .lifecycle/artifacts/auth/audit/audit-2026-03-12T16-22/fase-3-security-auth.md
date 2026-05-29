# Fase 3: SECURITY — Auth

**Date**: 2026-03-12 16:22 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS v4.0, NIST SP 800-63B, RFC 9700, RFC 8725, CWE-200/203/209/918/1321/1333

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 119   |
| FAIL    | 1     |
| WARN    | 3     |
| N/A     | 1     |

**Overall**: PASS (with 1 FAIL, 3 WARN)

---

## Sub-phase Summary

| Sub-phase | Scope | Checks | PASS | FAIL | WARN | N/A |
|-----------|-------|--------|------|------|------|-----|
| 3a. OWASP ASVS Ch 2 (Authentication) | 18 | 18 | 18 | 0 | 0 | 0 |
| 3b. OWASP ASVS Ch 3 (Session Management) | 10 | 10 | 10 | 0 | 0 | 0 |
| 3c. OWASP ASVS Ch 4 (Access Control) | 8 | 8 | 8 | 0 | 0 | 0 |
| 3d. OWASP ASVS Ch 5 (Input Validation) | 7 | 7 | 7 | 0 | 0 | 0 |
| 3e. OWASP ASVS Ch 6 (Cryptography) | 5 | 5 | 5 | 0 | 0 | 0 |
| 3f. NIST SP 800-63B | 9 | 9 | 9 | 0 | 0 | 0 |
| 3g. RFC 9700 (OAuth 2.0) | 8 | 8 | 8 | 0 | 0 | 0 |
| 3h. RFC 8725 (JWT) | 6 | 6 | 6 | 0 | 0 | 0 |
| 3i. HTTP Security & Rate Limiting | 12 | 12 | 12 | 0 | 0 | 0 |
| 3j. Error Disclosure (CWE-200/203/209) | 13 | 13 | 11 | 0 | 2 | 0 |
| 3k. Logging (OWASP Ch 7) | 7 | 7 | 7 | 0 | 0 | 0 |
| 3l. Data Protection (OWASP Ch 8) | 7 | 7 | 4 | 1 | 1 | 1 |
| 3m. API Security (OWASP Ch 13) | 5 | 5 | 5 | 0 | 0 | 0 |
| 3n. Node.js Attacks | 9 | 9 | 9 | 0 | 0 | 0 |
| **TOTAL** | **124** | **124** | **119** | **1** | **3** | **1** |

---

## FAIL Findings

### V8.2.1: Anti-caching on sensitive endpoints
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: No `Cache-Control: no-store` headers found on any auth endpoint (login, refresh, me, sessions)
- **Expected**: Sensitive auth endpoints should set `Cache-Control: no-store, no-cache, must-revalidate`
- **Actual**: No anti-caching headers on any endpoint. Note: SCRUM-176 (NoCacheInterceptor) was implemented but its PR has not been merged to main yet.
- **Standard**: OWASP ASVS V8.2.1

---

## WARN Findings

### EM-03: No security mechanism disclosure
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `src/auth/mfa.service.ts:99-101` reveals MFA API workflow. `src/auth/mfa.service.ts:194-196` reveals password existence. `src/security/turnstile.guard.ts:24,32` reveals CAPTCHA mechanism.
- **Actual**: Some error messages disclose internal mechanisms (MFA setup state, OAuth-only account state, Turnstile CAPTCHA)
- **Standard**: CWE-209

### EM-05: No entity existence disclosure on authenticated endpoints
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `src/auth/trusted-device.service.ts:147` and `src/auth/passkey.service.ts:378,417` throw NotFoundException. Services filter by userId, so 404 only fires for non-owned entities — acceptable risk.
- **Standard**: CWE-200

### V8.3.1: No sensitive data in query strings
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `src/auth/auth.controller.ts:298,320` accept verification tokens via @Query. `src/auth/guards/oauth-link.guard.ts:26-27` accepts JWT in query. These are standard practices for email verification links and OAuth redirects (browser redirects cannot carry Authorization headers).
- **Standard**: OWASP ASVS V8.3.1

---

## N/A Findings

### V8.3.7: Database TLS
- **Verdict**: N/A
- **Evidence**: Database URL from environment variable — TLS enforcement is an infrastructure/deployment concern, not verifiable from code.

---

## Key Security Strengths

1. **Zero CRITICAL findings** across all 124 checks
2. **Timing-safe authentication**: DUMMY_PASSWORD_HASH comparison on all public paths prevents user enumeration
3. **Comprehensive rate limiting**: All auth endpoints throttled with progressive lockout (15/30/60/120 min escalation)
4. **Full PKCE + State on OAuth**: Both Google and GitHub strategies use PKCE with S256 and cryptographic state
5. **JWT best practices**: HS256 explicit, iss/aud/jti/exp claims, 15-min access tokens, refresh rotation with theft detection
6. **Centralized error messages**: All errors via ErrorMessages constants, ValidationPipe strips field names, generic messages for auth failures
7. **No SQL injection surface**: Zero raw queries, all access via Prisma ORM
8. **No prototype pollution surface**: ValidationPipe whitelist strips unknown properties
9. **MFA enforcement**: Admins required to enable MFA, TOTP + WebAuthn + recovery codes
10. **Reauthentication**: All sensitive operations require current password

## Recommendations

1. **V8.2.1 (FAIL)**: Merge SCRUM-176 PR (NoCacheInterceptor) to main, or apply `Cache-Control: no-store` headers to auth controllers
2. **EM-03 (WARN)**: Replace MFA setup workflow message with generic error. Use generic CAPTCHA message instead of "CAPTCHA verification"
3. **EM-05 (WARN)**: Consider returning 403 instead of 404 for authenticated entity lookups, or accept current risk (ownership validation in place)
4. **V8.3.1 (WARN)**: Accept as standard practice for email verification and OAuth redirect flows. Document accepted risk.
