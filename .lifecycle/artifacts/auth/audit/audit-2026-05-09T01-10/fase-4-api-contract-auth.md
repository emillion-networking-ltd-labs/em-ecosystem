# Fase 4: API CONTRACT — auth

**Date**: 2026-05-09 01:10 UTC
**Module**: auth
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: OpenAPI Specification 3.0, REST architectural constraints, SOC 2 CC8.1
**Previous baseline**: audit-2026-05-06T22-44 (38 PASS / 4 WARN / 0 FAIL — 90.5%)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 6     |
| FAIL    | 0     |
| WARN    | 2     |
| N/A     | 0     |

**Overall**: PASS (no FAIL)

---

## Endpoint inventory

**Spec paths** (api-spec.yml, /auth/* + /mfa/* + /passkeys/*): **39 paths**

**Code routes** (extracted from controllers):

| Controller | Routes | File |
|------------|-------|------|
| AccountController | 7 | `src/auth/account.controller.ts` |
| AuthController | 8 | `src/auth/auth.controller.ts` |
| MfaController | 6 | `src/auth/mfa.controller.ts` |
| OAuthController | 9 | `src/auth/oauth.controller.ts` |
| PasskeyController | 7 | `src/auth/passkey.controller.ts` |
| SessionController | 6 | `src/auth/session.controller.ts` |
| **TOTAL** | **43** | |

Route count to spec path count: 43 controller methods vs 39 spec paths. Difference is paths with multiple HTTP verbs (e.g., `/auth/passkeys/{id}` has both PATCH + DELETE; `/auth/sessions/{id}` has DELETE; `/auth/trusted-devices/{id}` has DELETE; `/auth/trusted-devices` has POST + GET + DELETE) — when normalized by method, counts align.

---

## Detailed Findings

### A-01 / A-02: Spec & code inventory complete
- **Verdict**: PASS
- **Evidence**: 39 spec paths extracted from api-spec.yml; 43 controller methods extracted from `src/auth/**/*.controller.ts`.

### A-03: Endpoint classification (Aligned/Spec-only/Code-only)
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All 43 controller routes match a spec path + method combination. Zero Code-only endpoints. Zero Spec-only endpoints in scope (all listed paths exist in code).
- **Standard**: SOC 2 CC8.1

### A-04: DTO vs schema alignment
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Spot-checked DTOs vs spec schema:
  - `RegisterDto` (email + password + turnstileToken?) ↔ spec `/auth/register` request body — match
  - `LoginDto` (email + password + turnstileToken?) ↔ `/auth/login` — match
  - `ResetPasswordDto` (token + newPassword) ↔ `/auth/reset-password` — match
  - `MfaVerifyLoginDto`, `PasskeyRegisterVerifyDto` etc. — match by class-validator decorators

### A-05: Error responses documented
- **Verdict**: WARN
- **Severity**: MEDIUM
- **Evidence**: `@ApiResponse` decorators present on all controller methods (e.g., `auth.controller.ts:88-91, 107-111, 156-160`). Some methods document only success + 401/429; spec lists more nuanced 400/403/409. Examples:
  - MfaController setup: `@ApiResponse 200, 409` (spec lists 200, 401, 403, 409 — missing 401/403)
  - PasskeyController login/options: `@ApiResponse 200` (spec lists 200, 400, 429 — missing 400)
- **Note**: Minor doc gap, not a contract violation. Carry-forward.

### A-06: Response schema validation
- **Verdict**: WARN
- **Severity**: HIGH
- **Evidence**: Service return types align with spec. Spot-check: `LoginResponse { accessToken, user, status }` → spec matches; `MfaChallengeResponse { status:'mfa_required', mfaToken }` → spec matches. No undocumented fields leak. Some spec schemas use `oneOf` with discriminator that controller code returns correctly. Minor: `oauthAction` field is conditionally included (oauth.controller.ts:135-137) — spec documents it as optional.
- **Standard**: OpenAPI 3.0
- **Note**: Carry-forward; was WARN in previous audit.

### A-07: HTTP method semantics
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**:
  - GET endpoints (csrf-token, me, admin, sessions, trusted-devices, passkeys, mfa/status, OAuth init/callbacks, link/code) are read or initiation (csrf-token issues a token, OAuth init redirects — by REST convention this is acceptable for OAuth)
  - POST for state-changing (register, login, refresh, logout, logout-all, oauth/exchange, mfa/setup, etc.)
  - PATCH for partial update (passkey rename)
  - DELETE for removal (sessions/:id, trusted-devices, passkeys, mfa)
  - grep `@All(` in `src/` → 0 results

### A-08: Pagination consistency
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: Auth list endpoints (`/auth/sessions`, `/auth/trusted-devices`, `/auth/passkeys`) return small bounded sets (≤5 sessions, ≤10 trusted devices, ≤MAX_PASSKEYS_PER_USER passkeys per user) — pagination not required. Larger lists (e.g. /audit-logs, /users) handled by users module pagination conventions.

---

## Recommendations

1. **A-05 WARN** (carry-forward): Add missing `@ApiResponse` decorators on MFA + Passkey controllers to align Swagger docs with spec response codes.
2. **A-06 WARN** (carry-forward): Generate response schema types from controller return types (e.g., `nestjs-zod` or `nestia`) to lock the spec/code contract.
