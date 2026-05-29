# Phase 5 — Data Model Audit

**Module**: Auth (GLOBAL)
**Date**: 2026-03-14
**Auditor**: Claude Opus 4.6
**Standards**: SOC 2 CC7.5, NIST AU-8, CWE-1049, ISO 25010

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 12    |
| WARN    | 2     |
| FAIL    | 0     |
| **Total** | **14** |

---

## Findings

### D-01 — Model Count

**Verdict**: PASS

| Source | Implemented Models | Planned Models | Total |
|--------|-------------------|----------------|-------|
| `schema.prisma` | 10 | — | 10 |
| `data-model.md` | 10 (implemented) | 11 (planned) | 21 |

**Implemented models in schema.prisma**: User, Session, AuditLog, EmailVerificationToken, PasswordResetToken, Permission, RolePermission, TrustedDevice, WebAuthnCredential, OAuthAccount.

**Implemented models in data-model.md**: Same 10 models, all marked `[IMPLEMENTED]` with `In Prisma Schema = Yes`. The 11 planned models (Project, ProjectMember, Team, TeamMember, Notification, Subscription, Invoice, Setting, PlatformModule, ProjectModule, App) are documented but correctly marked `Planned / No`.

**Evidence**: `schema.prisma` lines 66-253; `data-model.md` Model Implementation Status table (lines 41-63).

---

### D-02 — Field Inventory

**Verdict**: WARN

All 10 implemented models have their fields documented in data-model.md field description sections. However, two discrepancies exist within data-model.md itself:

**Discrepancy 1 — updatedAt missing from field description sections:**

| Model | Field | In schema.prisma | In data-model.md field desc. | In embedded Prisma block |
|-------|-------|-------------------|------------------------------|--------------------------|
| Session | `updatedAt` | Yes (line 113) | **No** (field list omits it) | Yes (line 1264) |
| WebAuthnCredential | `updatedAt` | Yes (line 205) | **No** (field list omits it) | Yes (line 1356) |

The embedded Prisma schema block in data-model.md correctly includes `updatedAt` for both models, but the human-readable field description sections do not mention it.

**Discrepancy 2 — incorrect model count in Prisma Schema section note:**

The note at data-model.md line 1073 reads: _"The Prisma schema below contains only the **12** implemented models and 4 implemented enums."_ However, there are only **10** implemented models (per the Implementation Status table at lines 41-63 and confirmed by schema.prisma). The correct count is 10. This is a stale reference, likely from a draft that was never corrected.

All scalar field names and types across all 10 models are otherwise consistent between schema.prisma and data-model.md.

**Severity**: LOW (documentation inconsistencies, no code or runtime impact)
**Standard**: CWE-1049 (Inconsistent documentation)

---

### D-03 — Enum Values

**Verdict**: PASS

| Enum | schema.prisma values | data-model.md values | Match |
|------|---------------------|---------------------|-------|
| Role | SUPERADMIN, ADMIN, USER | SUPERADMIN, ADMIN, USER | Exact |
| Provider | LOCAL, GOOGLE, GITHUB | LOCAL, GOOGLE, GITHUB | Exact |
| AuditAction | 37 values (lines 21-58) | 37 values (lines 915-953) | Exact |
| EmailVerificationTokenType | REGISTRATION, EMAIL_CHANGE | REGISTRATION, EMAIL_CHANGE | Exact |

All 4 implemented enums have identical values between schema.prisma and data-model.md. The 10 planned enums are documented in data-model.md only (not in schema.prisma), which is correct.

**Evidence**: `schema.prisma` lines 9-64; `data-model.md` Enums section (lines 889-1068).

---

### D-04 — Relations

**Verdict**: PASS

All `@relation` directives in schema.prisma are documented in data-model.md:

| Model | Relations in schema.prisma | Documented |
|-------|---------------------------|-----------|
| User | 8 relations (sessions, auditLogs, auditLogsTarget, emailVerificationTokens, passwordResetTokens, trustedDevices, webAuthnCredentials, oauthAccounts) | Yes — all 8 plus 5 planned relations listed |
| Session | user → User (onDelete: Cascade) | Yes |
| AuditLog | user → User (SetNull), targetUser → User (SetNull) | Yes |
| EmailVerificationToken | user → User (Cascade) | Yes |
| PasswordResetToken | user → User (Cascade) | Yes |
| TrustedDevice | user → User (Cascade) | Yes |
| WebAuthnCredential | user → User (Cascade) | Yes |
| OAuthAccount | user → User (Cascade) | Yes |
| Permission | rolePermissions → RolePermission[] | Yes |
| RolePermission | permission → Permission (Cascade) | Yes |

