# Backend Implementation Plan: SCRUM-97 Enforce Email Verification Before Dashboard Access After Registration

## 2. Codebase State Snapshot

- **Date**: 2026-03-01
- **Last completed ticket**: SCRUM-96 (Auth UX Polish — Password Recovery Flow, Figma Alignment + Resend Verification)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/auth.service.ts` (AuthResult interface L73-77, register() L110-150, constructor L91-108)
  - `nexacore-api/src/auth/auth.controller.ts` (register endpoint L105-127)
  - `nexacore-api/src/auth/tests/auth.service.spec.ts` (register tests)
  - `nexacore-api/src/auth/tests/auth.controller.spec.ts` (register tests)
  - `nexacore-dashboard/src/context/AuthContext.tsx` (register callback L189-211, AuthContextType L75-90)
  - `nexacore-dashboard/src/components/auth/RegisterForm.tsx` (isAuthenticated redirect L31-34)
  - `nexacore-dashboard/src/components/guards/ProtectedRoute.tsx` (full file, 33 lines)
- **Constructor signatures verified**:
  - `AuthService`: UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PrismaService, MailService (7 deps)
  - `AuthController`: AuthService, SessionsService, JwtService, PermissionsService (4 deps)
- **Guard dependency chain verified**: No new guards in this ticket. Existing guard chains unaffected.

## 3. Overview

Remove token generation from the registration flow so that newly registered users must verify their email before accessing the dashboard. Currently `register()` returns `accessToken + refreshToken cookie`, creating an asymmetric enforcement gap where `login()` blocks unverified users but `register()` does not.

After this change: Register → /activation/check-email → Verify email → /login → Dashboard.

## 4. Architecture Context

### Modules involved
- **AuthModule** — service + controller changes (no module-level changes)

### Components affected
| Component | File | Change Type |
|-----------|------|-------------|
| AuthResult type | `auth.service.ts:73-77` | Modify (new RegisterResult type) |
| AuthService.register() | `auth.service.ts:110-150` | Modify (remove token generation) |
| AuthController.register() | `auth.controller.ts:105-127` | Modify (remove cookie, change response) |
| AuthContext.register() | `AuthContext.tsx:189-211` | Modify (remove token storage) |
| RegisterForm | `RegisterForm.tsx:31-34` | Modify (remove isAuthenticated redirect) |
| ProtectedRoute | `ProtectedRoute.tsx` | Modify (add emailVerified defense-in-depth) |
| auth.service.spec.ts | tests | Update existing + add new tests |
| auth.controller.spec.ts | tests | Update existing tests |
| api-spec.yml | spec | Update response schema |

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch Naming**: `feature/SCRUM-97-fullstack`
- **Implementation Steps**:
  1. Ensure on `feature/security-warn-remediation` (current working branch)
  2. `git checkout -b feature/SCRUM-97-fullstack`
  3. Verify: `git branch`

### Step 1: Backend — Create RegisterResult type

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: Add new return type for register, keep AuthResult for login
- **Implementation Steps**:
  1. Add after `AuthResult` interface (line 77):
     ```typescript
     export interface RegisterResult {
       message: string;
       user: SafeUser;
     }
     ```
  2. Keep `AuthResult` unchanged (used by `login()`, `handleOAuthUser()`, etc.)

### Step 2: Backend — Modify AuthService.register()

- **File**: `nexacore-api/src/auth/auth.service.ts` (lines 110-150)
- **Action**: Remove token generation, return RegisterResult instead of AuthResult
- **Implementation Steps**:
  1. Change return type: `Promise<AuthResult>` → `Promise<RegisterResult>`
  2. Remove `generateTokens()` call (lines 131-134)
  3. Remove `buildRefreshCookie()` from return
  4. Keep `createAndSendVerificationEmail()` (line 128) — non-blocking
  5. Keep `auditService.log()` (lines 136-144) — audit REGISTER action
  6. Return: `{ message: 'Verification email sent', user: toSafeUser(user) }`
- **Final method signature**:
  ```typescript
  async register(
    dto: RegisterDto,
    requestMeta: { ipAddress: string; userAgent?: string | null },
    ctx?: RequestContext,
  ): Promise<RegisterResult>
  ```

### Step 3: Backend — Modify AuthController.register()

- **File**: `nexacore-api/src/auth/auth.controller.ts` (lines 105-127)
- **Action**: Remove cookie setting, remove `@Res` parameter, change response
- **Implementation Steps**:
  1. Remove `@Res({ passthrough: true }) res: Response` parameter
  2. Remove `this.setCookie(res, result.cookie)` call (line 125)
  3. Remove `Response` from imports if no longer used elsewhere (check first)
  4. Change return: `{ message: result.message, user: result.user }`
  5. Keep all decorators (@Post, @Throttle, @HttpCode, @ApiOperation, @ApiResponse)
  6. Update @ApiResponse 201 description: "User registered — verification email sent"
- **Final method**:
  ```typescript
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: any,
  ) {
    const meta = this.extractRequestMeta(req);
    const result = await this.authService.register(registerDto, meta, meta);
    return { message: result.message, user: result.user };
  }
  ```
- **Note**: Check if `Response` import is used by other methods (login, refresh, handleOAuthCallback all use `@Res`). Do NOT remove the import if other methods use it.

### Step 4: Frontend — Modify AuthContext.register()

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx` (lines 189-211)
- **Action**: Remove token storage, /auth/me call, and AUTH_SUCCESS dispatch
- **Implementation Steps**:
  1. Change response type: `AuthResponse` → `{ message: string; user: SafeUser }` (or a new `RegisterResponse` type)
  2. Remove `apiClient.setAccessToken(data.accessToken)` (line 193)
  3. Remove `const user = await apiClient.get<SafeUser>('/auth/me')` (line 194)
  4. Remove `dispatch({ type: 'AUTH_SUCCESS', ... })` (lines 195-198)
  5. Add `dispatch({ type: 'AUTH_STOP' })` before `return true`
  6. Keep error handling (rate limit, toast) unchanged
