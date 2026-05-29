# Backend Implementation Plan: SCRUM-121 Convert validate-reset-token to POST (V3.5.1)

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket on branch**: SCRUM-120 (Reduce session timeouts to NIST AAL2)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.controller.ts` — validateResetToken at lines 406-422 (GET, @SkipCsrf, @ApiQuery, @Query('token'))
  - `src/auth/auth.controller.ts` — imports at lines 1-55 (Query at line 8, ApiQuery at line 23, SkipCsrf at line 50)
  - `src/auth/dto/` — 17 existing DTOs, no ValidateResetTokenDto
  - `src/auth/dto/reset-password.dto.ts` — pattern reference (class-validator + ApiProperty)
  - `src/auth/tests/auth.controller.spec.ts` — validateResetToken tests at lines 591-609 (2 tests, raw string args)
  - `api-spec.yml` — lines 674-699 already define POST with requestBody (no change needed)
- **Constructor signatures verified**: N/A — no constructor changes in this ticket
- **Methods verified to exist**:
  - `validateResetToken(token: string)` at auth.controller.ts:417 — current GET handler
  - `validateResetToken(token: string)` at auth.service.ts:1133 — takes plain string, no changes needed
- **Guard dependency chain verified**: N/A — no guard changes in this ticket
- **Discrepancies with integration-state.md**: integration-state.md line 75 shows `POST /validate-reset-token | — | @SkipCsrf` — the code is actually GET with @SkipCsrf. After this ticket, it will be POST without @SkipCsrf.
- **Other @Query/@ApiQuery usage**: verify-email (line 291) and verify-email-change (line 313) still use @Query/@ApiQuery — these imports MUST NOT be removed

## Overview

Convert GET /auth/validate-reset-token to POST with token in request body, complying with OWASP ASVS V3.5.1 (tokens must not appear in URL query parameters). Tokens in URLs are exposed via browser history, server access logs, proxy logs, and Referer headers.

## Architecture Context

- **Modules involved**: AuthModule (controller only)
- **Components affected**: auth.controller.ts (method decorator + params), new ValidateResetTokenDto, auth.controller.spec.ts (test data)
- **No DI, module, guard, service, or schema changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-121-backend` from SCRUM-120 branch
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-120-backend` (already there)
  2. `git checkout -b feature/SCRUM-121-backend`
  3. Verify branch: `git branch --show-current`

### Step 1: Create ValidateResetTokenDto

- **File**: `src/auth/dto/validate-reset-token.dto.ts` (NEW)
- **Action**: Create DTO with single `token` field, following existing DTO patterns (reset-password.dto.ts)
- **Implementation Steps**:
  1. Create file with:
     ```typescript
     import { IsString, IsNotEmpty } from 'class-validator';
     import { ApiProperty } from '@nestjs/swagger';

     export class ValidateResetTokenDto {
       @ApiProperty({
         description: 'Password reset token from email',
         example: 'a1b2c3d4e5f6...',
       })
       @IsString()
       @IsNotEmpty({ message: 'Token is required' })
       token: string;
     }
     ```

### Step 2: Convert Controller Endpoint from GET to POST

- **File**: `src/auth/auth.controller.ts`
- **Action**: Change method from GET to POST, replace @Query with @Body, remove @SkipCsrf and @ApiQuery
- **Implementation Steps**:
  1. Add import for ValidateResetTokenDto at line ~44 (after ResetPasswordDto import):
     ```typescript
     import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';
     ```
  2. Replace lines 406-422 with:
     ```typescript
     @Post('validate-reset-token')
     @HttpCode(HttpStatus.OK)
     @ApiOperation({
       summary: 'Validate a password reset token without consuming it',
     })
     @ApiResponse({ status: 200, description: 'Token validity status' })
     async validateResetToken(@Body() dto: ValidateResetTokenDto) {
       return this.authService.validateResetToken(dto.token);
     }
     ```
  3. Key changes:
     - `@Get` → `@Post` (already imported at line 3)
     - Added `@HttpCode(HttpStatus.OK)` — POST defaults to 201, but this returns 200
     - Removed `@SkipCsrf()` — POST endpoints need CSRF protection
     - Removed `@ApiQuery` decorator — token now in body, auto-documented by DTO
     - `@Query('token') token: string` → `@Body() dto: ValidateResetTokenDto`
     - Removed `if (!token)` guard — class-validator `@IsNotEmpty()` handles this via global ValidationPipe
  4. Do NOT remove `Query` or `ApiQuery` from imports — still used by verify-email (line 291) and verify-email-change (line 313)

### Step 3: Update Controller Tests

- **File**: `src/auth/tests/auth.controller.spec.ts`
- **Action**: Update validateResetToken tests for POST + DTO pattern
- **Implementation Steps**:
  1. Replace lines 591-609 with:
     ```typescript
     // ─── POST /auth/validate-reset-token ──────────────────────────

     describe('validateResetToken', () => {
       it('should delegate to authService and return validity', async () => {
         authService.validateResetToken.mockResolvedValue({ valid: true });

         const result = await controller.validateResetToken({ token: 'some-token' });

         expect(authService.validateResetToken).toHaveBeenCalledWith('some-token');
         expect(result).toEqual({ valid: true });
       });
     });
     ```
  2. Key changes:
     - Comment updated: GET → POST
     - Removed "no token provided" test — `@IsNotEmpty()` + global ValidationPipe handles empty tokens before the controller (returns 400 automatically)
     - Remaining test: passes DTO object `{ token: 'some-token' }` instead of raw string

### Step 4: Build, Test, Verify

- **Implementation Steps**:
  1. `nest build` — zero errors
  2. Run full test suite — all tests pass
  3. Verify the endpoint is POST: `grep -n 'validate-reset-token' src/auth/auth.controller.ts`

### Step 5: Update Technical Documentation

- **Action**: Review documentation impact
- **Implementation Steps**:
  1. `api-spec.yml`: Already correct (POST with requestBody at lines 674-699) — no change needed
  2. `integration-state.md`: Update AuthController Method Guards table — remove `@SkipCsrf` for validate-reset-token. Add SCRUM-121 changelog entry.
  3. No data-model.md changes (no schema changes)

## Implementation Order

1. Step 0: Create Feature Branch
2. Step 1: Create ValidateResetTokenDto
3. Step 2: Convert controller endpoint from GET to POST
4. Step 3: Update controller tests
5. Step 4: Build, test, verify
6. Step 5: Update technical documentation

## Testing Checklist

- [ ] POST /auth/validate-reset-token accepts `{ token: "..." }` in body
- [ ] GET /auth/validate-reset-token no longer exists
- [ ] Empty token rejected by ValidationPipe (400, not controller logic)
- [ ] CSRF protection applies (no @SkipCsrf)
- [ ] @HttpCode(200) ensures POST returns 200 (not 201)
- [ ] `nest build` compiles with zero errors
- [ ] All existing tests still pass

## Error Response Format

No new error responses. Existing ValidationPipe handles invalid/empty token:
```json
{
  "message": ["Token is required"],
  "error": "Bad Request",
  "statusCode": 400
}
```

## Dependencies

- No new npm packages
- **Prerequisite**: SCRUM-120 (must be on `feature/SCRUM-120-backend` branch)

## Notes

- **@Query/@ApiQuery imports retained**: verify-email and verify-email-change endpoints still use @Query and @ApiQuery — do NOT remove from imports.
- **No service changes**: auth.service.ts `validateResetToken()` takes a plain string — the controller extracts `dto.token`.
- **CSRF**: Removing @SkipCsrf is intentional — POST endpoints must be CSRF-protected (the old GET had @SkipCsrf because it was a read-only query, but POST implicitly needs protection via the CsrfGuard APP_GUARD).

## Next Steps After Implementation

1. Commit, push, create PR
2. Run `/update-docs SCRUM-121`
3. Proceed to SCRUM-122

## Implementation Verification

- [ ] **Code Quality**: 1 new DTO file, 1 controller method changed, 1 test updated
- [ ] **Functionality**: Token no longer in URL query parameters
- [ ] **Testing**: Existing tests updated for new POST + DTO pattern
- [ ] **Security**: OWASP ASVS V3.5.1 compliance verified
- [ ] **Integration**: No module, guard, or DI changes
- [ ] **Documentation**: integration-state.md updated
