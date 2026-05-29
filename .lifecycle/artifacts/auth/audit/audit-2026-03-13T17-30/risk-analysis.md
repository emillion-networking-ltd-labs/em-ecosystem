# Risk Analysis — Auth Audit 2026-03-13

**Purpose**: Formal risk assessment for findings evaluated as potential "accepted risk" candidates. Documents attack scenarios, compensating controls, residual risk, and final disposition. Future audits MUST reference this document before re-analyzing the same findings.

---

## Risk Assessment Framework

Every finding must pass this decision tree before being accepted:

```
Is a fix viable?
  └─ YES → Is the fix low-cost (< 1 sprint day)?
       └─ YES → FIX (do not accept)
       └─ NO → Are there documented compensating controls?
            └─ YES → ACCEPT with evidence + periodic review
            └─ NO → FIX or MITIGATE
  └─ NO → ACCEPT with compensating controls + periodic review schedule
```

**Acceptance requires ALL of**:
1. Documented attack scenario with realistic likelihood assessment
2. Identified compensating controls with evidence they are active
3. Quantified residual risk after controls
4. Named risk owner (person or team)
5. Review schedule (quarterly minimum)

---

## RA-01: V8.3.1 — JWT in Query Parameter (OAuth Account Linking)

### Finding Summary
`oauth-link.guard.ts:26-28` accepts the full access JWT via `?token=` query parameter for OAuth account linking initiation (`GET /auth/link/google?token=<JWT>`).

### Attack Scenarios

| # | Scenario | Likelihood | Impact | Risk |
|---|----------|-----------|--------|------|
| A | **Reverse proxy log extraction**: Attacker with log access (nginx/ALB/Cloudflare) extracts JWT from URL, replays within 15-min TTL on any authenticated endpoint | MEDIUM | HIGH | HIGH |
| B | **Browser history theft**: Shared/corporate machine — another user extracts token from browser history | LOW | HIGH | MEDIUM |
| C | **Same-origin analytics script**: Third-party script (Sentry, GA) captures `window.location.href` before redirect | LOW | MEDIUM | LOW |
| D | **Token replay on all endpoints**: Stolen JWT is the full access token — usable on ANY endpoint, not just linking | — | Amplifier | — |

### Token Details
- **Type**: Full production access JWT (sub, email, role, jti)
- **Expiry**: 15 minutes (configurable via `JWT_ACCESS_EXPIRATION`)
- **Scope**: Unrestricted — valid for all authenticated API endpoints
- **Not single-use**: Can be replayed within TTL window

### Existing Compensating Controls

| Control | Mitigates | Gap |
|---------|----------|-----|
| Referrer-Policy: `strict-origin-when-cross-origin` | Scenario C (cross-origin only) | Does NOT prevent same-origin leakage |
| HTTPS enforcement | Network interception | Does NOT prevent log/history leakage |
| 15-min JWT TTL | Limits exploitation window | Logs are persistent — token valid when written |
| Rate limiting (10/60s) | Brute force | Irrelevant to log-based extraction |
| NoCacheInterceptor | Response caching | Does NOT prevent request URL logging |
| Header-first preference | Non-browser clients | Browsers must use query param |

### Residual Risk After Controls
**HIGH** — No control addresses the primary vector (reverse proxy logs). The full access JWT appears in plaintext in server logs with no scrubbing mechanism. A single log access grants full user impersonation for 15 minutes.

### Fix Assessment
- **Viable**: YES — replace `?token=<JWT>` with `?intent=<opaque_single_use_token>` stored in Redis
- **Cost**: LOW (~4 hours) — pattern identical to existing `OAuthCodeStore` already in the codebase
- **Breaking changes**: Frontend must call `POST /auth/oauth/link-intent` before redirect (minor change)

### Disposition
**MUST FIX** — Fix is viable, low-cost, and eliminates the risk entirely. Accepting this risk would leave a well-understood, exploitable vector in production with no compensating control for the primary attack scenario.

---

## RA-02: D-11 — Missing `updatedAt` on Token Models

