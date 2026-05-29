# Fase 5: DATA MODEL — global

**Date**: 2026-05-09 01:10 UTC
**Module**: auth (global phase, run once)
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC7.5, CC8.1, NIST AU-8, CWE-1049, CWE-89
**Previous baseline**: audit-2026-05-06T22-44 (11 PASS / 2 WARN / 1 FAIL — 78.6%) — D-02-A was FAIL (User.deletedAt undocumented)

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 13    |
| FAIL    | 0     |
| WARN    | 1     |
| N/A     | 0     |

**Overall**: PASS (no FAIL — D-02-A resolved since previous audit)

---

## Detailed Findings

### D-01: Model count
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `schema.prisma` declares 10 models (`User, Session, AuditLog, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, OAuthAccount, Permission, RolePermission`) at lines 67, 105, 132, 154, 170, 185, 203, 223, 239, 254. data-model.md sections 1–7, 19–21 mark these IMPLEMENTED. Counts match.
- **Standard**: SOC 2 CC8.1

### D-02: Field inventory (especially User.deletedAt)
- **Verdict**: PASS
- **Severity**: HIGH (was D-02-A FAIL in previous audit)
- **Evidence**: `schema.prisma:84` `deletedAt DateTime?` on User. data-model.md `### 1. User [IMPLEMENTED]` block now documents deletedAt explicitly: *"Tombstone for GDPR Article 17 (Right to Erasure). When a user requests account deletion, the row is marked with this timestamp instead of being hard-deleted..."* — both prose and field listing. **D-02-A FAIL closed.**
- **Standard**: SOC 2 CC8.1

### D-03: Enum values
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: 4 enums in schema.prisma — Role (3 values), Provider (3 values), AuditAction (40 values), EmailVerificationTokenType (2 values). All documented in data-model.md sections under "Enums" with matching values. AuditAction recently extended for OAUTH_AUTO_VERIFIED (migration 20260328194437) — documented.

### D-04: Relations
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `@relation` directives on User → Session/AuditLog/EmailVerificationToken/PasswordResetToken/TrustedDevice/WebAuthnCredential/OAuthAccount; AuditLog → user/targetUser; Permission → RolePermission. data-model.md prose describes all bidirectional relationships.

### D-05: Indices
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `@@index` declarations on all queryable foreign keys (userId, tokenFamily, action, createdAt, etc.). Compound indices (`[userId, isRevoked, lastUsedAt]`, `[action, userId, createdAt]`, `[action, ipAddress, createdAt]`) added in migrations 20260302113638 and beyond. All indices documented in spec.

### D-06: Default values
- **Verdict**: PASS
- **Severity**: LOW
- **Evidence**: `@default(uuid())`, `@default(now())`, `@default(false)`, `@default(USER)` (Role), `@default(REGISTRATION)` (TokenType), `@default([])` (recovery codes, transports), `@default("singleDevice")` (device type). All match documented defaults.

### D-07: Migration integrity
- **Verdict**: PASS (inferred from build/test pass)
- **Severity**: CRITICAL
- **Evidence**: `prisma/migrations/` has 22 versioned folders + `migration_lock.toml`. Tests pass (607/607) against the test DB, implying migrations apply cleanly. Production migration status not verifiable in audit harness.

### D-08: Migrations versioned
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `prisma/migrations/` directory contains 22 timestamp-prefixed folders, all in version control. Latest: `20260418165311_add_user_deleted_at` (2026-04-18).

### D-09: Cascade delete safety
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: `grep "onDelete: Cascade"` on schema.prisma — 7 cascades:
  - Session → User (line 107) — sessions belong to user, OK
  - EmailVerificationToken → User (line 159) — tokens belong to user, OK
  - PasswordResetToken → User (line 174) — tokens belong to user, OK
  - TrustedDevice → User (line 188) — devices belong to user, OK
  - WebAuthnCredential → User (line 215) — passkeys belong to user, OK
  - OAuthAccount → User (line 232) — OAuth links belong to user, OK
  - RolePermission → Permission (line 259) — junction row, OK
  - AuditLog uses `onDelete: SetNull` (lines 144-146) — audit log retained when user deleted, correct GDPR posture
- All cascades intentional and consistent with GDPR/audit-trail design.
- **Standard**: Data safety

### D-10: createdAt fields
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All 10 models have `createdAt DateTime @default(now())`.
- **Standard**: NIST AU-8, SOC 2 CC7.1

### D-11: updatedAt fields
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All mutable models have `updatedAt DateTime @updatedAt`: User, Session, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, Permission, RolePermission. AuditLog and OAuthAccount are append-only — intentionally no updatedAt.

### D-12: Unique constraints
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: `User.email @unique`, `Session` (no natural unique — uses uuid PK), `EmailVerificationToken.tokenHash @unique`, `PasswordResetToken.tokenHash @unique`, `TrustedDevice @@unique([userId, fingerprintHash])`, `WebAuthnCredential.credentialId @unique`, `OAuthAccount @@unique([provider, providerId])` + `@@unique([userId, provider])`, `Permission.key @unique`, `RolePermission @@unique([role, permissionId])`.

### D-13: Seed data safety
- **Verdict**: WARN (out of audit scope deeper review)
- **Severity**: MEDIUM
- **Evidence**: `prisma/seed.ts` exists per `package.json:prisma.seed`. Previous audits verified upsert pattern + no production credentials. Carry-forward.

### D-14: No raw queries
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: grep `queryRawUnsafe\|executeRawUnsafe\|\\$queryRaw\b\|\\$executeRaw\b` in `src/` non-test → 0 results.
- **Standard**: CWE-89

---

## Recommendations

None at this time. The previous audit's only FAIL (D-02-A — User.deletedAt undocumented) is resolved in data-model.md.
