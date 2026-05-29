# Phase 5: Data Model Audit

**Date**: 2026-03-13
**Auditor**: Claude Opus 4.6
**Scope**: Global (all implemented models)
**Schema**: `nexacore-api/prisma/schema.prisma`
**Documentation**: `ai-specs/specs/data-model.md`

---

## Summary

| Metric | Value |
|--------|-------|
| Total checks | 14 |
| PASS | 11 |
| WARN | 2 |
| FAIL | 1 |

---

## Check Results

### D-01: Model Count — PASS

| Source | Implemented Models | Planned Models | Total |
|--------|--------------------|----------------|-------|
| schema.prisma | 10 | — | 10 |
| data-model.md | 10 | 11 | 21 |

**Implemented models in schema.prisma** (10):
1. User
2. Session
3. AuditLog
4. EmailVerificationToken
5. PasswordResetToken
6. TrustedDevice
7. WebAuthnCredential
8. OAuthAccount
9. Permission
10. RolePermission

**Documented as implemented in data-model.md** (10): Same 10 models. Exact match.

**Planned models documented** (11): Project, ProjectMember, Team, TeamMember, Notification, Subscription, Invoice, Setting, PlatformModule, ProjectModule, App — none are in schema.prisma. Consistent.

**Note**: The data-model.md header says "21 entities (10 implemented, 11 planned)" which is accurate. The Prisma Schema section within data-model.md includes both implemented AND planned models, which could cause confusion, but the Implementation Status table clearly marks each model's status.

---

### D-02: Field Inventory — PASS

All fields in schema.prisma match the field descriptions in data-model.md for every implemented model.

| Model | Schema Fields | Doc Fields | Match |
|-------|--------------|------------|-------|
| User | 17 scalar + 8 relations | 17 scalar + 8 relations | YES |
| Session | 14 scalar + 1 relation | 14 scalar + 1 relation | YES |
| AuditLog | 7 scalar + 2 relations | 7 scalar + 2 relations | YES |
| EmailVerificationToken | 6 scalar + 1 relation | 6 scalar + 1 relation | YES |
| PasswordResetToken | 5 scalar + 1 relation | 5 scalar + 1 relation | YES |
| TrustedDevice | 9 scalar + 1 relation | 9 scalar + 1 relation | YES |
| WebAuthnCredential | 11 scalar + 1 relation | 11 scalar + 1 relation | YES |
| OAuthAccount | 5 scalar + 1 relation | 5 scalar + 1 relation | YES |
| Permission | 5 scalar + 1 relation | 5 scalar + 1 relation | YES |
| RolePermission | 4 scalar + 1 relation | 4 scalar + 1 relation | YES |

**Detail**: The doc's field descriptions section for User lists relations to planned models (ownedProjects, projectMemberships, teamMemberships, notifications, settings) which are not in the actual schema.prisma. This is expected since those are planned. The doc's Prisma Schema section includes these planned relations — this is a documentation-only concern (the Prisma schema copy in the doc is aspirational, not a reflection of current reality). The actual schema.prisma is the source of truth.

---

### D-03: Enum Values — PASS

| Enum | Schema Values | Doc Values | Match |
|------|--------------|------------|-------|
| Role | SUPERADMIN, ADMIN, USER | SUPERADMIN, ADMIN, USER | YES |
| Provider | LOCAL, GOOGLE, GITHUB | LOCAL, GOOGLE, GITHUB | YES |
| AuditAction | 35 values | 35 values | YES |
| EmailVerificationTokenType | REGISTRATION, EMAIL_CHANGE | REGISTRATION, EMAIL_CHANGE | YES |

**AuditAction values verified** (all 35 match between schema and doc):
LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, REGISTER, TOKEN_REFRESH, OAUTH_LOGIN, ACCOUNT_LOCKED, ACCOUNT_UNLOCKED, PASSWORD_CHANGE, PROFILE_UPDATE, USER_ROLE_CHANGE, USER_DEACTIVATED, USER_ACTIVATED, USER_DELETED, SUPERADMIN_BYPASS, MFA_ENABLED, MFA_DISABLED, SESSION_IDLE_REVOKED, SESSION_LIMIT_EXCEEDED, EMAIL_CHANGE_REQUESTED, EMAIL_CHANGED, ACCOUNT_SELF_DELETED, DEVICE_TRUSTED, DEVICE_UNTRUSTED, IMPOSSIBLE_TRAVEL_DETECTED, LOGIN_BLOCKED_TRAVEL, BRUTE_FORCE_DETECTED, CREDENTIAL_STUFFING_DETECTED, UNUSUAL_LOGIN_HOURS, NEW_COUNTRY_LOGIN, PASSKEY_REGISTERED, PASSKEY_DELETED, PASSKEY_AUTH_SUCCESS, PASSKEY_AUTH_FAILURE, OAUTH_UNLINKED, OAUTH_LINKED, OAUTH_REGISTER.

