# Backend Implementation Plan: SCRUM-222 — Add updatedAt to Token Models

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-220 (Document sensitive Prisma fields)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/prisma/schema.prisma` — EmailVerificationToken (lines 150-163), PasswordResetToken (lines 165-177)
  - `nexacore-api/src/auth/email-verification.service.ts` — `.update()` calls on lines 68, 140
  - `nexacore-api/src/auth/password-reset.service.ts` — `.update()` on line 131, `.updateMany()` on line 52
  - `nexacore-api/src/auth/tests/auth-test.helpers.ts` — PrismaService mock (lines 146-159)
  - `nexacore-api/src/auth/tests/auth-email.spec.ts` — inline token mock objects
  - `nexacore-api/src/auth/tests/auth-password.spec.ts` — inline token mock objects
  - `nexacore-api/prisma/migrations/20260313000000_add_updated_at_session_webauthn/migration.sql` — precedent migration pattern
  - `ai-specs/ai-specs/specs/data-model.md` — EmailVerificationToken (lines 215-237), PasswordResetToken (lines 249-264), TypeScript interfaces (lines 1682-1700), ASCII diagram (lines 1896-1903)
- **Constructor signatures verified**: N/A (no constructor changes — schema-only)
- **Methods verified to exist**: N/A (no method changes)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None

## 2. Overview

Add `updatedAt DateTime @updatedAt` to `EmailVerificationToken` and `PasswordResetToken` models. Both models are mutable (have `usedAt` set via `.update()` / `.updateMany()`), but lack the standard `updatedAt` field that all other mutable models (User, Session, TrustedDevice, WebAuthnCredential) already have. This is a schema + migration + docs change — no service logic changes needed since Prisma's `@updatedAt` is auto-managed.

## 3. Architecture Context

- **Models affected**: EmailVerificationToken, PasswordResetToken
- **Services that mutate these models**: EmailVerificationService, PasswordResetService
- **No code changes needed in services** — Prisma auto-sets `@updatedAt` on every `.update()` / `.updateMany()`
- **Migration precedent**: `20260313000000_add_updated_at_session_webauthn` — same pattern, `ALTER TABLE ADD COLUMN ... DEFAULT CURRENT_TIMESTAMP`

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-222-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-222-backend`

### Step 1: Update Prisma Schema

- **File**: `nexacore-api/prisma/schema.prisma`
- **Action**: Add `updatedAt DateTime @updatedAt` to both token models
- **Implementation Steps**:
  1. In `EmailVerificationToken` (after `createdAt` on line 159), add: `updatedAt DateTime @updatedAt`
  2. In `PasswordResetToken` (after `createdAt` on line 173), add: `updatedAt DateTime @updatedAt`
- **Notes**: Follow same field placement as other models — `updatedAt` comes right after `createdAt`

### Step 2: Create Migration

- **Action**: Create a manual migration SQL file (same pattern as `20260313000000_add_updated_at_session_webauthn`)
- **Implementation Steps**:
  1. Create directory: `nexacore-api/prisma/migrations/20260314000000_add_updated_at_token_models/`
  2. Create `migration.sql`:
     ```sql
     -- AlterTable: Add updatedAt to email_verification_tokens with default for existing rows
     ALTER TABLE "email_verification_tokens" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

     -- AlterTable: Add updatedAt to password_reset_tokens with default for existing rows
     ALTER TABLE "password_reset_tokens" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
     ```
  3. Run `npx prisma validate` to confirm schema is valid
  4. Run `npx prisma generate` to regenerate Prisma Client types
- **Notes**: We use a manual migration (not `prisma migrate dev`) because there is no database to connect to in the dev environment. The precedent migration `20260313000000` follows this exact pattern.

### Step 3: Verify Build and Tests

- **Action**: Confirm no regressions
- **Implementation Steps**:
  1. Run `npx nest build` — must compile clean
  2. Run `npx jest --forceExit` — all 870+ tests must pass
- **Notes**: Tests should pass without changes because:
  - Mock PrismaService objects don't validate field shapes
  - Inline mock token objects in tests are partial — they only include fields needed for each test
  - `@updatedAt` is auto-managed by Prisma runtime, not by service code

### Step 4: Update Technical Documentation

- **File**: `ai-specs/ai-specs/specs/data-model.md`
- **Action**: Add `updatedAt` field to both token model sections
- **Implementation Steps**:
  1. **EmailVerificationToken Fields** (after `createdAt` line ~226): Add `- \`updatedAt\`: Last modification timestamp (auto-managed by Prisma)`
  2. **PasswordResetToken Fields** (after `createdAt` line ~259): Add `- \`updatedAt\`: Last modification timestamp (auto-managed by Prisma)`
  3. **TypeScript interfaces** (lines ~1682-1700): Add `updatedAt: Date;` to both interfaces
  4. **ASCII diagram** (lines ~1896-1903): Add `updatedAt` to both token summaries in the diagram
  5. **Prisma schema section** (lines ~1295-1320): Add `updatedAt DateTime @updatedAt` to both models

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update Prisma schema
3. Step 2: Create migration
4. Step 3: Verify build and tests
5. Step 4: Update technical documentation

## 6. Testing Checklist

- [ ] `npx prisma validate` passes
- [ ] `npx prisma generate` succeeds
- [ ] `npx nest build` compiles clean
- [ ] All 870+ tests pass
- [ ] No new tests needed (schema-only change, `@updatedAt` is auto-managed)

## 7. Error Response Format

N/A — no API changes. Token models are never directly exposed in API responses.

## 8. Dependencies

- No new dependencies required

## 9. Notes

- Prisma's `@updatedAt` decorator automatically sets the field to `now()` on every `.update()` / `.updateMany()` call — no service code changes needed
- The migration uses `DEFAULT CURRENT_TIMESTAMP` for existing rows (same as the Session/WebAuthn precedent migration)
- Token models are internal — they are never returned in API responses, so no serialization changes needed
- Test mocks don't need updating — they use partial objects and Prisma mocks don't validate field presence

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit and push
- Run `/update-docs` to update integration-state.md

## 11. Implementation Verification

- [ ] Both models have `updatedAt DateTime @updatedAt` in schema.prisma
- [ ] Migration file exists at `prisma/migrations/20260314000000_add_updated_at_token_models/migration.sql`
- [ ] `prisma validate` passes
- [ ] `nest build` compiles without errors
- [ ] All tests pass (870+)
- [ ] `data-model.md` updated with `updatedAt` field in both models (field lists, interfaces, diagram, schema)
