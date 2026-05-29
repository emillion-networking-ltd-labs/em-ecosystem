# Phase 4: API CONTRACT — Auth Module

| Field | Value |
|------|------|
| **Date (UTC)** | 2026-05-06 22:44 |
| **Module** | auth |
| **Standards** | OpenAPI Specification 3.0, REST architectural constraints, SOC 2 CC8.1 (Change Documentation), OWASP ASVS V8.3.4 |
| **Spec source** | `ai-specs/ai-specs/specs/api-spec.yml` |
| **Code source** | `nexacore-api/src/auth/*.controller.ts` + `src/auth/dto/*.ts` |
| **Endpoints in scope** | 42 (Auth 8 + OAuth 8 + Account 7 + Session 6 + MFA 6 + Passkey 7) |
| **Previous baseline** | 2026-03-29 — 37 PASS / 4 WARN / 1 FAIL |

---

## A-01 — Spec paths extracted

**Verdict: PASS** | Severity: — | Standard: —

**Evidence**: `api-spec.yml:88-1340` — 38 distinct path objects under the auth scope (`/auth/*`, `/auth/mfa/*`, `/auth/passkeys/*`). Several path objects expose multiple HTTP verbs (e.g., `/auth/trusted-devices` has POST + GET + DELETE; `/auth/trusted-devices/{id}` has DELETE; `/auth/sessions/{id}` has DELETE; `/auth/passkeys/{id}` has PATCH + DELETE; `/auth/mfa` has DELETE), totalling **42 documented operations** — a 1:1 match with the 42 controller routes counted at startup.

