# Backend Implementation Plan: SCRUM-268 Add updatedAt to RolePermission Model

## 1. Codebase State Snapshot

- **Date**: 2026-03-16
- **Last completed ticket**: SCRUM-267 (frontend error boundaries + a11y)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `prisma/schema.prisma:250-260` — RolePermission model, has `createdAt` but no `updatedAt`
  - `src/permissions/entities/permission.entity.ts:12-18` — RolePermission interface, has `createdAt` but no `updatedAt`
  - `src/permissions/permissions.service.ts` — uses `rolePermission.createMany`, `deleteMany`, `findMany`, `count`. No `select` that would break with new field.
- **Constructor signatures verified**: No constructor changes needed.
- **Methods verified to exist**: N/A — no method modifications.
- **Discrepancies with integration-state.md**: None.

## 2. Regression Impact Analysis

- **Blast radius**: Minimal — 2 files modified (schema + entity interface). Adding an optional auto-managed field does not break any existing code.
- **Breaking changes identified**: None. `@updatedAt` is auto-managed by Prisma — no code changes needed in callers. Adding `updatedAt: Date` to the TypeScript interface is additive (no consumer reads it yet).
- **API contract impact**: None — no endpoint returns RolePermission directly (only aggregated Permission arrays).
- **Schema migration impact**: `updatedAt` with `@updatedAt` gets `DEFAULT now()` in the migration, so existing rows get a valid timestamp. Non-breaking.
- **Test files requiring updates**: No `.spec.ts` files reference `RolePermission` directly. No mock updates needed.
- **Blast radius size**: 2 files affected (+ data-model.md docs).

## 3. Overview

Add `updatedAt DateTime @updatedAt` to the RolePermission Prisma model and its TypeScript interface. This addresses audit finding D-11 (NIST AU-8 timestamp completeness). The field is auto-managed by Prisma — no service code changes needed.

## 4. Architecture Context

- **Module**: PermissionsModule
- **Files affected**:
  - `prisma/schema.prisma` — RolePermission model
  - `src/permissions/entities/permission.entity.ts` — RolePermission interface
  - `ai-specs/specs/data-model.md` — documentation

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-268-backend`
- **From**: latest `main`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-268-backend`

### Step 1: Add updatedAt to Prisma Schema

- **File**: `prisma/schema.prisma`
- **Action**: Add `updatedAt DateTime @updatedAt` to RolePermission model after the `createdAt` line
- **Implementation Steps**:
  1. Add `updatedAt    DateTime   @updatedAt` after line 255 (`createdAt DateTime @default(now())`)
- **Implementation Notes**: `@updatedAt` automatically sets the value on create and update — no manual code needed.

### Step 2: Create Prisma Migration

- **Action**: Generate and apply migration
- **Implementation Steps**:
  1. Run `npx prisma migrate dev --name add-role-permission-updated-at`
  2. Verify migration SQL adds `updatedAt` column with `DEFAULT CURRENT_TIMESTAMP`
  3. Verify `npx prisma generate` succeeds (regenerates client)

### Step 3: Update TypeScript Interface

- **File**: `src/permissions/entities/permission.entity.ts`
- **Action**: Add `updatedAt: Date` to the `RolePermission` interface
- **Implementation Steps**:
  1. Add `updatedAt: Date;` after `createdAt: Date;` (line 17)

### Step 4: Update data-model.md

- **File**: `ai-specs/specs/data-model.md`
- **Action**: Add `updatedAt` field to RolePermission documentation in all relevant sections
- **Implementation Steps**:
  1. Section 7 (RolePermission Fields): Add `- updatedAt: Last modification timestamp (auto-updated by Prisma)`
  2. Prisma schema block (~line 1434): Add `updatedAt DateTime @updatedAt`
  3. TypeScript interface block (~line 1759): Add `updatedAt: Date;`
  4. ER diagram block (~line 1962): Add `updatedAt DateTime` row

### Step 5: Build and Test Verification

- **Action**: Verify no regressions
- **Implementation Steps**:
  1. `nest build` — must compile clean
  2. `jest --maxWorkers=1 --forceExit` — all tests must pass (919+)

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add updatedAt to Prisma schema
3. Step 2: Create and apply Prisma migration
4. Step 3: Update TypeScript interface
5. Step 4: Update data-model.md
6. Step 5: Build and test verification

## 7. Testing Checklist

- [ ] `nest build` compiles clean
- [ ] All existing tests pass (919+)
- [ ] Migration created and applies cleanly
- [ ] Prisma Client generated successfully

## 8. Error Response Format

N/A — no endpoint changes.

## 9. Dependencies

- No new dependencies required.

## 10. Notes

- `@updatedAt` is a Prisma-managed decorator — it automatically updates on any `update` or `upsert` operation. No manual timestamp management needed.
- The `setPermissionsForRole` method uses `deleteMany` + `createMany` (not `update`), so `updatedAt` will equal `createdAt` for recreated records. This is correct behavior — the records are new after a permission reassignment.
- AuditLog and Permission models intentionally lack `updatedAt` (immutable/reference data). Only RolePermission was flagged as actionable.

## 11. Next Steps After Implementation

- Run `/verify SCRUM-268` then `/commit SCRUM-268`

## 12. Implementation Verification

- [ ] **Code Quality**: Schema valid, interface matches schema
- [ ] **Functionality**: Migration applies, Prisma Client regenerates
- [ ] **Testing**: All 919+ tests pass
- [ ] **Regression**: No blast radius concerns — additive change only
- [ ] **Documentation**: data-model.md updated
