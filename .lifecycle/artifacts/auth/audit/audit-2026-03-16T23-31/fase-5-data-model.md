# Phase 5: Data Model Audit — Auth Module

**Date**: 2026-03-16T23:31
**Auditor**: Claude Opus 4.6
**Scope**: Global — all models in `prisma/schema.prisma` vs `specs/data-model.md`
**Standards**: SOC 2 CC7.5, NIST AU-8, CWE-1049
**Previous audit**: audit-2026-03-16T22-30 (2 FAIL: D-02, D-08)

---

## D-01: All implemented models in schema.prisma are documented in data-model.md

**Verdict**: PASS

**Evidence**: schema.prisma contains 10 implemented models:
1. User (line 66)
2. Session (line 101)
3. AuditLog (line 128)
4. EmailVerificationToken (line 150)
5. PasswordResetToken (line 166)
6. TrustedDevice (line 181)
7. WebAuthnCredential (line 199)
8. OAuthAccount (line 219)
9. Permission (line 235)
10. RolePermission (line 250)

data-model.md Model Implementation Status table (lines 41-63) lists all 10 as "Implemented | Yes". The header at line 3 correctly states "21 entities (10 implemented, 11 planned)". The Prisma schema note at line 1112 correctly states "10 implemented models".

All 10 models are fully documented with fields, validation rules, business invariants, and relations.

---

## D-02: Embedded Prisma schema in data-model.md matches actual schema.prisma

**Verdict**: PASS

**Evidence**: Compared the embedded schema (data-model.md lines 1114-1447) with actual schema.prisma (lines 1-261) field by field for all 10 auth-relevant models:

**Permission model** (critical check from previous audit):
- data-model.md lines 1421-1434: includes `updatedAt DateTime @updatedAt` at line 1428
- schema.prisma lines 235-248: includes `updatedAt DateTime @updatedAt` at line 242
- **MATCH** -- Previous D-02 FAIL (missing updatedAt in Permission) is now RESOLVED.

**RolePermission model**:
- data-model.md lines 1436-1447: includes `updatedAt DateTime @updatedAt` at line 1442
- schema.prisma lines 250-261: includes `updatedAt DateTime @updatedAt` at line 256
- **MATCH**

**EmailVerificationToken model**:
- data-model.md lines 1336-1349: includes `updatedAt DateTime @updatedAt` at line 1345
- schema.prisma lines 150-164: includes `updatedAt DateTime @updatedAt` at line 160
- **MATCH**

**PasswordResetToken model**:
- data-model.md lines 1351-1363: includes `updatedAt DateTime @updatedAt` at line 1359
- schema.prisma lines 166-179: includes `updatedAt DateTime @updatedAt` at line 175
- **MATCH**

**OAuthAccount model**:
- data-model.md lines 1403-1417: fields match schema.prisma lines 219-233
- Both have: id, userId, provider, providerId, email, createdAt, @@unique constraints, @@index
- **MATCH**

All remaining models (User, Session, AuditLog, TrustedDevice, WebAuthnCredential) also match field-for-field. Enums (Role, Provider, AuditAction, EmailVerificationTokenType) match exactly.

---

## D-03: Field types and constraints match between spec and schema

**Verdict**: PASS

**Evidence**: Spot-checked critical fields across models:
- User.lockoutCount: data-model.md says "integer, default: 0", schema.prisma says `Int @default(0)` (line 80) -- MATCH
- Session.latitude/longitude: data-model.md says "Float", schema.prisma says `Float?` (lines 113-114) -- MATCH
- AuditLog.metadata: data-model.md says "JSON object", schema.prisma says `Json?` (line 135) -- MATCH
- WebAuthnCredential.publicKey: data-model.md says "raw bytes (PostgreSQL bytea)", schema.prisma says `Bytes` (line 203) -- MATCH
- OAuthAccount unique constraints: data-model.md and schema both have `@@unique([provider, providerId])` and `@@unique([userId, provider])` -- MATCH

---

## D-04: Relations documented correctly

**Verdict**: PASS

**Evidence**: Verified relation documentation for auth models:
- User.sessions: data-model.md line 120 says "One-to-many -> Session". schema.prisma line 89 has `sessions Session[]` -- MATCH
- User.oauthAccounts: data-model.md line 132 says "One-to-many -> OAuthAccount". schema.prisma line 96 has `oauthAccounts OAuthAccount[]` -- MATCH
- User.trustedDevices: data-model.md line 130. schema.prisma line 94 -- MATCH
- User.webAuthnCredentials: data-model.md line 131. schema.prisma line 95 -- MATCH
- Planned relations (ownedProjects, projectMemberships, etc.) are marked `[PLANNED]` in data-model.md -- CORRECT

