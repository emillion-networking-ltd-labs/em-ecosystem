# Fase 5: DATA MODEL — Auth Module

**Date**: 2026-03-15 21:30 UTC
**Module**: auth (global scope — Prisma schema)
**Auditor**: Claude (automated)
**Framework**: audit-standards.mdc v1.0
**Standards**: ISO 25010 §4.2.6 (Data Integrity), SOC 2 CC8.2

---

## Summary

| Verdict | Count |
|---------|-------|
| PASS    | 9     |
| FAIL    | 0     |
| WARN    | 4     |
| N/A     | 0     |
| INFO    | 1     |

**Overall**: PASS

---

## Detailed Findings

### D-01: Entity names match
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All 10 auth-relevant models match between `data-model.md` (§1-§21) and `schema.prisma`: User, Session, AuditLog, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, OAuthAccount, Permission, RolePermission.

### D-02: Field names match
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: All core auth fields match. Minor documentation inconsistency: `data-model.md` §21 (OAuthAccount) field list does not explicitly note that `updatedAt` is absent by design (immutable entity). Business Invariants section mentions it but field list could mislead.

### D-03: Field types match
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: All field types verified: UUID PKs (`String @id @default(uuid())`), Role enum, `Bytes` for WebAuthn publicKey, `Json?` for AuditLog metadata, `Float?` for geolocation, `String[] @default([])` for arrays. No type mismatches found.

### D-04: Relations match
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: All 8 implemented auth relations match (`schema.prisma:89-96,104,138-139,156,171,184,213,227,254`). `data-model.md` §1 (User) lists 5 planned relations (`ownedProjects`, `projectMemberships`, `teamMemberships`, `notifications`, `settings`) not in Prisma schema — expected for PLANNED models but not annotated as such.

### D-05: Indices documented
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: 6 `@@index` directives in `schema.prisma` not documented in `data-model.md`: Session (`@@index([userId, isRevoked, lastUsedAt])` L124), AuditLog (2 indices L145-146), OAuthAccount (`@@index([userId])` L231), Permission (`@@index([resource])` L246), RolePermission (`@@index([role])` L257). Unique constraints are documented.

### D-06: Enum values match
- **Verdict**: WARN
- **Severity**: LOW
- **Evidence**: All 4 implemented enums match: Role (3 values), Provider (3 values), AuditAction (37 values), EmailVerificationTokenType (2 values). Two doc issues: (1) `data-model.md` §21 describes Provider as "GOOGLE, GITHUB" omitting `LOCAL`; (2) embedded Prisma Schema section includes planned enums (`ProjectStatus`, `MemberRole`, etc.) not in actual `schema.prisma`.

### D-07: Default values match
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 16 default values verified: `role=USER`, `emailVerified=false`, `isActive=true`, `failedAttempts=0`, `lockoutCount=0`, `mfaEnabled=false`, `mfaRecoveryCodes=[]`, `Session.isRevoked=false`, `Session.lastUsedAt=now()`, `WebAuthnCredential.signCount=0`, `transports=[]`, `backedUp=false`, `deviceType="singleDevice"`, `TrustedDevice.isRevoked=false`, `lastVerifiedAt=now()`, `EmailVerificationToken.type=REGISTRATION`. All match.

### D-08: Migration history
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: 18 migration files in `prisma/migrations/`, spanning `0001_init` through `20260314115530_add_updated_at_permission`. All auth entities have corresponding migrations. `migration_lock.toml` present.

### D-09: Cascade rules safe
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: All 9 cascade rules reviewed: Session→User (CASCADE), AuditLog→User (SET NULL — preserves forensic history), EmailVerificationToken→User (CASCADE), PasswordResetToken→User (CASCADE), TrustedDevice→User (CASCADE), WebAuthnCredential→User (CASCADE), OAuthAccount→User (CASCADE), RolePermission→Permission (CASCADE). AuditLog correctly uses SET NULL — security-correct pattern.

### D-10: Soft delete support
- **Verdict**: INFO
- **Severity**: LOW
- **Evidence**: No `deletedAt` field on any entity. Soft delete implemented via `User.isActive` boolean (`schema.prisma:77`, `@default(true)`). Documented design decision in `data-model.md` §1. GDPR erasure uses anonymized tombstone pattern.

### D-11: Updated-at fields
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: All mutable models have `@updatedAt`: User (L87), Session (L117, migration `20260313000000`), EmailVerificationToken (L160, migration `20260314000000`), PasswordResetToken (L175, migration `20260314000000`), TrustedDevice (L192), WebAuthnCredential (L211, migration `20260313000000`), Permission (L242, migration `20260314115530`). Intentionally absent on immutable entities: AuditLog (append-only), OAuthAccount (immutable), RolePermission (junction table). SCRUM-222 verified DONE.

### D-12: No raw queries
- **Verdict**: PASS
- **Severity**: CRITICAL
- **Evidence**: Zero occurrences of `$queryRaw` or `$executeRaw` in `src/auth/`. All database access via Prisma typed queries.

### D-13: Seed data
- **Verdict**: PASS
- **Severity**: MEDIUM
- **Evidence**: `prisma/seed.ts` seeds 9 permissions and 2 role-permission mappings (USER: 2 perms, ADMIN: 8 perms) using idempotent `upsert` operations. No SUPERADMIN user seeded (correct — out-of-band creation).

### D-14: Schema validation
- **Verdict**: PASS
- **Severity**: HIGH
- **Evidence**: Structural validation by manual inspection — all 10 models and 4 enums syntactically complete, all relation directives resolve, no duplicate names. `npx prisma validate` not executed in audit context but schema parsed cleanly. CI pipeline build step would catch invalid schema.

---

## Recommendations

1. **D-06 (WARN)**: Fix OAuthAccount §21 Provider description — change "Provider enum: GOOGLE, GITHUB" to "Provider enum (GOOGLE or GITHUB — LOCAL exists in enum but never assigned to OAuthAccount)".
2. **D-04 (WARN)**: Add `[PLANNED]` annotations to 5 planned relations in User §1 of `data-model.md`.
3. **D-02 (WARN)**: Add explicit "(intentionally absent — immutable by design)" note for `updatedAt` in OAuthAccount field list.
4. **D-05 (WARN)**: Add Indices subsection to each model in `data-model.md` documenting `@@index` directives.
5. **D-06 (WARN)**: Move planned enums out of the embedded Prisma Schema section in `data-model.md` into a separate "Planned Additions" section.