**Planned enums in doc** (10): ProjectStatus, MemberRole, NotificationType, NotificationStatus, BillingPlan, BillingStatus, InvoiceStatus, SettingScope, ModuleStatus, AppStatus — none in actual schema.prisma. The Prisma schema copy within data-model.md includes these planned enums, consistent with its aspirational nature.

---

### D-04: Relations — PASS

All `@relation` directives in schema.prisma are documented in data-model.md.

| Relation | Schema Directive | Documented |
|----------|-----------------|-----------|
| User.auditLogs | @relation("AuditLogUser") | YES |
| User.auditLogsTarget | @relation("AuditLogTarget") | YES |
| User.emailVerificationTokens | @relation("UserEmailVerificationTokens") | YES |
| User.passwordResetTokens | @relation("UserPasswordResetTokens") | YES |
| Session.user → User | fields: [userId], onDelete: Cascade | YES |
| AuditLog.user → User | fields: [userId], onDelete: SetNull | YES |
| AuditLog.targetUser → User | fields: [targetUserId], onDelete: SetNull | YES |
| EmailVerificationToken.user → User | fields: [userId], onDelete: Cascade | YES |
| PasswordResetToken.user → User | fields: [userId], onDelete: Cascade | YES |
| TrustedDevice.user → User | fields: [userId], onDelete: Cascade | YES |
| WebAuthnCredential.user → User | fields: [userId], onDelete: Cascade | YES |
| OAuthAccount.user → User | fields: [userId], onDelete: Cascade | YES |
| RolePermission.permission → Permission | fields: [permissionId], onDelete: Cascade | YES |

---

### D-05: Indices — PASS

All `@@index` and `@@unique` directives in schema.prisma are documented in the Prisma Schema section of data-model.md.

| Model | Index/Unique | Documented |
|-------|-------------|-----------|
| Session | @@index([userId]) | YES |
| Session | @@index([tokenFamily]) | YES |
| Session | @@index([userId, isRevoked]) | YES |
| Session | @@index([userId, isRevoked, lastUsedAt]) | YES |
| AuditLog | @@index([action]) | YES |
| AuditLog | @@index([userId]) | YES |
| AuditLog | @@index([targetUserId]) | YES |
| AuditLog | @@index([createdAt]) | YES |
| AuditLog | @@index([action, userId, createdAt]) | YES |
| AuditLog | @@index([action, ipAddress, createdAt]) | YES |
| EmailVerificationToken | @@index([userId]) | YES |
| PasswordResetToken | @@index([userId]) | YES |
| TrustedDevice | @@unique([userId, fingerprintHash]) | YES |
| TrustedDevice | @@index([userId, isRevoked, expiresAt]) | YES |
| WebAuthnCredential | @@index([userId]) | YES |
| OAuthAccount | @@unique([provider, providerId]) | YES |
| OAuthAccount | @@unique([userId, provider]) | YES |
| OAuthAccount | @@index([userId]) | YES |
| Permission | @@index([resource]) | YES |
| RolePermission | @@unique([role, permissionId]) | YES |
| RolePermission | @@index([role]) | YES |

---

### D-06: Default Values — PASS

All `@default` directives match between schema.prisma and data-model.md.

| Model.Field | Default | Documented |
|-------------|---------|-----------|
| User.role | @default(USER) | YES |
| User.emailVerified | @default(false) | YES |
| User.isActive | @default(true) | YES |
| User.failedAttempts | @default(0) | YES |
| User.lockoutCount | @default(0) | YES |
| User.mfaEnabled | @default(false) | YES |
| User.mfaRecoveryCodes | @default([]) | YES |
| Session.isRevoked | @default(false) | YES |
| Session.lastUsedAt | @default(now()) | YES |
| EmailVerificationToken.type | @default(REGISTRATION) | YES |
| TrustedDevice.lastVerifiedAt | @default(now()) | YES |
| TrustedDevice.isRevoked | @default(false) | YES |
| WebAuthnCredential.signCount | @default(0) | YES |
| WebAuthnCredential.transports | @default([]) | YES |
| WebAuthnCredential.backedUp | @default(false) | YES |
| WebAuthnCredential.deviceType | @default("singleDevice") | YES |
| All id fields | @default(uuid()) | YES |
| All createdAt fields | @default(now()) | YES |

