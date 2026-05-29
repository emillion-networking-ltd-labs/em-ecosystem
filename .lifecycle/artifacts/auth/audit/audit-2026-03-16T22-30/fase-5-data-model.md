# Phase 5: DATA MODEL Audit (Global)

**Date**: 2026-03-16T22:30
**Auditor**: Claude Opus 4.6 (automated)
**Scope**: Global — all models in `prisma/schema.prisma` vs `specs/data-model.md`
**Standards**: SOC 2 CC7.5, NIST AU-8, CWE-1049

---

## Summary Table

| Check ID | Requirement | Verdict | Severity | Details |
|----------|------------|---------|----------|---------|
| D-01 | Model count: schema vs docs | WARN | MEDIUM | Live: 10 models. Docs header says "12 implemented models" but status table correctly lists 10. Embedded Prisma schema includes 21 (10 implemented + 11 planned) |
| D-02 | Field/type parity per model | FAIL | MEDIUM | Permission model in embedded Prisma schema missing `updatedAt` field that exists in live schema |
| D-03 | Enum value parity | PASS | — | All 4 implemented enums (Role, Provider, AuditAction, EmailVerificationTokenType) match exactly between live schema and docs |
| D-04 | @relation directives documented | PASS | — | All relations in live schema are documented in model descriptions and embedded Prisma schema |
| D-05 | @@index and @@unique parity | PASS | — | All indices and unique constraints in live schema match the docs (model descriptions + embedded Prisma schema) |
| D-06 | @default directives parity | PASS | — | All @default values in live schema match the docs |
| D-07 | Prisma migrate status | N/A | — | Cannot execute `npx prisma migrate status` — Bash tool not available. Manual verification required |
| D-08 | Migrations directory committed | FAIL | HIGH | `prisma/migrations/` directory does not exist. No migration files found |
| D-09 | Cascade delete review | PASS | — | 7 cascade deletes, all intentional and documented (see detailed findings) |
| D-10 | createdAt on all models | PASS | — | All 10 models have `createdAt DateTime @default(now())` |
| D-11 | updatedAt on mutable models | PASS | — | 8 of 10 models have `updatedAt @updatedAt`. AuditLog (append-only) and OAuthAccount (immutable) correctly omit it — both documented as design decisions |
| D-12 | @unique on identity fields | PASS | — | `User.email`, `EmailVerificationToken.tokenHash`, `PasswordResetToken.tokenHash`, `Permission.key`, `WebAuthnCredential.credentialId`, composite uniques on TrustedDevice, OAuthAccount, RolePermission — all present |
| D-13 | Seed file safety | PASS | — | `prisma/seed.ts` uses `upsert` for all operations, contains no credentials or secrets, only seeds Permission and RolePermission data |
| D-14 | Raw SQL usage | PASS | — | Zero instances of `$queryRawUnsafe`, `$executeRawUnsafe`, `$queryRaw`, or `$executeRaw` in `src/` |

---

## Verdict Summary

| Verdict | Count |
|---------|-------|
| PASS | 10 |
| FAIL | 2 |
| WARN | 1 |
| N/A | 1 |

---

## Detailed Findings

### D-01: Model Count — Schema vs Docs [WARN]

**Live schema** (`prisma/schema.prisma`): **10 models**
- User, Session, AuditLog, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, OAuthAccount, Permission, RolePermission

**Docs** (`specs/data-model.md`):
- Status table correctly lists 10 implemented + 11 planned = 21 total
- However, the note at the Prisma Schema section (line ~1112) states: _"The Prisma schema below contains only the **12 implemented** models and 4 implemented enums"_ — this is incorrect. The embedded schema contains all 21 models (including planned ones), and the actual implemented count is 10, not 12.

**Evidence**: `data-model.md` line 1112: `> **Note**: The Prisma schema below contains only the 12 implemented models and 4 implemented enums.`

**Expected**: Note should say "10 implemented models" and acknowledge that the embedded schema also includes 11 planned models.

**Standard**: SOC 2 CC7.5 — documentation accuracy

---

### D-02: Field/Type Parity — Permission Model [FAIL]

**Severity**: MEDIUM
**Standard**: CWE-1049 (Inconsistent Documentation), SOC 2 CC7.5

**Live schema** (`prisma/schema.prisma` lines 235-248):
```prisma
model Permission {
  id          String           @id @default(uuid())
  key         String           @unique
  description String
  resource    String
  action      String
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt    // <-- EXISTS in live

  rolePermissions RolePermission[]

  @@index([resource])
  @@map("permissions")
}
```

**Embedded Prisma schema in docs** (data-model.md lines ~1421-1433):
```prisma
model Permission {
  id          String           @id @default(uuid())
  key         String           @unique
  description String
  resource    String
  action      String
  createdAt   DateTime         @default(now())
  // <-- updatedAt MISSING

  rolePermissions RolePermission[]

  @@index([resource])
  @@map("permissions")
}
```

The **model description section** for Permission (Section 6) correctly documents `updatedAt` as a field: _"updatedAt: Record update timestamp (auto-managed by Prisma @updatedAt)"_. Only the embedded Prisma code block is out of sync.

**Impact**: Documentation inconsistency — the prose section is correct but the embedded schema code is wrong.

---

### D-08: Migrations Directory Not Committed [FAIL]

