# Phase 5 — DATA MODEL

| Metadata | Value |
|----------|-------|
| Date | 2026-05-06 22:44 UTC |
| Module | auth (global phase, focused on auth-related entities) |
| Scope | Auth entities: User, Session, AuditLog, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, OAuthAccount, Permission, RolePermission. Auth enums: Role, Provider, AuditAction, EmailVerificationTokenType. |
| Standards | SOC 2 CC7.5 (Change Identification), NIST AU-8 (Time Stamps), CWE-1049 (Interaction Frequency) |
| Schema | `nexacore-api/prisma/schema.prisma` |
| Docs | `ai-specs/specs/data-model.md` |
| Migrations | `nexacore-api/prisma/migrations/` (22 folders + `migration_lock.toml`) |
| Seed | `nexacore-api/prisma/seed.ts` |

## Summary

| Verdict | Count |
|---------|-------|
| PASS | 11 |
| WARN | 2 |
| FAIL | 1 |

Recurrence vs previous baseline (2026-03-29: 9 PASS / 2 WARN / 1 FAIL):
- Previous FAIL DM-06 (`OAUTH_AUTO_VERIFIED` missing from data-model.md) → **RESOLVED** (now present at line 996 prose + line 1179 appendix enum block).
- Previous WARN DM-W1 (missing `@sensitive` on 2 schema fields) → **RESOLVED** (all 8 sensitive fields tagged in schema; all 8 marked `[SENSITIVE]` in doc prose).
- Previous WARN DM-W2 (migration drift not verifiable in agent) → **RESOLVED THIS RUN**: `npx prisma migrate status` succeeded (Database schema is up to date).
- New FAIL D-02-A (User `deletedAt` field undocumented in data-model.md) — see findings below.
- New WARN D-02-B (User appendix schema in data-model.md is stale: missing `@sensitive` triple-slash comments and `deletedAt` not present in field list within the inline schema block at lines 1254-1294).
- New WARN D-09-W (RolePermission cascade-on-Permission semantically permissive but not explicitly justified in data-model.md).

---

## Detailed Findings

### D-01 — Model count [PASS]

**Verification**: Counted models in schema.prisma vs data-model.md.

- **schema.prisma**: 10 models (User, Session, AuditLog, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, OAuthAccount, Permission, RolePermission).
- **data-model.md**: 21 entities total — 10 marked `[IMPLEMENTED]` (matching schema 1-to-1), 11 marked `[PLANNED]` (Project, ProjectMember, Team, TeamMember, Notification, Subscription, Invoice, Setting, PlatformModule, ProjectModule, App).
- All 10 implemented models match. PASS.

### D-02 — Field inventory [FAIL]

**Verification**: For each implemented model, compared field list in data-model.md prose vs schema.prisma.

**FAIL D-02-A (HIGH, SOC 2 CC8.1)** — `User.deletedAt` field undocumented in data-model.md.
- **Schema** (line 91): `deletedAt DateTime?`
- **Data-model.md User §1 prose** (lines 73-94): field list ends with `updatedAt` — `deletedAt` missing entirely from the prose field list.
- **Data-model.md User appendix block** (lines 1254-1294): `deletedAt` also missing from the inline `model User` block.
- Migration source: `20260418165311_add_user_deleted_at` (added 2026-04-18). Doc never updated.
- **Impact**: Field is part of the GDPR self-deletion tombstone flow (referenced at line 113 business invariant), but its existence is not declared. SOC 2 CC8.1 (change management) violation: schema change shipped without doc update.
- **Standard**: SOC 2 CC8.1 (Change Management).

**Other models (PASS)**:
- Session: 16 fields in schema, 16 documented. ✓
- AuditLog: 8 fields in schema, 8 documented. ✓
- EmailVerificationToken: 7 fields in schema, 7 documented. ✓
- PasswordResetToken: 6 fields in schema, 6 documented. ✓
- TrustedDevice: 9 fields, 9 documented. ✓
- WebAuthnCredential: 11 fields, 11 documented. ✓
- OAuthAccount: 6 fields, 6 documented. ✓
- Permission, RolePermission: out of auth-focus scope but fields match.

### D-03 — Enum values [PASS]

**Verification**: Compared enum values in schema.prisma vs data-model.md.

- **Role**: schema 3 values (SUPERADMIN, ADMIN, USER), doc 3 values. ✓
- **Provider**: schema 3 values (LOCAL, GOOGLE, GITHUB), doc 3 values. ✓
- **AuditAction**: schema 38 values (lines 21-60), data-model.md prose 38 values (lines 959-996), data-model.md appendix block 38 values (lines 1142-1180). All match including `OAUTH_AUTO_VERIFIED` (previous FAIL — now fixed). ✓
- **EmailVerificationTokenType**: schema 2 values (REGISTRATION, EMAIL_CHANGE), doc 2 values. ✓

