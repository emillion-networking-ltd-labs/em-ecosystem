# Fase 3: SECURITY — Auth Module

**Date**: 2026-03-15 20:15 UTC
**Module**: auth
**Auditor**: Claude Opus 4.6 (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OWASP ASVS v4.0, NIST SP 800-63B, RFC 9700, RFC 8725, CWE-200/203/209/918/1321/1333

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 118   |
| FAIL    | 0     |
| WARN    | 6     |
| N/A     | 0     |

**Overall**: PASS

---

## Sub-phase Summary

| Sub-phase | Standard | Checks | PASS | FAIL | WARN |
|-----------|----------|--------|------|------|------|
| 3a | OWASP ASVS Ch.2 (Authentication) | 18 | 18 | 0 | 0 |
| 3b | OWASP ASVS Ch.3 (Session Mgmt) | 10 | 9 | 0 | 1 |
| 3c | OWASP ASVS Ch.4 (Access Control) | 8 | 8 | 0 | 0 |
| 3d | OWASP ASVS Ch.5 (Input Validation) | 7 | 7 | 0 | 0 |
| 3e | OWASP ASVS Ch.6 (Cryptography) | 5 | 4 | 0 | 1 |
| 3f | NIST SP 800-63B (Digital Identity) | 9 | 9 | 0 | 0 |
| 3g | RFC 9700 (OAuth 2.0 Security) | 8 | 8 | 0 | 0 |
| 3h | RFC 8725 (JWT Best Practices) | 6 | 6 | 0 | 0 |
| 3i | HTTP Security & Rate Limiting | 12 | 12 | 0 | 0 |
| 3j | Error Disclosure (CWE-200/203/209) | 13 | 10 | 0 | 3 |
| 3k | OWASP ASVS Ch.7 (Logging) | 7 | 6 | 0 | 1 |
| 3l | OWASP ASVS Ch.8 (Data Protection) | 7 | 7 | 0 | 0 |
| 3m | OWASP ASVS Ch.13 (API Security) | 5 | 5 | 0 | 0 |
| 3n | Node.js Attacks (CWE-1321/1333/918) | 9 | 9 | 0 | 0 |
| **Total** | | **124** | **118** | **0** | **6** |

---

## Detailed Findings — WARN Items Only

(All 118 PASS findings documented in sub-phase agent outputs)

### V3.5.1: Token not in URL (3b)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `mail.service.ts:16,71,205` — Email links contain tokens as query params (e.g., `/verify-email?token=abc`, `/reset-password?token=xyz`). Standard industry practice for email verification/reset. Mitigated by single-use tokens with 1h/24h expiry.
- **Standard**: OWASP ASVS V3.5.1

### V6.2.3: Modern TOTP algorithm (3e)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: `mfa.service.ts:70` — TOTP uses SHA-1 algorithm. This is standard per RFC 6238 and required for compatibility with most authenticator apps. SHA-256 would be stronger but has compatibility issues.
- **Standard**: OWASP ASVS V6.2.3, RFC 6238

### EM-03: No security mechanism disclosure (3j)
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `login.service.ts:299` — MFA setup message discloses admin role: `'MFA setup is required for administrator accounts'`. `error-messages.ts:21-22` — `PASSWORD_REQUIRED_NO_PASSWORD` reveals OAuth-only configuration on authenticated endpoints.
- **Standard**: CWE-200, CWE-209

### EM-08: No feature state disclosure (3j)
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `passkey.service.ts:69` — `'Maximum of N passkeys reached'` discloses exact passkey limit. `mfa.service.ts:208-209,245-246` — `PASSWORD_REQUIRED_NO_PASSWORD` reveals OAuth-only state.
- **Standard**: CWE-200

### EM-10: Consistent error messages per category (3j)
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: Two authentication failure messages: `'Invalid credentials'` (login) vs `'Authentication failed'` (JWT/OAuth/passkey). Several inline error strings not centralized in `error-messages.ts` (e.g., `email-verification.service.ts:180,193`, `passkey.service.ts:69,112,224`).
- **Standard**: CWE-209

### V7.1.2: No PII in logs (3k)
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `mail.service.ts` — Logs full email addresses at ~12 locations (e.g., line 31: `'Verification email sent to ${email}'`). Email is PII under GDPR/SOC 2. Should be pseudonymized (e.g., `j***@example.com`).
- **Standard**: OWASP ASVS V7.1.2, GDPR Art. 5

---

## Key Security Strengths

1. **Zero FAIL findings** across 124 security checks
2. **Constant-time anti-enumeration**: DUMMY_PASSWORD_HASH pattern on all public endpoints
3. **Full PKCE + state**: OAuth 2.0 with S256 code challenge, single-use state with 5-min TTL
4. **JWT hardened**: HS256 only, iss/aud/jti/exp claims, 15-min access tokens, refresh rotation with family theft detection
5. **Comprehensive rate limiting**: Per-endpoint @Throttle + progressive lockout (15/30/60/120 min)
6. **Production secret validation**: 12+ env vars validated at startup, app refuses to start with weak secrets
7. **No raw queries**: Zero `$queryRaw`/`$executeRaw` — Prisma typed queries only
8. **No prototype pollution vectors**: Zero Object.assign/spread from request, no lodash
9. **No SSRF**: Only 2 outbound calls, both to hardcoded trusted URLs

---

## Recommendations

1. **EM-03**: Change MFA setup message to generic `'Additional verification required'` — do not disclose admin role
2. **EM-08**: Replace passkey limit message with generic `'Cannot add more passkeys'`
3. **EM-10**: Consolidate all inline error strings into `error-messages.ts` constants
4. **V7.1.2**: Pseudonymize email in mail.service.ts logs (e.g., `j***@example.com`)
5. **V3.5.1**: No action needed — email tokens in URL is industry standard
6. **V6.2.3**: No action needed — SHA-1 TOTP is RFC 6238 standard
