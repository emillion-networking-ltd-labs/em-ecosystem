# Implementation Plan: SCRUM-238 Validate OAuth, SMTP, and Redis Secrets in Production

> **Retroactive plan** — created post-implementation (2026-03-15). The `/plan` step was skipped during the original development session due to context exhaustion. This document reconstructs the plan from the enriched Jira ticket to maintain process integrity.

**Date**: 2026-03-15 (retroactive)
**Sprint**: 11 — Security II
**Scope**: backend
**Branch**: `feature/SCRUM-238`

---

## 1. Objective

Extend `validateProductionSecrets()` to reject known development OAuth and SMTP credentials in production. Currently JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET, callback URLs, JWT expiry, and DATABASE_URL sslmode are validated. OAuth client secrets, SMTP password, and Redis password are unchecked.

## 2. Context

- **Audit finding**: WARN V2.10.1 — Development fallback secrets for OAuth/SMTP/Redis not validated
- **Standards**: OWASP ASVS V2.10.1, NIST SP 800-63B
- **Risk**: App can start in production with `.env.example` placeholder values for OAuth secrets

## 3. Codebase State (Pre-Implementation)

| File | State |
|------|-------|
| `nexacore-api/src/common/utils/validate-production-secrets.ts` | 108 lines, validates 6 secrets (JWT_SECRET, MFA_ENCRYPTION_KEY, CSRF_SECRET, GOOGLE/GITHUB_CALLBACK_URL HTTPS, JWT_ACCESS_EXPIRATION, DATABASE_URL sslmode) |
| `nexacore-api/src/tests/validate-production-secrets.spec.ts` | 28 tests covering existing validations |
| `.env.example` placeholders | `GOOGLE_CLIENT_SECRET="your-google-client-secret"`, `GITHUB_CLIENT_SECRET="your-github-client-secret"`, `SMTP_PASSWORD=""`, `REDIS_PASSWORD=""` |

## 4. Implementation Steps

### Step 1: Create feature branch
- Branch from `main` as `feature/SCRUM-238`

### Step 2: Add GOOGLE_CLIENT_SECRET validation
- **File**: `validate-production-secrets.ts`
- **Location**: After JWT_ACCESS_EXPIRATION check (line ~93)
- **Logic**: Reject if missing, equals placeholder `'your-google-client-secret'`, or length < 20
- **Error**: `FATAL: GOOGLE_CLIENT_SECRET must be set to a real value of at least 20 characters in production`
- **Standard**: OWASP ASVS V2.10.1

### Step 3: Add GITHUB_CLIENT_SECRET validation
- **File**: `validate-production-secrets.ts`
- **Location**: After GOOGLE_CLIENT_SECRET check
- **Logic**: Reject if missing, equals placeholder `'your-github-client-secret'`, or length < 20
- **Error**: `FATAL: GITHUB_CLIENT_SECRET must be set to a real value of at least 20 characters in production`
- **Standard**: OWASP ASVS V2.10.1

### Step 4: Add SMTP_PASSWORD validation
- **File**: `validate-production-secrets.ts`
- **Location**: After GITHUB_CLIENT_SECRET check
- **Logic**: Reject if missing or empty (falsy)
- **Error**: `FATAL: SMTP_PASSWORD must be set in production (required for email verification)`
- **Rationale**: Email verification is required in production

### Step 5: Add REDIS_PASSWORD warning
- **File**: `validate-production-secrets.ts`
- **Location**: After SMTP_PASSWORD check
- **Logic**: `console.warn` if missing or empty — do NOT throw
- **Message**: `WARNING: REDIS_PASSWORD is empty in production — cloud Redis providers typically require authentication`
- **Rationale**: Local Redis may not require auth; blocking startup is too aggressive

### Step 6: Update VALID_SECRETS test fixture
- **File**: `validate-production-secrets.spec.ts`
- **Add to VALID_SECRETS**: `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`, `SMTP_PASSWORD`, `REDIS_PASSWORD` with valid values
- **Purpose**: Ensure all new validations pass in the "all valid" test case

### Step 7: Add GOOGLE_CLIENT_SECRET tests (3 tests)
- `should throw when GOOGLE_CLIENT_SECRET is missing`
- `should throw when GOOGLE_CLIENT_SECRET is the placeholder`
- `should throw when GOOGLE_CLIENT_SECRET is shorter than 20 chars`

### Step 8: Add GITHUB_CLIENT_SECRET tests (3 tests)
- `should throw when GITHUB_CLIENT_SECRET is missing`
- `should throw when GITHUB_CLIENT_SECRET is the placeholder`
- `should throw when GITHUB_CLIENT_SECRET is shorter than 20 chars`

### Step 9: Add SMTP_PASSWORD tests (2 tests)
- `should throw when SMTP_PASSWORD is missing`
- `should throw when SMTP_PASSWORD is empty`

### Step 10: Add REDIS_PASSWORD tests (2 tests)
- `should warn but not throw when REDIS_PASSWORD is empty` (spy on `console.warn`)
- `should not warn when REDIS_PASSWORD is set`

## 5. Files to Modify

| File | Action | Lines Added (est.) |
|------|--------|-------------------|
| `nexacore-api/src/common/utils/validate-production-secrets.ts` | MODIFY | ~37 |
| `nexacore-api/src/tests/validate-production-secrets.spec.ts` | MODIFY | ~100 |

## 6. Acceptance Criteria

- [ ] App refuses to start in production with `.env.example` placeholder OAuth secrets
- [ ] App refuses to start in production with empty SMTP_PASSWORD
- [ ] App warns (but starts) in production with empty REDIS_PASSWORD
- [ ] App still starts normally in development with any values
- [ ] All new validations have unit tests
- [ ] `nest build` clean
- [ ] All tests pass

## 7. Integration Impact

- **Module changes**: None — `validateProductionSecrets()` is a standalone bootstrap utility
- **Guard changes**: None
- **DI changes**: None
- **Schema changes**: None
- **integration-state.md**: Changelog entry only

## 8. Security Considerations

- Uses `process.env` directly (correct — runs before NestFactory.create, ConfigService unavailable)
- Placeholder values sourced from `.env.example` to ensure exact match
- Minimum length thresholds: 20 chars for OAuth secrets (shorter than JWT/MFA/CSRF 32-char requirement, but OAuth secrets are externally generated)
- REDIS_PASSWORD is warn-only to avoid blocking deployments with local Redis (no auth required)

## 9. Risk Assessment

- **Risk**: LOW — adds fail-fast validation, no behavioral changes to existing code
- **Rollback**: Remove the new checks; existing validations unaffected