- **Final callback**:
  ```typescript
  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      await apiClient.post<{ message: string; user: SafeUser }>('/auth/register', { email, password });
      dispatch({ type: 'AUTH_STOP' });
      return true;
    } catch (err: unknown) {
      // ... existing error handling unchanged ...
    }
  }, [addToast]);
  ```

### Step 5: Frontend — Clean up RegisterForm

- **File**: `nexacore-dashboard/src/components/auth/RegisterForm.tsx`
- **Action**: Remove isAuthenticated redirect (no longer needed since register doesn't authenticate)
- **Implementation Steps**:
  1. Remove `isAuthenticated` from `useAuth()` destructuring (line 22)
  2. Remove the `useEffect` that redirects to `/dashboard` when `isAuthenticated` (lines 31-34)
  3. Keep `router.push('/activation/check-email')` on success (line 61) — already correct

### Step 6: Frontend — ProtectedRoute defense-in-depth

- **File**: `nexacore-dashboard/src/components/guards/ProtectedRoute.tsx`
- **Action**: Add `emailVerified` check as secondary guard
- **Implementation Steps**:
  1. Destructure `user` from `useAuth()` alongside `isAuthenticated` and `isInitialized`
  2. After the `isAuthenticated` check, add:
     ```typescript
     if (isAuthenticated && user && user.emailVerified === false) {
       router.replace('/activation/check-email');
       return null;
     }
     ```
  3. This catches edge cases where a user somehow has tokens but hasn't verified email (e.g., OAuth state corruption, future flows)
- **Note**: Check that `user` is part of `AuthState` and has `emailVerified` field. Verify `SafeUser` type includes `emailVerified: boolean`.

### Step 7: Backend tests — Update auth.service.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`
- **Action**: Update register test assertions, add negative tests
- **Implementation Steps**:
  1. **Update** "should create a new user with hashed password and return accessToken + cookie":
     - Rename to: "should create a new user with hashed password and return message + user"
     - Assert: `result.message` === 'Verification email sent'
     - Assert: `result.user` has SafeUser fields
     - Assert: `result` does NOT have `accessToken` property
     - Assert: `result` does NOT have `cookie` property
  2. **Update** "should return SafeUser without passwordHash":
     - Keep assertion on `result.user`, adjust property access
  3. **Remove** "should create a session via SessionsService":
     - `generateTokens()` is no longer called, so no session is created on register
     - Or change to: "should NOT create a session on register" and assert `sessionsService.createSession` NOT called
  4. **Keep** "should hash the password with bcrypt using 12 rounds"
  5. **Update** "register should succeed even when audit fails" — update return assertion
  6. **Update** "should complete registration even when verification email fails" — update return assertion
  7. **Add new test**: "should NOT call generateTokens on register"
     - Call `register()`, assert `jwtService.signAsync` NOT called (or mock `generateTokens` and assert not called)

### Step 8: Backend tests — Update auth.controller.spec.ts

- **File**: `nexacore-api/src/auth/tests/auth.controller.spec.ts`
- **Action**: Update register controller tests
- **Implementation Steps**:
  1. **Update** "should set cookie and return accessToken + user":
     - Rename to: "should return message + user without setting cookie"
     - Mock `authService.register` to return `{ message: 'Verification email sent', user: mockSafeUser }`
     - Assert: `result.message` === 'Verification email sent'
     - Assert: `result.user` is present
     - Assert: `mockRes.cookie` NOT called
     - Remove `@Res` parameter from test call (adjust mock request)
  2. **Keep** "should propagate ConflictException from service"

### Step 9: Update API specification

- **File**: `ai-specs/specs/api-spec.yml`
- **Action**: Update POST /auth/register response schema
- **Implementation Steps**:
  1. Change 201 response from `AuthResponse` to new `RegisterResponse` schema
  2. Add `RegisterResponse` component:
     ```yaml
     RegisterResponse:
       type: object
       properties:
         message:
           type: string
           example: "Verification email sent"
         user:
           $ref: '#/components/schemas/SafeUser'
     ```
  3. Update 201 description: "User registered — verification email sent. No tokens returned."

### Step 10: Update integration-state.md and create record

- **File**: `ai-specs/specs/integration-state.md`
- **Action**: Add changelog entry
- **Implementation Steps**:
  1. Add row: `| 2026-03-XX | SCRUM-97 | register() no longer returns tokens (AuthResult → RegisterResult). Controller removes cookie set + @Res param. Frontend register() stops storing tokens / dispatching AUTH_SUCCESS. RegisterForm removes isAuthenticated redirect. ProtectedRoute adds emailVerified defense-in-depth. api-spec.yml: AuthResponse → RegisterResponse for POST /auth/register. |`
  2. Create record: `ai-specs/changes/records/SCRUM-97_fullstack.md`

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create RegisterResult type (backend)
3. Step 2: Modify AuthService.register() (backend)
4. Step 3: Modify AuthController.register() (backend)
5. Step 7: Update auth.service.spec.ts (backend tests)
6. Step 8: Update auth.controller.spec.ts (backend tests)
7. **Checkpoint**: `npx nest build` + `npx jest --maxWorkers=1 --forceExit` — all pass
8. Step 4: Modify AuthContext.register() (frontend)
9. Step 5: Clean up RegisterForm (frontend)
10. Step 6: ProtectedRoute defense-in-depth (frontend)
11. **Checkpoint**: `npm run build` — compiles clean
12. Step 9: Update api-spec.yml
13. Step 10: Update integration-state.md + create record

## 7. Testing Checklist

### Automated
- [ ] `npx nest build` — compiles clean
- [ ] `npx jest --maxWorkers=1 --forceExit` — all tests pass, coverage thresholds met
- [ ] `npm run build` (dashboard) — compiles clean

### Manual
- [ ] Register new account → NO tokens in response body, NO refresh_token cookie
- [ ] After register → redirected to `/activation/check-email`
- [ ] Try navigating to `/dashboard` manually → redirected to `/login` (not authenticated)
- [ ] Click verification link in email → redirected to `/login`
- [ ] Login after verification → succeeds, redirected to `/dashboard`
- [ ] Login WITHOUT verification → "Verify your email to sign in" error (existing behavior, no regression)
- [ ] OAuth registration (Google/GitHub) → still works with auto-verification (no regression)
- [ ] Register with existing email → "Email already registered" error (no regression)
- [ ] Rate limiting on register → still works (no regression)

## 8. Error Response Format

No new error codes. Existing responses:

| Status | Response | When |
|--------|----------|------|
| 201 | `{ message: "Verification email sent", user: SafeUser }` | Successful registration |
| 400 | `{ statusCode: 400, message: [...], error: "Bad Request" }` | Validation error |
| 409 | `{ statusCode: 409, message: "Email already registered", error: "Conflict" }` | Duplicate email |
| 429 | `{ statusCode: 429, message: "...", retryAfter: N }` | Rate limited |

## 9. Partial Update Support

N/A — this is a behavior change, not a CRUD operation.

## 10. Dependencies

No new external dependencies. All changes use existing NestJS, Prisma, and Next.js APIs.

## 11. Notes

- **OAuth flow unaffected**: `handleOAuthUser()` still returns `AuthResult` with tokens. OAuth users (Google/GitHub) are auto-verified by the provider, so they bypass email verification.
- **Existing sessions**: Users who registered before this change and have active sessions can still access the dashboard. This is acceptable — the fix prevents NEW unverified registrations from getting tokens.
- **`@Res` parameter**: Only remove from `register()` method. Other methods (`login()`, `refresh()`, `handleOAuthCallback()`) still need `@Res` for cookie setting.
- **RegisterForm isAuthenticated redirect**: Removing this is safe because after SCRUM-97, register no longer dispatches `AUTH_SUCCESS`, so `isAuthenticated` won't become `true` during registration.
- **CSRF**: Register endpoint does not have `@SkipCsrf()` — it requires CSRF token (same as before, no change).

## 12. Next Steps After Implementation

1. Run full test suite: backend (jest) + frontend (build)
2. Manual QA of full registration flow (register → verify → login → dashboard)
3. Verify OAuth flows unaffected
4. Update Jira ticket to Done
5. Consider future: ProtectedRoute emailVerified check could be promoted from defense-in-depth to primary guard

## 13. Implementation Verification

- [ ] **Code Quality**: No lint errors, follows existing patterns
- [ ] **Functionality**: Register returns message only, no tokens
- [ ] **Testing**: All existing tests updated, new negative tests added, coverage thresholds met
- [ ] **Integration**: OAuth flows unaffected, login flow unaffected, existing sessions unaffected
- [ ] **Documentation**: api-spec.yml updated, integration-state.md changelog updated, record created
