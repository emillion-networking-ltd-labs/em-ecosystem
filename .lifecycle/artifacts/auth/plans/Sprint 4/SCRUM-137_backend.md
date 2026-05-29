# Backend Implementation Plan: SCRUM-137 Coordinated Merge — Sprint 2-3 Feature Branches into Main

## Codebase State Snapshot

- **Date**: 2026-03-05
- **Last completed ticket**: SCRUM-136 (Jest + RTL test infrastructure for dashboard)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/strategies/jwt.strategy.ts` — JwtStrategy class, constructor, validate method
  - `src/auth/auth.service.ts` — AuthService class, constructor (12 deps), tokenDenyListService usage
  - `src/auth/token-deny-list.service.ts` — TokenDenyListService class, 3 public methods
  - `src/auth/tests/jwt.strategy.spec.ts` — full spec file (97 lines), missing TokenDenyListService mock
  - `src/auth/tests/auth.service.spec.ts` — full spec file, 2 test module builders, both missing TokenDenyListService mock
  - `src/common/interfaces/jwt-payload.interface.ts` — JwtPayload interface (sub, email, role, jti)
- **Constructor signatures verified**:
  - `JwtStrategy(usersService: UsersService, tokenDenyListService: TokenDenyListService)` — 2 deps
  - `AuthService(usersService, sessionsService, jwtService, oauthCodeStore, auditService, passwordBreachService, prisma, mailService, trustedDeviceService, impossibleTravelService, suspiciousLoginService, tokenDenyListService)` — 12 deps
  - `TokenDenyListService(@Inject(REDIS_CLIENT) redis: Redis)` — 1 dep
- **Methods verified to exist**:
  - `TokenDenyListService.denyToken(jti, ttlSeconds)` — line 13
  - `TokenDenyListService.denyAllForUser(userId, ttlSeconds)` — line 21
  - `TokenDenyListService.isDenied(jti, userId)` — line 29
  - `JwtStrategy.validate(payload: JwtPayload)` — line 26, calls `this.tokenDenyListService.isDenied()`
  - `AuthService.logout()` — calls `this.tokenDenyListService.denyAllForUser()` at line 608
  - `AuthService.logoutAll()` — calls `this.tokenDenyListService.denyAllForUser()` at line 630
- **Guard dependency chain verified**: N/A (no guard changes in this ticket)
- **Discrepancies with integration-state.md**: None found

## Overview

SCRUM-137 was created to coordinate merging Sprint 2-3 feature branches into main and fix pre-existing test failures. Upon codebase verification:

1. **All Sprint 2-3 branches are already merged** — `git branch -r --no-merged main` returns zero branches. The consolidation was completed in previous commits (`b830aea merge: integrate SCRUM-119 through SCRUM-127` and individual Sprint 4 commits that landed directly on main).
2. **Build passes** — `nest build` completes with 0 TypeScript errors.
3. **2 test suites fail** — 147 tests fail across `jwt.strategy.spec.ts` (3 tests) and `auth.service.spec.ts` (144 tests). Root cause: SCRUM-117 added `TokenDenyListService` as a constructor dependency to both `JwtStrategy` and `AuthService`, but the test spec files were never updated to include a mock provider.

Therefore, the remaining scope is: **fix the 2 failing test suites by adding the missing `TokenDenyListService` mock**.

## Architecture Context

- **Modules involved**: AuthModule (tests only — no production code changes)
- **Components affected**: 2 test files only
- **Root cause**: SCRUM-117 (`feat: add jti claim to JWT tokens and Redis deny-list`, commit `eebd615`) added `TokenDenyListService` as a dependency to `JwtStrategy` and `AuthService` but did not update their spec files
- **Impact**: NestJS dependency injection in test modules fails because `TokenDenyListService` is not provided

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-137-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-137-backend`
  3. `git branch` to verify

### Step 1: Fix `jwt.strategy.spec.ts` — Add TokenDenyListService Mock

- **File**: `src/auth/tests/jwt.strategy.spec.ts`
- **Action**: Add missing `TokenDenyListService` mock provider to the test module
- **Implementation Steps**:
  1. Add import: `import { TokenDenyListService } from '../token-deny-list.service';`
  2. Add mock provider to `Test.createTestingModule({ providers: [...] })`:
     ```typescript
     {
       provide: TokenDenyListService,
       useValue: {
         isDenied: jest.fn().mockResolvedValue(false),
       },
     },
     ```
  3. Add `jti` field to all test payloads (required by `JwtPayload` interface):
     - `{ sub: 'uuid-123', email: 'test@example.com', role: Role.USER, jti: 'test-jti-123' }`
  4. Add test case for token denial path:
     ```typescript
     it('should throw UnauthorizedException when token is denied', async () => {
       tokenDenyListService.isDenied.mockResolvedValue(true);
       await expect(
         strategy.validate({ sub: 'uuid-123', email: 'test@example.com', role: Role.USER, jti: 'denied-jti' }),
       ).rejects.toThrow(new UnauthorizedException('Token has been revoked'));
     });
     ```
  5. Add `tokenDenyListService` to the `let` declarations and `module.get()` in `beforeEach`
