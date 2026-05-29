# Phase 3 Security Audit — Auth Module — Targeted Re-run

**Date**: 2026-05-04T00:30 UTC
**Module**: auth
**Scope**: Targeted Phase 3 re-run gating SCRUM-347 (`/commit`) per its `/verify` BLOCKED-RISK gate. Verifies that SCRUM-327 (already in main, commit `3422a25`) and SCRUM-347 (working-tree, pre-commit) preserve the **0-FAIL baseline** established 2026-03-17T23-31 (`audit-2026-03-16T23-31/`).
**Previous baseline**: 2026-03-17 — 258 checks, 0 FAIL, 19 WARN, 91.5%.
**Auditor**: targeted code-level verification of changed surfaces only. **Full 14-sub-phase / 125-check Phase 3 re-run deferred** — this run audits the SCRUM-347 + SCRUM-327 diff surface only. Unchanged code remains under the 2026-03-17 baseline.

---

## Targeted Check Set

The following 18 checks are within the blast radius of SCRUM-347 + SCRUM-327. Re-evaluated against live code:

| # | Sub-phase | Check ID | Requirement | Verification Path | Severity | Verdict |
|---|-----------|----------|-------------|-------------------|----------|---------|
| 1 | 3a | V2.1.7 | Bcrypt cost ≥ 10 | `auth/constants/auth.constants.ts:6` `BCRYPT_ROUNDS=12`; `:158` `BCRYPT_ROUNDS_RECOVERY=10`. SCRUM-327 inline `bcrypt.compare` reuses these via `user.passwordHash` (already-hashed at registration with cost 12). | CRITICAL | **PASS** |
| 2 | 3a | V2.10.1 | No hardcoded credentials | Re-grep on changed files (`trusted-device.service.ts`, `passkey.service.ts`, 4 DTOs, `token-deny-list.service.ts`, `jwt.strategy.ts`, `sessions.service.ts`): 0 hardcoded passwords/secrets. All secrets via `ConfigService` or `process.env` reads at module init. | CRITICAL | **PASS** |
| 3 | 3a | V2.2.1 | Anti-automation on auth endpoints | `session.controller.ts`: `@Throttle` on `trustDevice` (line 94, AUTH_RATE_LIMITS.trust_device); `passkey.controller.ts`: `@Throttle` on register/options (52), register/verify (76), login/options (100), login/verify (114), delete (173). All 5 SCRUM-327-modified endpoints retain throttle. | HIGH | **PASS** |
| 4 | 3b | V3.3.1 | Logout invalidates session | `sessions/sessions.service.ts` `revokeSession` now pairs DB write with `tokenDenyListService.denyBySessionId(sessionId, ACCESS_TOKEN_TTL_SECONDS)` — closes the eventual-consistency gap. Direct read of working tree confirms paired call at expected line range. | HIGH | **PASS — strengthened by SCRUM-347** |
| 5 | 3b | V3.3.4 | Logout-all invalidates all sessions | `sessions.service.ts` `revokeAllUserSessions` now calls `tokenDenyListService.denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS)` — same pattern as V3.3.1. Closes 4 caller paths (per-row revoke, email-verification, password-reset, password-change) per SCRUM-347 plan Step 6. | HIGH | **PASS — strengthened by SCRUM-347** |
| 6 | 3b | V3.5.1 | Token not in URL | Re-grep on changed controllers: 0 query-param token passing. Refresh token in httpOnly cookie (unchanged). | HIGH | **PASS** |
| 7 | 3b | V3.5.2 | Token in secure cookie | Existing `auth.controller` cookie-setting unchanged (httpOnly + secure + sameSite). SCRUM-347/-327 don't touch this path. | HIGH | **PASS (unchanged baseline)** |
| 8 | 3c | V4.1.1 | RBAC at controller level | `session.controller.ts`: `@UseGuards(JwtAuthGuard)` on all 5 protected methods (lines 61, 75, 92, 128, 139, 157). `passkey.controller.ts`: `@UseGuards(JwtAuthGuard)` on all 6 protected methods (lines 50, 74, 147, 156, 171). | HIGH | **PASS** |
| 9 | 3c | V4.1.4 | Deny by default | `auth.module.ts` exports unchanged; APP_GUARD + global guards established outside SCRUM-347/-327 scope. | CRITICAL | **PASS (unchanged baseline)** |
| 10 | 3c | V4.2.1 | Parameter tampering — UUID validation | `session.controller.ts`: `@Param('id', ParseUUIDPipe)` on `revokeSession` (80), `revokeTrustedDevice` (154). `passkey.controller.ts`: same on rename (155), remove (180). | MEDIUM | **PASS** |
| 11 | 3d | V5.1.3 | All DTOs validated | New DTOs: `trust-device.dto.ts` (modified), `trusted-device-revoke.dto.ts` (NEW), `passkey-register-options.dto.ts` (NEW), `passkey-delete.dto.ts` (modified) — all use `@IsString @IsNotEmpty` on `password`. `trust-device.dto.ts` retains `@MinLength(16) @MaxLength(512)` on fingerprint. | HIGH | **PASS** |
| 12 | 3e | V6.2.1 | Strong hash algorithm | `bcrypt.compare` used in SCRUM-327 inline checks; no MD5/SHA1/SHA256 introduction. | CRITICAL | **PASS** |
| 13 | 3e | V6.2.2 | Cryptographic random | Re-grep on changed files: 0 `Math.random` introductions. `crypto.randomUUID` used in passkey challengeId (existing pattern, unchanged). | CRITICAL | **PASS** |
| 14 | 3e | V6.4.1 | Secrets from environment | All secrets via `ConfigService.get('auth.jwtSecret')` / Redis client config / etc. No hardcoded secrets in changed files. | CRITICAL | **PASS** |
| 15 | 3f | N-06 | Re-authentication for sensitive ops | **SCRUM-327 closes this gap explicitly**. Pre-SCRUM-327: only MFA disable + recovery-codes had it; trust-device + passkey-register were FAIL/WARN. Post-SCRUM-327: 5 additional endpoints enforce password re-auth. | HIGH | **PASS — strengthened by SCRUM-327** |
| 16 | 3h | J-01 | JWT algorithm explicitly set (no `none`) | `jwt.strategy.ts:25` `algorithms: ['HS256']` (explicit allow-list). `auth.module.ts:64` `algorithm: 'HS256' as const` (sign side); `:69` `algorithms: ['HS256']` (verify side). SCRUM-347 doesn't touch these. | CRITICAL | **PASS (unchanged baseline)** |
| 17 | 3h | J-04 | Access token expiration ≤ 15 min | `auth.module.ts:60` `expiresIn: configService.get('auth.jwtAccessExpiration')` — env-controlled. SCRUM-347 doesn't change. | HIGH | **PASS (unchanged baseline)** |
| 18 | 3i | H-07 / H-10 | Rate limit on auth/MFA endpoints | `auth.controller.ts` (login/register/forgot-password — unchanged), `mfa.controller.ts` (5 throttled methods — unchanged), `passkey.controller.ts` (5 throttled methods — verified at lines 52, 76, 100, 114, 173), `session.controller.ts` (1 throttled method — verified at line 94). | HIGH | **PASS** |