**Evidence**: `schema.prisma` lines 86-93, 101, 134-135, 151, 165, 178, 207, 221, 237, 247.

---

### D-05 — Indices

**Verdict**: PASS

All `@@index` and `@@unique` directives in schema.prisma are present in the embedded Prisma schema in data-model.md:

| Model | Indices/Unique Constraints | Match |
|-------|---------------------------|-------|
| Session | 4 @@index (userId, tokenFamily, [userId,isRevoked], [userId,isRevoked,lastUsedAt]) | Exact |
| AuditLog | 6 @@index (action, userId, targetUserId, createdAt, [action,userId,createdAt], [action,ipAddress,createdAt]) | Exact |
| EmailVerificationToken | 1 @@index (userId), 1 @unique (tokenHash) | Exact |
| PasswordResetToken | 1 @@index (userId), 1 @unique (tokenHash) | Exact |
| TrustedDevice | 1 @@unique ([userId,fingerprintHash]), 1 @@index ([userId,isRevoked,expiresAt]) | Exact |
| WebAuthnCredential | 1 @@index (userId), 1 @unique (credentialId) | Exact |
| OAuthAccount | 2 @@unique ([provider,providerId], [userId,provider]), 1 @@index (userId) | Exact |
| Permission | 1 @@index (resource), 1 @unique (key) | Exact |
| RolePermission | 1 @@unique ([role,permissionId]), 1 @@index (role) | Exact |
| User | 1 @unique (email) | Exact |

**Evidence**: `schema.prisma` lines 117-121, 137-142, 157, 171, 188-189, 209, 223-225, 239, 250-251.

---

### D-06 — Default Values

**Verdict**: PASS

All `@default` directives in schema.prisma match the documented defaults in data-model.md:

| Model | Field | Default (schema) | Default (docs) | Match |
|-------|-------|-------------------|----------------|-------|
| User | id | uuid() | UUID, auto-generated | Yes |
| User | role | USER | USER | Yes |
| User | emailVerified | false | false | Yes |
| User | isActive | true | true | Yes |
| User | failedAttempts | 0 | 0 | Yes |
| User | lockoutCount | 0 | 0 | Yes |
| User | mfaEnabled | false | false | Yes |
| User | mfaRecoveryCodes | [] | [] | Yes |
| Session | isRevoked | false | false | Yes |
| Session | lastUsedAt | now() | now() | Yes |
| EmailVerificationToken | type | REGISTRATION | REGISTRATION | Yes |
| TrustedDevice | isRevoked | false | false | Yes |
| TrustedDevice | lastVerifiedAt | now() | now() | Yes |
| WebAuthnCredential | signCount | 0 | 0 | Yes |
| WebAuthnCredential | transports | [] | [] | Yes |
| WebAuthnCredential | backedUp | false | false | Yes |
| WebAuthnCredential | deviceType | "singleDevice" | "singleDevice" | Yes |

All `@default(now())` for createdAt and `@updatedAt` for updatedAt are consistent across all models.

**Evidence**: `schema.prisma` lines 67-84, 111-114, 150, 182-186, 198-201.

---

### D-07 — Migration Integrity

**Verdict**: PASS

17 migration files found in `prisma/migrations/`, all properly versioned with timestamps:

1. `0001_init/migration.sql`
2. `20260225230005_add_profile_fields_and_superadmin/migration.sql`
3. `20260226171805_add_lockout_count/migration.sql`
4. `20260226180647_add_audit_log/migration.sql`
5. `20260226215701_add_mfa_fields/migration.sql`
6. `20260226220000_add_sessions_remove_user_refresh_token/migration.sql`
7. `20260227082218_add_email_verification_and_password_reset_tokens/migration.sql`
8. `20260227090901_add_permissions_rbac/migration.sql`
9. `20260302113638_add_session_idle_index_and_audit_actions/migration.sql`
10. `20260302134639_add_email_change_flow/migration.sql`
11. `20260302143930_add_account_self_deleted_action/migration.sql`
12. `20260304132222_add_session_geolocation_fields/migration.sql`
13. `20260309150542_add_oauth_accounts/migration.sql`
14. `20260309200000_remove_deprecated_user_provider_fields/migration.sql`
15. `20260311001758_add_oauth_register_audit_action/migration.sql`
16. `20260313000000_add_updated_at_session_webauthn/migration.sql`
17. `20260314000000_add_updated_at_token_models/migration.sql`

