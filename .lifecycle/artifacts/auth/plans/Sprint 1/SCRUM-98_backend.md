# Backend Implementation Plan: SCRUM-98 Password Breach Check (HaveIBeenPwned)

## 2. Codebase State Snapshot

- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-97 (enforce email verification before dashboard access)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/auth.service.ts` — constructor (7 deps, lines 96-113), register() (lines 115-149), resetPassword() (lines 701-763)
  - `nexacore-api/src/auth/auth.module.ts` — providers (7), imports (7), exports (AuthService only)
  - `nexacore-api/src/users/users.service.ts` — constructor (4 deps, lines 30-35), changePassword() (lines 250-297)
  - `nexacore-api/src/users/users.module.ts` — imports: AuditModule, SessionsModule, MailModule
  - `nexacore-api/src/auth/tests/auth.service.spec.ts` — TestingModule setup (lines 119-204, 8 mocked services)
- **Constructor signatures verified**: AuthService (7 deps), UsersService (4 deps)
- **Guard dependency chain verified**: No new guards in this ticket — all changes are service-layer only
- **Directory check**: `auth/services/` does NOT exist — current pattern is flat structure in `auth/`

## 3. Overview

Integrate HaveIBeenPwned (HIBP) Pwned Passwords API using the k-anonymity approach to check passwords against known breach databases. Applies to all three password-setting flows: registration, password reset, and password change. Uses native Node.js `crypto` and `fetch` — no new dependencies.

**Key principle**: Fail-open. If the HIBP API is unreachable, the password is accepted (logged as warning). Security should not degrade UX availability.

## 4. Architecture Context

### Modules Involved
- **AuthModule** — owns the new `PasswordBreachService`, uses it in `AuthService.register()` and `AuthService.resetPassword()`
- **UsersModule** — imports `AuthModule` to access `PasswordBreachService` for `UsersService.changePassword()`

### Components Affected
| Component | File | Change |
|-----------|------|--------|
| PasswordBreachService | `src/auth/password-breach.service.ts` | NEW — HIBP k-anonymity check |
| AuthService | `src/auth/auth.service.ts` | Inject + call breach check in register() and resetPassword() |
| AuthModule | `src/auth/auth.module.ts` | Add PasswordBreachService to providers + exports |
| UsersService | `src/users/users.service.ts` | Inject + call breach check in changePassword() |
| UsersModule | `src/users/users.module.ts` | Import AuthModule for PasswordBreachService |
| Tests | `src/auth/tests/password-breach.service.spec.ts` | NEW — unit tests |
| Tests | `src/auth/tests/auth.service.spec.ts` | Add mock + breached password tests |
| Tests | `src/users/tests/users.service.spec.ts` | Add mock + breached password test |

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch**: `feature/SCRUM-98-backend`
- **Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-98-backend`
  3. Verify with `git branch`

### Step 1: Create PasswordBreachService

- **File**: `nexacore-api/src/auth/password-breach.service.ts`
- **Action**: New injectable service using HIBP k-anonymity API

**Function Signature**:
```typescript
@Injectable()
export class PasswordBreachService {
  private readonly logger = new Logger(PasswordBreachService.name);

  async isBreached(password: string): Promise<boolean>
}
```

**Implementation Steps**:
1. SHA-1 hash the password using `crypto.createHash('sha1').update(password).digest('hex').toUpperCase()`
2. Split hash: `prefix` = first 5 chars, `suffix` = remaining 35 chars
3. `fetch('https://api.pwnedpasswords.com/range/' + prefix)` with 3-second timeout via `AbortController`
4. Parse response: text lines in format `SUFFIX:COUNT`
5. Check if any line's suffix matches our suffix
6. Return `true` if found, `false` if not
7. On ANY error (timeout, network, parse): log warning, return `false` (fail-open)

**Dependencies**: None new — uses Node.js native `crypto` and global `fetch`

**Implementation Notes**:
- Set `User-Agent` header to identify the app (HIBP API etiquette)
- AbortController with 3000ms timeout prevents hanging requests
- Wrap entire function in try/catch — never throw, always return boolean

### Step 2: Register PasswordBreachService in AuthModule

- **File**: `nexacore-api/src/auth/auth.module.ts`
- **Action**: Add to providers AND exports arrays

**Steps**:
1. Import `PasswordBreachService` from `./password-breach.service`
2. Add `PasswordBreachService` to `providers` array (after OAuthCodeStore, line 52)
3. Add `PasswordBreachService` to `exports` array (alongside AuthService, line 54)

