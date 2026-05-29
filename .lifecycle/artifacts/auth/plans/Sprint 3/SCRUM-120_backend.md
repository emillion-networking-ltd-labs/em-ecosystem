# Backend Implementation Plan: SCRUM-120 Reduce Session Timeouts to NIST AAL2

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket on branch**: SCRUM-119 (Enforce MFA for Admin/SUPERADMIN roles)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/constants/auth.constants.ts` — 101 lines, SESSION_IDLE_TIMEOUT_HOURS at line 73 (parseInt, default '24'), MAX_CONCURRENT_SESSIONS at line 82
  - `src/auth/auth.service.ts` — 1173 lines, constructor at line 108-129 (11 deps), refreshExpiration default '7d' at line 121
  - `src/sessions/tests/sessions.service.spec.ts` — isSessionIdle tests at lines 543-561 (use 25h/23h test data)
- **Constructor signatures verified**:
  - `AuthService(usersService, sessionsService, jwtService, oauthCodeStore, auditService, passwordBreachService, prisma, mailService, trustedDeviceService, impossibleTravelService, suspiciousLoginService)` — 11 deps at lines 108-119
- **Methods verified to exist**:
  - `parseDurationMs()` at auth.service.ts:48 — converts '7d'/'12h' strings to milliseconds
  - `isSessionIdle()` at sessions.service.ts — accepts `lastUsedAt: Date` and optional `timeoutHours` parameter
- **Guard dependency chain verified**: N/A — no guard changes in this ticket
- **Discrepancies with integration-state.md**: None relevant to this ticket. The SCRUM-119-126 bulk changelog entry exists but individual SCRUM-119 entry was added.

## Overview

Reduce session timeout defaults to comply with OWASP ASVS V3.3.2 (idle timeout <= 30 min) and V3.3.3 (absolute timeout <= 12h) at AAL2. Changes are config-only defaults — env vars still override.

## Architecture Context

- **Modules involved**: AuthModule (constants), SessionsModule (test only)
- **Components affected**: auth.constants.ts (constant value + parser), auth.service.ts (constructor default), sessions.service.spec.ts (test data)
- **No DI, module, guard, or schema changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-120-backend` from SCRUM-119 branch
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-119-backend` (already there)
  2. `git checkout -b feature/SCRUM-120-backend`
  3. Verify branch: `git branch --show-current`

### Step 1: Update SESSION_IDLE_TIMEOUT_HOURS

- **File**: `src/auth/constants/auth.constants.ts`
- **Action**: Change default from '24' to '0.5', switch parseInt to parseFloat
- **Implementation Steps**:
  1. At line 73, replace the SESSION_IDLE_TIMEOUT_HOURS block:
     ```typescript
     /**
      * Session idle timeout in hours.
      * Sessions with lastUsedAt older than this are rejected on refresh.
      * NIST SP 800-63B §7.2 / OWASP ASVS V3.3.2: idle timeout <= 30 min at AAL2.
      * Default: 0.5h (30 minutes). Override via SESSION_IDLE_TIMEOUT_HOURS env var.
      */
     export const SESSION_IDLE_TIMEOUT_HOURS = parseFloat(
       process.env.SESSION_IDLE_TIMEOUT_HOURS || '0.5',
     );
     ```
  2. Key changes: `parseInt(..., 10)` → `parseFloat()` (supports fractional hours), `'24'` → `'0.5'`

### Step 2: Update JWT_REFRESH_EXPIRATION Default

- **File**: `src/auth/auth.service.ts`
- **Action**: Change default from '7d' to '12h' in constructor
- **Implementation Steps**:
  1. At line 121, replace:
     ```typescript
     // OWASP ASVS V3.3.3 / NIST SP 800-63B §7.2: absolute timeout <= 12h at AAL2
     this.refreshExpiration = process.env.JWT_REFRESH_EXPIRATION || '12h';
     ```
  2. The existing `parseDurationMs()` already handles '12h' format correctly (case 'h' at line 59)
- **Implementation Notes**:
  - `parseDurationMs('12h')` = 12 * 60 * 60 * 1000 = 43,200,000ms (correct)
  - Cookie maxAge and session expiresAt both derive from this value

### Step 3: Update isSessionIdle Tests

- **File**: `src/sessions/tests/sessions.service.spec.ts`
- **Action**: Adjust test data for new 0.5h default threshold
- **Implementation Steps**:
  1. At line 544-547, update "older than threshold" test:
     ```typescript
     it('should return true when lastUsedAt is older than threshold', () => {
       // Default idle timeout is 0.5h (30 min) — 1 hour ago should be idle
       const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
       expect(sessionsService.isSessionIdle(oneHourAgo)).toBe(true);
     });
     ```
  2. At line 549-552, update "within threshold" test:
     ```typescript
     it('should return false when lastUsedAt is within threshold', () => {
       // Default idle timeout is 0.5h (30 min) — 10 minutes ago should NOT be idle
       const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
       expect(sessionsService.isSessionIdle(tenMinsAgo)).toBe(false);
     });
     ```
  3. The "custom idle timeout parameter" test (line 554-560) remains unchanged — it tests the override path

### Step 4: Build, Test, Verify

- **Implementation Steps**:
  1. `nest build` — zero errors
  2. Run full test suite — all tests pass
  3. Verify SESSION_IDLE_TIMEOUT_HOURS value: `grep -n 'SESSION_IDLE_TIMEOUT_HOURS' src/auth/constants/auth.constants.ts`
  4. Verify refreshExpiration value: `grep -n "refreshExpiration" src/auth/auth.service.ts | head -3`

### Step 5: Update Technical Documentation

- **Action**: Review documentation impact
- **Implementation Steps**:
  1. `api-spec.yml`: Update POST /auth/refresh description — change "SESSION_IDLE_TIMEOUT_HOURS (default 24h)" to "(default 0.5h / 30 min)"
  2. `integration-state.md`: Add SCRUM-120 changelog entry
  3. No data-model.md changes (no schema changes)

## Implementation Order

1. Step 0: Create Feature Branch
2. Step 1: Update SESSION_IDLE_TIMEOUT_HOURS (constants)
3. Step 2: Update JWT_REFRESH_EXPIRATION (auth.service.ts constructor)
4. Step 3: Update isSessionIdle tests
5. Step 4: Build, test, verify
6. Step 5: Update technical documentation

## Testing Checklist

- [ ] SESSION_IDLE_TIMEOUT_HOURS defaults to 0.5 (parseFloat, not parseInt)
- [ ] JWT_REFRESH_EXPIRATION defaults to '12h' (not '7d')
- [ ] isSessionIdle test: 1 hour ago → idle (true)
- [ ] isSessionIdle test: 10 min ago → not idle (false)
- [ ] isSessionIdle test: custom parameter override still works
- [ ] parseDurationMs tests unchanged and passing
- [ ] `nest build` compiles with zero errors
- [ ] All existing tests still pass

## Error Response Format

No new error responses. Existing 401 response for idle session timeout is unchanged:
```json
{
  "message": "Session expired due to inactivity",
  "error": "Unauthorized",
  "statusCode": 401
}
```

## Dependencies

- No new npm packages
- **Prerequisite**: SCRUM-119 (must be on `feature/SCRUM-119-backend` branch)

## Notes

- **Backwards compatibility**: Deployments with custom `SESSION_IDLE_TIMEOUT_HOURS` or `JWT_REFRESH_EXPIRATION` env vars are unaffected — env vars still override defaults.
- **parseInt → parseFloat**: Required to support 0.5 (fractional hours). parseInt('0.5', 10) would return 0, which would make ALL sessions idle immediately.
- **12h refresh vs 0.5h idle**: Refresh tokens live up to 12h, but inactive sessions are killed after 30 min. Active users get seamless 12h sessions; idle users must re-authenticate after 30 min.

## Next Steps After Implementation

1. Commit, push, create PR
2. Run `/update-docs SCRUM-120`
3. Proceed to SCRUM-121

## Implementation Verification

- [ ] **Code Quality**: Only 3 lines of production code changed (2 in constants, 1 in service)
- [ ] **Functionality**: Session timeout reduced to NIST AAL2 compliance
- [ ] **Testing**: Existing tests updated to match new defaults
- [ ] **Security**: OWASP ASVS V3.3.2 + V3.3.3 compliance verified
- [ ] **Integration**: No module, guard, or DI changes
- [ ] **Documentation**: api-spec.yml + integration-state.md updated
