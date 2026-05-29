# SCRUM-154: Rate Limit Responses Reveal Throttle Configuration — Backend Plan

- **Ticket**: SCRUM-154
- **Scope**: backend
- **Sprint**: 5 — Security Hardening
- **Priority**: HIGH (H-08)
- **Security references**: CWE-200

---

### 1. Codebase State Snapshot

- **Date**: 2026-03-09
- **Last completed ticket**: SCRUM-152 (OAuth callback filter information disclosure)
- **Integration state verified**: Yes
- **Branch**: main (clean)

**Files verified**:

| File | Key observations |
|------|-----------------|
| `http-exception.filter.ts:29-32` | Short-circuit: detects `success: false && error` format and passes through as-is — **does NOT strip `retryAfter` from body** |
| `http-exception.filter.ts:44-47` | Retry-After header logic: sets header and strips from body — **only runs for non-custom format** |
| `custom-throttler.guard.ts:40-51` | Throws HttpException with custom format including `retryAfter: retryAfterSeconds` in body |
| `custom-throttler.guard.ts:38` | Also sets `Retry-After` header directly on response before throwing |
| `auth.service.ts:239,296` | Lockout exceptions: `retryAfter` in plain format (non-custom) — correctly stripped by filter lines 44-47 |

**Constructor signatures verified**:
- `HttpExceptionFilter` — no constructor (stateless filter)
- `CustomThrottlerGuard` — extends ThrottlerGuard (no custom constructor)

**Guard dependency chain verified**: No guard changes.

**Discrepancies with integration-state.md**: None.

### 2. Overview

The `CustomThrottlerGuard` throws 429 exceptions with a custom format (`{ success: false, error: { ... retryAfter: N } }`). The `HttpExceptionFilter` has a short-circuit (lines 30-32) that recognizes this custom format and passes it through to the client unchanged. This means the `retryAfter` value (exact seconds until retry is allowed) leaks in the JSON response body, enabling attackers to calculate exact rate limit windows and optimize brute force timing.

The guard already sets the `Retry-After` HTTP header directly (line 38), so the fix is simply to strip `retryAfter` from the custom format body in the short-circuit before sending.

### 3. Architecture Context

- **Modules involved**: None (global filter + global guard)
- **Affected files**: HttpExceptionFilter (fix), CustomThrottlerGuard (no change — already sets header)
- **No new modules/guards/DI changes**

### 4. Implementation Steps

#### Step 1: Fix HttpExceptionFilter short-circuit (http-exception.filter.ts:29-32)

**File**: `nexacore-api/src/common/filters/http-exception.filter.ts`

```typescript
// BEFORE (lines 29-32)
// Short-circuit if already in our custom format (e.g., from CustomThrottlerGuard)
if (responseObj.success === false && responseObj.error) {
  response.status(statusCode).json(exceptionResponse);
  return;
}

// AFTER
// Short-circuit if already in our custom format (e.g., from CustomThrottlerGuard)
if (responseObj.success === false && responseObj.error) {
  const errorObj = responseObj.error as Record<string, unknown>;
  // Strip retryAfter from body — it's already in the Retry-After HTTP header
  if (typeof errorObj.retryAfter === 'number') {
    response.setHeader('Retry-After', String(errorObj.retryAfter));
    delete errorObj.retryAfter;
  }
  response.status(statusCode).json(exceptionResponse);
  return;
}
```

**Rationale**: The `CustomThrottlerGuard` already sets the `Retry-After` HTTP header directly on the response (line 38), so the header will be set twice — once by the guard and once by the filter. This is harmless (last value wins, both are identical). However, for correctness and defense-in-depth, the filter should also set the header in case future code skips the guard's header setting. The key change is `delete errorObj.retryAfter` which removes it from the JSON body.

**Alternative considered**: Remove `retryAfter` from the guard's thrown exception entirely. Rejected because: (1) the guard already sets the HTTP header, (2) other code paths (like auth.service lockout) pass `retryAfter` through the filter's non-custom path — consistency is better, (3) the filter is the single sanitization point for all responses.

#### Step 2: Update throttler guard test assertions (custom-throttler.guard.spec.ts)

**File**: `nexacore-api/src/common/guards/tests/custom-throttler.guard.spec.ts`

The guard tests check the exception body directly (before it passes through the filter). The guard still includes `retryAfter` in the exception — the filter strips it. So the guard tests should still expect `retryAfter` to be in the thrown exception body.

**Decision**: NO CHANGES to throttler guard tests. The tests verify the guard's behavior (what it throws), not the filter's behavior (what reaches the client). The `retryAfter` is still in the thrown exception — it's just stripped by the filter before reaching the client.

#### Step 3: Add filter test for custom-format retryAfter stripping (http-exception.filter.spec.ts)

**File**: `nexacore-api/src/common/filters/tests/http-exception.filter.spec.ts`

Add a new test after the existing short-circuit test (line 253):

