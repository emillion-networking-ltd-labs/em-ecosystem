# Backend Implementation Plan: SCRUM-123 Improve Auth Test Coverage to 90%+ Functions (T-04/T-06/T-07)

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket on branch**: SCRUM-122 (OAuth URLs + JWT expiry production validation)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.service.ts` — 2437 lines; `handleTravelBlock()` at line 770, `checkSuspiciousLoginSuccess()` at line 795, `checkSuspiciousLoginFailure()` at line 811 (all private, all use fire-and-forget `.catch(() => {})`)
  - `src/auth/trusted-device.service.ts` — 3 fire-and-forget `.catch(() => {})` at lines 89, 161, 177 (trustDevice, revokeDevice, revokeAllDevices); `parseDeviceName()` at line 183 with both `Edg/` (line 193) and `Edge/` (line 194) detection
  - `src/auth/guards/jwt-auth.guard.ts` — 5 lines, one-liner: `class JwtAuthGuard extends AuthGuard('jwt') {}`
  - `src/auth/tests/auth.service.spec.ts` — 2437 lines; fire-and-forget resilience block at lines 1608-1770 (12 tests, already present); impossible travel tests at lines 2225-2290 (4 tests); suspicious login tests at lines 2292-2354 (4 tests)
  - `src/auth/tests/trusted-device.service.spec.ts` — 392 lines; parseDeviceName tests at lines 333-391 (8 tests), NO fire-and-forget resilience tests, only modern `Edg/` tested (line 361), no `Edge/` legacy, no iPad test
- **Constructor signatures verified**: N/A — test-only changes, no source modifications
- **Methods verified to exist**: `handleTravelBlock(travelResult, userId, requestMeta)` at auth.service.ts:770, `checkSuspiciousLoginSuccess(user, requestMeta)` at auth.service.ts:795, `checkSuspiciousLoginFailure(userId, requestMeta)` at auth.service.ts:811
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None relevant to this ticket

## Overview

Close remaining test coverage gaps in auth module services identified by audit findings T-04 (function coverage <90%), T-06 (service-level gaps), and T-07 (guard coverage). The current function coverage from SCRUM-115 is ~91.45%, but specific untested branches remain: trusted-device.service.ts fire-and-forget handlers, browser detection edge cases, and auth.service.ts defensive branches.

## Architecture Context

- **Modules involved**: None — test files only
- **Components affected**: auth.service.spec.ts (3 new tests), trusted-device.service.spec.ts (5 new tests)
- **No DI, module, guard, controller, or schema changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-123-backend` from SCRUM-122 branch
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-122-backend` (already there)
  2. `git checkout -b feature/SCRUM-123-backend`
  3. Verify branch: `git branch --show-current`

### Step 1: Add Missing Tests to auth.service.spec.ts

- **File**: `src/auth/tests/auth.service.spec.ts`
- **Action**: Add 3 new tests for untested branches in private helper methods
- **Implementation Steps**:
  1. Inside the `suspicious login detection integration` describe block (after line 2354), add:

     **Test 1: checkSuspiciousLoginFailure with undefined userId (early return)**
     ```typescript
     it('should not call analyzeLoginFailure when userId is undefined (user not found)', async () => {
       usersService.findByEmail.mockResolvedValue(null);
       (bcrypt.compare as jest.Mock).mockResolvedValue(false);

       await expect(
         authService.login(
           { email: 'nonexistent@example.com', password: 'pass' },
           requestMeta,
         ),
       ).rejects.toThrow(UnauthorizedException);

       expect(suspiciousLoginService.analyzeLoginFailure).not.toHaveBeenCalled();
     });
     ```
     This tests the `if (!userId) return;` guard at line 815 of auth.service.ts.

  2. Inside the `impossible travel integration` describe block, add after the blocked test (line 2279):

     **Test 2: handleTravelBlock audit payload verification**
     ```typescript
     it('should log audit with travel metadata when blocking', async () => {
       const auditSvc = (authService as any).auditService;
       impossibleTravelService.detectImpossibleTravel.mockResolvedValue({
         isAnomalous: true,
         previousLocation: { city: 'Madrid', country: 'Spain', countryCode: 'ES', latitude: 40.4168, longitude: -3.7038 },
         currentLocation: { city: 'New York', country: 'United States', countryCode: 'US', latitude: 40.7128, longitude: -74.006 },
         distanceKm: 5762,
         elapsedHours: 0.5,
         requiredSpeedKmh: 11524,
         strategy: 'block',
         actionTaken: 'blocked',
       });

       await expect(authService.login(loginDto, requestMeta)).rejects.toThrow(ForbiddenException);

       expect(auditSvc.log).toHaveBeenCalledWith(
         expect.objectContaining({
           action: 'LOGIN_BLOCKED_TRAVEL',
           userId: 'uuid-123',
           metadata: expect.objectContaining({
             distanceKm: 5762,
             elapsedHours: 0.5,
             requiredSpeedKmh: 11524,
           }),
         }),
       );
     });
     ```

  3. After the `suspicious login detection integration` describe block, add:

     **Test 3: checkSuspiciousLoginSuccess full payload assertion**
     ```typescript
     it('should pass full payload to analyzeLoginSuccess', async () => {
       await authService.login(loginDto, requestMeta);

       expect(suspiciousLoginService.analyzeLoginSuccess).toHaveBeenCalledWith(
         expect.objectContaining({
           userId: 'uuid-123',
           email: 'test@example.com',
           firstName: null,
           ipAddress: '127.0.0.1',
           userAgent: 'test-agent',
           loginTime: expect.any(Date),
         }),
       );
     });
     ```

### Step 2: Add Missing Tests to trusted-device.service.spec.ts

- **File**: `src/auth/tests/trusted-device.service.spec.ts`
- **Action**: Add 5 new tests (3 fire-and-forget resilience + 2 browser detection variants)
- **Implementation Steps**:
  1. After the `revokeAllDevices` describe block (before `parseDeviceName`), add a new describe block:

     ```typescript
     // ─── Fire-and-forget resilience ──────────────────────────────
     describe('fire-and-forget audit resilience', () => {
       it('trustDevice should succeed even when audit log rejects', async () => {
         auditService.log.mockRejectedValue(new Error('audit write failed'));
         prisma.trustedDevice.count.mockResolvedValue(0);
         prisma.trustedDevice.upsert.mockResolvedValue(mockDevice);

         const result = await service.trustDevice('user-1', 'fingerprint', '127.0.0.1', 'Chrome UA');

         expect(result).toBeDefined();
         expect(result.id).toBe('device-1');
       });

       it('revokeDevice should succeed even when audit log rejects', async () => {
         auditService.log.mockRejectedValue(new Error('audit write failed'));
         prisma.trustedDevice.findFirst.mockResolvedValue(mockDevice);
         prisma.trustedDevice.update.mockResolvedValue({ ...mockDevice, isRevoked: true });

         await expect(
           service.revokeDevice('device-1', 'user-1'),
         ).resolves.not.toThrow();
       });

       it('revokeAllDevices should succeed even when audit log rejects', async () => {
         auditService.log.mockRejectedValue(new Error('audit write failed'));
         prisma.trustedDevice.updateMany.mockResolvedValue({ count: 3 });

         const count = await service.revokeAllDevices('user-1');

         expect(count).toBe(3);
       });
     });
     ```

  2. Inside the `parseDeviceName` describe block, after the Edge on Windows test (line 363), add:

     **Test 4: Edge legacy browser detection**
     ```typescript
     it('should detect legacy Edge on Windows', () => {
       expect(
         service.parseDeviceName(
           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0 Safari/537.36 Edge/18.0',
         ),
       ).toBe('Edge on Windows');
     });
     ```

  3. After the Safari on iOS (iPhone) test (line 379), add:

     **Test 5: Safari iPad browser detection**
     ```typescript
     it('should detect Safari on iOS (iPad)', () => {
       expect(
         service.parseDeviceName(
           'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
         ),
       ).toBe('Safari on iOS');
     });
     ```

### Step 3: Build, Test, Verify

- **Implementation Steps**:
  1. `nest build` — zero errors
  2. Run full test suite — all tests pass
  3. Expected test count: ~773 (765 + 8 new)
  4. Verify function coverage targets:
     - auth.service.ts funcs ≥ 90%
     - trusted-device.service.ts funcs: approaching 100% (fire-and-forget handlers now covered)

### Step 4: Update Technical Documentation

- **Action**: Review documentation impact
- **Implementation Steps**:
  1. `integration-state.md`: Add SCRUM-123 changelog entry
  2. No api-spec.yml, data-model.md, or other doc changes (no API or schema changes)

## Implementation Order

1. Step 0: Create Feature Branch
2. Step 1: Add auth.service.spec.ts tests (3)
3. Step 2: Add trusted-device.service.spec.ts tests (5)
4. Step 3: Build, test, verify
5. Step 4: Update technical documentation

## Testing Checklist

- [ ] checkSuspiciousLoginFailure with undefined userId → analyzeLoginFailure NOT called
- [ ] handleTravelBlock audit payload → metadata contains distanceKm, elapsedHours, requiredSpeedKmh
- [ ] checkSuspiciousLoginSuccess full payload → all 6 fields verified
- [ ] trustDevice fire-and-forget resilience → device created despite audit failure
- [ ] revokeDevice fire-and-forget resilience → device revoked despite audit failure
- [ ] revokeAllDevices fire-and-forget resilience → count returned despite audit failure
- [ ] Legacy Edge/ browser detection → 'Edge on Windows'
- [ ] Safari iPad browser detection → 'Safari on iOS'
- [ ] `nest build` compiles with zero errors
- [ ] All existing tests still pass

## Error Response Format

No API error responses — test-only changes with no runtime behavior modifications.

## Dependencies

- No new npm packages
- **Prerequisite**: SCRUM-122 (must be on `feature/SCRUM-122-backend` branch)

## Notes

- **Test-only ticket**: No source code modifications. All changes are in test files.
- **Fire-and-forget pattern**: The `.catch(() => {})` callbacks are anonymous functions. When `auditService.log` rejects, the catch handler swallows the error silently. Tests verify the main operation still succeeds despite audit failure.
- **JwtAuthGuard**: The guard is a one-liner (`extends AuthGuard('jwt')`) with no custom logic. It achieves 100% coverage through integration — instantiated by every test that uses `JwtAuthGuard` as a provider. No dedicated spec file needed. This matches the original bulk commit assessment (T-07 reclassified to PASS).
- **Rectified**: Individual branch/commit/PR replacing bulk commit `e0f12f7`.
- **Coverage context**: SCRUM-115 baseline was 91.45% funcs. These additional tests close remaining micro-gaps in trusted-device.service.ts (fire-and-forget handlers) and auth.service.ts (defensive branches).

## Next Steps After Implementation

1. Commit, push, create PR
2. Run `/update-docs SCRUM-123`
3. Proceed to SCRUM-124 (or next in rectification sequence)

## Implementation Verification

- [ ] **Code Quality**: 8 new tests added, all follow existing test patterns
- [ ] **Functionality**: No source modifications — tests only
- [ ] **Testing**: Fire-and-forget resilience, browser detection edge cases, defensive branches all covered
- [ ] **Security**: T-04/T-06/T-07 audit findings addressed
- [ ] **Integration**: No module, guard, or DI changes
- [ ] **Documentation**: integration-state.md updated
