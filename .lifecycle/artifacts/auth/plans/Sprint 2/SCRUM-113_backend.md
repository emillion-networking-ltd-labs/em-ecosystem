# Backend Implementation Plan: SCRUM-113 Redis Store Atomicity

## 1. Codebase State Snapshot

- **Date**: 2026-03-03
- **Last completed ticket**: SCRUM-112 (Rate Limiting Gaps)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/stores/oauth-state.store.ts` — line 37: `redis.get()`, line 39: `redis.del()` (non-atomic)
  - `src/auth/stores/oauth-code.store.ts` — line 32: `redis.get()`, line 33: `redis.del()` (non-atomic, del called unconditionally)
  - `src/auth/tests/oauth-state.store.spec.ts` — mock type `{ get, set, del }`, validate tests at lines 62-76
  - `src/auth/tests/oauth-code.store.spec.ts` — mock type `{ get, set, del }`, exchange tests at lines 94-121
- **Constructor signatures verified**: Both stores inject `@Inject(REDIS_CLIENT) private readonly redis: Redis` — no changes needed
- **Guard dependency chain verified**: N/A (no guard changes)

## 2. Overview

Replace the non-atomic GET + DEL Redis pattern with a single GETDEL command (Redis 6.2+, natively supported by ioredis) in both OAuth stores. This eliminates a TOCTOU race condition where concurrent requests could both pass validation before the first completes deletion. Code-only change — no new endpoints, no schema changes, no DI modifications.

## 3. Architecture Context

- **Module**: AuthModule (stores only, no module-level changes)
- **Components affected**: 2 store classes, 2 test files
- **No new providers, imports, exports, or DI changes**

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-113-backend` from latest `feature/SCRUM-112-backend` (accumulated work)
- **Branch Naming**: `feature/SCRUM-113-backend`
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-112-backend`
  2. `git checkout -b feature/SCRUM-113-backend`
  3. `git branch` — verify

### Step 1: Replace GET+DEL with GETDEL in OAuthStateStore.validate()

- **File**: `src/auth/stores/oauth-state.store.ts`
- **Action**: Replace the two-step `redis.get()` + `redis.del()` in `validate()` with a single `redis.getdel()` call
- **Implementation Steps**:
  1. Replace lines 37-40 of `validate()`:
     ```typescript
     // BEFORE (lines 37-40):
     const data = await this.redis.get(`oauth:state:${state}`);
     if (!data) return false;
     await this.redis.del(`oauth:state:${state}`);
     return true;

     // AFTER:
     const data = await this.redis.getdel(`oauth:state:${state}`);
     if (!data) return false;
     return true;
     ```
  2. The method now uses a single Redis round-trip. If the key exists, GETDEL returns its value and deletes it atomically. If it doesn't exist, returns null.
- **Dependencies**: None — ioredis already supports `getdel()` natively
- **Implementation Notes**: `getCodeVerifier()` is a peek-only method and should keep using `redis.get()` (no deletion).

### Step 2: Replace GET+DEL with GETDEL in OAuthCodeStore.exchange()

- **File**: `src/auth/stores/oauth-code.store.ts`
- **Action**: Replace the two-step `redis.get()` + `redis.del()` in `exchange()` with a single `redis.getdel()` call
- **Implementation Steps**:
  1. Replace lines 32-33 of `exchange()`:
     ```typescript
     // BEFORE (lines 32-33):
     const data = await this.redis.get(`oauth:code:${code}`);
     await this.redis.del(`oauth:code:${code}`);

     // AFTER:
     const data = await this.redis.getdel(`oauth:code:${code}`);
     ```
  2. The null check on line 34 (`if (!data) return null;`) remains unchanged.
- **Dependencies**: None
- **Implementation Notes**: The current code calls `redis.del()` unconditionally even when `data` is null (wasteful). GETDEL naturally handles this — if the key doesn't exist, it returns null without side effects.

### Step 3: Update oauth-state.store.spec.ts

- **File**: `src/auth/tests/oauth-state.store.spec.ts`
- **Action**: Update mock and validate tests to use `getdel` instead of `get` + `del`
- **Implementation Steps**:
  1. **Update mock type** (line 7): Add `getdel` to the Redis mock type:
     ```typescript
     let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock; getdel: jest.Mock };
     ```
  2. **Update mock initialization** (line 10-14): Add `getdel` mock:
     ```typescript
     redis = {
       get: jest.fn(),
       set: jest.fn().mockResolvedValue('OK'),
       del: jest.fn().mockResolvedValue(1),
       getdel: jest.fn(),
     };
     ```
  3. **Update validate test "should return true and delete key"** (lines 63-69):
     - Mock `redis.getdel` instead of `redis.get`
     - Assert `redis.getdel` was called (not `redis.get` + `redis.del`)
     - Assert `redis.get` was NOT called
     - Assert `redis.del` was NOT called
     ```typescript
     it('should atomically get and delete key for an existing state', async () => {
       redis.getdel.mockResolvedValue(JSON.stringify({ codeVerifier: 'abc' }));
       const result = await store.validate('test-state');
       expect(result).toBe(true);
       expect(redis.getdel).toHaveBeenCalledWith('oauth:state:test-state');
       expect(redis.get).not.toHaveBeenCalled();
       expect(redis.del).not.toHaveBeenCalled();
     });
     ```
  4. **Update validate test "should return false for unknown state"** (lines 71-76):
     - Mock `redis.getdel` returning null instead of `redis.get`
     ```typescript
     it('should return false for an unknown state', async () => {
       redis.getdel.mockResolvedValue(null);
       const result = await store.validate('nonexistent-state');
       expect(result).toBe(false);
     });
     ```

### Step 4: Update oauth-code.store.spec.ts

- **File**: `src/auth/tests/oauth-code.store.spec.ts`
- **Action**: Update mock and exchange tests to use `getdel` instead of `get` + `del`
- **Implementation Steps**:
  1. **Update mock type** (line 9): Add `getdel`:
     ```typescript
     let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock; getdel: jest.Mock };
     ```
  2. **Update mock initialization** (lines 46-50): Add `getdel` mock:
     ```typescript
     redis = {
       get: jest.fn(),
       set: jest.fn().mockResolvedValue('OK'),
       del: jest.fn().mockResolvedValue(1),
       getdel: jest.fn(),
     };
     ```
  3. **Update exchange test "should return the payload"** (lines 95-101):
     - Mock `redis.getdel` instead of `redis.get`
     ```typescript
     it('should return the payload for a valid code', async () => {
       redis.getdel.mockResolvedValue(JSON.stringify(mockPayload));
       const result = await store.exchange('valid-code');
       expect(result).not.toBeNull();
       expect(result!.accessToken).toBe('test-access-token');
       expect(result!.user.email).toBe('test@example.com');
     });
     ```
  4. **Update exchange test "should delete the key (single-use)"** (lines 103-107):
     - Rename to reflect atomicity, assert `getdel` used (not `get`+`del`)
     ```typescript
     it('should atomically get and delete the key (single-use)', async () => {
       redis.getdel.mockResolvedValue(JSON.stringify(mockPayload));
       await store.exchange('valid-code');
       expect(redis.getdel).toHaveBeenCalledWith('oauth:code:valid-code');
       expect(redis.get).not.toHaveBeenCalled();
       expect(redis.del).not.toHaveBeenCalled();
     });
     ```
  5. **Update exchange test "should return null for unknown code"** (lines 109-113):
     - Mock `redis.getdel` returning null instead of `redis.get`
     ```typescript
     it('should return null for an unknown code', async () => {
       redis.getdel.mockResolvedValue(null);
       const result = await store.exchange('nonexistent-code');
       expect(result).toBeNull();
     });
     ```
  6. **Update exchange test "should reconstruct Date objects"** (lines 115-121):
     - Mock `redis.getdel` instead of `redis.get`
     ```typescript
     it('should reconstruct Date objects from JSON serialization', async () => {
       redis.getdel.mockResolvedValue(JSON.stringify(mockPayload));
       const result = await store.exchange('valid-code');
       expect(result!.user.createdAt).toBeInstanceOf(Date);
       expect(result!.user.updatedAt).toBeInstanceOf(Date);
       expect(result!.user.createdAt.toISOString()).toBe(mockDate.toISOString());
     });
     ```

### Step 5: Build, Test, and Verify

- **Action**: Run post-implementation integrity checks
- **Implementation Steps**:
  1. `npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all tests must pass (expect 558+)
  3. `npx jest --coverage` — verify thresholds met

