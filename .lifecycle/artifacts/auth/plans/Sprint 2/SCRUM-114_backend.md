# Backend Implementation Plan: SCRUM-114 Endpoint Correctness

## 1. Codebase State Snapshot

- **Date**: 2026-03-03
- **Last completed ticket**: SCRUM-113 (Redis Store Atomicity)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/users/users.controller.ts` — line 112: `return { error: 'User not found' }` (returns 200 instead of 404)
  - `src/audit/audit.controller.ts` — line 54: `@Param('id')` without ParseUUIDPipe
  - `src/users/tests/users.controller.spec.ts` — line 175: test asserts `{ error: 'User not found' }` (must change to NotFoundException)
  - `src/audit/tests/audit.controller.spec.ts` — line 110: test already expects NotFoundException (no change needed)
  - `ai-specs/specs/api-spec.yml` — line 919: GET /users/{id} already has 404 response documented; line 848: GET /audit-logs/{id} already has 404 but missing 400 for invalid UUID
- **Constructor signatures verified**: N/A (no DI changes)
- **Guard dependency chain verified**: N/A (no guard changes)

## 2. Overview

Fix 2 endpoint correctness issues found during code audit: (1) `GET /users/:id` returns HTTP 200 with `{ error: 'User not found' }` body instead of throwing `NotFoundException` (404); (2) `GET /audit-logs/:id` is missing `ParseUUIDPipe` on the `:id` parameter, allowing malformed IDs to reach Prisma. Both are small fixes with minimal test updates.

## 3. Architecture Context

- **Modules**: UsersModule (controller only), AuditModule (controller only)
- **Components affected**: 2 controllers, 1 test file, 1 spec doc
- **No new providers, imports, exports, or DI changes**

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-114-backend` from latest `feature/SCRUM-113-backend`
- **Branch Naming**: `feature/SCRUM-114-backend`
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-113-backend`
  2. `git checkout -b feature/SCRUM-114-backend`
  3. `git branch` — verify

### Step 1: Fix GET /users/:id to throw NotFoundException

- **File**: `src/users/users.controller.ts`
- **Action**: Replace `return { error: 'User not found' }` with `throw new NotFoundException('User not found')`
- **Implementation Steps**:
  1. Add `NotFoundException` to the `@nestjs/common` import (line 1). Currently imports: `Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, HttpCode, HttpStatus, ParseUUIDPipe`. Add `NotFoundException`.
  2. Replace line 112:
     ```typescript
     // BEFORE:
     return { error: 'User not found' };

     // AFTER:
     throw new NotFoundException('User not found');
     ```
- **Dependencies**: `NotFoundException` from `@nestjs/common` (already available, just needs import)
- **Implementation Notes**: This makes `GET /users/:id` consistent with `GET /audit-logs/:id` and all other NestJS endpoints that use `NotFoundException` for missing resources. The existing `@ApiResponse({ status: 404 })` in api-spec.yml is already correct.

### Step 2: Add ParseUUIDPipe to GET /audit-logs/:id

- **File**: `src/audit/audit.controller.ts`
- **Action**: Add `ParseUUIDPipe` to the `@Param('id')` decorator
- **Implementation Steps**:
  1. Add `ParseUUIDPipe` to the `@nestjs/common` import (line 1-8). Currently imports: `Controller, Get, Param, Query, UseGuards, NotFoundException`. Add `ParseUUIDPipe`.
  2. Change line 54:
     ```typescript
     // BEFORE:
     async getAuditLog(@Param('id') id: string) {

     // AFTER:
     async getAuditLog(@Param('id', ParseUUIDPipe) id: string) {
     ```
- **Dependencies**: `ParseUUIDPipe` from `@nestjs/common` (already available, just needs import)
- **Implementation Notes**: This makes `GET /audit-logs/:id` consistent with all other UUID param endpoints (users/:id, sessions/:id). ParseUUIDPipe returns 400 with a validation error for non-UUID strings, preventing malformed IDs from reaching Prisma.

### Step 3: Update users.controller.spec.ts

- **File**: `src/users/tests/users.controller.spec.ts`
- **Action**: Change the "should return error object when user not found" test to expect `NotFoundException`
- **Implementation Steps**:
  1. Verify `NotFoundException` is imported (check existing imports at top of file).
  2. Replace the test at lines 175-181:
     ```typescript
     // BEFORE:
     it('should return error object when user not found', async () => {
       usersService.findById.mockResolvedValue(null);

       const result = await controller.getUser('nonexistent');

       expect(result).toEqual({ error: 'User not found' });
     });

     // AFTER:
     it('should throw NotFoundException when user not found', async () => {
       usersService.findById.mockResolvedValue(null);

       await expect(controller.getUser('nonexistent')).rejects.toThrow(
         NotFoundException,
       );
     });
     ```
- **Implementation Notes**: The audit.controller.spec.ts already correctly tests for NotFoundException (line 110-116) — no changes needed there. ParseUUIDPipe is validated at the framework level and doesn't need unit tests in the controller spec.

### Step 4: Update api-spec.yml

- **File**: `ai-specs/specs/api-spec.yml`
- **Action**: Add 400 response to `GET /audit-logs/{id}` for invalid UUID format (now enforced by ParseUUIDPipe)
- **Implementation Steps**:
  1. After the `'404'` response block (line 848-849), add:
     ```yaml
     '400':
       description: Invalid UUID format
     ```
- **Implementation Notes**: `GET /users/{id}` already has the correct 404 documented (line 919-924). The 400 for invalid UUID on users/{id} is implicit via the IdParam component which specifies `format: uuid`. For audit-logs/{id}, the param is defined inline, so adding the 400 explicitly is more correct.

### Step 5: Build, Test, and Verify

- **Action**: Run post-implementation integrity checks
- **Implementation Steps**:
  1. `npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all tests must pass (expect 558+)
  3. `npx jest --coverage` — verify thresholds met

### Step 6: Update Technical Documentation

- **Action**: Documentation review
- **Implementation Steps**:
  1. `api-spec.yml` — 400 on audit-logs/{id} (Step 4)
  2. `data-model.md` — no changes
  3. `integration-state.md` — changelog entry will be added during `/update-docs`

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Fix `GET /users/:id` to throw NotFoundException
3. Step 2: Add ParseUUIDPipe to `GET /audit-logs/:id`
4. Step 3: Update `users.controller.spec.ts`
5. Step 4: Update `api-spec.yml`
6. Step 5: Build + test + coverage
7. Step 6: Documentation review

## 6. Testing Checklist

- [ ] `users.controller.spec.ts`: "user not found" test expects `NotFoundException` (not error object)
- [ ] `audit.controller.spec.ts`: existing tests still pass (no changes needed)
- [ ] All 558+ existing tests still pass
- [ ] `nest build` compiles clean
- [ ] Coverage thresholds met

## 7. Error Response Format

After fixes, both endpoints will produce standard NestJS error responses:

**GET /users/:id with nonexistent UUID:**
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

**GET /audit-logs/:id with invalid UUID format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed (uuid is expected)",
  "error": "Bad Request"
}
```

## 8. Partial Update Support

N/A — endpoint correctness fixes.

## 9. Dependencies

None. All required classes (`NotFoundException`, `ParseUUIDPipe`) are already available from `@nestjs/common`.

## 10. Notes

- `NotFoundException` is already used in `audit.controller.ts` (line 7, 57) — this fix makes users.controller consistent.
- `ParseUUIDPipe` is already used in `users.controller.ts` (lines 109, 122, 143) — this fix makes audit.controller consistent.
- The api-spec.yml already documents 404 for `GET /users/{id}` (line 919) — that documentation was ahead of the code (now correct after this fix).
- `GET /audit-logs` list endpoint uses `ListAuditLogsQueryDto` with class-validator for query params — the `:id` parameter was the only one missing pipe validation.

## 11. Next Steps After Implementation

- Sprint 2 audit remediation complete (SCRUM-112, 113, 114 all done)
- Proceed to Sprint 3 — SCRUM-115 (Production Hardening)

## 12. Implementation Verification

- [ ] `GET /users/:id` returns 404 (not 200) when user not found
- [ ] `GET /audit-logs/:id` returns 400 on invalid UUID format
- [ ] `GET /audit-logs/:id` returns 404 on valid UUID not found (unchanged)
- [ ] All tests pass, build clean, coverage thresholds met
- [ ] `api-spec.yml` has 400 on `audit-logs/{id}`

## 13. Module-Level Planning

N/A — no module-level changes.

## 14. Satellite App Planning

N/A — NexaCore internal changes only.