**Path index (38 paths / 42 ops)**:
- AuthController scope: `/auth/csrf-token`, `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/me`, `/auth/admin` (8)
- OAuthController scope: `/auth/google`, `/auth/google/callback`, `/auth/github`, `/auth/github/callback`, `/auth/oauth/exchange`, `/auth/link/code`, `/auth/link/google`, `/auth/link/github` (8)
- AccountController scope: `/auth/verify-email`, `/auth/verify-email-change`, `/auth/resend-verification`, `/auth/resend-verification-public`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/validate-reset-token` (7)
- SessionController scope: `/auth/sessions` (GET), `/auth/sessions/{id}` (DELETE), `/auth/trusted-devices` (POST/GET/DELETE), `/auth/trusted-devices/{id}` (DELETE) (6)
- MfaController scope: `/auth/mfa/setup`, `/auth/mfa/verify-setup`, `/auth/mfa/verify-login`, `/auth/mfa` (DELETE), `/auth/mfa/recovery-codes`, `/auth/mfa/status` (6)
- PasskeyController scope: `/auth/passkeys/register/options`, `/auth/passkeys/register/verify`, `/auth/passkeys/login/options`, `/auth/passkeys/login/verify`, `/auth/passkeys` (GET), `/auth/passkeys/{id}` (PATCH/DELETE) (7)

---

## A-02 — Controller routes extracted

**Verdict: PASS** | Severity: — | Standard: —

**Evidence (file:line)**:

| Controller | File:Line | Routes |
|-----------|-----------|--------|
| AuthController | `auth.controller.ts:49` `@Controller('auth')` | `:56 GET csrf-token`, `:75 POST register`, `:100 POST login`, `:149 POST refresh`, `:182 POST logout`, `:201 POST logout-all`, `:231 GET me`, `:249 GET admin` (8) |
| OAuthController | `oauth.controller.ts:43` `@Controller('auth')` | `:51 GET google`, `:68 GET google/callback`, `:98 GET github`, `:115 GET github/callback`, `:145 POST oauth/exchange`, `:185 POST link/code`, `:206 GET link/google`, `:230 GET link/github` (8) |
| AccountController | `account.controller.ts:35` `@Controller('auth')` | `:41 POST verify-email`, `:57 POST verify-email-change`, `:73 POST resend-verification`, `:89 POST resend-verification-public`, `:117 POST forgot-password`, `:138 POST reset-password`, `:162 POST validate-reset-token` (7) |
| SessionController | `session.controller.ts:40` `@Controller('auth')` | `:61 GET sessions`, `:75 DELETE sessions/:id`, `:104 POST trusted-devices`, `:141 GET trusted-devices`, `:151 DELETE trusted-devices`, `:177 DELETE trusted-devices/:id` (6) |
| MfaController | `mfa.controller.ts:42` `@Controller('auth/mfa')` | `:50 POST setup`, `:67 POST verify-setup`, `:89 POST verify-login`, `:130 DELETE`, `:153 POST recovery-codes`, `:176 GET status` (6) |
| PasskeyController | `passkey.controller.ts:42` `@Controller('auth/passkeys')` | `:49 POST register/options`, `:72 POST register/verify`, `:98 POST login/options`, `:112 POST login/verify`, `:146 GET`, `:155 PATCH :id`, `:169 DELETE :id` (7) |

**Total: 42 routes** — matches A-01 spec count.

---

## A-03 — Endpoint classification (Aligned / Spec-only / Code-only / Mismatched)

**Verdict: PASS** | Severity: HIGH | Standard: SOC 2 CC8.1

**Result**:
- Aligned: **42 / 42**
- Spec-only: 0
- Code-only: **0** (target: 0)
- Mismatched: **0** (target: 0)

**Path normalization applied**: NestJS `:id` equated with OpenAPI `{id}`. `MfaController` controller-prefix `auth/mfa` joins with route `setup` → `/auth/mfa/setup`, etc. `PasskeyController` controller-prefix `auth/passkeys` joins with route `register/options` → `/auth/passkeys/register/options`. The empty-path `@Delete()` in `mfa.controller.ts:130` resolves to `/auth/mfa` (spec line 1000); the empty-path `@Get()` in `passkey.controller.ts:146` resolves to `/auth/passkeys` (spec line 1238).

**Sampling (illustrative, not exhaustive)**:
| Method | Path (normalised) | Spec | Code | Status |
|---|---|---|---|---|
| POST | /auth/register | yml:88 | auth.controller.ts:75 | Aligned |
| POST | /auth/login | yml:124 | auth.controller.ts:100 | Aligned |
| POST | /auth/refresh | yml:185 | auth.controller.ts:149 | Aligned |
| GET | /auth/me | yml:226 | auth.controller.ts:231 | Aligned |
| GET | /auth/csrf-token | yml:421 | auth.controller.ts:56 | Aligned |
| POST | /auth/logout-all | yml:439 | auth.controller.ts:201 | Aligned |
| GET | /auth/google/callback | yml:283 | oauth.controller.ts:68 | Aligned |
| POST | /auth/oauth/exchange | yml:393 | oauth.controller.ts:145 | Aligned |
| POST | /auth/link/code | yml:310 | oauth.controller.ts:185 | Aligned |
| POST | /auth/verify-email-change | yml:707 | account.controller.ts:57 | Aligned |
| POST | /auth/resend-verification-public | yml:847 | account.controller.ts:89 | Aligned |
| POST | /auth/validate-reset-token | yml:820 | account.controller.ts:162 | Aligned |
| GET | /auth/sessions | yml:454 | session.controller.ts:61 | Aligned |
| DELETE | /auth/sessions/{id} | yml:489 | session.controller.ts:75 | Aligned |
| POST | /auth/trusted-devices | yml:515 | session.controller.ts:104 | Aligned |
| GET | /auth/trusted-devices | yml:563 | session.controller.ts:141 | Aligned |
| DELETE | /auth/trusted-devices | yml:597 | session.controller.ts:151 | Aligned |
| DELETE | /auth/trusted-devices/{id} | yml:634 | session.controller.ts:177 | Aligned |
| POST | /auth/mfa/setup | yml:882 | mfa.controller.ts:50 | Aligned |
| POST | /auth/mfa/verify-setup | yml:920 | mfa.controller.ts:67 | Aligned |
| POST | /auth/mfa/verify-login | yml:955 | mfa.controller.ts:89 | Aligned |
| DELETE | /auth/mfa | yml:1000 | mfa.controller.ts:130 | Aligned |
| POST | /auth/mfa/recovery-codes | yml:1036 | mfa.controller.ts:153 | Aligned |
| GET | /auth/mfa/status | yml:1073 | mfa.controller.ts:176 | Aligned |
| POST | /auth/passkeys/register/options | yml:1095 | passkey.controller.ts:49 | Aligned |
| POST | /auth/passkeys/register/verify | yml:1130 | passkey.controller.ts:72 | Aligned |
| POST | /auth/passkeys/login/options | yml:1172 | passkey.controller.ts:98 | Aligned |
| POST | /auth/passkeys/login/verify | yml:1205 | passkey.controller.ts:112 | Aligned |
| GET | /auth/passkeys | yml:1238 | passkey.controller.ts:146 | Aligned |
| PATCH | /auth/passkeys/{id} | yml:1279 | passkey.controller.ts:155 | Aligned |
| DELETE | /auth/passkeys/{id} | yml:1320 | passkey.controller.ts:169 | Aligned |

(Remaining 11 routes follow the same pattern — verified in full traversal of the path lists in A-01 / A-02.)

---

## A-04 — DTO vs spec requestBody (5 representative endpoints)

**Verdict: PASS** | Severity: HIGH | Standard: OpenAPI 3.0

| # | Endpoint | DTO file | DTO fields & validators | Spec schema | Match? |
|---|---|---|---|---|---|
| 1 | POST /auth/login | `login.dto.ts:4-20` | `email: @IsEmail`, `password: @IsString`, `turnstileToken?: @IsOptional @IsString` | `LoginDto` (yml ref) — email + password + optional turnstileToken | OK |
| 2 | POST /auth/register | `register.dto.ts:10-31` | `email: @IsEmail`, `password: @IsString @MinLength(8) @MaxLength(128)`, `turnstileToken?: @IsOptional @IsString` | `RegisterDto` (yml ref) — same shape, same constraints | OK |
| 3 | POST /auth/mfa/verify-setup | `mfa-verify-setup.dto.ts:4-13` | `token: @IsString @Length(6,6) @Matches(/^\d{6}$/)` | yml:933-938 — `token: string` (required, 6-digit TOTP) | OK |
| 4 | POST /auth/passkeys/register/verify | `passkey-register-verify.dto.ts:4-17` | `credential: @IsObject (Record<string, unknown>)`, `name?: @IsOptional @IsString @MaxLength(64)` | yml:1141-1151 — `credential: object` (required), `name: string maxLength 64` (optional) | OK |
| 5 | POST /auth/reset-password | `reset-password.dto.ts:4-21` | `token: @IsString @IsNotEmpty`, `newPassword: @IsString @MinLength(8) @MaxLength(128)` | yml:784-820 — `token: string` (required), `newPassword: string` (required, 8-128 implied via prose) | OK |

All sampled DTOs use `@IsOptional` exclusively for fields explicitly marked optional in the spec, and `MinLength/MaxLength` constraints match the spec's prose constraints (8 / 128 / 16 / 512 / 64). `@Matches(/^\d{6}$/)` on `MfaVerifySetupDto.token` is a stricter superset of the spec's "6-digit TOTP code" prose — acceptable hardening.

---

## A-05 — Error responses documented vs thrown exceptions (5 sampled endpoints)

**Verdict: PASS** | Severity: MEDIUM | Standard: OpenAPI 3.0

| # | Endpoint | Spec error codes | Code-side `@ApiResponse` / thrown | Match? |
|---|---|---|---|---|
| 1 | POST /auth/login | 401 / 403 / 429 (yml:158-183) | controller `@ApiResponse(401, 403, 429)` (auth.controller.ts:111-113) | OK |
| 2 | POST /auth/refresh | 401 / 429 (yml:200-211) | `@ApiResponse(401, 429)` + thrown `UnauthorizedException` (auth.controller.ts:158-170) | OK |
| 3 | POST /auth/mfa/verify-setup | 400 / 429 (yml:946-953) | `@ApiResponse(400)` (mfa.controller.ts:79); 429 from `@Throttle` decorator — globally documented in spec | OK |
| 4 | POST /auth/passkeys/register/verify | 400 / 401 / 429 (yml:1165-1170) | `@ApiResponse(400, 401)` + 429 via `@Throttle` (passkey.controller.ts) | OK |
| 5 | DELETE /auth/mfa | 400 / 401 / 429 (yml:1025-1034) | `@ApiResponse(400, 401)` + 429 via `@Throttle` (mfa.controller.ts:141-143) | OK |

Notes:
- 429 (Too Many Requests) is consistently emitted by `@nestjs/throttler` globally — the spec documents it on every rate-limited endpoint and the controller emits the corresponding header (`Retry-After`).
- Login 429 limit per spec is "10 per 60s" (yml:179); rate-limit constant resolved from `AUTH_RATE_LIMITS.login` (auth.controller.ts:104-105) — values not cross-checked here (left for Phase 3 SECURITY).

---

## A-06 — Response shape integrity (no undocumented fields)

**Verdict: WARN** | Severity: HIGH | Standard: OpenAPI 3.0, V8.3.4

Three response-shape divergences detected. None leak sensitive data (no PII, no secrets, no internal IDs other than already-documented UUIDs/timestamps), so the severity is reduced from FAIL to WARN per the WARN policy in audit-standards Section 3 (incomplete documentation, not contract violation).

### W-A06-1 — `/auth/sessions` (GET) returns 4 undocumented fields

**Expected (yml:466-487)**: `id`, `deviceInfo`, `ipAddress`, `userAgent`, `createdAt`, `lastUsedAt` (6 fields)
**Actual (`sessions/entities/session.entity.ts:20-31` `SessionResponse`)**: `id`, `deviceInfo`, `ipAddress`, `userAgent`, `locationCity`, `locationCountry`, `createdAt`, `lastUsedAt`, `expiresAt`, `isCurrent` (10 fields)
**Undocumented**: `locationCity`, `locationCountry`, `expiresAt`, `isCurrent`
**Evidence**: `nexacore-api/src/sessions/entities/session.entity.ts:36-49` `toSessionResponse()`
**Impact**: All four fields are intentional UX (session-list page renders city/country and "current session" badge per dashboard design system). Spec is stale relative to code.

### W-A06-2 — `/auth/trusted-devices` (POST) returns undocumented `alreadyTrusted`

**Expected (yml:546-556)**: `id`, `deviceName`, `expiresAt`
**Actual (`session.controller.ts:133-138`)**: `id`, `deviceName`, `expiresAt`, `alreadyTrusted`
**Evidence**: `trusted-device.service.ts:117-122` returns `{ id, deviceName, expiresAt, alreadyTrusted: false }` from `trustDevice()` (controller wraps via `trustDeviceWithReauth` — same shape).
**Impact**: Boolean flag — non-sensitive. Used by frontend to show "Already trusted" toast vs "Device trusted" toast.

### W-A06-3 — `/auth/mfa/status` (GET) returns undocumented `recoveryCodesRemaining`

**Expected (yml:1080-1089)**: `mfaEnabled`
**Actual (`mfa.service.ts:265-279` `getMfaStatus()`)**: `mfaEnabled`, `recoveryCodesRemaining`
**Evidence**: `mfa.service.ts:275-278`
**Impact**: Numeric count of remaining recovery codes — non-sensitive (zero codes remaining is arguably *more* security-revealing than the actual count, but still benign). Used by Settings → Security UI.

### Aligned response shapes (sampled, no findings)

- POST /auth/register → `{ message }` ✅ (auth.controller.ts:97 ↔ yml:106-110)
- POST /auth/login (success) → `{ status, accessToken, user }` ✅ (auth.controller.ts:142-146 ↔ yml:154-157 oneOf AuthResponse)
- POST /auth/refresh → `{ accessToken }` ✅ (auth.controller.ts:179 ↔ yml:194-199 TokenResponse)
- POST /auth/oauth/exchange → `{ accessToken, user, oauthAction? }` ✅ (oauth.controller.ts:175-180 ↔ yml:402-413)
- POST /auth/mfa/verify-setup → `{ message }` ✅ (mfa.controller.ts:86 ↔ yml:944-945 MessageResponse)
- POST /auth/mfa/verify-login → `{ accessToken, user }` ✅ (mfa.controller.ts:127 ↔ yml:989-990 AuthResponse)
- POST /auth/mfa/recovery-codes → `{ recoveryCodes }` ✅ (mfa.controller.ts:173 ↔ yml:1059-1065)
- POST /auth/forgot-password → `{ message }` ✅
- POST /auth/reset-password → `{ message }` ✅
- POST /auth/validate-reset-token → `{ valid }` ✅ (yml:843-845 ↔ auth.service.ts:181)
- GET /auth/passkeys → `[{ id, name, deviceType, backedUp, transports, lastUsedAt, createdAt }]` ✅ (passkey.service.ts:277-285 ↔ yml:1252-1275)
- GET /auth/trusted-devices → `[{ id, deviceName, ipAddress, lastVerifiedAt, expiresAt, createdAt }]` ✅ (trusted-device.service.ts:156-163 ↔ yml:577-594)

---

## A-07 — HTTP method semantics

**Verdict: PASS** | Severity: MEDIUM | Standard: REST architectural constraints

- `@All()` decorator usage in `src/auth/`: **0** (Grep confirmed no occurrences)
- `@Get` endpoints (csrf-token, me, admin, google, google/callback, github, github/callback, link/google, link/github, sessions, trusted-devices, status, passkeys): all read-only — no DB writes triggered from controller body. Notable: `csrf-token` issues a cookie (state change client-side) but does not mutate DB; `google/callback` and `github/callback` perform identity creation/linking, but this is the standard OAuth 2.0 redirect semantic (not a REST GET — the side effect is encoded in the OAuth specification, not the contract). Acceptable per RFC 6749.
- `@Patch(':id')` (passkey rename): updates a single field idempotently — appropriate.
- `@Delete` endpoints (sessions/:id, trusted-devices, trusted-devices/:id, mfa, passkeys/:id): all idempotent per service-layer semantics (re-deleting a revoked session is a no-op via `findFirst` + revoked-flag check; re-deleting a non-existent passkey returns 404 — idempotent under "deleted == not-found" convention).
- HTTP status overrides (`@HttpCode`) are consistent with the spec: `OK (200)` on POST endpoints that semantically aren't creating new top-level resources (login, logout, refresh, verify-*, forgot-password, reset-password, validate-reset-token, mfa/setup, mfa/verify-setup, mfa/verify-login, mfa-disable via DELETE, mfa/recovery-codes, oauth/exchange) and `CREATED (201)` on resource creation (link/code, trusted-devices). All match the spec's response-key (`'200'` vs `'201'`).

---

## A-08 — Pagination consistency on list endpoints

**Verdict: WARN** | Severity: LOW | Standard: API design best practice

### W-A08-1 — No pagination on any auth-module list endpoint

**Evidence**: All four list endpoints return unbounded arrays:
- GET /auth/sessions (`session.controller.ts:67-73` → `sessions.service.ts:206-227 getActiveSessions`) — no `take/skip`, no `page/limit` query params.
- GET /auth/trusted-devices (`session.controller.ts:147-149` → `trusted-device.service.ts:148-167 listTrustedDevices`) — no `take/skip`.
- GET /auth/passkeys (`passkey.controller.ts:146-153` → `passkey.service.ts:277 listPasskeys`) — no `take/skip`.
- GET /auth/mfa/recovery-codes — N/A (returned in-line by recovery-codes endpoint, not paginated).

**Justification (acceptable)**: Each list is bounded by domain invariants:
- Sessions: max 5 per user (oldest evicted on 6th login) — yml:127.
- Passkeys: max 10 per user — yml:1099.
- Trusted devices: practically capped (per-user, expires after 30d) — no hard limit, but small in practice.

**Recommendation**: Document the implicit upper bound in the spec response schema (`maxItems: 5` for sessions, `maxItems: 10` for passkeys). Adding pagination is unnecessary at current cardinality but spec should make the cap explicit. This is an LOW-severity documentation gap, not a contract violation — same finding as 2026-03-29 baseline (W-A08-1).

---

## Previous-baseline FAIL verification (2026-03-29 → 2026-05-06)

**Baseline 2026-03-29 FAIL — E-01: `Trusted Devices` tag missing from spec top-level `tags:` block.**
**Status now: RESOLVED.**

**Evidence**: `api-spec.yml:69-70`
```yaml
- name: Trusted Devices
  description: MFA-trusted device management
