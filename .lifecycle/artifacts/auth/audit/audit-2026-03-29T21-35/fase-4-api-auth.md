# Phase 4: API CONTRACT — Auth Module Audit (2026-03-29)

## Summary: 37 PASS, 4 WARN, 1 FAIL (42 endpoint checks + 4 hygiene checks)

### FAIL (1)

| ID | Severity | Description |
|----|----------|-------------|
| **E-01** | Low | Tag `Trusted Devices` used in 4 path operations but NOT declared in top-level `tags:` section. Swagger UI renders without description. |

### WARN (4)

| ID | Severity | Description |
|----|----------|-------------|
| **B-10** | Low | `POST /auth/resend-verification-public` — spec missing `turnstileToken` field (code has it + TurnstileGuard). |
| **D-30** | Low | `POST /auth/mfa/setup` — spec says `bearerAuth` only, code uses `JwtOrMfaSetupGuard` (accepts setupToken too). |
| **D-31** | Low | `POST /auth/mfa/verify-setup` — same as D-30. |
| **D-32** | Low | Spec doesn't document `oauthAction: 'auto-verified'` in OAuth exchange response (new field from SCRUM-301). |

### All 42 routes verified
Every endpoint in api-spec.yml exists in controllers, and every controller endpoint has a spec entry. HTTP methods, request DTOs, response shapes, and auth guards match (with exceptions above).

**Summary**: 37 PASS, 4 WARN, 1 FAIL