### Step 3: Integrate in AuthService.register()

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: Inject PasswordBreachService and call before hashing in register()

**Steps**:
1. Add `private readonly passwordBreachService: PasswordBreachService` to constructor (line ~104, after mailService)
2. In `register()`, after the email conflict check (line 123) and before `bcrypt.hash` (line 125), add:
   ```typescript
   const isBreached = await this.passwordBreachService.isBreached(dto.password);
   if (isBreached) {
     throw new BadRequestException(
       'This password has appeared in a data breach. Please choose a different password.',
     );
   }
   ```

### Step 4: Integrate in AuthService.resetPassword()

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: Call breach check in resetPassword() before hashing

**Steps**:
1. In `resetPassword()`, after the same-password check (line ~735) and before `bcrypt.hash` (line 737), add:
   ```typescript
   const isBreached = await this.passwordBreachService.isBreached(dto.newPassword);
   if (isBreached) {
     throw new BadRequestException(
       'This password has appeared in a data breach. Please choose a different password.',
     );
   }
   ```
2. This goes INSIDE the `$transaction` callback, after token validation and same-password check

### Step 5: Integrate in UsersService.changePassword()

- **File**: `nexacore-api/src/users/users.service.ts`
- **Action**: Inject PasswordBreachService and call before hashing

**Steps**:
1. Add `private readonly passwordBreachService: PasswordBreachService` to constructor (line ~35, after mailService)
2. Import PasswordBreachService: `import { PasswordBreachService } from '../auth/password-breach.service';`
3. In `changePassword()`, after current password verification (line ~272) and before `bcrypt.hash` (line 274), add:
   ```typescript
   const isBreached = await this.passwordBreachService.isBreached(dto.newPassword);
   if (isBreached) {
     throw new BadRequestException(
       'This password has appeared in a data breach. Please choose a different password.',
     );
   }
   ```

### Step 6: Update UsersModule imports

- **File**: `nexacore-api/src/users/users.module.ts`
- **Action**: Import AuthModule so PasswordBreachService is available for injection

**Steps**:
1. Add `AuthModule` to imports array (line 9)
2. Verify no circular dependency: AuthModule imports UsersModule, UsersModule imports AuthModule → NestJS handles this with `forwardRef` if needed
3. If circular dependency error occurs: use `@Inject(forwardRef(() => PasswordBreachService))` in UsersService constructor and add `forwardRef(() => AuthModule)` in UsersModule imports

### Step 7: Write PasswordBreachService Unit Tests

- **File**: `nexacore-api/src/auth/tests/password-breach.service.spec.ts`
- **Action**: Comprehensive tests for the breach service

**Test Cases**:
| # | Test Case | Setup | Expected |
|---|-----------|-------|----------|
| 1 | Password found in breach DB | Mock fetch returning suffix match with count > 0 | Returns `true` |
| 2 | Password NOT in breach DB | Mock fetch returning no matching suffix | Returns `false` |
| 3 | API timeout (3s) | Mock fetch that hangs > 3s | Returns `false` (fail-open) |
| 4 | API returns 5xx error | Mock fetch returning 500 | Returns `false` (fail-open) |
| 5 | API returns network error | Mock fetch rejecting with TypeError | Returns `false` (fail-open) |
| 6 | Malformed API response | Mock fetch returning garbage text | Returns `false` + logger.warn called |
| 7 | SHA-1 prefix is exactly 5 chars | Spy on fetch URL arg | URL ends with 5-char hex prefix |
| 8 | Empty password | Call with empty string | Returns `false` (or handles gracefully) |

**Mock strategy**: Mock global `fetch` using `jest.spyOn(global, 'fetch')`

### Step 8: Update AuthService Tests

