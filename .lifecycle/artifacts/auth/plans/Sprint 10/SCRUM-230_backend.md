# Backend Implementation Plan: SCRUM-230 — Update Mock Requirements Table (I-07)

## 1. Codebase State Snapshot

- **Date**: 2026-03-14
- **Last completed ticket**: SCRUM-229 (Consolidate error message variants)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/auth.controller.ts` — constructor: `AuthService, PermissionsService` (2 deps)
  - `nexacore-api/src/auth/oauth.controller.ts` — constructor: `AuthService, ConfigService, OAuthLinkCodeStore` (3 deps)
  - `nexacore-api/src/auth/account.controller.ts` — constructor: `AuthService` (1 dep)
  - `nexacore-api/src/auth/session.controller.ts` — constructor: `SessionsService, TrustedDeviceService, JwtService` (3 deps)
  - `ai-specs/ai-specs/specs/integration-state.md` — line 168: single AuthController row with 7 combined deps (stale)
- **Constructor signatures verified**:
  - `AuthController(authService: AuthService, permissionsService: PermissionsService)`
  - `OAuthController(authService: AuthService, configService: ConfigService, oauthLinkCodeStore: OAuthLinkCodeStore)`
  - `AccountController(authService: AuthService)`
  - `SessionController(sessionsService: SessionsService, trustedDeviceService: TrustedDeviceService, jwtService: JwtService)`
- **Methods verified to exist**: N/A (no code changes)
- **Guard dependency chain verified**: N/A (no guard changes)
- **Discrepancies with integration-state.md**: Test Mock Requirements table line 168 lists pre-split AuthController with 7 deps — must be updated to 4 separate rows

## 2. Overview

The Test Mock Requirements table in `integration-state.md` still lists a single `AuthController` row with 7 combined dependencies from before SCRUM-197 split it into 4 controllers. This ticket updates the table to reflect the actual post-split controller constructors. Documentation-only change, no code modifications.

## 3. Architecture Context

- **Document**: `ai-specs/ai-specs/specs/integration-state.md` — Test Mock Requirements section (line 162+)
- **Impact**: Documentation accuracy only — no code, tests, or runtime behavior changes

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create branch `feature/SCRUM-230-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-230-backend`

### Step 1: Update Test Mock Requirements Table

- **File**: `ai-specs/ai-specs/specs/integration-state.md`
- **Action**: Replace single `AuthController` row (line 168) with 4 separate controller rows
- **Implementation Steps**:
  1. Replace line 168:
     ```
     | **AuthController** | AuthService, SessionsService, JwtService, **PermissionsService**, TrustedDeviceService, **TurnstileService**, **ConfigService** |
     ```
     With 4 rows:
     ```
     | **AuthController** | AuthService, **PermissionsService** |
     | **OAuthController** | AuthService, **ConfigService**, OAuthLinkCodeStore |
     | **AccountController** | AuthService |
     | **SessionController** | SessionsService, TrustedDeviceService, JwtService |
     ```
- **Notes**: TurnstileService was listed in the old row but is not a constructor dep of any controller — it's registered as APP_GUARD via SecurityModule. Removed from mock table as it's automatically resolved.

### Step 2: Verify No Code Changes

- **Action**: Confirm only `integration-state.md` was modified
- **Implementation Steps**:
  1. `git diff --stat` should show only 1 file changed
  2. No `nest build` or test run needed (docs-only change)

### Step 3: Update Technical Documentation

- **Action**: The table update IS the documentation fix — no additional docs needed beyond changelog entry

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update Test Mock Requirements table
3. Step 2: Verify no code changes

## 6. Testing Checklist

- [ ] Single AuthController row replaced with 4 separate rows
- [ ] Each row matches actual constructor DI from live code
- [ ] No code files modified
- [ ] TurnstileService removed (APP_GUARD, not controller dep)

## 7. Error Response Format

N/A — documentation-only change.

## 8. Dependencies

- No new dependencies

## 9. Notes

- This is a documentation-only ticket — no code, tests, or build verification needed
- The old row included TurnstileService which was never a controller constructor dependency — it's an APP_GUARD registered via SecurityModule
- OAuthLinkCodeStore is a new dependency introduced in the OAuth controller split that wasn't in the original combined row

## 10. Next Steps After Implementation

- Run `/verify` to confirm plan compliance
- Run `/commit` to create commit
- Run `/update-docs` to create implementation record

## 11. Implementation Verification

- [ ] 1 stale row removed
- [ ] 4 accurate rows added
- [ ] All constructor deps match live code
- [ ] No code changes
