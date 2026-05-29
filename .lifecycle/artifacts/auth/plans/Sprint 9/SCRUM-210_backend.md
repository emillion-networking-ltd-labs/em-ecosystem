# Backend Implementation Plan: SCRUM-210 Add updatedAt to Session/WebAuthn + Permission Seed

## Codebase State Snapshot

- **Date**: 2026-03-13
- **Last completed ticket**: SCRUM-208 (verification tokens to POST body)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `prisma/schema.prisma` — Session (lines 98-121), WebAuthnCredential (lines 190-207), no `updatedAt` on either
  - `src/sessions/entities/session.entity.ts` — Session interface (17 fields, no `updatedAt`)
  - `src/permissions/constants/default-permissions.ts` — 9 permissions, 2 role mappings (USER, ADMIN)
  - `package.json` — no `prisma.seed` config, `ts-node` v10.9.2 in devDeps
  - `tsconfig.json` — `rootDir: ./src`, `module: nodenext`, `strict: true`
- **No prisma/seed.ts exists** — confirmed via glob
- **Constructor signatures verified**: N/A (no service/controller modifications)
- **Methods verified to exist**: N/A (no method modifications)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: None

## Overview

Two audit WARN remediations:
1. **D-11**: Add `@updatedAt` to Session and WebAuthnCredential Prisma models (audit trail + optimistic concurrency)
2. **D-13**: Create standalone `prisma/seed.ts` for fresh deployments (CI/CD, dev setup) — complements existing app-level seeding in `PermissionsService.onModuleInit()`

## Architecture Context

- **Models affected**: Session, WebAuthnCredential (Prisma schema only — no service/controller logic changes)
- **New file**: `prisma/seed.ts` (standalone, not part of NestJS compilation)
- **Entity interface affected**: `src/sessions/entities/session.entity.ts` (add `updatedAt` field)
- **Tests affected**: Any test creating mock Session objects needs `updatedAt` added

## Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-210-backend`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-210-backend`

### Step 1: Add updatedAt to Prisma Schema

- **File**: `prisma/schema.prisma`
- **Action**: Add `updatedAt DateTime @updatedAt` to Session and WebAuthnCredential models
- **Implementation Steps**:
  1. In `model Session` (line 113, after `lastUsedAt`): add `updatedAt DateTime @updatedAt`
  2. In `model WebAuthnCredential` (line 201, after `createdAt`): add `updatedAt DateTime @updatedAt`
- **Notes**: `@updatedAt` auto-updates on every Prisma write — no application code changes needed

### Step 2: Create and Apply Migration

- **Action**: Generate Prisma migration
- **Steps**:
  1. Run `npx prisma migrate dev --name add-updated-at-session-webauthn --create-only` to create migration without applying (no live DB)
  2. Run `npx prisma generate` to update Prisma Client types
- **Notes**: Migration will add `updatedAt` column with `DEFAULT now()` for existing rows

### Step 3: Update Session Entity Interface

- **File**: `src/sessions/entities/session.entity.ts`
- **Action**: Add `updatedAt: Date` to Session interface
- **Implementation Steps**:
  1. Add `updatedAt: Date;` after `lastUsedAt: Date;` (line 15)
- **Notes**: `SessionResponse` and `toSessionResponse()` do NOT need updating — `updatedAt` is internal, not exposed to API consumers

### Step 4: Update Test Mocks

- **Action**: Add `updatedAt` to all mock Session and WebAuthnCredential objects in test files
- **Files to check and update**:
  - `src/auth/tests/auth-test.helpers.ts` — shared mock Session factory
  - `src/sessions/tests/sessions.service.spec.ts` — mock Session objects
  - `src/auth/tests/session.controller.spec.ts` — mock Session objects
  - `src/auth/tests/auth-token.spec.ts` — mock Session objects
  - `src/auth/tests/auth-login.spec.ts` — mock Session objects
  - `src/auth/tests/auth-oauth.spec.ts` — mock Session objects
  - Any WebAuthn test files with mock WebAuthnCredential objects
- **Pattern**: Add `updatedAt: new Date()` alongside existing `createdAt: new Date()`

### Step 5: Create Prisma Seed File