```typescript
it('should strip retryAfter from custom format body and set Retry-After header', () => {
  const customBody = {
    success: false,
    error: {
      message: 'Too many requests.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      retryAfter: 60,
    },
  };
  const exception = new HttpException(customBody, 429);

  filter.catch(exception, mockHost);

  expect(mockStatus).toHaveBeenCalledWith(429);
  expect(mockSetHeader).toHaveBeenCalledWith('Retry-After', '60');
  const callArg = mockJson.mock.calls[0][0];
  expect(callArg.error).not.toHaveProperty('retryAfter');
  expect(callArg.error.message).toBe('Too many requests.');
  expect(callArg.error.code).toBe('RATE_LIMIT_EXCEEDED');
});
```

### 5. Testing Checklist

#### Tests to ADD (1):

| # | Test | File | Description |
|---|------|------|-------------|
| 1 | "should strip retryAfter from custom format body and set Retry-After header" | http-exception.filter.spec.ts | Verifies custom-format 429 has retryAfter stripped from body and set as header |

#### Tests UNCHANGED:

| Test | File | Reason |
|------|------|--------|
| "should throw HttpException(429) with RATE_LIMIT_EXCEEDED when limit exceeded" | custom-throttler.guard.spec.ts:109 | Tests guard behavior (what it throws), not filter output — retryAfter still in exception |
| "should throw HttpException(429) when request is blocked..." | custom-throttler.guard.spec.ts:141 | Same — guard test, not filter test |
| "should short-circuit when response already has custom format" | http-exception.filter.spec.ts:242 | Existing test has no retryAfter — tests basic short-circuit, not stripping |
| "should set Retry-After header when retryAfter present" | http-exception.filter.spec.ts:255 | Tests non-custom format (lockout exceptions) — different path |

### 6. Implementation Order

1. Step 1: Fix `HttpExceptionFilter` short-circuit — strip `retryAfter` from custom format body
2. Step 3: Add filter test for custom-format retryAfter stripping
3. Run `nest build` — must compile clean
4. Run `jest --maxWorkers=1 --forceExit` — all tests must pass

### 7. Error Response Format

After fix:

| Scenario | Before (body) | After (body) | Header |
|----------|--------------|-------------|--------|
| 429 from CustomThrottlerGuard | `{ success: false, error: { message, code, statusCode, retryAfter: 60 } }` | `{ success: false, error: { message, code, statusCode } }` | `Retry-After: 60` |
| 401 lockout from AuthService | `{ success: false, error: { message, code, statusCode } }` | No change (already correct) | `Retry-After: N` |

### 8. Dependencies

- No new dependencies
- No new constants

### 9. Notes

- **CustomThrottlerGuard already sets the header**: The guard sets `Retry-After` on the response (line 38) before throwing the exception. The filter also sets it as defense-in-depth. Both values are identical.
- **auth.service lockout retryAfter**: The lockout exceptions (lines 239, 296) use plain format (not custom `success: false` format), so they go through the filter's normal path (lines 44-47) which already correctly strips `retryAfter` and sets the header. No change needed.
- **Frontend impact**: The `nexacore-dashboard` `RateLimitBanner` component reads `retryAfter` from the response body. After this fix, it needs to read from the `Retry-After` HTTP header instead. However, checking the AuthContext — the lockout `retryAfter` (from auth.service) goes through the non-custom path where it's already stripped. The throttler 429 was the only source of `retryAfter` in the body. Frontend should already handle the standard HTTP `Retry-After` header. This is a backend security fix — frontend adaptation (if needed) is a separate concern.

### 10. Next Steps

After implementation:
1. Run `nest build` — must compile clean
2. Run `jest --maxWorkers=1 --forceExit` — all tests must pass
3. Proceed to `/commit`

### 11. Implementation Verification

- [ ] `HttpExceptionFilter` short-circuit strips `retryAfter` from custom format body
- [ ] `Retry-After` HTTP header set in both guard AND filter (defense-in-depth)
- [ ] JSON response body does NOT contain `retryAfter`
- [ ] New test verifies custom-format stripping
- [ ] Existing tests unchanged and passing
- [ ] `nest build` compiles clean
- [ ] All tests pass

### 12. Module-Level Planning

No module changes. No new providers, imports, or exports.

### 13. Satellite App Planning

No satellite app impact.

### 14. Cross-Ticket Dependency Checklist

| Ticket | Relationship | Status |
|--------|-------------|--------|
| SCRUM-140 | Parent — implemented HttpExceptionFilter retryAfter header logic but missed custom format short-circuit | Done |
| SCRUM-152 | Sibling — OAuth callback filter (completed) | Done |
| SCRUM-153 | Sibling — MFA enrollment status (already fixed by SCRUM-140) | Done |

### 15. Guard Dependency Chain Verification

No guard changes. CustomThrottlerGuard is registered as APP_GUARD in AppModule — no modification needed.