---

### D-07: Migration Integrity — WARN

**Severity**: Low
**Standard**: SOC 2 CC8.1 (Change Management)

Cannot run `npx prisma migrate status` — no database connection available in this audit environment. Manual verification recommended.

**Migration files present** (16 migrations):
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

Migration names are descriptive and sequential. The `migration_lock.toml` is present.

---

### D-08: Migration Files Versioned — WARN

**Severity**: Low
**Standard**: SOC 2 CC8.1 (Change Management)

The `prisma/migrations/` directory exists with 16 migrations and `migration_lock.toml`. However, no `.git` repository was detected in the workspace root. Cannot verify git versioning status. The working directory (`EMILLION NETWORKING LABS`) is not a git repo — the actual git repo is likely within `em-ecosystem-code/`. This is a structural observation, not a failure.

**Recommendation**: Verify that `em-ecosystem-code/` git history includes all 16 migration directories.

---

### D-09: Cascade Delete Safety — PASS

**Severity**: N/A (all cascades are intentional and documented)

Cascade deletes found in schema.prisma:

| Relation | onDelete | Safety Assessment |
|----------|----------|-------------------|
| Session → User | Cascade | SAFE — sessions are user-owned, must be deleted with user |
| EmailVerificationToken → User | Cascade | SAFE — tokens are user-specific, no value without user |
| PasswordResetToken → User | Cascade | SAFE — tokens are user-specific, no value without user |
| TrustedDevice → User | Cascade | SAFE — devices are user-specific |
| WebAuthnCredential → User | Cascade | SAFE — credentials are user-specific |
| OAuthAccount → User | Cascade | SAFE — OAuth links are user-specific |
| RolePermission → Permission | Cascade | SAFE — junction table entry, no value without permission |

**Non-cascade deletes** (correct):
| Relation | onDelete | Reason |
|----------|----------|--------|
| AuditLog.user → User | SetNull | CORRECT — audit logs preserved for forensics |
| AuditLog.targetUser → User | SetNull | CORRECT — audit logs preserved for forensics |

No dangerous cascade paths detected. All cascades flow from parent (User/Permission) to dependent child records. No cross-entity cascades that could cause data loss.

---

### D-10: Audit Trail — createdAt on ALL Models — PASS

All 10 implemented models have `createdAt DateTime @default(now())`:

| Model | createdAt Present |
|-------|------------------|
| User | YES |
| Session | YES |
| AuditLog | YES |
| EmailVerificationToken | YES |
| PasswordResetToken | YES |
| TrustedDevice | YES |
| WebAuthnCredential | YES |
| OAuthAccount | YES |
| Permission | YES |
| RolePermission | YES |

---

### D-11: Audit Trail — updatedAt on ALL Mutable Models — FAIL

**Severity**: Medium
**Standard**: SOC 2 CC6.1 (Logical Access Controls), ISO 27001 A.12.4.1 (Event Logging)

| Model | Mutable? | updatedAt Present |
|-------|----------|------------------|
| User | YES | YES — `@updatedAt` |
| Session | YES (isRevoked, refreshTokenHash, lastUsedAt) | YES — `@updatedAt` |
| AuditLog | NO (append-only) | N/A — correctly absent |
| EmailVerificationToken | YES (usedAt) | NO |
| PasswordResetToken | YES (usedAt) | NO |
| TrustedDevice | YES (isRevoked, lastVerifiedAt) | YES — `@updatedAt` |
| WebAuthnCredential | YES (signCount, lastUsedAt, name) | YES — `@updatedAt` |
| OAuthAccount | NO (immutable, created or deleted) | N/A — correctly absent |
| Permission | NO (seeded, managed by SUPERADMIN only) | N/A — acceptable |
| RolePermission | NO (junction, created or deleted) | N/A — acceptable |

**Finding**: `EmailVerificationToken` and `PasswordResetToken` are mutable (their `usedAt` field gets updated when the token is consumed) but lack `updatedAt`. While these are effectively single-use tokens where `usedAt` serves as the mutation timestamp, adding `updatedAt` would provide a consistent audit trail and detect any unexpected mutations.