- **File**: `prisma/seed.ts` (NEW)
- **Action**: Create standalone seed file that upserts all 9 permissions and assigns to USER/ADMIN roles
- **Implementation Steps**:
  1. Import `PrismaClient` from `@prisma/client`
  2. Import `DEFAULT_PERMISSIONS` and `DEFAULT_ROLE_PERMISSIONS` from `../src/permissions/constants/default-permissions`
  3. Note: Cannot import `Role` enum from NestJS source (outside Prisma context) — use the Prisma-generated `Role` enum from `@prisma/client`
  4. Create `main()` async function:
     a. Instantiate `PrismaClient`
     b. For each permission in `DEFAULT_PERMISSIONS`: `prisma.permission.upsert({ where: { key }, update: { description, resource, action }, create: { key, description, resource, action } })`
     c. For each role in `DEFAULT_ROLE_PERMISSIONS`: look up permission IDs by key, then for each: `prisma.rolePermission.upsert({ where: { role_permissionId: { role, permissionId } }, update: {}, create: { role, permissionId } })`
     d. Log summary: "Seeded X permissions, Y role assignments"
     e. Disconnect Prisma
  5. Call `main()` with `.catch()` error handling
- **Notes**: Use Prisma-generated `Role` enum (not the NestJS one) to avoid import path issues. The seed file runs outside NestJS context.

### Step 6: Configure Seed in package.json

- **File**: `package.json`
- **Action**: Add `prisma.seed` configuration
- **Implementation Steps**:
  1. Add top-level `"prisma"` section: `"prisma": { "seed": "ts-node prisma/seed.ts" }`
- **Notes**: `ts-node` is already in devDependencies. However, since `tsconfig.json` has `rootDir: ./src`, the seed file at `prisma/` is outside the root. The seed execution uses ts-node directly (not NestJS build), so this is fine — ts-node doesn't enforce `rootDir`.

### Step 7: Verify

- **Action**: Run all tests and build
- **Steps**:
  1. `npm test` — all 859+ tests must pass
  2. `npx nest build` — clean compilation
  3. Verify `npx prisma generate` succeeds with new schema

### Step 8: Update Technical Documentation

- **Action**: Update documentation to reflect schema changes
- **Steps**:
  1. Update `ai-specs/specs/data-model.md` — add `updatedAt` field to Session and WebAuthnCredential model definitions
  2. Update `ai-specs/specs/integration-state.md` — add changelog entry

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add updatedAt to Prisma schema
3. Step 2: Create migration + regenerate client
4. Step 3: Update Session entity interface
5. Step 4: Update test mocks
6. Step 5: Create prisma/seed.ts
7. Step 6: Configure seed in package.json
8. Step 7: Verify (tests + build)
9. Step 8: Update documentation

## Testing Checklist

- [ ] All existing tests pass (859+)
- [ ] Mock Session objects include `updatedAt`
- [ ] Mock WebAuthnCredential objects include `updatedAt` (if any exist)
- [ ] `nest build` clean
- [ ] `prisma generate` succeeds
- [ ] Seed file has no TypeScript errors

## Error Response Format

N/A — no new endpoints or error responses.

## Dependencies

- `ts-node` (already in devDependencies)
- `@prisma/client` (already in dependencies)

## Notes

- `@updatedAt` is a Prisma-managed field — it auto-updates on every `update`/`upsert` call. No application code changes needed.
- The seed file complements (does not replace) `PermissionsService.onModuleInit()` — the app-level seeding remains for runtime initialization.
- `SessionResponse` is NOT updated — `updatedAt` is internal metadata, not exposed to API consumers.
- The migration will set `DEFAULT now()` for existing rows' `updatedAt` values.

## Next Steps After Implementation

- Run `/update-docs SCRUM-210` to create implementation record
- Transition SCRUM-210 to Done

## Implementation Verification

- [ ] Prisma schema has `updatedAt @updatedAt` on Session and WebAuthnCredential
- [ ] Migration file exists in `prisma/migrations/`
- [ ] Session entity interface includes `updatedAt: Date`
- [ ] All test mocks updated
- [ ] `prisma/seed.ts` created with 9 permissions + 2 role assignments
- [ ] `package.json` has `prisma.seed` config
- [ ] 859+ tests pass
- [ ] `nest build` clean
