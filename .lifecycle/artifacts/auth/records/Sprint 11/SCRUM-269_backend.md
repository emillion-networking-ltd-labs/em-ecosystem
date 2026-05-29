# Implementation Record: SCRUM-269 Low Priority Cleanup Batch

## 1. Summary

- **What**: Added custom `exceptionFactory` to global `ValidationPipe` and improved `sanitizeValidationDetails` in `HttpExceptionFilter` to fully sanitize `forbidNonWhitelisted` messages and dotted nested property paths (EM-11, CWE-209). B-08, DEP-05 confirmed already fixed. DC-04 deferred.
- **Scope**: Backend
- **Branch**: `feature/SCRUM-269-backend`
- **PR**: #143
- **Date**: 2026-03-16

## 2. Plan Reference

- **Plan**: `ai-specs/changes/plans/Sprint 11/SCRUM-269_backend.md`
- **Plan followed**: Yes

## 3. Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `d8d7836` | SCRUM-269: add custom ValidationPipe exceptionFactory + improve error sanitization (EM-11) | `src/main.ts`, `src/common/filters/http-exception.filter.ts`, `src/common/filters/tests/http-exception.filter.spec.ts` |

## 4. Deviations from Plan

Implementation followed the plan exactly. No deviations.

## 5. Test Results

- **Build**: `nest build` clean
- **All backend tests**: 921 passed / 0 failed (+2 new)
- **New tests**:
  - `should sanitize forbidNonWhitelisted messages completely` — verifies "property X should not exist" → "Unknown property is not allowed"
  - `should sanitize dotted nested property paths` — verifies "address.zipCode must be a string" → "Must be a string"

## 6. Bugs Found

No bugs found during implementation.

## 7. Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-269 |
| `ai-specs/changes/records/Sprint 11/SCRUM-269_backend.md` | This record |

## 8. Audit Finding Verification

- **Audit check ID**: EM-11
- **Standard**: CWE-209 (Generation of Error Message Containing Sensitive Information)
- **Fix**: Custom `exceptionFactory` in ValidationPipe + improved `sanitizeValidationDetails` regex with `forbidNonWhitelisted` special case
- **All instances resolved**: Yes — single instance in `main.ts:50-64`
- **Recurrence prevention**: The `HttpExceptionFilter` acts as defense-in-depth — any future validation errors pass through `sanitizeValidationDetails` regardless of how the ValidationPipe is configured
- **Root cause**: Default NestJS `exceptionFactory` was used, which passes raw class-validator messages including DTO property names
- **SLA status**: Completed within SLA (LOW — within 2 sprints)

### Additional findings status:
- **B-08**: Already fixed — `tsconfig.build.json:4` has `sourceMap: false`
- **DEP-05**: Already resolved — `pg` is peer dependency of `@prisma/adapter-pg`, zero direct imports
- **DC-04**: Deferred — documentation-only, very low priority

## 9. Lessons Learned

- **Defense-in-depth**: Having sanitization in both the `exceptionFactory` (source) and `HttpExceptionFilter` (output) ensures DTO property names are stripped even if one layer is misconfigured.
- **forbidNonWhitelisted pitfall**: NestJS generates "property X should not exist" messages that don't follow the standard "fieldName constraint" pattern — requires explicit handling.
