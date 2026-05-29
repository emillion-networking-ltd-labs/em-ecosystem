# Backend Implementation Plan: SCRUM-93 — Users + DTO Coverage Gaps

## Codebase State Snapshot

- **Date**: 2026-02-28
- **Last completed ticket**: SCRUM-92 backend (https-redirect middleware spec on `feature/SCRUM-92-backend`)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/users/users.service.ts` (433 lines) — 17 public methods, 5 fire-and-forget `.catch(() => {})` callbacks
  - `src/users/users.controller.ts` (125 lines) — 7 endpoints, all decorated with guards
  - `src/users/dto/list-users-query.dto.ts` (34 lines) — 2 `@Type(() => Number)` decorators (page, limit)
  - `src/audit/dto/list-audit-logs-query.dto.ts` (54 lines) — 2 `@Type(() => Number)` decorators (page, limit)
  - `src/users/tests/users.service.spec.ts` (868 lines) — 38 tests, all 17 methods tested
  - `src/users/tests/users.controller.spec.ts` (221 lines) — 7 tests, all endpoints tested
- **Constructor signatures verified**: `UsersService(PrismaService, AuditService, SessionsService)`
- **Guard dependency chain verified**: N/A — no guard changes

## Overview

SCRUM-93 closes the remaining per-file coverage gaps for the users/audit domain. Three gaps identified:

| File | Metric | Current | Target | Root Cause |
|------|--------|---------|--------|------------|
| `users.service.ts` | funcs | 79.16% | ≥95% | 5 `.catch(() => {})` callbacks never triggered |
| `list-users-query.dto.ts` | funcs | 0% | 100% | `@Type(() => Number)` arrow funcs never invoked |
| `list-audit-logs-query.dto.ts` | funcs | 0% | 100% | `@Type(() => Number)` arrow funcs never invoked |
| `users.controller.ts` | branches | 65.78% | N/A | NestJS decorator branches — **not unit-testable** |

## Architecture Context

### Modules involved
- `UsersModule` — existing tests modified
- `AuditModule` — new DTO spec

### Components affected
- 1 existing spec modified (`users.service.spec.ts`)
- 2 new spec files (DTO tests)
- 0 source file changes

### Files referenced
| File | Change |
|------|--------|
| `src/users/tests/users.service.spec.ts` | **Modify** — add 5 audit-rejection tests |
| `src/users/tests/list-users-query.dto.spec.ts` | **Create** — 2 tests |
| `src/audit/tests/list-audit-logs-query.dto.spec.ts` | **Create** — 2 tests |

### Pattern reference
| File | Reuse |
|------|-------|
| `src/users/tests/users.service.spec.ts` | Existing TestingModule setup, mock patterns |
| No existing DTO specs | New pattern: `plainToInstance()` + `validate()` from class-transformer/class-validator |

## Implementation Steps

### Step 0: Create Feature Branch

- **Branch name**: `feature/SCRUM-93-backend`
- **Base**: `feature/SCRUM-92-backend`

---

### Step 1: Add audit-rejection tests to `users.service.spec.ts`

**Goal**: Cover the 5 `.catch(() => {})` fire-and-forget callbacks.

**Technique**: Mock `auditService.log` to reject, call the method, flush microtasks with `await new Promise(process.nextTick)`, verify the method completes without throwing.

5 tests to add (each within its existing `describe` block):

1. **`updateProfile` — should not throw when audit log rejects** (inside `describe('updateProfile')`)
   - `auditService.log.mockRejectedValue(new Error('audit fail'))`
   - `prisma.user.update.mockResolvedValue(mockUser)`
   - Call `updateProfile('uuid-123', { firstName: 'Jane' }, { ipAddress: '10.0.0.1', userAgent: 'ua' })`
   - `await new Promise(process.nextTick)` — flush fire-and-forget promise
   - Assert result is defined (no throw)

2. **`changePassword` — should not throw when audit log rejects** (inside `describe('changePassword')`)
   - `auditService.log.mockRejectedValue(new Error('audit fail'))`
   - `prisma.user.findUnique.mockResolvedValue(mockUser)`
   - `bcrypt.compare.mockResolvedValue(true)`, `bcrypt.hash.mockResolvedValue('new-hash')`
   - `prisma.user.update.mockResolvedValue(mockUser)`
   - Call `changePassword('uuid-123', changeDto, ctx)`
   - `await new Promise(process.nextTick)`
   - Assert no throw

3. **`adminUpdateUser` (role change) — should not throw when audit log rejects** (inside `describe('adminUpdateUser')`)
   - `auditService.log.mockRejectedValue(new Error('audit fail'))`
   - `prisma.user.findUnique.mockResolvedValue(mockUser)` (role = USER)
   - `prisma.user.update.mockResolvedValue({ ...mockUser, role: Role.ADMIN })`
   - Call `adminUpdateUser('uuid-123', { role: Role.ADMIN }, actingSuperadmin)`
   - `await new Promise(process.nextTick)`
   - Assert result is defined

4. **`adminUpdateUser` (activation) — should not throw when audit log rejects** (inside `describe('adminUpdateUser')`)
   - `auditService.log.mockRejectedValue(new Error('audit fail'))`
   - `prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false })`
   - `prisma.user.update.mockResolvedValue({ ...mockUser, isActive: true })`
   - Call `adminUpdateUser('uuid-123', { isActive: true }, actingSuperadmin)`
   - `await new Promise(process.nextTick)`
   - Assert result is defined

5. **`softDelete` — should not throw when audit log rejects** (inside `describe('softDelete')`)
   - `auditService.log.mockRejectedValue(new Error('audit fail'))`
   - `prisma.user.findUnique.mockResolvedValue(mockUser)`
   - `prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false })`
   - Call `softDelete('uuid-123', 'admin-1', ctx)`
   - `await new Promise(process.nextTick)`
   - Assert no throw

---

### Step 2: Create `list-users-query.dto.spec.ts`

- **File**: `src/users/tests/list-users-query.dto.spec.ts`
- **Imports**: `plainToInstance` from `class-transformer`, `validate` from `class-validator`

2 tests:

1. **Should transform string page/limit to numbers via @Type**
   - `const dto = plainToInstance(ListUsersQueryDto, { page: '3', limit: '50' })`
   - Assert `dto.page === 3`, `dto.limit === 50` (typeof number)

2. **Should pass validation with valid data**
   - `const dto = plainToInstance(ListUsersQueryDto, { page: 1, limit: 10, sortBy: 'email', sortOrder: 'asc' })`
   - `const errors = await validate(dto)`
   - Assert `errors.length === 0`

---

### Step 3: Create `list-audit-logs-query.dto.spec.ts`

- **File**: `src/audit/tests/list-audit-logs-query.dto.spec.ts`
- **Imports**: Same as Step 2

2 tests:

1. **Should transform string page/limit to numbers via @Type**
   - `const dto = plainToInstance(ListAuditLogsQueryDto, { page: '2', limit: '25' })`
   - Assert `dto.page === 2`, `dto.limit === 25`

2. **Should pass validation with valid data**
   - `const dto = plainToInstance(ListAuditLogsQueryDto, { page: 1, limit: 20, sortOrder: 'desc' })`
   - `const errors = await validate(dto)`
   - Assert `errors.length === 0`

---

### Step 4: Run tests

- `npx jest users.service --verbose` (verify 5 new tests pass)
- `npx jest list-users-query --verbose` (verify DTO tests)
- `npx jest list-audit-logs-query --verbose` (verify DTO tests)
- `npx jest --passWithNoTests` (full suite — expect 34 suites, 427 tests)

---

### Step 5: Verify coverage

```bash
npx jest --coverage \
  --collectCoverageFrom='**/users/users.service.ts' \
  --collectCoverageFrom='**/users/dto/list-users-query.dto.ts' \
  --collectCoverageFrom='**/audit/dto/list-audit-logs-query.dto.ts'