PASS.

### D-04 — Relations [PASS]

**Verification**: GREP `@relation` directives in schema vs documented relations sections.

All 9 `@relation` directives in auth-related models are documented:
- Session→User (cascade) ✓ documented
- AuditLog→User (SetNull, named "AuditLogUser") ✓ documented
- AuditLog→User (SetNull, named "AuditLogTarget") ✓ documented
- EmailVerificationToken→User (cascade, named "UserEmailVerificationTokens") ✓ documented
- PasswordResetToken→User (cascade, named "UserPasswordResetTokens") ✓ documented
- TrustedDevice→User (cascade) ✓ documented
- WebAuthnCredential→User (cascade) ✓ documented
- OAuthAccount→User (cascade) ✓ documented
- RolePermission→Permission (cascade) ✓ documented

PASS.

### D-05 — Indices [PASS]

**Verification**: Compared `@@index` and `@@unique` in schema vs docs.

| Model | Schema indices/uniques | Documented |
|-------|------------------------|------------|
| User | `@unique(email)` | ✓ (prose: "unique") |
| Session | 4 indices (userId; tokenFamily; userId,isRevoked; userId,isRevoked,lastUsedAt) | ✓ all 4 listed |
| AuditLog | 6 indices | ✓ all 6 listed |
| EmailVerificationToken | `@unique(tokenHash)` + `@index(userId)` | ✓ |
| PasswordResetToken | `@unique(tokenHash)` + `@index(userId)` | ✓ |
| TrustedDevice | `@@unique([userId, fingerprintHash])` + `@@index([userId, isRevoked, expiresAt])` | ✓ |
| WebAuthnCredential | `@unique(credentialId)` + `@index(userId)` | ✓ |
| OAuthAccount | 2 composite uniques + 1 index | ✓ |

PASS.

### D-06 — Default values [PASS]

**Verification**: Compared `@default` directives.

- All `@default(uuid())` IDs match. ✓
- Booleans (`emailVerified=false`, `isActive=true`, `mfaEnabled=false`, `isRevoked=false`, `backedUp=false`, `failedAttempts=0`, `lockoutCount=0`, `signCount=0`, `mfaRecoveryCodes=[]`, `transports=[]`, `deviceType="singleDevice"`) all documented in respective field bullets.
- All `@default(now())` timestamps documented as "auto-generated".
- `EmailVerificationTokenType @default(REGISTRATION)` documented.

PASS. (Previously DM-06 FAIL on `OAUTH_AUTO_VERIFIED` — now resolved.)

### D-07 — Migration integrity [PASS]

**Verification**: `npx prisma migrate status` from `nexacore-api/`.

```
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma\schema.prisma.
Datasource "db": PostgreSQL database "em_ecosystem", schema "public" at "localhost:5432"
22 migrations found in prisma/migrations
Database schema is up to date!
```

No pending migrations. No failed migrations. CRITICAL gate passes. PASS.

### D-08 — Migration files versioned [PASS]

**Verification**: Listed `prisma/migrations/` contents.

22 migration folders + `migration_lock.toml` present:
1. `0001_init`
2. `20260225230005_add_profile_fields_and_superadmin`
3. `20260226171805_add_lockout_count`
4. `20260226180647_add_audit_log`
5. `20260226215701_add_mfa_fields`
6. `20260226220000_add_sessions_remove_user_refresh_token`
7. `20260227082218_add_email_verification_and_password_reset_tokens`
8. `20260227090901_add_permissions_rbac`
9. `20260302113638_add_session_idle_index_and_audit_actions`
10. `20260302134639_add_email_change_flow`
11. `20260302143930_add_account_self_deleted_action`
12. `20260304132222_add_session_geolocation_fields`
13. `20260309150542_add_oauth_accounts`
14. `20260309200000_remove_deprecated_user_provider_fields`
15. `20260311001758_add_oauth_register_audit_action`
16. `20260313000000_add_updated_at_session_webauthn`
17. `20260314000000_add_updated_at_token_models`
18. `20260314115530_add_updated_at_permission`
19. `20260316220000_add_role_permission_updated_at`
20. `20260328194437_add_oauth_auto_verified_audit_action`
21. `20260414161753_add_avatar_original_and_crop_data`
22. `20260418165311_add_user_deleted_at`

All committed (verified by directory listing on filesystem). PASS.

### D-09 — Cascade delete safety [WARN]

**Verification**: GREPped `onDelete:` in schema.prisma. Found 9 occurrences:

| Line | Relation | Action | Justification in data-model.md? |
|------|----------|--------|---------------------------------|
| 108 | Session→User | Cascade | ✓ Documented (User deletion revokes sessions; expected) |
| 142 | AuditLog→User (acting) | SetNull | ✓ Documented (audit logs are append-only / preserved) |
| 143 | AuditLog→User (target) | SetNull | ✓ Documented |
| 160 | EmailVerificationToken→User | Cascade | ✓ Documented (line 239 explicit "cascade delete") |
| 175 | PasswordResetToken→User | Cascade | ✓ Documented (line 277 explicit "cascade delete") |
| 188 | TrustedDevice→User | Cascade | ✓ Documented (line 804 explicit) |
| 217 | WebAuthnCredential→User | Cascade | ✓ Documented (line 847 explicit) |
| 231 | OAuthAccount→User | Cascade | ✓ Documented (line 896 explicit) |
| 258 | RolePermission→Permission | Cascade | ⚠ Not explicitly justified — assumed safe (deleting a Permission cleans assignments) |

**WARN D-09-W (LOW, Data safety)** — RolePermission→Permission cascade is mechanically reasonable (orphan-cleanup on permission deletion) but `data-model.md` Permission/RolePermission sections (lines 305-370) do not state the cascade rationale explicitly. Out of auth-module focus but flagged in this global phase.

No cascade is sourced FROM `User` outward (User is only a cascade target, never a source), and `User` itself is soft-deletable via `deletedAt`. No CRITICAL safety issue. WARN (not FAIL) because all User-targeted cascades on auth tables are intended (sessions, tokens, devices, OAuth links, passkeys).

### D-10 — Audit trail field `createdAt` [PASS]

**Verification**: GREP `createdAt` for each model.

All 10 models have `createdAt DateTime @default(now())`:
- User (line 89), Session (120), AuditLog (140), EmailVerificationToken (163), PasswordResetToken (178), TrustedDevice (195), WebAuthnCredential (214), OAuthAccount (229), Permission (245), RolePermission (259).

PASS.

### D-11 — Audit trail field `updatedAt` [PASS]

**Verification**: GREP `updatedAt` for each mutable model.

| Model | `updatedAt`? | Mutable? |
|-------|--------------|----------|
| User | ✓ line 90 | Yes |
| Session | ✓ line 121 | Yes |
| AuditLog | ✗ | No (append-only by design — documented invariant line 209) |
| EmailVerificationToken | ✓ line 164 | Yes |
| PasswordResetToken | ✓ line 179 | Yes |
| TrustedDevice | ✓ line 196 | Yes |
| WebAuthnCredential | ✓ line 215 | Yes |
| OAuthAccount | ✗ | No (immutable — documented invariant line 907 "OAuth links are immutable — created or deleted, never modified (no updatedAt)") |
| Permission | ✓ line 246 | Yes |
| RolePermission | ✓ line 260 | Yes |

Both omissions (AuditLog, OAuthAccount) are intentional and explicitly documented. PASS.

### D-12 — Unique constraints [PASS]

**Verification**: READ schema.prisma uniques.

| Field/composite | Constraint | Status |
|-----------------|------------|--------|
| User.email | `@unique` | ✓ |
| EmailVerificationToken.tokenHash | `@unique` | ✓ |
| PasswordResetToken.tokenHash | `@unique` | ✓ |
| WebAuthnCredential.credentialId | `@unique` | ✓ |
| TrustedDevice (userId, fingerprintHash) | `@@unique` | ✓ |
| OAuthAccount (provider, providerId) | `@@unique` (one OAuth identity = one user) | ✓ |
| OAuthAccount (userId, provider) | `@@unique` (one provider per user) | ✓ |
| Permission.key | `@unique` | ✓ |
| RolePermission (role, permissionId) | `@@unique` | ✓ |

Note: `Session.refreshTokenHash` does NOT have `@unique` — intentional, because rotation produces unique values per session naturally and bcrypt hashing of identical inputs yields different hashes (different salts). Token theft detection is at family level. Acceptable.

PASS.

### D-13 — Seed data safety [PASS]

**Verification**: READ `prisma/seed.ts`.

- ✓ Uses `prisma.permission.upsert(...)` (idempotent) and `prisma.rolePermission.upsert(...)` (idempotent). Safe to re-run.
- ✓ No hardcoded credentials, no passwords, no secrets, no users. Only seeds `Permission` definitions and `RolePermission` mappings.
- ✓ No SUPERADMIN bootstrap (correctly handled out of band — only assignable by another SUPERADMIN per business invariant line 111).
- ✓ Logs `Seeded N permissions / N role-permission assignments`. No PII in logs.

PASS.

### D-14 — No raw queries [PASS]

