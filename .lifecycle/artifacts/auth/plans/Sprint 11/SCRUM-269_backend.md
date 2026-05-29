# Backend Implementation Plan: SCRUM-269 Low Priority Cleanup Batch

## 1. Codebase State Snapshot

- **Date**: 2026-03-16
- **Last completed ticket**: SCRUM-268 (add updatedAt to RolePermission)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/main.ts:50-56` — ValidationPipe with no `exceptionFactory`
  - `nexacore-api/src/common/filters/http-exception.filter.ts:70-77` — `sanitizeValidationDetails` regex `^[a-zA-Z_][a-zA-Z0-9_]* ` strips leading field name but misses `forbidNonWhitelisted` messages
  - `nexacore-api/tsconfig.build.json:4` — `sourceMap: false` (B-08 already fixed)
  - `nexacore-api/package.json:61` — `pg` used transitively by `@prisma/adapter-pg`, 0 direct imports (DEP-05 already fixed)
- **Constructor signatures verified**: N/A
- **Methods verified to exist**: N/A
- **Discrepancies with integration-state.md**: None

## 2. Regression Impact Analysis

- **Blast radius**: Minimal — 2 files modified (`main.ts` + `http-exception.filter.ts`). Changes only affect validation error message format.
- **Breaking changes identified**: Validation error `details` array will have different message text. No API contract break — messages are already sanitized by the filter; this makes sanitization more robust.
- **API contract impact**: None — the response shape `{ success, error: { message, code, statusCode, details } }` is unchanged.
- **Schema migration impact**: None
- **Test files requiring updates**: `http-exception.filter.spec.ts` — test expectations for `forbidNonWhitelisted` messages need updating. Existing tests for standard messages remain valid.
- **Blast radius size**: 2 files + 1 test file

## 3. Overview

Address EM-11 audit WARN: add a custom `exceptionFactory` to the global `ValidationPipe` that produces sanitized validation error messages. Also improve `sanitizeValidationDetails` in the `HttpExceptionFilter` to handle `forbidNonWhitelisted` messages ("property X should not exist"). B-08, DEP-05, and DC-04 are already resolved — no action needed.

## 4. Architecture Context

- **Module**: Global bootstrap (`main.ts`) + global exception filter
- **Files affected**:
  - `nexacore-api/src/main.ts` — add `exceptionFactory` to ValidationPipe
  - `nexacore-api/src/common/filters/http-exception.filter.ts` — improve `sanitizeValidationDetails` regex
  - `nexacore-api/src/common/filters/tests/http-exception.filter.spec.ts` — add test for `forbidNonWhitelisted` sanitization

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-269-backend`
- **From**: latest `main`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-269-backend`

### Step 1: Add custom exceptionFactory to ValidationPipe

- **File**: `nexacore-api/src/main.ts`
- **Action**: Add `exceptionFactory` to the ValidationPipe configuration that produces generic validation messages without DTO property names.
- **Implementation Steps**:
  1. Import `BadRequestException` from `@nestjs/common` (line 3)
  2. Import `ValidationError` from `class-validator`
  3. Add `exceptionFactory` property to the ValidationPipe options:
     ```typescript
     exceptionFactory: (errors: ValidationError[]) => {
       const messages = errors.flatMap((err) =>
         err.constraints
           ? Object.values(err.constraints)
           : [`${err.property} validation failed`],
       );
       return new BadRequestException(messages);
     },
     ```
- **Implementation Notes**: The `exceptionFactory` returns a standard `BadRequestException` with a messages array. The `HttpExceptionFilter` already handles arrays by calling `sanitizeValidationDetails`, which strips leading field names. The factory also handles `forbidNonWhitelisted` case — when `forbidNonWhitelisted: true`, NestJS calls the factory with `ValidationError` objects that have `constraints: { whitelistValidation: "property X should not exist" }`. The constraint message includes the word "property" before the field name, so the filter's regex handles the first word but leaves the field name.

### Step 2: Improve sanitizeValidationDetails regex

- **File**: `nexacore-api/src/common/filters/http-exception.filter.ts`
- **Action**: Update `sanitizeValidationDetails` to also handle `forbidNonWhitelisted` messages ("property fieldName should not exist") and nested property paths (e.g., "address.zipCode must be...").
- **Implementation Steps**:
  1. Replace the existing regex in `sanitizeValidationDetails`:
     ```typescript
     private sanitizeValidationDetails(details: string[]): string[] {
       return details.map((detail) => {
         // Handle "property fieldName should not exist" (forbidNonWhitelisted)
         if (/^property \S+ should not exist$/i.test(detail)) {
           return 'Unknown property is not allowed';
         }
         // class-validator format: "fieldName constraint message" or "nested.field constraint message"
         // Strip the leading field name (including dotted paths) to prevent DTO structure disclosure (CWE-209)
         const stripped = detail.replace(/^[a-zA-Z_][a-zA-Z0-9_.]*\s+/, '');
         return stripped.charAt(0).toUpperCase() + stripped.slice(1);
       });
     }
     ```
- **Implementation Notes**: Two improvements: (a) special-case `forbidNonWhitelisted` messages to return a generic "Unknown property is not allowed" instead of leaking the property name, (b) updated regex includes `.` to handle dotted/nested property paths.

### Step 3: Add test for forbidNonWhitelisted sanitization

- **File**: `nexacore-api/src/common/filters/tests/http-exception.filter.spec.ts`
- **Action**: Add test case verifying `forbidNonWhitelisted` messages are fully sanitized.
- **Implementation Steps**:
  1. Add test after existing sanitization tests (~line 117):
     ```typescript
     it('should sanitize forbidNonWhitelisted messages completely', () => {
       const exception = new HttpException(
         {
           message: [
             'property unknownField should not exist',
             'property anotherField should not exist',
           ],
           error: 'Bad Request',
           statusCode: 400,
         },
         HttpStatus.BAD_REQUEST,
       );

       filter.catch(exception, mockHost);

       const callArg = mockJson.mock.calls[0][0];
       expect(callArg.error.details).toEqual([
         'Unknown property is not allowed',
         'Unknown property is not allowed',
       ]);
     });
     ```
  2. Add test for dotted nested paths:
     ```typescript
     it('should sanitize dotted nested property paths', () => {
       const exception = new HttpException(
         {
           message: ['address.zipCode must be a string'],
           error: 'Bad Request',
           statusCode: 400,
         },
         HttpStatus.BAD_REQUEST,
       );

       filter.catch(exception, mockHost);

       const callArg = mockJson.mock.calls[0][0];
       expect(callArg.error.details).toEqual(['Must be a string']);
     });
     ```

### Step 4: Build and Test Verification

- **Action**: Verify no regressions
- **Implementation Steps**:
  1. `nest build` — must compile clean
  2. `jest --maxWorkers=1 --forceExit` — all tests must pass (919+, now +2 new)

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add exceptionFactory to ValidationPipe
3. Step 2: Improve sanitizeValidationDetails
4. Step 3: Add tests
5. Step 4: Build and test verification

## 7. Testing Checklist

- [ ] `nest build` compiles clean
- [ ] All existing tests pass (919+)
- [ ] New test: `forbidNonWhitelisted` messages sanitized to "Unknown property is not allowed"
- [ ] New test: dotted nested paths stripped correctly
- [ ] Existing sanitization tests still pass (standard field names stripped)

## 8. Error Response Format

No change to response shape. Before and after:
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": ["Must be an email", "Unknown property is not allowed"]
  }
}
```

## 9. Dependencies

- No new dependencies. `class-validator` already in `package.json`.

## 10. Notes

- **B-08 (source maps)**: Already fixed — `tsconfig.build.json` has `sourceMap: false`. No action.
- **DEP-05 (pg dependency)**: Already resolved — `pg` is a peer dependency of `@prisma/adapter-pg`, zero direct imports. No action.
- **DC-04 (Sprint 6 records)**: Documentation-only, very low priority. Can be addressed in a future docs pass. Not blocking.
- The `exceptionFactory` + improved filter regex form a **defense-in-depth** pattern: the factory produces messages with field names (needed for developer DX in dev mode), and the filter strips them before they reach the client.

## 11. Next Steps After Implementation

- Run `/verify SCRUM-269` then `/commit SCRUM-269`

## 12. Implementation Verification

- [ ] **Code Quality**: exceptionFactory handles all ValidationError shapes
- [ ] **Functionality**: Validation errors no longer leak DTO property names
- [ ] **Testing**: All 919+ tests pass + 2 new tests
- [ ] **Regression**: No blast radius — same response shape, better sanitization
- [ ] **Documentation**: No doc changes needed (no new endpoints, models, or modules)
