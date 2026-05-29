# Backend Implementation Plan: SCRUM-249 Tech Debt — LoginSecurityService Unit Tests

## Codebase State Snapshot

- **Date**: 2026-03-15
- **Last completed ticket**: SCRUM-245 (Structural refactoring)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/login-security.service.ts` — 121 lines, 5 constructor deps, 5 public methods
  - `nexacore-api/src/auth/tests/trusted-device.service.spec.ts` — reference pattern (direct instantiation + manual mocks)
  - `nexacore-api/src/auth/tests/auth-test.helpers.ts` — shared test module factory (not used for this test)
  - `nexacore-api/src/geolocation/interfaces/geolocation-result.interface.ts` — ImpossibleTravelResult shape
- **Constructor signatures verified**:
  - `LoginSecurityService(impossibleTravelService: ImpossibleTravelService, suspiciousLoginService: SuspiciousLoginService, mailService: MailService, sessionsService: SessionsService, auditService: AuditService)` — 5 deps
- **Methods verified to exist**:
  - `checkImpossibleTravel(user, requestMeta)` — line 25
  - `handleTravelBlock(travelResult, userId, requestMeta)` — line 48
  - `checkSuspiciousLoginSuccess(user, requestMeta)` — line 65
  - `checkSuspiciousLoginFailure(userId, requestMeta)` — line 81
  - `notifyIfNewDevice(user, sessionId, requestMeta)` — line 95
- **Discrepancies with integration-state.md**: None

## Overview

Create a dedicated unit test file for `LoginSecurityService`, covering all 5 public methods. This resolves the D4 (Accepted-Quality) deviation from SCRUM-245. Test-only change — no production code modifications.

## Architecture Context

- **Modules involved**: None (test file only)
- **Components affected**: None
- **New file**: `nexacore-api/src/auth/tests/login-security.service.spec.ts`

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-249-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-249-backend`

### Step 1: Create Test File with Mock Setup

- **File**: `nexacore-api/src/auth/tests/login-security.service.spec.ts` (NEW)
- **Action**: Create test file following the direct-instantiation pattern (like `trusted-device.service.spec.ts`)
- **Implementation Steps**:
  1. Define mock objects for all 5 dependencies:
     - `impossibleTravelService: { detectImpossibleTravel: jest.Mock }`
     - `suspiciousLoginService: { analyzeLoginSuccess: jest.Mock, analyzeLoginFailure: jest.Mock }`
     - `mailService: { sendLoginNotificationEmail: jest.Mock }`
     - `sessionsService: { findPreviousActiveSessions: jest.Mock }`
     - `auditService: { log: jest.Mock }`
  2. In `beforeEach`: clear mocks, recreate mock objects with default `.mockResolvedValue()`, instantiate `new LoginSecurityService(...)` directly
  3. Define shared fixtures:
     - `mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'Test', mfaEnabled: false }`
     - `requestMeta = { ipAddress: '127.0.0.1', userAgent: 'test-agent' }`
     - `mockTravelResult: ImpossibleTravelResult` (anomalous, blocked)

### Step 2: Test `checkImpossibleTravel`

- **Action**: 2 test cases
- **Test cases**:
  1. `should call detectImpossibleTravel with correct params and return result` — mock returns a travel result, verify params passed and return value
  2. `should return null when detectImpossibleTravel throws` — mock rejects, verify returns `null` (the try/catch)

### Step 3: Test `handleTravelBlock`

- **Action**: 2 test cases
- **Test cases**:
  1. `should log audit event with travel metadata` — verify `auditService.log` called with `AuditAction.LOGIN_BLOCKED_TRAVEL`, userId, and metadata fields (previousLocation, currentLocation, distanceKm, elapsedHours, requiredSpeedKmh)
  2. `should throw ForbiddenException` — verify the exception is thrown with the correct message

### Step 4: Test `checkSuspiciousLoginSuccess`

- **Action**: 2 test cases
- **Test cases**:
  1. `should call analyzeLoginSuccess with correct params` — verify params include userId, email, firstName, ipAddress, userAgent, loginTime
  2. `should not throw when analyzeLoginSuccess rejects` — mock rejects, call method, verify no exception propagates (fire-and-forget `.catch`)

### Step 5: Test `checkSuspiciousLoginFailure`

- **Action**: 3 test cases
- **Test cases**:
  1. `should call analyzeLoginFailure with correct params` — verify userId, ipAddress, userAgent
  2. `should return early when userId is undefined` — call with `undefined`, verify `analyzeLoginFailure` NOT called
  3. `should not throw when analyzeLoginFailure rejects` — mock rejects, verify no exception

### Step 6: Test `notifyIfNewDevice`

- **Action**: 4 test cases
- **Test cases**:
  1. `should not send email when no previous sessions exist` — mock returns `[]`, verify `sendLoginNotificationEmail` NOT called
  2. `should not send email when IP and userAgent both match` — mock returns `[{ ipAddress: '127.0.0.1', userAgent: 'test-agent' }]`, verify NOT called
  3. `should send email when IP differs from all previous sessions` — mock returns `[{ ipAddress: '10.0.0.1', userAgent: 'test-agent' }]`, verify `sendLoginNotificationEmail` called with correct args
  4. `should send email when userAgent differs from all previous sessions` — mock returns `[{ ipAddress: '127.0.0.1', userAgent: 'other-agent' }]`, verify called

### Step 7: Build & Test Verification

- **Action**: Verify everything passes
- `cd nexacore-api && npx jest login-security.service --forceExit` — new tests pass
- `npx nest build` — compiles clean
- `npx jest --maxWorkers=1 --forceExit` — full suite passes (901+ tests)

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create test file with mock setup
3. Steps 2-6: Implement test cases per method (can be done sequentially in same file)
4. Step 7: Build & test verification

## Testing Checklist

- [ ] `checkImpossibleTravel`: success + exception paths (2 tests)
- [ ] `handleTravelBlock`: audit log + exception (2 tests)
- [ ] `checkSuspiciousLoginSuccess`: correct params + fire-and-forget (2 tests)
- [ ] `checkSuspiciousLoginFailure`: correct params + early return + fire-and-forget (3 tests)
- [ ] `notifyIfNewDevice`: no sessions + match + IP diff + UA diff (4 tests)
- [ ] Total: 13 test cases minimum
- [ ] `nest build` compiles clean
- [ ] Full suite passes (901+ tests)

## Error Response Format

N/A — test-only ticket.

## Dependencies

No new dependencies. Uses only existing Jest + NestJS testing utilities.

## Notes

- **Direct instantiation**: Use `new LoginSecurityService(...)` instead of `Test.createTestingModule(...)` — simpler for pure unit tests with no NestJS DI features needed.
- **Fire-and-forget tests**: For methods using `.catch(() => {})`, use `process.nextTick` flush or simply verify the mock was called (the catch swallows errors silently).
- **No production code changes**: This is purely additive test coverage.