- **File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`
- **Action**: Add PasswordBreachService mock and breached password tests

**Steps**:
1. Add `passwordBreachService` mock to TestingModule providers:
   ```typescript
   { provide: PasswordBreachService, useValue: { isBreached: jest.fn().mockResolvedValue(false) } }
   ```
2. In `describe('register')`:
   - Existing tests continue to work (mock returns false by default)
   - Add new test: `'should throw BadRequestException when password is breached'`
     - Set `passwordBreachService.isBreached.mockResolvedValue(true)`
     - Assert `rejects.toThrow(BadRequestException)`
     - Assert `usersService.create` was NOT called
3. In `describe('resetPassword')` (if exists):
   - Same pattern: mock true → expect BadRequestException

### Step 9: Update UsersService Tests

- **File**: `nexacore-api/src/users/tests/users.service.spec.ts`
- **Action**: Add PasswordBreachService mock for changePassword tests

**Steps**:
1. Add `passwordBreachService` mock to TestingModule
2. Add test: `'should throw BadRequestException when new password is breached'`
3. Existing changePassword tests continue working (mock returns false)

### Step 10: Backend Checkpoint

- **Action**: Verify everything compiles and all tests pass
- **Steps**:
  1. `npx nest build` — must compile clean
  2. `npx jest --forceExit` — all tests must pass
  3. Verify no coverage threshold regressions

### Step 11: Update Technical Documentation

- **Action**: Update api-spec.yml, integration-state.md
- **Steps**:
  1. **api-spec.yml**: No new endpoints. Update POST /auth/register, POST /auth/reset-password, PATCH /users/me/password responses to include 400 for breached password
  2. **integration-state.md**: Add PasswordBreachService to AuthModule providers/exports, add dependency to AuthService and UsersService, add changelog entry
  3. Create implementation record at `ai-specs/changes/records/SCRUM-98_backend.md`

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create PasswordBreachService
3. Step 2: Register in AuthModule (providers + exports)
4. Step 3: Integrate in AuthService.register()
5. Step 4: Integrate in AuthService.resetPassword()
6. Step 5: Integrate in UsersService.changePassword()
7. Step 6: Update UsersModule imports
8. Step 7: Write PasswordBreachService unit tests
9. Step 8: Update AuthService tests
10. Step 9: Update UsersService tests
11. Step 10: Backend checkpoint (build + test)
12. Step 11: Update documentation

## 7. Testing Checklist

- [ ] PasswordBreachService: 8 test cases (match, no-match, timeout, 5xx, network error, malformed, prefix length, empty)
- [ ] register() with breached password throws BadRequestException
- [ ] register() with clean password works normally
- [ ] resetPassword() with breached password throws BadRequestException
- [ ] changePassword() with breached password throws BadRequestException
- [ ] All existing 442+ tests still pass
- [ ] `nest build` compiles clean
- [ ] Coverage thresholds met (stmts 90%, branches 85%, funcs 90%, lines 90%)

## 8. Error Response Format

```json
{
  "statusCode": 400,
  "message": "This password has appeared in a data breach. Please choose a different password.",
  "error": "Bad Request"
}
```

HTTP status: **400 Bad Request** (consistent with other validation errors)

## 9. Partial Update Support

N/A — this is a validation check, not a CRUD operation.

## 10. Dependencies

- **No new npm packages required**
- Uses Node.js native `crypto` module (already in runtime)
- Uses global `fetch` (available in Node.js 18+, already used by the project)

## 11. Notes

- **Fail-open is mandatory**: HIBP API downtime must NEVER block user registration/password changes
- **k-anonymity**: Only first 5 chars of SHA-1 hash sent to API — full password never leaves the server
- **User-Agent header**: HIBP API etiquette requires identifying the calling app
- **Circular dependency risk**: AuthModule ↔ UsersModule. If NestJS throws, use `forwardRef()`. Test this during Step 6.
- **Error message**: Use a user-friendly message, not technical jargon. Do NOT reveal the breach count.
- **Flat file structure**: Place `password-breach.service.ts` directly in `src/auth/` (no `services/` subdirectory — follows existing pattern)

## 12. Next Steps After Implementation

1. Frontend: Show breach error in RegisterForm, ResetPasswordForm (already handles 400 errors via toast)
2. Consider caching HIBP responses briefly (5 min) to reduce API calls for repeated attempts
3. Future: Add breach check to password composition feedback (real-time check on frontend blur event)

## 13. Implementation Verification

- [ ] **Code Quality**: No lint errors, follows NestJS DI patterns
- [ ] **Functionality**: Breached passwords rejected in all 3 flows, clean passwords accepted
- [ ] **Resilience**: API timeout/failure does not block users
- [ ] **Privacy**: Only SHA-1 prefix (5 chars) sent externally
- [ ] **Testing**: New + existing tests all pass, coverage maintained
- [ ] **Integration**: No circular dependency issues
- [ ] **Documentation**: api-spec.yml, integration-state.md, implementation record updated