Migration lock file (`migration_lock.toml`) is present. Migrations follow chronological naming convention. No gaps detected.

**Evidence**: File listing from `prisma/migrations/` directory.

---

### D-08 — Migration Files Versioned

**Verdict**: PASS

All 17 migration directories and the `migration_lock.toml` file exist in the `prisma/migrations/` directory within the `em-ecosystem-code` repository. The repository is a git repository (confirmed by `.git` presence at `em-ecosystem-code/.git`). Migration files are tracked in version control.

**Evidence**: Glob results for `**/prisma/migrations/**/migration.sql` returned all 17 files. `migration_lock.toml` confirmed present.

---

### D-09 — Cascade Delete Safety

**Verdict**: PASS

Cascade delete (`onDelete: Cascade`) usage in schema.prisma:

| Relation | From | To | Cascade | Justified |
|----------|------|----|---------|-----------|
| Session.user | Session | User | Cascade | Yes — sessions are owned by user, orphan sessions serve no purpose |
| EmailVerificationToken.user | EVToken | User | Cascade | Yes — tokens are user-owned, meaningless without user |
| PasswordResetToken.user | PRToken | User | Cascade | Yes — tokens are user-owned, meaningless without user |
| TrustedDevice.user | TrustedDevice | User | Cascade | Yes — device trust is per-user |
| WebAuthnCredential.user | WebAuthn | User | Cascade | Yes — credentials belong to user |
| OAuthAccount.user | OAuthAccount | User | Cascade | Yes — OAuth links are per-user |
| RolePermission.permission | RolePermission | Permission | Cascade | Yes — junction table, meaningless without permission |

**Non-cascade (safe):**
- AuditLog.user → `onDelete: SetNull` (preserves audit trail)
- AuditLog.targetUser → `onDelete: SetNull` (preserves audit trail)

All cascade deletes are on child/dependent tables that have no independent meaning without the parent. AuditLog correctly uses SetNull to preserve forensic records. No dangerous cascades detected.

**Evidence**: `schema.prisma` lines 101, 134-135, 151, 165, 178, 207, 221, 247.

---

### D-10 — Audit Trail: createdAt

**Verdict**: PASS

All 10 implemented models have `createdAt DateTime @default(now())`:

| Model | Has createdAt | Default |
|-------|--------------|---------|
| User | Yes (line 83) | @default(now()) |
| Session | Yes (line 112) | @default(now()) |
| AuditLog | Yes (line 132) | @default(now()) |
| EmailVerificationToken | Yes (line 154) | @default(now()) |
| PasswordResetToken | Yes (line 168) | @default(now()) |
| TrustedDevice | Yes (line 185) | @default(now()) |
| WebAuthnCredential | Yes (line 204) | @default(now()) |
| OAuthAccount | Yes (line 219) | @default(now()) |
| Permission | Yes (line 235) | @default(now()) |
| RolePermission | Yes (line 248) | @default(now()) |

**Evidence**: `schema.prisma` referenced lines.

---

### D-11 — Audit Trail: updatedAt

**Verdict**: WARN

Analysis of which mutable models have `updatedAt`:

| Model | Mutable? | Has updatedAt | Verdict |
|-------|----------|---------------|---------|
| User | Yes | Yes (@updatedAt, line 84) | OK |
| Session | Yes (isRevoked, refreshTokenHash, lastUsedAt) | Yes (@updatedAt, line 113) | OK |
| EmailVerificationToken | Yes (usedAt) | Yes (@updatedAt, line 155) | OK |
| PasswordResetToken | Yes (usedAt) | Yes (@updatedAt, line 169) | OK |
| TrustedDevice | Yes (isRevoked, lastVerifiedAt) | Yes (@updatedAt, line 186) | OK |
| WebAuthnCredential | Yes (signCount, name, lastUsedAt) | Yes (@updatedAt, line 205) | OK |
| AuditLog | No (append-only) | No | OK — by design |
| OAuthAccount | No (immutable, create/delete only) | No | OK — by design |
| Permission | Yes (description can be updated via seed upsert) | No | **WARN** |
| RolePermission | No (create/delete only via junction table) | No | OK — by design |

