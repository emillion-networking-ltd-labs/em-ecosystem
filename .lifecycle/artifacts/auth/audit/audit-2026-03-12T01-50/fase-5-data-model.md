# Fase 5: DATA MODEL — Global

**Date**: 2026-03-12 02:30
**Module**: global
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: SOC 2 CC7.5, NIST AU-8, CWE-1049

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 11    |
| FAIL    | 1     |
| WARN    | 1     |
| N/A     | 1     |

**Overall**: FAIL (1 FAIL, 1 WARN)

---

## Detailed Findings

### D-01: Model count
- **Verdict**: FAIL
- **Severity**: MEDIUM
- **Evidence**: schema.prisma has 10 models. data-model.md documents 21. 11 models absent (Project, ProjectMember, Team, TeamMember, Notification, Subscription, Invoice, Setting, PlatformModule, ProjectModule, App). Header says "19 entities" but ToC lists 21.
- **Expected**: Counts match or spec clearly marks planned vs implemented
- **Actual**: 11 planned models not yet implemented — known sprint-bounded gap
- **Standard**: SOC 2 CC8.1

### D-02: Field inventory
- **Verdict**: PASS
- **Evidence**: All 10 implemented models have exact field match with spec. No field drift.

### D-03: Enum values
- **Verdict**: PASS
- **Evidence**: 4/13 enums implemented (Role, Provider, AuditAction, EmailVerificationTokenType). All values match exactly. 9 future enums absent (expected).

### D-04: Relations
- **Verdict**: PASS
- **Evidence**: All @relation directives match spec. AuditLog uses named relations for dual User references.

### D-05: Indices
- **Verdict**: PASS
- **Evidence**: All @@index and @@unique constraints match spec across all 10 models.

### D-06: Default values
- **Verdict**: PASS
- **Evidence**: All @default values match spec exactly (17 defaults verified).

### D-07: Migration integrity
- **Verdict**: N/A
- **Evidence**: Could not run `prisma migrate status` (requires live DB connection). 15 migration files present and internally consistent with current schema via static analysis.

### D-08: Migration files versioned
- **Verdict**: PASS
- **Evidence**: `prisma/migrations/` not excluded by .gitignore. 15 migration folders + migration_lock.toml present.

### D-09: Cascade delete safety
- **Verdict**: PASS
- **Evidence**: 7 cascade deletes, all on User→child relations (sessions, tokens, devices, passkeys, OAuth accounts). AuditLog uses `onDelete: SetNull` (preserves audit trail). No cross-entity cascade chains.

### D-10: createdAt on all models
- **Verdict**: PASS
- **Evidence**: 10/10 models have `createdAt DateTime @default(now())`.

### D-11: updatedAt on mutable models
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 5 mutable models missing `@updatedAt`: Session, EmailVerificationToken, PasswordResetToken, WebAuthnCredential, Permission. Domain-specific timestamps (`lastUsedAt`, `usedAt`) partially compensate.
- **Expected**: All mutable models have updatedAt
- **Actual**: 5 models rely on domain-specific timestamps instead

### D-12: Unique constraints
- **Verdict**: PASS
- **Evidence**: All security-critical uniqueness enforced: User.email, token hashes, TrustedDevice fingerprint, WebAuthnCredential.credentialId, OAuthAccount provider+providerId, Permission.key, RolePermission role+permissionId.

### D-13: Seed data safety
- **Verdict**: PASS
- **Evidence**: No seed.ts/seed.js file exists. No prisma.seed script configured. Permissions seeded via application bootstrap logic.

### D-14: No raw queries
- **Verdict**: PASS
- **Evidence**: 0 occurrences of $queryRawUnsafe, $executeRawUnsafe, $queryRaw, $executeRaw across entire src/.

---

## Recommendations

1. **D-01** (FAIL): Update data-model.md header count. Clearly mark planned vs implemented models (e.g., status column: Implemented/Planned).
2. **D-11** (WARN): Add `updatedAt @updatedAt` to Session, WebAuthnCredential, and Permission models for audit trail consistency.
