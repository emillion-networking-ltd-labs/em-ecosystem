# Backend Implementation Plan: SCRUM-183 Fix unsafe `as any` cast on email verification path

## Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-182 (Extract Shared Utilities)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.service.ts` — line 954: `const user = verificationToken.user as any;`
- **Constructor signatures verified**: N/A — no constructor changes in this ticket
- **Methods verified to exist**: `verifyEmailChange()` at `auth.service.ts:925`
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None

## Overview

Remove a single unsafe `as any` type cast in the `verifyEmailChange()` method of `AuthService`. The Prisma query at line 932 uses `include: { user: true }`, which already returns `verificationToken.user` fully typed as `User`. The `as any` cast at line 954 erases this type information on a security-critical email change verification path, violating TypeScript strictness standards (Phase 10 TS-02).

This is a type-only change with zero runtime or behavioral impact.

## Architecture Context

- **Module**: AuthModule
- **Component**: AuthService (`src/auth/auth.service.ts`)
- **Method**: `verifyEmailChange()` (line 925)
- **Impact**: Type safety only — no API, schema, DI, or behavioral changes

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-183-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-183-backend`
  3. `git branch` to verify

### Step 1: Remove `as any` cast

- **File**: `src/auth/auth.service.ts`
- **Action**: Change line 954 from `const user = verificationToken.user as any;` to `const user = verificationToken.user;`
- **Implementation Steps**:
  1. Open `src/auth/auth.service.ts`
  2. At line 954, remove `as any` cast
  3. Verify that TypeScript resolves `user` as type `User` (from Prisma's `include: { user: true }`)
  4. Confirm all subsequent property accesses (`user.pendingEmail`, `user.email`, `user.id`, `user.firstName`) are valid `User` fields in the Prisma schema
- **Implementation Notes**: The Prisma schema defines `User` with fields `id`, `email`, `pendingEmail`, `firstName` — all accessed in this method. No type errors expected.

### Step 2: Build verification

- **Action**: Run `nest build` to confirm clean compilation with no type errors
- **Implementation Steps**:
  1. `cd nexacore-api && npx nest build`
  2. Verify zero errors

### Step 3: Test verification

- **Action**: Run full test suite to confirm zero regressions
- **Implementation Steps**:
  1. `cd nexacore-api && npx jest --no-cache`
  2. Verify all tests pass (expected: 836+)

### Step 4: Update Technical Documentation

- **Action**: No documentation updates needed
- **Implementation Notes**: This is a type-only change. No changes to: API spec, data model, module registry, guard chains, permissions, or service dependencies. The integration-state.md changelog entry will be added during `/update-docs`.

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Remove `as any` cast
3. Step 2: Build verification
4. Step 3: Test verification
5. Step 4: Documentation (no updates needed)

## Testing Checklist

- [ ] `nest build` compiles cleanly
- [ ] All existing tests pass
- [ ] Zero `as any` occurrences in `verifyEmailChange()` method
- [ ] `verificationToken.user` property accesses are type-checked by TypeScript

## Error Response Format

N/A — no endpoint or error handling changes.

## Dependencies

None — no new packages or imports required.

## Notes

- Zero runtime impact — TypeScript type casts are erased at compile time
- No new tests needed — the behavioral contract is unchanged
- The `User` type from Prisma includes all fields accessed: `id`, `email`, `pendingEmail`, `firstName`

## Next Steps After Implementation

- Run `/update-docs SCRUM-183` to create implementation record and update integration-state.md changelog

## Implementation Verification

- [ ] `as any` removed from line 954
- [ ] `nest build` — zero errors
- [ ] All tests pass
- [ ] No behavioral changes introduced