```

Expected:
- `users.service.ts`: funcs ≥95% (ideally ~95-100%)
- `list-users-query.dto.ts`: funcs 100%
- `list-audit-logs-query.dto.ts`: funcs 100%

---

### Step 6: Documentation

- Create `ai-specs/ai-specs/changes/records/SCRUM-93_backend.md`

## Implementation Order

1. Step 0: Create branch
2. Step 1: Add 5 audit-rejection tests to `users.service.spec.ts`
3. Step 2: Create `list-users-query.dto.spec.ts` (2 tests)
4. Step 3: Create `list-audit-logs-query.dto.spec.ts` (2 tests)
5. Step 4: Run tests (targeted + full suite)
6. Step 5: Verify coverage
7. Step 6: Documentation

## Testing Checklist

- [ ] 5 new service tests pass
- [ ] 2 new list-users-query DTO tests pass
- [ ] 2 new list-audit-logs-query DTO tests pass
- [ ] Full suite passes (34+ suites, 427 tests)
- [ ] `users.service.ts` funcs ≥ 95%
- [ ] `list-users-query.dto.ts` funcs = 100%
- [ ] `list-audit-logs-query.dto.ts` funcs = 100%

## Dependencies

- `class-transformer` (`plainToInstance`) — already in project deps
- `class-validator` (`validate`) — already in project deps

## Notes

- **Zero risk**: Test-only, no source changes.
- **Fire-and-forget pattern**: The `.catch(() => {})` callbacks are intentional error suppression for audit logging. They must NOT propagate failures to the caller. Tests verify this contract.
- **`process.nextTick` flush**: Required because the audit `.catch()` callback runs asynchronously after the main method returns. Without flushing, V8 coverage won't record the callback execution before the test ends.
- **Controller branch gap (65.78%)**: NestJS decorators (`@UseGuards`, `@Roles`, `@RequirePermissions`, `@HttpCode`) generate conditional branches that are only exercisable via e2e tests with the full NestJS HTTP pipeline. This is a known framework limitation and is **not addressable** by unit tests. Documented as accepted.

## Implementation Verification

- [ ] 5 audit-rejection tests added in correct `describe` blocks
- [ ] 2 DTO spec files created at correct paths (`users/tests/`, `audit/tests/`)
- [ ] `plainToInstance` correctly exercises `@Type(() => Number)` decorators
- [ ] `process.nextTick` flush used in all fire-and-forget tests
- [ ] Full test suite passes
- [ ] Per-file coverage targets met
