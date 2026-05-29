# Backend Implementation Plan: SCRUM-159 Security: Sanitize validation error field names in HTTP responses

## 1. Header

- **Ticket**: SCRUM-159
- **Sprint**: Sprint 5 - Security Hardening
- **Scope**: backend
- **Parent**: Deferred from SCRUM-140 (M-03)
- **CWE**: CWE-209 (Generation of Error Message Containing Sensitive Information)

## 2. Codebase State Snapshot

- **Date**: 2026-03-08
- **Last completed ticket**: SCRUM-140 (Error Message Information Disclosure Audit & Remediation)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/common/filters/http-exception.filter.ts` — 74 lines, `catch()` method at line 12, validation array handling at lines 37-40
  - `src/common/filters/tests/http-exception.filter.spec.ts` — 238 lines, 11 test cases
  - `src/main.ts` — line 49-55: ValidationPipe config (whitelist, forbidNonWhitelisted, transform, NO custom exceptionFactory)
- **Constructor signatures verified**: `HttpExceptionFilter` — no constructor (stateless filter, implements `ExceptionFilter`)
- **Methods verified to exist**:
  - `HttpExceptionFilter.catch(exception, host)` — line 12
  - `HttpExceptionFilter.getErrorCode(statusCode)` — line 62
- **Guard dependency chain verified**: N/A — this ticket modifies a filter, not a guard
- **Discrepancies with integration-state.md**: None

## 3. Overview

Strip internal DTO field names from class-validator error messages in the `HttpExceptionFilter`. Currently, validation errors like `"email must be an email"` expose the DTO property name `email`. After this change, the response will contain `"Must be an email"` — removing the field name prefix and capitalizing the first letter for readability.

This is a minimal, surgical change to the filter's validation error handling (lines 37-40). No other files, modules, or services are affected.

## 4. Architecture Context

- **Module**: Common (global filter registered in `main.ts` line 57)
- **Component affected**: `HttpExceptionFilter` only
- **Files**: 2 files (1 source + 1 test)
- **No module imports, guards, or DI changes required**

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch
- **Branch Naming**: `feature/SCRUM-159-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-159-backend`
  3. Verify branch: `git branch`

### Step 1: Add sanitization helper to HttpExceptionFilter

- **File**: `src/common/filters/http-exception.filter.ts`
- **Action**: Add a private method `sanitizeValidationDetails()` that strips the leading field name from each class-validator error message
- **Function Signature**:
  ```typescript
  private sanitizeValidationDetails(details: string[]): string[] {
    return details.map((detail) => {
      // class-validator format: "fieldName constraint message"
      // Strip the first word (field name) and capitalize
      const stripped = detail.replace(/^[a-zA-Z_][a-zA-Z0-9_]* /, '');
      return stripped.charAt(0).toUpperCase() + stripped.slice(1);
    });
  }
  ```
- **Implementation Steps**:
  1. Add the `sanitizeValidationDetails` private method after `getErrorCode`
  2. Modify lines 37-40 to call the sanitizer:
     ```typescript
     if (Array.isArray(responseObj.message)) {
       details = this.sanitizeValidationDetails(responseObj.message as string[]);
       message = 'Validation failed';
     }
     ```
- **Dependencies**: None (pure string manipulation)
- **Implementation Notes**:
  - The regex `^[a-zA-Z_][a-zA-Z0-9_]* ` matches valid JS/TS identifier followed by a space — this is the field name prefix that class-validator prepends
  - If a message doesn't match the pattern (no field name prefix), it passes through unchanged
  - Capitalize first letter so "must be an email" becomes "Must be an email" for proper sentence form
  - Edge case: single-word messages (no space) — regex doesn't match, message passes through unchanged

### Step 2: Update existing test and add new test cases

- **File**: `src/common/filters/tests/http-exception.filter.spec.ts`
- **Action**: Update the existing validation error test case and add new cases for sanitization
- **Implementation Steps**:
  1. **Update existing test** (line 67, "should handle validation errors with array of messages"):
     - Current test uses `['Email is required', 'Password too short']` — these don't have class-validator field name prefix format
     - Change to realistic class-validator messages: `['email must be an email', 'password must be longer than or equal to 8 characters']`
     - Update expected details: `['Must be an email', 'Must be longer than or equal to 8 characters']`
  2. **Add test**: "should strip field names from class-validator validation errors"
     - Input: `['firstName must be shorter than or equal to 100 characters', 'avatarUrl must be a valid URL']`
     - Expected: `['Must be shorter than or equal to 100 characters', 'Must be a valid URL']`
  3. **Add test**: "should handle validation messages without field name prefix"
     - Input: `['Invalid format', 'Required']`
     - Expected: same (unchanged, first letter already capitalized)
  4. **Add test**: "should handle single-word validation messages"
     - Input: `['Required']`
     - Expected: `['Required']` (unchanged)
  5. **Verify**: Non-validation error tests (all 8 existing non-validation tests) must remain unchanged and passing

### Step 3: Verify build and tests

- **Action**: Run post-implementation checks
- **Implementation Steps**:
  1. `cd nexacore-api && npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all 813 tests must pass
  3. Verify the filter spec specifically: `npx jest src/common/filters/tests/http-exception.filter.spec.ts --verbose`

