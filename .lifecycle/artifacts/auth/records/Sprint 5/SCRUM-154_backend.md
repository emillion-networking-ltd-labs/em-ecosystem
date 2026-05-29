# Implementation Record: SCRUM-154 Rate Limit Responses Reveal Throttle Configuration

## 1. Summary

Fixed the `HttpExceptionFilter` short-circuit to strip `retryAfter` from the JSON response body for custom-format 429 responses from `CustomThrottlerGuard`. The exact retry-after value (exposing throttle window configuration) now only appears in the standard `Retry-After` HTTP header, not in the body.

- **Scope**: backend
- **Branch**: `feature/SCRUM-154-backend`
- **Implementation date**: 2026-03-09
- **PR**: #42
- **Security references**: CWE-200

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 5/SCRUM-154_backend.md`
- **Plan was followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `d2bf2ed` | fix(SCRUM-154): strip retryAfter from rate limit response body | 2 files (1 source + 1 test) |

## 4. Deviations from Plan

Implementation followed the plan exactly.

## 5. Files Changed

### Modified Source Files (1)

| File | Changes |
|------|---------|
| `nexacore-api/src/common/filters/http-exception.filter.ts` | Lines 30-38: In the custom-format short-circuit, added logic to extract `retryAfter` from the error object, set it as `Retry-After` HTTP header, and delete it from the body before sending the JSON response. |

### Modified Test Files (1)

| File | Changes |
|------|---------|
| `nexacore-api/src/common/filters/tests/http-exception.filter.spec.ts` | Added 1 new test: "should strip retryAfter from custom format body and set Retry-After header" — verifies custom-format 429 has retryAfter stripped from body and set as header. |

## 6. Test Results

- **Backend**: 44 suites, 821 tests — all pass
- **TypeScript**: `nest build` compiles clean
- **Net test change**: +1 (1 test added)

## 7. Bugs Found

No bugs found during implementation.

## 8. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry added. No module/guard/DI/controller/permission/schema changes — filter behavior fix only. |

## 9. Lessons Learned

- The SCRUM-140 HttpExceptionFilter fix had two code paths: the normal path (lines 44-47) correctly stripped `retryAfter`, but the custom-format short-circuit (lines 30-32) bypassed this logic entirely. This is a common pattern — when adding sanitization logic, ensure ALL exit paths are covered, including short-circuits.
- The `CustomThrottlerGuard` already sets the `Retry-After` HTTP header directly on the response before throwing, so the header is set twice (by guard and filter). This is harmless but provides defense-in-depth.
