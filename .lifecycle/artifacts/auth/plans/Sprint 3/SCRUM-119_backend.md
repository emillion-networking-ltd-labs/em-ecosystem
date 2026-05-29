# Backend Implementation Plan: SCRUM-119 Enforce MFA for Admin/SUPERADMIN Roles

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket on main**: SCRUM-118 (Resolve npm audit HIGH vulnerabilities)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.service.ts` — 158 lines, 2 constructor deps (UsersService, JwtService)
  - `src/auth/auth.controller.ts` — 161 lines, 1 constructor dep (AuthService)
  - `src/users/entities/user.entity.ts` — 43 lines, User interface has 14 fields (no mfaEnabled)
  - `prisma/schema.prisma` — Role enum (SUPERADMIN, ADMIN, USER), User model (no mfaEnabled field)
  - `src/users/enums/role.enum.ts` — exists (Role enum)
- **Constructor signatures verified**:
  - `AuthService(usersService: UsersService, jwtService: JwtService)` — 2 deps at `auth.service.ts:22-25`
  - `AuthController(authService: AuthService)` — 1 dep at `auth.controller.ts:33`
- **Methods verified to exist**:
  - `AuthService.login(dto: LoginDto)` at `auth.service.ts:50` — returns `Promise<{ accessToken, refreshToken, user }>` (simple type, no MfaChallengeResult union)
  - `AuthController.login(loginDto: LoginDto)` at `auth.controller.ts:51` — delegates to authService.login()
- **Guard dependency chain verified**: N/A — no new guards in this ticket
- **Discrepancies with integration-state.md**: MAJOR — `integration-state.md` documents a codebase with 12 AuthService deps, MfaService, AuditService, SessionsService, SecurityModule, etc. The actual `main` branch has only 2 AuthService deps and none of these modules. integration-state.md reflects the state of unmerged feature branches (SCRUM-98 through SCRUM-115).

## BLOCKER: Missing Prerequisites on `main`

**SCRUM-119 cannot be implemented on current `main`**. The following dependencies are missing:

| Required Feature | Added By | Status on `main` |
|-----------------|----------|-------------------|
| `mfaEnabled` field on User | SCRUM-28 | Missing |
| MFA setup endpoints (POST /auth/mfa/setup, etc.) | SCRUM-28 | Missing |
| `MfaChallengeResult` type in AuthService.login() | SCRUM-28 | Missing |
| `AuditService` for audit logging | SCRUM-25 | Missing |
| `AuditAction` enum | SCRUM-25 | Missing |

**Resolution**: Before SCRUM-119 can be implemented, the feature branches for SCRUM-22 through SCRUM-115 must be merged to `main` in order. Alternatively, SCRUM-119 must be implemented on a branch that has all prerequisites (e.g., branching from `feature/SCRUM-115-backend`).

## Overview

Enforce OWASP ASVS V2.7.2 — multi-factor authentication must be required for administrative interfaces and privileged accounts. When ADMIN or SUPERADMIN users log in with `mfaEnabled === false`, the system returns an `MfaSetupRequiredResult` instead of tokens, forcing them to set up MFA before accessing the system.

## Architecture Context

- **Modules involved**: AuthModule (modify AuthService + AuthController)
- **Components affected**: AuthService (new interface + role check), AuthController (new early return)
- **Files referenced**:
  - `src/auth/auth.service.ts` — add `MfaSetupRequiredResult` interface, role check in `login()`
  - `src/auth/auth.controller.ts` — import new type, add early return for mfaSetupRequired
  - `src/auth/tests/auth.service.spec.ts` — new tests for MFA enforcement
  - `src/auth/tests/auth.controller.spec.ts` — new test for controller handling

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch
- **Branch Naming**: `feature/SCRUM-119-backend`
- **Implementation Steps**:
  1. Determine the correct base branch. If SCRUM-98 through SCRUM-115 are not yet on `main`, branch from the latest feature branch that has MFA (e.g., `feature/SCRUM-115-backend`)
  2. `git checkout -b feature/SCRUM-119-backend`
  3. Verify `mfaEnabled` exists: `grep -r "mfaEnabled" src/` must return results
- **Notes**: If `mfaEnabled` does not exist on the base branch, STOP and merge prerequisites first.

### Step 1: Add MfaSetupRequiredResult Interface

- **File**: `src/auth/auth.service.ts`
- **Action**: Export a new interface for the MFA setup required response
- **Implementation Steps**:
  1. Add after existing interfaces (MfaChallengeResult or similar):
     ```typescript
     export interface MfaSetupRequiredResult {
       mfaSetupRequired: true;
       message: string;
     }
     ```
  2. Update `login()` return type to include `MfaSetupRequiredResult` in the union:
     ```typescript
     async login(...): Promise<AuthResult | MfaChallengeResult | MfaSetupRequiredResult>
     ```
- **Dependencies**: Import `Role` from `../users/enums/role.enum` (if not already imported)

### Step 2: Add Role Check in login() Flow

- **File**: `src/auth/auth.service.ts`
- **Action**: After MFA challenge check and before token generation, check if admin/SUPERADMIN has MFA disabled
- **Implementation Steps**:
  1. Locate the point in `login()` AFTER the MFA challenge check (`if (user.mfaEnabled)` block) and BEFORE `generateTokens()` is called
  2. Add:
     ```typescript
     // OWASP ASVS V2.7.2: Admin/SUPERADMIN must have MFA enabled
     if (
       (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) &&
       !user.mfaEnabled
     ) {
       this.auditService
         .log({
           action: AuditAction.LOGIN_SUCCESS,
           userId: user.id,
           ipAddress: ctx?.ipAddress,
           userAgent: ctx?.userAgent,
           metadata: { mfaSetupRequired: true, role: user.role },
         })
         .catch(() => {});

       return {
         mfaSetupRequired: true,
         message: 'MFA setup is required for administrator accounts. Please enable MFA to continue.',
       };
     }
     ```
  3. Audit log uses fire-and-forget pattern (`.catch(() => {})`) — login must not fail if audit write fails
- **Implementation Notes**:
  - This check runs AFTER MFA challenge, so admins who already have MFA enabled will see the normal challenge flow
  - Regular USER role is unaffected — they can log in with or without MFA
  - The response contains no tokens and no cookie — the user is not authenticated

### Step 3: Controller Handling

- **File**: `src/auth/auth.controller.ts`
- **Action**: Handle the new `MfaSetupRequiredResult` in the login endpoint
- **Implementation Steps**:
  1. Import `MfaSetupRequiredResult` from `./auth.service`
  2. In the `login()` method, after calling `this.authService.login()`, add early return:
     ```typescript
     if ('mfaSetupRequired' in result) {
       return result as MfaSetupRequiredResult;
     }
     ```
  3. This must be BEFORE any `setCookie()` or token extraction logic
- **Implementation Notes**:
  - No cookie is set when `mfaSetupRequired` is returned
  - HTTP status remains 200 (not an error — the login was "successful" but access is gated)

### Step 4: Unit Tests

- **File**: `src/auth/tests/auth.service.spec.ts`
- **Action**: Add tests for MFA enforcement logic
- **Implementation Steps**:
  1. **Test: ADMIN without MFA gets mfaSetupRequired**
     - Mock user with `role: Role.ADMIN, mfaEnabled: false`
     - Call `authService.login(dto, requestMeta, ctx)`
     - Assert result has `mfaSetupRequired: true`
     - Assert `auditService.log` was called with metadata `{ mfaSetupRequired: true, role: 'ADMIN' }`
  2. **Test: SUPERADMIN without MFA gets mfaSetupRequired**
     - Mock user with `role: Role.SUPERADMIN, mfaEnabled: false`
     - Same assertions
  3. **Test: ADMIN with MFA enabled proceeds normally**
     - Mock user with `role: Role.ADMIN, mfaEnabled: true`
     - Assert result has `mfaRequired: true` (MFA challenge, not setup required)
  4. **Test: USER without MFA gets tokens normally**
     - Mock user with `role: Role.USER, mfaEnabled: false`
     - Assert result has `accessToken` (not mfaSetupRequired)
  5. **Test: audit log failure does not block login response**
     - Mock `auditService.log` to reject
     - Assert `mfaSetupRequired` is still returned (fire-and-forget)

- **File**: `src/auth/tests/auth.controller.spec.ts`
- **Action**: Add test for controller early return
- **Implementation Steps**:
  1. **Test: mfaSetupRequired result is returned without setting cookie**
     - Mock `authService.login()` to return `{ mfaSetupRequired: true, message: '...' }`
     - Assert controller returns the result directly
     - Assert `res.cookie()` was NOT called

### Step 5: Update Technical Documentation

- **Action**: Review and update documentation
- **Implementation Steps**:
  1. `api-spec.yml`: Add `MfaSetupRequiredResponse` schema to POST /auth/login responses (200 with mfaSetupRequired discriminator)
  2. No data model changes (no new fields — uses existing `mfaEnabled` + `role`)
  3. `integration-state.md`: No module/guard/service changes — only a new return type in existing service

## Implementation Order

1. Step 0: Create Feature Branch (from correct base with MFA prerequisites)
2. Step 1: Add MfaSetupRequiredResult interface
3. Step 2: Add role check in login() flow
4. Step 3: Controller handling
5. Step 4: Unit tests
6. Step 5: Update technical documentation

## Testing Checklist

- [ ] ADMIN + mfaEnabled=false → mfaSetupRequired response (no tokens)
- [ ] SUPERADMIN + mfaEnabled=false → mfaSetupRequired response (no tokens)
- [ ] ADMIN + mfaEnabled=true → normal MFA challenge flow
- [ ] USER + mfaEnabled=false → normal token response (no enforcement)
- [ ] Audit log failure does not block response (fire-and-forget)
- [ ] Controller does not set cookie for mfaSetupRequired result
- [ ] `nest build` compiles with zero errors
- [ ] All existing tests still pass

## Error Response Format

No new error responses. The `MfaSetupRequiredResult` is a 200 OK with a discriminated body:

```json
{
  "mfaSetupRequired": true,
  "message": "MFA setup is required for administrator accounts. Please enable MFA to continue."
}
```

Frontend should check for `mfaSetupRequired` in the login response and redirect to MFA setup page.

## Dependencies

- **Prerequisite tickets**: SCRUM-25 (AuditModule), SCRUM-28 (MFA system) — must be on the base branch
- No new npm packages

## Notes

- **Enforcement at login, not via guard**: A guard-based approach would block already-authenticated admins on every request, requiring a database check each time. The login-flow approach blocks access once at authentication and is simpler.
- **No forced MFA enrollment**: This does not auto-enroll admins in MFA. It returns a "setup required" signal. The frontend must provide a flow for the user to enable MFA, then retry login.
- **OAuth admins**: If an ADMIN logs in via OAuth (Google/GitHub), the same check should apply in `validateOAuthUser()`. Consider adding the role check there too if OAuth admin login exists.

## Next Steps After Implementation

1. Commit, push, create PR
2. Run `/update-docs SCRUM-119`
3. Proceed to SCRUM-120

## Implementation Verification

- [ ] **Code Quality**: MfaSetupRequiredResult interface is clean, role check is before token generation
- [ ] **Functionality**: Admin/SUPERADMIN blocked, USER unaffected
- [ ] **Testing**: 5 service tests + 1 controller test covering all role/MFA combinations
- [ ] **Security**: OWASP ASVS V2.7.2 compliance verified
- [ ] **Integration**: No module, guard, or DI changes
- [ ] **Documentation**: api-spec.yml updated with new response variant
