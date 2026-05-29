# Implementation Plan: SCRUM-160 Prisma Schema — OAuthAccount Model + Data Migration

## 1. Ticket Summary

Create the `OAuthAccount` Prisma model (1:N with User) and migrate existing `provider`/`providerId` data from the User table. This is Phase A of the SCRUM-158 multi-provider OAuth architecture.

- **Scope**: backend
- **Type**: Subtask of SCRUM-158
- **Parent plan**: `ai-specs/ai-specs/changes/plans/Backlog/SCRUM-158_fullstack.md` (Phase A)

## 2. Current State Analysis

### 2.1 Prisma Schema (schema.prisma)

The User model has two OAuth-related fields (lines 72-73):
```prisma
provider   Provider  @default(LOCAL)   // enum: LOCAL, GOOGLE, GITHUB
providerId String?
```

The `Provider` enum (lines 15-19):
```prisma
enum Provider {
  LOCAL
  GOOGLE
  GITHUB
}
```

The `AuditAction` enum has `OAUTH_UNLINKED` (line 56) but no `OAUTH_LINKED`.

### 2.2 Models Count

Currently 8 models: User, Session, AuditLog, EmailVerificationToken, PasswordResetToken, TrustedDevice, WebAuthnCredential, Permission, RolePermission.

### 2.3 User Relations

User currently has 7 relations (lines 86-92):
- sessions, auditLogs, auditLogsTarget, emailVerificationTokens, passwordResetTokens, trustedDevices, webAuthnCredentials

## 3. Codebase State Snapshot

### 3.1 Module Dependencies

No module changes needed. OAuthAccount is accessed via PrismaService (global).

### 3.2 Guard Dependencies

No guard changes needed.

### 3.3 Test Baseline

44 suites, 821 tests — all passing.

## 4. Implementation Steps

### Step 1: Add OAUTH_LINKED to AuditAction enum

**File**: `prisma/schema.prisma` (line 56, after OAUTH_UNLINKED)

Add `OAUTH_LINKED` to the enum. This is needed by Phase B but adding now avoids a second migration.

```prisma
  OAUTH_UNLINKED
  OAUTH_LINKED        // ← new
}
```

### Step 2: Add OAuthAccount model

**File**: `prisma/schema.prisma` (after WebAuthnCredential model, line 206)

```prisma
model OAuthAccount {
  id         String   @id @default(uuid())
  userId     String
  provider   Provider
  providerId String
  email      String
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@unique([userId, provider])
  @@index([userId])
  @@map("oauth_accounts")
}
```

Design decisions:
- `@@unique([provider, providerId])`: One OAuth identity maps to exactly one user (prevents identity theft)
- `@@unique([userId, provider])`: One provider per user (can't have two Google accounts)
- `@@index([userId])`: Fast lookup when listing a user's linked providers
- `email`: Stores email at time of linking (audit trail, not used for matching)
- `onDelete: Cascade`: When user is deleted, their OAuthAccounts are cleaned up
- **No `updatedAt`**: OAuth links are immutable — created or deleted, never modified

### Step 3: Add oauthAccounts relation to User model

**File**: `prisma/schema.prisma` (after `webAuthnCredentials` relation, line 92)

```prisma
  webAuthnCredentials      WebAuthnCredential[]
  oauthAccounts            OAuthAccount[]          // ← new
```

**IMPORTANT**: Keep `provider` and `providerId` fields on User. They will be removed in Phase D (SCRUM-163) after all services are refactored.

### Step 4: Generate Prisma migration

```bash
cd nexacore-api
npx prisma migrate dev --name add-oauth-accounts
```

This auto-generates the SQL migration file in `prisma/migrations/`.

### Step 5: Add data migration SQL

After the auto-generated migration, append a data migration to copy existing OAuth data:

```sql
-- Data migration: copy existing OAuth links to new table
INSERT INTO "oauth_accounts" ("id", "userId", "provider", "providerId", "email", "createdAt")
SELECT gen_random_uuid(), "id", "provider"::"Provider", "providerId", "email", "createdAt"
FROM "users"
WHERE "provider" != 'LOCAL' AND "providerId" IS NOT NULL;
```

This must be in the same migration file to ensure atomicity.

### Step 6: Regenerate Prisma client

```bash
npx prisma generate
```

Verify `OAuthAccount` type is available in `@prisma/client`.

### Step 7: Verify build

```bash
npm run build
```

Must compile clean. No source code changes needed — the new model is additive.

### Step 8: Verify tests

```bash
npm test
```

All 821 tests must pass. Since no source code changed (only schema), no test updates needed.

## 5. Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `OAUTH_LINKED` to AuditAction enum, add `OAuthAccount` model, add `oauthAccounts` relation to User |
| `prisma/migrations/YYYYMMDD_add_oauth_accounts/migration.sql` | Auto-generated + data migration SQL appended |

## 6. Files NOT to Modify

| File | Reason |
|------|--------|
| Any `.ts` source file | This is a schema-only change. Service refactoring is Phase B (SCRUM-161) |
| Any test file | No behavior changes — additive schema only |
| `user.entity.ts` | Will be updated in Phase B when toSafeUser changes |

## 7. Security Considerations

| Risk | Mitigation |
|------|-----------|
| Data migration integrity | Atomic migration (schema + data in one transaction) |
| Unique constraint violations during migration | `WHERE provider != 'LOCAL' AND providerId IS NOT NULL` ensures clean data |
| Backward compatibility | Old `provider`/`providerId` fields preserved — no breaking changes |

## 8. Rollback Plan

If migration fails:
```bash
npx prisma migrate resolve --rolled-back YYYYMMDD_add_oauth_accounts
```

The migration is purely additive — rolling back drops `oauth_accounts` table and `OAUTH_LINKED` enum value. No data loss on existing tables.

## 9. Verification Checklist

- [ ] `OAuthAccount` table exists in PostgreSQL
- [ ] `@@unique([provider, providerId])` constraint active
- [ ] `@@unique([userId, provider])` constraint active
- [ ] Existing OAuth users have corresponding `OAuthAccount` rows
- [ ] `User.provider` and `User.providerId` still exist (not removed)
- [ ] `OAUTH_LINKED` exists in `AuditAction` enum
- [ ] `npx prisma generate` produces `OAuthAccount` type
- [ ] `npm run build` compiles clean
- [ ] All 821 tests pass
- [ ] No source code files modified

## 10. Dependencies

- **Depends on**: nothing (first phase)
- **Blocks**: SCRUM-161 (Phase B needs OAuthAccount table)

## 11. Estimated Risk

**Low** — purely additive schema change with data migration. No behavior changes, no source code modifications, no test updates.