### Step 4: Update Technical Documentation

- **Action**: No spec file changes needed for this ticket
- **Implementation Notes**:
  - `integration-state.md`: No structural changes (no new modules, guards, services, or DI)
  - `api-spec.yml`: The `details` field schema doesn't change (still `string[]`); only the content of the strings changes
  - `backend-standards.mdc`: ErrorMessages section already covers this pattern; no update needed
  - Documentation updates will be handled by `/update-docs` after implementation

## 6. Implementation Order

1. Step 0: Create Feature Branch
2. Step 1: Add sanitization helper to HttpExceptionFilter
3. Step 2: Update existing test and add new test cases
4. Step 3: Verify build and tests
5. Step 4: Update Technical Documentation

## 7. Testing Checklist

- [ ] Validation errors with field name prefix are sanitized (field name stripped, first letter capitalized)
- [ ] Validation errors without field name prefix pass through unchanged
- [ ] Single-word validation messages pass through unchanged
- [ ] Non-validation errors (string response, object response, 500, 429, 403, etc.) are completely unaffected
- [ ] Short-circuit for custom format responses still works
- [ ] Retry-After header handling still works
- [ ] All 813 existing tests pass
- [ ] `nest build` compiles clean

## 8. Error Response Format

**Before** (current):
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": ["email must be an email", "password must be longer than or equal to 8 characters"]
  }
}
```

**After** (sanitized):
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": ["Must be an email", "Must be longer than or equal to 8 characters"]
  }
}
```

## 9. Partial Update Support

N/A — this is a filter behavior change, not an endpoint.

## 10. Dependencies

None. Pure string manipulation, no new packages.

## 11. Notes

- **Security**: Eliminates CWE-209 for validation errors — attackers can no longer confirm internal DTO property names from error responses
- **Frontend compatibility**: Verified that `nexacore-dashboard/src/context/AuthContext.tsx` (extractErrorMessage) reads `details[0]` as a display string — no field name parsing. The sanitized messages remain human-readable
- **Regex safety**: The regex is simple, non-backtracking, and operates on short strings (<200 chars) — no ReDoS risk
- **Scope**: This is intentionally minimal — only the filter changes. No DTO modifications, no ValidationPipe exceptionFactory, no frontend changes

## 12. Next Steps After Implementation

- Run `/commit SCRUM-159` to create PR and merge
- Run `/update-docs SCRUM-159` to create implementation record
- SCRUM-159 closes the last deferred finding from SCRUM-140

## 13. Implementation Verification

- [ ] Code Quality: Single private method added, clean regex, capitalization helper
- [ ] Functionality: Validation error field names stripped from all responses
- [ ] Testing: Existing tests updated + 3 new edge case tests
- [ ] Integration: No module/guard/DI changes — zero integration risk
- [ ] Documentation: `/update-docs` will handle post-implementation

## 14. Module-Level Planning

N/A — this ticket modifies a single global filter, not a NexaCore module.

## 15. Satellite App Planning

N/A — no satellite app involved.