**Verification**: GREPped `nexacore-api/src/` for `prisma.$queryRawUnsafe`, `prisma.$executeRawUnsafe`, `$queryRaw`, `$executeRaw`.

- `prisma.$queryRawUnsafe`: 0 occurrences.
- `prisma.$executeRawUnsafe`: 0 occurrences.
- `$queryRaw` / `$executeRaw` (tagged templates): 0 occurrences.

All database access is via the Prisma typed client. No SQL injection surface via raw queries. PASS (CRITICAL gate).

---

## Additional Findings (cross-check)

**WARN D-02-B (LOW, SOC 2 CC8.1)** — data-model.md appendix `model User { ... }` block at lines 1254-1294 is missing both:
1. `deletedAt DateTime?` (added in migration 22, 2026-04-18)
2. `/// @sensitive — ...` triple-slash comments on `passwordHash`, `mfaSecret`, `mfaRecoveryCodes` (these comments DO exist in the actual schema.prisma since the schema was annotated, but the appendix copy in data-model.md is a stripped-down replica that does not carry over the directives).

This is a documentation-only drift; the prose `[SENSITIVE]` markers still fully cover the requirement. Recommend regenerating the appendix from `schema.prisma` (or referencing it instead of duplicating).

---

## Findings List

### FAIL (1)

| ID | Severity | Standard | Description |
|----|----------|----------|-------------|
| D-02-A | HIGH | SOC 2 CC8.1 | `User.deletedAt` field present in `schema.prisma` (since migration `20260418165311_add_user_deleted_at`) but NOT documented in `data-model.md` User §1 prose field list (lines 73-94) NOR in the appendix `model User` block (lines 1254-1294). The field powers the GDPR Article 17 tombstone flow referenced at line 113 — its existence must be declared. **Remediation**: add `deletedAt: Soft-deletion timestamp for GDPR tombstone (optional — null for active accounts)` to User field list, and add `deletedAt DateTime?` to the appendix block. |

### WARN (2)

| ID | Severity | Standard | Description |
|----|----------|----------|-------------|
| D-02-B | LOW | SOC 2 CC8.1 | data-model.md appendix `model User { ... }` block (lines 1254-1294) is a stale stripped-down copy of `schema.prisma`: missing `deletedAt` and missing `/// @sensitive` annotations on `passwordHash`, `mfaSecret`, `mfaRecoveryCodes`. Consider replacing the duplicate block with a link/reference to `schema.prisma`, or regenerating from source on each schema change. |
| D-09-W | LOW | Data safety | `RolePermission.permission` cascade on Permission deletion is semantically reasonable but not explicitly justified in data-model.md Permission §6 / RolePermission §7. Add a one-line "Cascade on Permission delete: orphan rolePermission rows removed (intentional)." |

### PASS (11)

D-01 (model count), D-03 (enum values), D-04 (relations), D-05 (indices), D-06 (default values), D-07 (migration integrity), D-08 (migrations versioned), D-10 (createdAt), D-11 (updatedAt), D-12 (unique constraints), D-13 (seed safety), D-14 (no raw queries).

(Note: that's 12 PASS lines but D-02 is listed as FAIL, leaving D-01, D-03–D-08, D-10–D-14 = 11 PASS + 1 FAIL + 2 WARN.)

---

## Recurrence Analysis vs 2026-03-29 Baseline

| Previous finding | Status this run |
|------------------|-----------------|
| FAIL DM-06 (`OAUTH_AUTO_VERIFIED` missing in data-model.md) | RESOLVED (line 996 prose, line 1179 appendix) |
| WARN DM-W1 (2 schema fields missing `@sensitive`) | RESOLVED (8/8 sensitive fields tagged in schema; doc prose marks all 8) |
| WARN DM-W2 (migration drift not verifiable in agent) | RESOLVED THIS RUN (`prisma migrate status` succeeded) |

**New findings this run**:
- New FAIL D-02-A (User.deletedAt undocumented) — drift from migration 22 (2026-04-18) never propagated to data-model.md.
- New WARN D-02-B (appendix block stale: missing deletedAt + missing /// @sensitive comments).
- New WARN D-09-W (RolePermission cascade rationale not in docs).

**Net delta**: 11 PASS / 2 WARN / 1 FAIL (vs prior 9 / 2 / 1). Resolved issues outnumber new ones; the new FAIL is a clean documentation gap (no security or integrity risk in code), inheriting the same root cause as the prior `OAUTH_AUTO_VERIFIED` FAIL: schema change shipped without simultaneous doc update.

**Recommendation**: add a `/update-docs` checklist item or pre-commit hook step "After every schema change, update data-model.md prose AND appendix block" — this is the third recurrence of the same drift pattern (DM-06 in 2026-03, DM-W1 in 2026-03, D-02-A here).