### Step 6: Update Technical Documentation

- **Action**: No documentation changes needed
- **Implementation Steps**:
  1. `api-spec.yml` — no endpoint changes
  2. `data-model.md` — no schema changes
  3. `integration-state.md` — changelog entry will be added during `/update-docs`
- **Notes**: This is an internal implementation change. No external API surface, schema, or architecture changes.

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Replace GET+DEL with GETDEL in `OAuthStateStore.validate()`
3. Step 2: Replace GET+DEL with GETDEL in `OAuthCodeStore.exchange()`
4. Step 3: Update `oauth-state.store.spec.ts`
5. Step 4: Update `oauth-code.store.spec.ts`
6. Step 5: Build + test + coverage
7. Step 6: Documentation review

## 6. Testing Checklist

- [ ] `oauth-state.store.spec.ts`: validate tests use `redis.getdel` mock, assert `redis.get`/`redis.del` NOT called
- [ ] `oauth-code.store.spec.ts`: exchange tests use `redis.getdel` mock, assert `redis.get`/`redis.del` NOT called
- [ ] `generate()` and `getCodeVerifier()` tests remain unchanged (they don't use del)
- [ ] `store()` tests remain unchanged (they use set, not get/del)
- [ ] All 558+ existing tests still pass
- [ ] `nest build` compiles clean
- [ ] Coverage thresholds met

## 7. Error Response Format

No new error responses. The stores' return types remain unchanged (`boolean` for validate, `OAuthTokenPayload | null` for exchange).

## 8. Partial Update Support

N/A — atomic operation replacement.

## 9. Dependencies

None. ioredis (already installed) natively supports `getdel()` for Redis 6.2+.

## 10. Notes

- `getdel()` is a Redis 6.2+ command. ioredis supports it natively via `redis.getdel(key)`.
- `getCodeVerifier()` in OAuthStateStore is a peek-only method — it must continue using `redis.get()` (no deletion).
- The `cleanup()` methods in both stores are no-ops (Redis TTL handles expiration) — no changes needed.
- In `OAuthCodeStore.exchange()`, the current code calls `redis.del()` unconditionally even when `data` is null. GETDEL eliminates this wasteful call.
- The `del` mock must remain in the Redis mock object because other methods or future tests may reference it, but validate/exchange tests should assert it is NOT called.

## 11. Next Steps After Implementation

- Proceed to SCRUM-114 (Endpoint Correctness)

## 12. Implementation Verification

- [ ] `OAuthStateStore.validate()` uses `this.redis.getdel()` — single Redis round-trip
- [ ] `OAuthCodeStore.exchange()` uses `this.redis.getdel()` — single Redis round-trip
- [ ] No `redis.get()` + `redis.del()` pattern remains in either method
- [ ] Tests verify atomicity (getdel called, get/del NOT called)
- [ ] Build clean, all tests pass, coverage thresholds met

## 13. Module-Level Planning

N/A — no module-level changes.

## 14. Satellite App Planning

N/A — NexaCore internal changes only.
