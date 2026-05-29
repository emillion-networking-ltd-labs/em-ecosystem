# Backend Implementation Plan: SCRUM-312 Avatar Tests + Storage Tests + ConfigService Fix

## Codebase State Snapshot

- **Date**: 2026-04-18
- **Last completed ticket**: SCRUM-311 (OAuth avatar download)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/users/users.service.ts` — uploadAvatar (line 578), removeAvatar (line 671), uploadOriginal (line 650), deleteOriginalFile (line 660), constructor (line 50-63)
  - `nexacore-api/src/users/users.controller.ts` — POST me/avatar (line 67), DELETE me/avatar (line 102)
  - `nexacore-api/src/storage/local-storage.provider.ts` — upload, delete, getPublicUrl
  - `nexacore-api/src/users/tests/users.service.spec.ts` — mock stubs for uploadAvatar/removeAvatar but NO test cases
  - `nexacore-api/src/users/tests/users.controller.spec.ts` — mock stubs lines 15-16, 65-66 but NO test cases
- **Constructor verified**: `UsersService(prisma, auditService, sessionsService, mailService, passwordBreachService, trustedDeviceService, tokenDenyListService, storage)` — 8 deps. Needs ConfigService added (9th)
- **ConfigModule**: `isGlobal: true` in app.module.ts — ConfigService available without import

## Regression Impact Analysis

- **Blast radius**: Constructor change adds ConfigService → all test files mocking UsersService need update
- **Test files requiring mock update**: `users.service.spec.ts` (already has module setup with providers)
- **Breaking changes**: Constructor adds 1 dep (ConfigService). Module-level — no consumer changes needed since UsersModule resolves DI internally
- **Blast radius size**: 4 files — manageable

## Overview

Tech debt from SCRUM-306: write missing tests for avatar upload/remove endpoints, create test file for LocalStorageProvider, and replace `process.env.UPLOAD_DIR` with ConfigService in UsersService.

## Architecture Context

- **Module**: UsersModule + StorageModule (existing)
- **Test pattern**: Jest mocks for Prisma, storage, fs
- **ConfigService**: Global (isGlobal: true) — no module import needed

## Implementation Steps

### Step 0: Create Feature Branch

- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-312-backend`

### Step 1: Inject ConfigService into UsersService

**File**: `src/users/users.service.ts`

Add ConfigService to constructor:
```ts
import { ConfigService } from '@nestjs/config';

constructor(
  // ... existing 8 deps ...
  private readonly configService: ConfigService,
) {}
```

Replace `process.env.UPLOAD_DIR` in `uploadOriginal` (line 653) and `deleteOriginalFile` (line 663):
```ts
const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
```

### Step 2: Update UsersService Test Module

**File**: `src/users/tests/users.service.spec.ts`

Add ConfigService to the test module providers:
```ts
{
  provide: ConfigService,
  useValue: { get: jest.fn().mockReturnValue('./uploads') },
},
```

### Step 3: Write uploadAvatar Tests

**File**: `src/users/tests/users.service.spec.ts`

Add `describe('uploadAvatar')` block with tests:
- Should save cropped avatar and return URLs
- Should delete old avatar before saving new one
- Should preserve existing original on re-edit (no originalFile)
- Should save new original when provided
- Should store cropData in DB
- Should fire audit log

### Step 4: Write removeAvatar Tests

**File**: `src/users/tests/users.service.spec.ts`

Add `describe('removeAvatar')` block with tests:
- Should delete cropped + original files and null DB fields
- Should handle user without avatar (no-op on files)
- Should fire audit log

### Step 5: Write Controller Avatar Tests

**File**: `src/users/tests/users.controller.spec.ts`

Add tests for:
- `POST /users/me/avatar` — should delegate to usersService.uploadAvatar
- `DELETE /users/me/avatar` — should delegate to usersService.removeAvatar

### Step 6: Create LocalStorageProvider Tests

**File**: `src/storage/tests/local-storage.provider.spec.ts` (NEW)

Tests:
- `upload` — writes file to disk, returns correct path
- `delete` — removes file from disk
- `delete` — no-op when file not found
- `getPublicUrl` — returns `/uploads/avatars/{key}`

Mock `fs/promises` (writeFile, mkdir, unlink).

### Step 7: Update Documentation

- `ai-specs/specs/integration-state.md` — changelog entry

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: ConfigService injection
3. Step 2: Update test module
4. Step 3: uploadAvatar tests
5. Step 4: removeAvatar tests
6. Step 5: Controller avatar tests
7. Step 6: LocalStorageProvider tests
8. Step 7: Documentation

## Testing Checklist

- [ ] No `process.env.UPLOAD_DIR` in users.service.ts
- [ ] uploadAvatar: 6+ test cases pass
- [ ] removeAvatar: 3+ test cases pass
- [ ] Controller: 2+ avatar test cases pass
- [ ] LocalStorageProvider: 4+ test cases pass
- [ ] All existing 1016 tests still pass
- [ ] Build: `nest build` clean

## Dependencies

- No new dependencies

## Notes

- ConfigService is global (`isGlobal: true`) — no need to import ConfigModule in UsersModule
- fs/promises mocking in LocalStorageProvider tests — use `jest.mock('fs/promises')`
- Controller avatar tests are unit-level (mock UsersService) — no actual file I/O