**Finding**: Permission model has no `updatedAt` field. The seed script uses `upsert` with an `update` clause that can modify `description`, `resource`, and `action` fields (seed.ts line 81). While Permission changes are rare (only via seed), they are technically mutable. This is a minor gap.

**Severity**: LOW
**Standard**: NIST AU-8 (timestamps for all mutable records)

---

### D-12 — Unique Constraints

**Verdict**: PASS

All fields requiring uniqueness have proper `@unique` or `@@unique` constraints:

| Model | Field(s) | Constraint | Purpose |
|-------|----------|-----------|---------|
| User | email | @unique | Prevent duplicate accounts |
| EmailVerificationToken | tokenHash | @unique | Token lookup integrity |
| PasswordResetToken | tokenHash | @unique | Token lookup integrity |
| Permission | key | @unique | Permission identity |
| RolePermission | [role, permissionId] | @@unique | Prevent duplicate assignments |
| TrustedDevice | [userId, fingerprintHash] | @@unique | One trust record per device per user |
| WebAuthnCredential | credentialId | @unique | WebAuthn spec requirement |
| OAuthAccount | [provider, providerId] | @@unique | One user per provider identity |
| OAuthAccount | [userId, provider] | @@unique | One link per provider per user |

No missing unique constraints identified. All documented uniqueness invariants in data-model.md are enforced at the database level.

**Evidence**: `schema.prisma` lines 68, 148, 163, 188, 196, 223-224, 231, 250.

---

### D-13 — Seed Data Safety

**Verdict**: PASS

Seed file: `prisma/seed.ts` (113 lines)

**Checks performed:**

1. **No hardcoded secrets**: The seed file contains only permission definitions (key, description, resource, action) and role-permission mappings. No passwords, tokens, API keys, connection strings, or any sensitive data.

2. **Uses upsert**: Both data operations use `prisma.permission.upsert()` (line 79) and `prisma.rolePermission.upsert()` (line 95), ensuring idempotent execution. The upsert uses `where: { key: perm.key }` for permissions and `where: { role_permissionId: { role, permissionId } }` for role-permissions.

3. **No user creation**: The seed does not create any user accounts, which is correct — users should be created through the application's registration flow.

4. **Proper cleanup**: Uses `prisma.$disconnect()` in the `finally` block (line 112).

5. **No raw SQL**: Only Prisma Client methods are used.

**Evidence**: `prisma/seed.ts` lines 1-113.

---

### D-14 — No Raw Queries

**Verdict**: PASS

Grep for `$queryRawUnsafe`, `$executeRawUnsafe`, `$queryRaw`, and `$executeRaw` across the entire `nexacore-api/` directory returned **zero matches**.

All database operations use Prisma Client's type-safe query builder. No raw SQL injection vectors exist.

**Evidence**: Grep search across `nexacore-api/` with pattern `\$queryRawUnsafe|\$executeRawUnsafe|\$queryRaw|\$executeRaw` — no matches.

---

## WARN Summary

| ID | Finding | Severity | Standard |
|----|---------|----------|----------|
| D-02 | Session and WebAuthnCredential field description sections in data-model.md omit `updatedAt` (present in schema and embedded Prisma block); also data-model.md Prisma Schema note incorrectly states "12 implemented models" instead of 10 | LOW | CWE-1049 |
| D-11 | Permission model lacks `updatedAt` despite being mutable via seed upsert | LOW | NIST AU-8 |

---

## Recurrence Analysis

| Finding | Previous Audit (2026-03-13) | Current Status |
|---------|---------------------------|----------------|
| D-11 (updatedAt on token models) | FAIL — EmailVerificationToken, PasswordResetToken, Session, WebAuthnCredential lacked updatedAt | **RESOLVED** — Migration `20260313000000` and `20260314000000` added updatedAt to all four models |
| D-02 (field doc inconsistency) | Not flagged | **NEW** — Session and WebAuthnCredential field descriptions still omit updatedAt text |
| D-11 (Permission updatedAt) | Not flagged | **NEW** — Minor, seed-only mutation path |