### Finding Summary
`EmailVerificationToken` and `PasswordResetToken` Prisma models lack `updatedAt @updatedAt` despite being mutable (via `usedAt` field).

### Attack Scenarios

| # | Scenario | Likelihood | Impact | Risk |
|---|----------|-----------|--------|------|
| A | **DB-level tamper**: Attacker with DB write access clears `usedAt = NULL` to reactivate a spent token. Without `updatedAt`, no forensic trace of the modification. | VERY LOW | HIGH | LOW |
| B | **Audit tool false positive**: Automated SOC 2 tooling (Vanta, Drata) flags mutable tables without `updatedAt` as control gap | LOW | LOW (manual rebuttal) | LOW |

### Field Mutation Analysis
- **Only mutated field**: `usedAt` — set once per token lifetime (on consumption)
- **Other fields**: `tokenHash`, `userId`, `expiresAt`, `type` — immutable after creation
- **Information overlap**: `updatedAt` would ALWAYS equal `usedAt` on used tokens, or `createdAt` on unused tokens. Zero additional information in current schema.

### Compliance Standard Requirements

| Standard | Requires `updatedAt` on token tables? | Evidence Layer |
|----------|--------------------------------------|---------------|
| SOC 2 Type II (CC6.1, CC7.2) | **No** | AuditLog table is the evidence trail |
| ISO 27001:2022 (A.8.5, A.8.15) | **No** | AuditLog with PASSWORD_CHANGE, EMAIL_CHANGED |
| NIST SP 800-63B | **No** | Requires invalidation after use (`usedAt`) + max validity (`expiresAt`) |
| OWASP ASVS v4 (V2.5.4, V7.1.x) | **No** | Log timestamps via AuditLog.createdAt |

### Existing Compensating Controls

| Control | Effect |
|---------|--------|
| `usedAt` field | Tracks the only mutation that occurs — semantically equivalent to `updatedAt` |
| `AuditLog` entries | `PASSWORD_CHANGE` and `EMAIL_CHANGED` with IP, user agent, metadata — far richer than `updatedAt` |
| `$transaction` blocks | `usedAt` set atomically with the consequential effect |
| `expiresAt` | Tokens auto-expire regardless of `usedAt` state |

### Residual Risk After Controls
**NEGLIGIBLE** — The only unmitigated scenario (DB-level `usedAt` tampering) assumes an attacker with direct database write access, at which point far higher-value attacks are available. The `AuditLog` provides a separate, immutable audit trail.

### Fix Assessment
- **Viable**: YES — single Prisma migration, 0 application code changes
- **Cost**: TRIVIAL (~15 minutes) — identical pattern to existing `add_updated_at_session_webauthn` migration
- **Breaking changes**: None

### Disposition
**FIX (hygiene)** — Despite negligible risk, the fix is so cheap that accepting it would cost more in documentation/rebuttal effort than just fixing it. Adds schema consistency with other mutable models.

---

## Summary of Dispositions

| Finding | Risk Level | Fix Cost | Disposition | Rationale |
|---------|-----------|----------|-------------|-----------|
| V8.3.1 (JWT in URL) | **HIGH** | Low (~4h) | **MUST FIX** | Primary attack vector (log leakage) has no compensating control |
| D-11 (missing updatedAt) | **NEGLIGIBLE** | Trivial (~15min) | **FIX (hygiene)** | Fix cheaper than documenting acceptance |

**Zero findings accepted as risk** — all have viable, low-cost fixes.

---

## Guidance for Future Risk Assessments

When evaluating whether a finding can be "accepted":

1. **Never accept if the fix is cheap** — documenting and maintaining an accepted risk costs more than a 1-day fix
2. **Never accept without compensating controls** — "low likelihood" is not a control
3. **Never accept amplifiable risks** — if a stolen credential grants access beyond its intended scope (like V8.3.1's full-scope JWT), the impact is unbounded
4. **Document the decision either way** — future audits must not re-analyze from scratch
5. **Assign a review date** — accepted risks must be re-evaluated quarterly at minimum

---

*Generated: 2026-03-13 | Auditor: Claude (automated) | Standards: ISO 27001 CAR, NIST RMF, OWASP Risk Rating*