```
The tag is now declared at the top-level alongside the 16 other tags, and is correctly referenced by all 4 trusted-device path operations (yml:521, 566, 602, 640). FAIL closed.

---

## Summary

| Check | Verdict | Severity | Δ vs 2026-03-29 |
|---|---|---|---|
| A-01 Spec parsed | PASS | — | unchanged |
| A-02 Routes scanned | PASS | — | unchanged |
| A-03 Endpoint classification | PASS (42/42 Aligned) | HIGH | unchanged |
| A-04 DTO vs schema (5) | PASS | HIGH | unchanged |
| A-05 Error responses (5) | PASS | MEDIUM | unchanged |
| A-06 Response shape integrity | **WARN** (3 undocumented fields across 3 endpoints) | HIGH | unchanged (recurrent — same 3 findings persist) |
| A-07 HTTP method semantics | PASS | MEDIUM | unchanged |
| A-08 Pagination consistency | **WARN** (no pagination, no documented `maxItems`) | LOW | unchanged |
| **E-01 (legacy)** Trusted Devices tag | **PASS** (was FAIL) | — | **RESOLVED ✅** |

### Counts (per audit-standards Phase 4 reporting convention)

The 8 checks (A-01..A-08) decompose to **42 row-level outcomes** when each endpoint is scored independently for A-03/A-06 (42 endpoints × 1 row each in the classification + response-shape passes), plus the per-check structural rows. Aligning with the 2026-03-29 baseline reporting (which counted 42 PASS = 1 per endpoint plus 4 WARN = 4 issues plus 1 FAIL):

| Bucket | 2026-05-06 | 2026-03-29 | Δ |
|---|---|---|---|
| **PASS** | 38 | 37 | **+1** (E-01 promoted to PASS) |
| **WARN** | 4 | 4 | **0** (same 3 A-06 + 1 A-08 findings persist) |
| **FAIL** | **0** | 1 | **−1** (E-01 fixed) |

### FAIL findings: NONE (0)
**Phase 4 0-FAIL milestone maintained for the auth module.**

### WARN findings (4)

| ID | Check | Severity | Description |
|----|-------|---------|-------------|
| W-A06-1 | A-06 | HIGH→WARN (incomplete-doc, not leak) | GET /auth/sessions returns 4 undocumented fields (`locationCity`, `locationCountry`, `expiresAt`, `isCurrent`) |
| W-A06-2 | A-06 | HIGH→WARN | POST /auth/trusted-devices returns undocumented `alreadyTrusted` boolean |
| W-A06-3 | A-06 | HIGH→WARN | GET /auth/mfa/status returns undocumented `recoveryCodesRemaining` integer |
| W-A08-1 | A-08 | LOW | No pagination + no `maxItems` documentation on `/auth/sessions`, `/auth/trusted-devices`, `/auth/passkeys` |

---

## Recommendations

1. **Fix W-A06-1, W-A06-2, W-A06-3 in `api-spec.yml`** — additive doc-only edit; bring spec response schemas into alignment with code. Estimated effort: ≤ 30 minutes. No code change required. Once committed, all four warnings drop to PASS.
2. **W-A08-1**: Annotate list endpoints with `maxItems: 5` (sessions), `maxItems: 10` (passkeys). For `/auth/trusted-devices`, add a `description` note: "No hard server-side limit; typical list is < 10 entries (TTL 30d, manual revoke, fingerprint dedupe)." LOW priority, can be deferred to next docs sweep.
3. **No A-03 / A-07 actions required** — 42/42 endpoints aligned, 0 `@All()`, idempotency intact.
4. **A-01 / A-02 parity check** — keep automated. The 1:1 spec-vs-startup-route count check is the cheapest regression detector for this phase; integrate into CI via `/check-api-contract` (already available as a slash command).

---

**Auditor**: Claude (Opus 4.7, audit Phase 4 sub-runner)
**Output written to**: `ai-specs/ai-specs/changes/auth/audit/audit-2026-05-06T22-44/fase-4-api-contract-auth.md`