---

## D-05: Database indices documented

**Verdict**: PASS

**Evidence**: data-model.md documents indices per model. Spot-checked:
- Session (data-model.md lines 177-181): 4 indices documented: `[userId]`, `[tokenFamily]`, `[userId, isRevoked]`, `[userId, isRevoked, lastUsedAt]`. schema.prisma lines 121-124: 4 matching `@@index` declarations -- MATCH
- AuditLog: data-model.md documents 6 indices. schema.prisma lines 141-146: 6 matching `@@index` declarations -- MATCH
- OAuthAccount: data-model.md documents `@@index([userId])`. schema.prisma line 231 -- MATCH

---

## D-06: Enum values match between spec and schema

**Verdict**: PASS

**Evidence**: Compared all 4 implemented enums:
- **Role**: data-model.md lists SUPERADMIN, ADMIN, USER. schema.prisma lines 9-13 -- MATCH (3 values)
- **Provider**: data-model.md lists LOCAL, GOOGLE, GITHUB. schema.prisma lines 15-19 -- MATCH (3 values)
- **AuditAction**: data-model.md embedded schema lines 1137-1175 lists 33 values. schema.prisma lines 21-59 lists 33 values -- MATCH
- **EmailVerificationTokenType**: data-model.md lists REGISTRATION, EMAIL_CHANGE. schema.prisma lines 61-64 -- MATCH (2 values)

---

## D-07: Sensitive fields annotated in both schema and docs

**Verdict**: PASS

**Evidence**: schema.prisma uses `/// @sensitive` comments on 8 fields:
- User.passwordHash (line 69), User.mfaSecret (line 82), User.mfaRecoveryCodes (line 84)
- Session.refreshTokenHash (line 106)
- EmailVerificationToken.tokenHash (line 152)
- PasswordResetToken.tokenHash (line 168)
- (TrustedDevice.fingerprintHash and WebAuthnCredential.publicKey also annotated)

data-model.md uses `[SENSITIVE]` badges on corresponding fields:
- passwordHash (line 76), mfaSecret (line 88), mfaRecoveryCodes (line 89)
- refreshTokenHash (line 144), tokenHash (lines 236, 274)
- fingerprintHash (line 803), publicKey (line 847)

All 8 sensitive fields are annotated in both locations.

---

## D-08: Prisma migrations directory tracked in version control

**Verdict**: PASS

**Evidence**: `nexacore-api/prisma/migrations/` directory exists and contains 19 migration directories plus `migration_lock.toml` (20 files total):
- 0001_init
- 20260225230005_add_profile_fields_and_superadmin
- 20260226171805_add_lockout_count
- 20260226180647_add_audit_log
- 20260226215701_add_mfa_fields
- 20260226220000_add_sessions_remove_user_refresh_token
- 20260227082218_add_email_verification_and_password_reset_tokens
- 20260227090901_add_permissions_rbac
- 20260302113638_add_session_idle_index_and_audit_actions
- 20260302134639_add_email_change_flow
- 20260302143930_add_account_self_deleted_action
- 20260304132222_add_session_geolocation_fields
- 20260309150542_add_oauth_accounts
- 20260309200000_remove_deprecated_user_provider_fields
- 20260311001758_add_oauth_register_audit_action
- 20260313000000_add_updated_at_session_webauthn
- 20260314000000_add_updated_at_token_models
- 20260314115530_add_updated_at_permission
- 20260316220000_add_role_permission_updated_at
- migration_lock.toml

Previous audit (D-08 FAIL) incorrectly flagged this as missing. The directory IS tracked and contains a complete migration history covering all schema changes.

---

## D-09: Cascade delete rules documented

**Verdict**: PASS

**Evidence**: schema.prisma cascade rules match data-model.md documentation:
- Session: `onDelete: Cascade` on userId (schema line 104) -- documented
- EmailVerificationToken: `onDelete: Cascade` (schema line 156) -- documented
- PasswordResetToken: `onDelete: Cascade` (schema line 171) -- documented
- TrustedDevice: `onDelete: Cascade` (schema line 184) -- documented
- WebAuthnCredential: `onDelete: Cascade` (schema line 213) -- documented
- OAuthAccount: `onDelete: Cascade` (schema line 227) -- documented
- AuditLog: `onDelete: SetNull` on userId and targetUserId (schema lines 138-139) -- documented (preserves audit trail)
- RolePermission: `onDelete: Cascade` on permissionId (schema line 254) -- documented

---

## D-10: Default values consistent between spec and schema

**Verdict**: PASS