**Severity**: HIGH
**Standard**: SOC 2 CC7.5 (Change Management), NIST CM-6

The `prisma/migrations/` directory does not exist in the codebase. No migration SQL files were found via glob search.

**Expected**: Migration files should be version-controlled to ensure reproducible database state and auditable schema changes.

**Impact**: Without committed migrations, database schema changes are not auditable. The project likely uses `prisma db push` for development, which is acceptable for early-stage projects but not for production deployments.

**Recommendation**: Before production deployment, generate and commit migration files using `npx prisma migrate dev`.

---

### D-09: Cascade Delete Review [PASS]

All 7 `onDelete: Cascade` directives are intentional and correctly documented:

| Model | Relation | onDelete | Justification |
|-------|----------|----------|--------------|
| Session | user → User | Cascade | User deletion removes all sessions |
| EmailVerificationToken | user → User | Cascade | User deletion removes all verification tokens |
| PasswordResetToken | user → User | Cascade | User deletion removes all reset tokens |
| TrustedDevice | user → User | Cascade | User deletion removes all trusted devices |
| WebAuthnCredential | user → User | Cascade | User deletion removes all passkeys |
| OAuthAccount | user → User | Cascade | User deletion removes all OAuth links |
| RolePermission | permission → Permission | Cascade | Permission deletion removes all role assignments |

Additionally, 2 `onDelete: SetNull` directives on AuditLog (userId, targetUserId) are correct — audit logs must survive user deletion for compliance.

---

### D-10: createdAt on All Models [PASS]

All 10 implemented models have `createdAt DateTime @default(now())`:

| Model | createdAt Present | Line |
|-------|------------------|------|
| User | Yes | 86 |
| Session | Yes | 116 |
| AuditLog | Yes | 136 |
| EmailVerificationToken | Yes | 159 |
| PasswordResetToken | Yes | 174 |
| TrustedDevice | Yes | 191 |
| WebAuthnCredential | Yes | 210 |
| OAuthAccount | Yes | 225 |
| Permission | Yes | 241 |
| RolePermission | Yes | 255 |

---

### D-11: updatedAt on Mutable Models [PASS]

| Model | updatedAt | Mutable? | Justification |
|-------|-----------|----------|---------------|
| User | Yes (line 87) | Yes | Profile updates, role changes, MFA, lockout |
| Session | Yes (line 117) | Yes | Token rotation, revocation |
| AuditLog | **No** | **No** — append-only | Documented business invariant: "cannot be updated or deleted" |
| EmailVerificationToken | Yes (line 160) | Yes | usedAt field updated on use |
| PasswordResetToken | Yes (line 175) | Yes | usedAt field updated on use |
| TrustedDevice | Yes (line 192) | Yes | lastVerifiedAt, isRevoked updates |
| WebAuthnCredential | Yes (line 211) | Yes | signCount, lastUsedAt, name updates |
| OAuthAccount | **No** | **No** — immutable | Documented: "created or deleted, never modified" |
| Permission | Yes (line 242) | Yes | Description/metadata updates |
| RolePermission | Yes (line 256) | Yes | Metadata updates |

Both omissions are intentional and explicitly documented.

---

### D-12: Unique Constraints [PASS]

| Field | Constraint | Line |
|-------|-----------|------|
| User.email | @unique | 68 |
| EmailVerificationToken.tokenHash | @unique | 153 |
| PasswordResetToken.tokenHash | @unique | 169 |
| Permission.key | @unique | 237 |
| WebAuthnCredential.credentialId | @unique | 202 |
| TrustedDevice.[userId, fingerprintHash] | @@unique | 194 |
| OAuthAccount.[provider, providerId] | @@unique | 229 |
| OAuthAccount.[userId, provider] | @@unique | 230 |
| RolePermission.[role, permissionId] | @@unique | 258 |

All identity and token fields that require uniqueness have appropriate constraints.

---

### D-13: Seed File Safety [PASS]

**File**: `nexacore-api/prisma/seed.ts` (113 lines)

Verified:
- Uses `prisma.permission.upsert()` for all permission records (idempotent)
- Uses `prisma.rolePermission.upsert()` for all role-permission assignments (idempotent)
- Contains **zero** hardcoded credentials, passwords, secrets, or production data
- Only seeds Permission and RolePermission entities with static RBAC definitions
- Proper error handling with `process.exit(1)` and `prisma.$disconnect()`

---

### D-14: Raw SQL Usage [PASS]

Grep results for `$queryRawUnsafe`, `$executeRawUnsafe`, `$queryRaw`, `$executeRaw` across entire `src/` directory: **zero matches**.

All database operations use Prisma Client's type-safe query API.

---

## Recommendations

1. **D-02 (FAIL)**: Update the embedded Prisma schema in `data-model.md` to add `updatedAt DateTime @updatedAt` to the Permission model block. Also fix the header note from "12 implemented models" to "10 implemented models" (addresses D-01 WARN simultaneously).

2. **D-08 (FAIL)**: Generate Prisma migration files with `npx prisma migrate dev` and commit the `prisma/migrations/` directory to version control before any production deployment. This is a prerequisite for SOC 2 CC7.5 compliance (auditable change management).

3. **D-07 (N/A)**: Manually run `npx prisma migrate status` to verify database schema alignment when database connectivity is available.