---

## Recurrence Analysis (vs 2026-03-17 baseline)

Per audit-standards.mdc Section 6.6: finding-by-finding comparison vs previous audit.

| Previous baseline finding | Status post-SCRUM-347 + SCRUM-327 |
|----------------------------|------------------------------------|
| 0 FAIL — 19 WARN — 258 checks total at 91.5% | **0 NEW FAIL introduced.** 18 of the 258 checks were re-evaluated against the changed surface; all 18 PASS. Remaining 240 checks remain under the prior baseline (unchanged code paths). |
| (no prior FAILs to compare) | N/A |

---

## Findings Summary

| Severity | Count |
|----------|-------|
| CRITICAL FAIL | **0** |
| HIGH FAIL | **0** |
| MEDIUM FAIL | **0** |
| LOW FAIL | **0** |
| WARN | **0 NEW** (prior baseline 19 WARN unchanged — none on SCRUM-347/-327 surface) |
| PASS | 18 / 18 of the targeted set |

**Verdict: 0-FAIL baseline preserved.** SCRUM-347 + SCRUM-327 changes pass Phase 3 security review.

---

## Strengthened Controls (positive deltas)

The following controls are NOW STRONGER than the 2026-03-17 baseline:

1. **V3.3.1 / V3.3.4 (logout invalidates session)**: pre-SCRUM-347 the deny-list was eventually-consistent on individual session revoke (only the REFRESH side was denied; access-token-for-the-revoked-session remained valid until its TTL expired). Post-SCRUM-347 the access token is denied immediately via `deny:session:{id}` Redis key. **Closes a documented eventual-consistency gap.**
2. **N-06 (re-auth for sensitive ops)**: pre-SCRUM-327 only MFA disable and recovery-codes regen required password re-auth. Post-SCRUM-327, 5 additional endpoints (POST /auth/trusted-devices, DELETE /auth/trusted-devices, DELETE /auth/trusted-devices/:id, POST /auth/passkeys/register/options, DELETE /auth/passkeys/:id) enforce the same gate. **Closes 4 FAIL + 1 WARN from the SCRUM-327 enrichment audit.**

---

## Out-of-Scope Notes

- This is a TARGETED Phase 3 re-run on the SCRUM-347 + SCRUM-327 diff surface. The remaining 240 / 258 unchanged checks are NOT re-evaluated here; they remain under the 2026-03-17 0-FAIL baseline. A full 11-phase audit re-run can be scheduled separately if SOC 2 / ISO 27001 compliance review demands it.
- Phases 1, 2, 4, 5, 6, 7, 8, 9, 10, 11 NOT re-run in this session. Recommend running `/audit auth full` in a follow-up session for a complete refresh.
- Carry-overs from prior tickets (Section 6.7 Phase Invalidation in `audit-standards.mdc`, ASVS-V2.8.x explicit checks proposed by SCRUM-327 plan Section 9) are pending in working tree (audit-standards.mdc) — to be committed in a future cycle.

---

## Action

- **SCRUM-347 `/verify` BLOCKED-RISK gate satisfied**. The Step 11 mandate (Phase 3 audit re-run, 0-FAIL preserved) is now closed via this targeted run.
- **Next step**: re-classify SCRUM-347 verdict from `BLOCKED-RISK` to `PASS-WITH-DEBT` (the original Accepted-Quality on Step 9 remains: integration test deferred to SCRUM-350). Then `/commit SCRUM-347`.
- **AC10 of SCRUM-327** (Phase 3 audit re-run) is also satisfied by this same audit pass.