**Evidence**: Spot-checked defaults:
- User.role: `@default(USER)` in schema (line 74), "default: USER" in data-model.md -- MATCH
- User.emailVerified: `@default(false)` in schema (line 75), "default: false" in data-model.md -- MATCH
- User.failedAttempts: `@default(0)` in schema (line 78), "default: 0" in data-model.md -- MATCH
- Session.isRevoked: `@default(false)` in schema (line 115), "default: false" in data-model.md -- MATCH
- WebAuthnCredential.signCount: `@default(0)` in schema (line 204), "default: 0" in data-model.md -- MATCH

---

## D-11: Timestamp fields (createdAt/updatedAt) present on all mutable models

**Verdict**: PASS

**Evidence**: All mutable models have both `createdAt` and `updatedAt`:
- User: createdAt (line 86), updatedAt (line 87) -- YES
- Session: createdAt (line 116), updatedAt (line 117) -- YES
- EmailVerificationToken: createdAt (line 159), updatedAt (line 160) -- YES
- PasswordResetToken: createdAt (line 174), updatedAt (line 175) -- YES
- TrustedDevice: createdAt (line 191), updatedAt (line 192) -- YES
- WebAuthnCredential: createdAt (line 210), updatedAt (line 211) -- YES
- Permission: createdAt (line 241), updatedAt (line 242) -- YES
- RolePermission: createdAt (line 255), updatedAt (line 256) -- YES
- OAuthAccount: createdAt (line 225) -- only createdAt (immutable after creation, no updatable fields)
- AuditLog: createdAt (line 136) -- only createdAt (append-only, immutable by design)

OAuthAccount and AuditLog correctly have only `createdAt` as they are immutable records.

---

## D-12: Table mapping (@@map) documented correctly

**Verdict**: PASS

**Evidence**: All models use `@@map` with snake_case table names:
- User -> "users" (schema line 98, data-model.md embedded schema line 1285)
- Session -> "sessions" (line 125, 1311)
- AuditLog -> "audit_logs" (line 147, 1333)
- EmailVerificationToken -> "email_verification_tokens" (line 163, 1348)
- PasswordResetToken -> "password_reset_tokens" (line 178, 1362)
- TrustedDevice -> "trusted_devices" (line 196, 1380)
- WebAuthnCredential -> "webauthn_credentials" (line 216, 1400)
- OAuthAccount -> "oauth_accounts" (line 232, 1416)
- Permission -> "permissions" (line 247, 1433)
- RolePermission -> "role_permissions" (line 260, 1446)

---

## D-13: Seed data documented

**Verdict**: PASS

**Evidence**: `prisma/seed.ts` exists (confirmed via directory listing). The integration-state.md documents the 9 permissions seeded by `PermissionsService.onModuleInit()` (lines 159-171) with their keys, resources, actions, and descriptions. Default role assignments documented (lines 173-179): USER gets 2, ADMIN gets all except permissions:write, SUPERADMIN bypasses.

---

## D-14: Model count in documentation header is accurate

**Verdict**: PASS

**Evidence**:
- data-model.md line 3: "21 entities (10 implemented, 11 planned)" -- CORRECT
- data-model.md line 1112: "10 implemented models and 4 implemented enums" -- CORRECT
- Model Implementation Status table (lines 41-63): 10 "Implemented", 11 "Planned" -- CORRECT
- Actual schema.prisma: 10 models, 4 enums -- MATCHES

---

## Recurrence Analysis (vs audit-2026-03-16T22-30)

| Previous Finding | Previous Verdict | Current Verdict | Status |
|-----------------|-----------------|-----------------|--------|
| D-02: Permission model missing updatedAt in embedded schema | FAIL | PASS | RESOLVED (updatedAt now at data-model.md line 1428) |
| D-08: Migrations directory not tracked | FAIL | PASS | RESOLVED (19 migrations + lock file present; previous audit was incorrect) |

**All 2 previous FAILs resolved. 0 regressions.**

---

## Summary

| Check | Description | Verdict |
|-------|-------------|---------|
| D-01 | All models documented | PASS |
| D-02 | Embedded schema matches actual | PASS |
| D-03 | Field types/constraints match | PASS |
| D-04 | Relations documented | PASS |
| D-05 | Database indices documented | PASS |
| D-06 | Enum values match | PASS |
| D-07 | Sensitive fields annotated | PASS |
| D-08 | Migrations tracked in VCS | PASS |
| D-09 | Cascade delete rules | PASS |
| D-10 | Default values consistent | PASS |
| D-11 | Timestamp fields present | PASS |
| D-12 | Table mapping correct | PASS |
| D-13 | Seed data documented | PASS |
| D-14 | Model count accurate | PASS |

**Overall Phase 5 Verdict**: **PASS** — 14 PASS, 0 WARN, 0 FAIL.
**FAIL count**: 0
**WARN count**: 0