**Recommendation**: Add `updatedAt DateTime @updatedAt` to `EmailVerificationToken` and `PasswordResetToken` models for audit trail completeness. Low risk since `usedAt` already timestamps the primary mutation event.

---

### D-12: Unique Constraints — PASS

| Requirement | Constraint | Present |
|-------------|-----------|---------|
| Email unique | User.email @unique | YES |
| Session token family | Session — no unique (correct, multiple sessions per family via rotation) | N/A |
| Verification token hash | EmailVerificationToken.tokenHash @unique | YES |
| Reset token hash | PasswordResetToken.tokenHash @unique | YES |
| MFA identifiers | User.mfaSecret — not unique (correct, each user has their own) | N/A |
| Passkey credential ID | WebAuthnCredential.credentialId @unique | YES |
| Trusted device fingerprint | TrustedDevice @@unique([userId, fingerprintHash]) | YES |
| OAuth provider identity | OAuthAccount @@unique([provider, providerId]) | YES |
| OAuth one-per-user-per-provider | OAuthAccount @@unique([userId, provider]) | YES |
| Permission key | Permission.key @unique | YES |
| Role-permission junction | RolePermission @@unique([role, permissionId]) | YES |

All security-critical unique constraints are in place.

---

### D-13: Seed Data Safety — PASS

**File**: `prisma/seed.ts`

| Check | Result |
|-------|--------|
| Hardcoded passwords | NONE — seed only creates Permission and RolePermission records |
| Hardcoded emails | NONE |
| Production credentials | NONE |
| API keys / secrets | NONE |
| Idempotency | YES — uses `prisma.permission.upsert()` and `prisma.rolePermission.upsert()` with proper `where` clauses |
| Error handling | YES — `.catch()` with `process.exit(1)` and `.finally()` with `$disconnect()` |
| User creation | NONE — seed does not create user accounts |

The seed file is safe for production use. It only seeds the RBAC permission catalog (9 permissions) and role-permission assignments (2 for USER, 8 for ADMIN). SUPERADMIN is intentionally excluded from role-permission assignments since it has implicit full access.

---

### D-14: No Raw Queries — PASS

**Standard**: OWASP ASVS V5.3 (SQL Injection Prevention), CWE-89

| Pattern | Files Found |
|---------|------------|
| `$queryRawUnsafe` | 0 |
| `$executeRawUnsafe` | 0 |
| `$queryRaw` | 0 |
| `$executeRaw` | 0 |

No raw SQL queries found anywhere in `src/`. All database operations use Prisma's type-safe query builder, which provides built-in parameterized queries and SQL injection protection.

---

## Findings Summary

| ID | Check | Severity | Result | Standard |
|----|-------|----------|--------|----------|
| D-01 | Model count | — | PASS | — |
| D-02 | Field inventory | — | PASS | — |
| D-03 | Enum values | — | PASS | — |
| D-04 | Relations | — | PASS | — |
| D-05 | Indices | — | PASS | — |
| D-06 | Default values | — | PASS | — |
| D-07 | Migration integrity | Low | WARN | SOC 2 CC8.1 |
| D-08 | Migration files versioned | Low | WARN | SOC 2 CC8.1 |
| D-09 | Cascade delete safety | — | PASS | — |
| D-10 | createdAt on all models | — | PASS | — |
| D-11 | updatedAt on mutable models | Medium | FAIL | SOC 2 CC6.1, ISO 27001 A.12.4.1 |
| D-12 | Unique constraints | — | PASS | — |
| D-13 | Seed data safety | — | PASS | — |
| D-14 | No raw queries | — | PASS | OWASP ASVS V5.3, CWE-89 |

---

## Actionable Items

### FAIL — D-11: Missing updatedAt on Token Models

**Models affected**: `EmailVerificationToken`, `PasswordResetToken`
**Risk**: Incomplete audit trail for token mutation events. While `usedAt` captures the primary use case, `updatedAt` would detect unexpected field changes.
**Remediation**: Add `updatedAt DateTime @updatedAt` to both models. Create a migration. Update data-model.md field descriptions.
**Priority**: Low-Medium (the `usedAt` field partially compensates)

### WARN — D-07 / D-08: Migration Status Unverifiable

**Issue**: No database connection available; git repo not at workspace root.
**Remediation**: Run `npx prisma migrate status` against a staging database. Verify `git log --oneline -- prisma/migrations/` in `em-ecosystem-code/` shows all 16 migrations committed.
**Priority**: Low (informational, likely already tracked in CI)