- **Dependencies**: `TokenDenyListService` import
- **Notes**: The existing 3 tests should pass as-is once the mock is provided (isDenied defaults to false). The new test covers the deny-list check introduced by SCRUM-117.

### Step 2: Fix `auth.service.spec.ts` — Add TokenDenyListService Mock

- **File**: `src/auth/tests/auth.service.spec.ts`
- **Action**: Add missing `TokenDenyListService` mock provider to BOTH test module builders
- **Implementation Steps**:
  1. Add import: `import { TokenDenyListService } from '../token-deny-list.service';`
  2. Add mock provider to the `createServiceWithExpiry` helper function (line ~31-47):
     ```typescript
     { provide: TokenDenyListService, useValue: { denyToken: jest.fn(), denyAllForUser: jest.fn(), isDenied: jest.fn().mockResolvedValue(false) } },
     ```
  3. Add mock provider to the main `beforeEach` test module (line ~133-247):
     ```typescript
     {
       provide: TokenDenyListService,
       useValue: {
         denyToken: jest.fn().mockResolvedValue(undefined),
         denyAllForUser: jest.fn().mockResolvedValue(undefined),
         isDenied: jest.fn().mockResolvedValue(false),
       },
     },
     ```
  4. Add `tokenDenyListService` to the `let` declarations at the top of the `AuthService` describe block
  5. Add `tokenDenyListService = module.get(TokenDenyListService);` after line 258
- **Dependencies**: `TokenDenyListService` import
- **Notes**: All 144 existing tests should pass once the mock is provided. The mock methods match the actual `TokenDenyListService` public interface: `denyToken()`, `denyAllForUser()`, `isDenied()`.

### Step 3: Validate — Run Full Test Suite

- **Action**: Run all backend tests and confirm 0 failures
- **Implementation Steps**:
  1. `npx jest --no-coverage` — confirm 44 suites pass, 0 fail
  2. `npx jest --coverage` — confirm coverage meets thresholds
  3. `npx nest build` — confirm 0 TypeScript errors
- **Expected result**: 809+ tests pass (662 previously passing + 147 fixed + 1 new test for deny-list path = 810 total)

### Step 4: Update Technical Documentation

- **Action**: No documentation updates needed
- **Notes**: This is a test-only fix. No production code, API endpoints, data models, or architecture changed. `integration-state.md` and other spec files remain accurate.

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Fix `jwt.strategy.spec.ts`
3. Step 2: Fix `auth.service.spec.ts`
4. Step 3: Validate (tests + build)
5. Step 4: Documentation review (no changes needed)

## Testing Checklist

- [ ] `jwt.strategy.spec.ts`: 4 tests pass (3 existing + 1 new deny-list test)
- [ ] `auth.service.spec.ts`: 144 tests pass (all existing)
- [ ] Full suite: 44 suites, 810 tests, 0 failures
- [ ] `nest build`: 0 TypeScript errors
- [ ] Coverage: no regression from baseline

## Error Response Format

N/A — no new endpoints or error responses.

## Partial Update Support

N/A — test-only changes.

## Dependencies

No new dependencies required.

## Notes

1. **Scope reduction**: Original ticket described a complex multi-branch merge operation. Upon codebase verification, all branches are already merged. The only remaining work is fixing 2 test files.
2. **Root cause**: SCRUM-117 added `TokenDenyListService` to `JwtStrategy` and `AuthService` constructors but did not propagate mock updates to their test files. This is a test mock propagation gap — exactly what `workflow-standards.mdc` warns about.
3. **No production code changes**: This plan modifies ONLY test files. The `TokenDenyListService` is already properly integrated in production code.
4. **JwtPayload.jti**: The `JwtPayload` interface requires `jti: string`. Test payloads in `jwt.strategy.spec.ts` are missing this field. Adding it ensures type correctness and tests the full validate flow.

## Next Steps After Implementation

1. `/commit SCRUM-137` — commit and push
2. `/update-docs SCRUM-137` — create implementation record
3. Update SCRUM-137 Jira ticket status to Done
4. Proceed to SCRUM-138 (manual verification) — this ticket is unblocked once SCRUM-137 is complete

## Implementation Verification

- [ ] **Code Quality**: Mock providers match actual `TokenDenyListService` interface exactly
- [ ] **Functionality**: All 810 tests pass with 0 failures
- [ ] **Testing**: New deny-list test covers the `isDenied` path in JwtStrategy
- [ ] **Integration**: No integration changes (test-only)
- [ ] **Documentation**: Record created via `/update-docs`
