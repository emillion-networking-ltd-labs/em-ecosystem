# Fullstack Implementation Plan: SCRUM-173 Differentiate OAuth Audit Actions (login/register/link)

## BACKEND SECTION

### 1. Codebase State Snapshot

- **Date**: 2026-03-11
- **Last completed ticket**: SCRUM-170 (Force GitHub OAuth re-authentication)
- **Integration state verified**: Yes (last update: SCRUM-170, 2026-03-11)

**Files verified against live code**:
| File | Verified |
|------|----------|
| `src/audit/enums/audit-action.enum.ts` | Full file (38 lines, 36 enum values) |
| `src/auth/auth.service.ts` | validateOAuthUser (lines 549-593), constructor (lines 108-131, 11 deps) |
| `src/users/users.service.ts` | findOrCreateByOAuth (lines 131-235), 4 return paths |
| `src/auth/tests/auth.service.spec.ts` | validateOAuthUser tests (lines 1897-1932, 2750-2768) |

**Constructor signatures verified**:
- `AuthService(11 deps)`: usersService, jwtService, configService, prisma, auditService, refreshTokenService, sessionService, suspiciousLoginDetector, passwordBreachService, oauthCodeStore, tokenDenyListService
- No constructor changes needed for this ticket

**Methods verified to exist**:
- `AuthService.validateOAuthUser()` — line 549, auth.service.ts
- `UsersService.findOrCreateByOAuth()` — line 131, users.service.ts
- `AuditService.log()` — used at line 574, auth.service.ts

**Guard dependency chain verified**: N/A (no guard changes)

**Discrepancies with integration-state.md**: None

### 2. Overview

`validateOAuthUser()` always logs `AuditAction.OAUTH_LOGIN` regardless of whether the OAuth flow resulted in a login (existing user), auto-link (existing user + new provider), or account creation (new user). The `action` field from `findOrCreateByOAuth()` is returned to the frontend via `oauthAction` but never used for audit logging.

### 3. Architecture Context

- **Module**: AuthModule (auth.service.ts)
- **Enum**: AuditAction (audit-action.enum.ts)
- **No new services, controllers, guards, or modules**
- **No Prisma schema changes**

**Current audit gap**:
| OAuth flow | `findOrCreateByOAuth` action | Current audit | Expected audit |
|---|---|---|---|
| Existing user + OAuthAccount | `'login'` (line 179/181) | OAUTH_LOGIN | OAUTH_LOGIN |
| Existing user + auto-link by email | `'linked'` (line 215) | OAUTH_LOGIN | OAUTH_LINKED |
| New user created | `'created'` (line 234) | OAUTH_LOGIN | OAUTH_REGISTER (new) |

### 4. Implementation Steps

#### Step 0: Create Feature Branch

- **Branch**: `feature/SCRUM-173-fullstack` (from main)
- Pull latest main, create branch, verify

#### Step 1: Add OAUTH_REGISTER to AuditAction Enum

- **File**: `src/audit/enums/audit-action.enum.ts`
- **Action**: Add new enum value after OAUTH_LINKED (line 37)

**Change**:
```typescript
OAUTH_UNLINKED = 'OAUTH_UNLINKED',
OAUTH_LINKED = 'OAUTH_LINKED',
OAUTH_REGISTER = 'OAUTH_REGISTER',  // NEW — OAuth-initiated account creation
```

#### Step 2: Map Action to AuditAction in validateOAuthUser()

- **File**: `src/auth/auth.service.ts`
- **Action**: Replace hardcoded `AuditAction.OAUTH_LOGIN` (line 576) with action-based mapping

**Current code** (lines 574-582):
```typescript
this.auditService
  .log({
    action: AuditAction.OAUTH_LOGIN,
    userId: user.id,
    ipAddress: ctx?.ipAddress,
    userAgent: ctx?.userAgent,
    metadata: { provider: profile.provider },
  })
  .catch(() => {});
```

**New code**:
```typescript
const auditActionMap: Record<string, AuditAction> = {
  login: AuditAction.OAUTH_LOGIN,
  linked: AuditAction.OAUTH_LINKED,
  created: AuditAction.OAUTH_REGISTER,
};

this.auditService
  .log({
    action: auditActionMap[action] || AuditAction.OAUTH_LOGIN,
    userId: user.id,
    ipAddress: ctx?.ipAddress,
    userAgent: ctx?.userAgent,
    metadata: { provider: profile.provider },
  })
  .catch(() => {});
```

**Implementation Notes**:
- `auditActionMap` defined as local const inside the method (not class-level — only used here)
- Fallback to `OAUTH_LOGIN` for safety if action is unexpected
- `action` variable already destructured at line 554: `const { user, action } = await this.usersService.findOrCreateByOAuth(profile);`

#### Step 3: Update auth.service.spec.ts Tests

- **File**: `src/auth/tests/auth.service.spec.ts`
- **Action**: Add/update test cases to verify correct audit action per scenario

**Test cases to add** (in the `validateOAuthUser` describe block, after line ~1932):

1. **`it('should log OAUTH_LOGIN when action is login')`**
   - Mock `findOrCreateByOAuth` → `{ user, action: 'login' }`
   - Assert `auditService.log` called with `action: AuditAction.OAUTH_LOGIN`

2. **`it('should log OAUTH_LINKED when action is linked')`**
   - Mock `findOrCreateByOAuth` → `{ user, action: 'linked' }`
   - Assert `auditService.log` called with `action: AuditAction.OAUTH_LINKED`

3. **`it('should log OAUTH_REGISTER when action is created')`**
   - Mock `findOrCreateByOAuth` → `{ user, action: 'created' }`
   - Assert `auditService.log` called with `action: AuditAction.OAUTH_REGISTER`

**Pattern** (based on existing test at line 2750):
```typescript
it('should log OAUTH_LINKED when OAuth auto-links by email', async () => {
  mockUsersService.findOrCreateByOAuth.mockResolvedValue({
    user: mockOAuthUser,
    action: 'linked',
  });
  // ... other mocks same as existing test ...

  await service.validateOAuthUser(oauthProfile, requestMeta, requestMeta);

  expect(mockAuditService.log).toHaveBeenCalledWith(
    expect.objectContaining({
      action: AuditAction.OAUTH_LINKED,
      metadata: { provider: oauthProfile.provider },
    }),
  );
});
```

#### Step 4: Run Backend Tests

- **Command**: `cd nexacore-api && npx jest --coverage`
- Verify all tests pass, no regressions
- Pay special attention to auth.service.spec.ts

---

## FRONTEND SECTION

### 5. Architecture Context (Frontend)

Three files need OAUTH_LINKED + OAUTH_REGISTER added to their action mappings:

| File | Mapping | Current actions | Missing |
|------|---------|----------------|---------|
| SecurityActivity.tsx | EVENT_CONFIG (lines 8-38) | 26 events | OAUTH_LINKED, OAUTH_REGISTER |
| AuditLogFilters.tsx | AUDIT_ACTIONS (lines 17-33) | 16 events | OAUTH_LINKED, OAUTH_REGISTER |
| AuditLogsTable.tsx | ACTION_COLORS (lines 9-25) | 15 events | OAUTH_LINKED, OAUTH_REGISTER |

**Note**: OAUTH_LINKED already exists in the backend enum since SCRUM-161 but was never added to frontend mappings. OAUTH_UNLINKED IS present in SecurityActivity (line 33) but NOT in AuditLogFilters/AuditLogsTable.

**Fallback**: All 3 files have safe fallback for unknown actions (won't crash), but missing entries show raw action strings instead of human-readable labels.

### Implementation Steps (Frontend)

#### Step 5: Add OAUTH_LINKED + OAUTH_REGISTER to SecurityActivity.tsx

- **File**: `src/components/profile/SecurityActivity.tsx`
- **Action**: Add 2 entries to EVENT_CONFIG (after line 33, `OAUTH_UNLINKED`)

```typescript
OAUTH_UNLINKED: { label: 'OAuth Unlinked', category: 'warning' },
OAUTH_LINKED: { label: 'OAuth Account Linked', category: 'success' },
OAUTH_REGISTER: { label: 'OAuth Account Created', category: 'success' },
```

**Category rationale**:
- `OAUTH_LINKED` → `success` (positive action, account connected)
- `OAUTH_REGISTER` → `success` (new account creation, same as `REGISTER`)

#### Step 6: Add OAUTH_LINKED + OAUTH_REGISTER to AuditLogFilters.tsx

- **File**: `src/components/admin/AuditLogFilters.tsx`
- **Action**: Add 3 entries to AUDIT_ACTIONS array (after line 23, `OAUTH_LOGIN`). Also add OAUTH_UNLINKED which is currently missing from admin filters.

```typescript
'OAUTH_LOGIN',
'OAUTH_LINKED',
'OAUTH_REGISTER',
'OAUTH_UNLINKED',
```

**Note**: Display labels auto-generated by replacing underscores with spaces (line 56): "OAUTH LINKED", "OAUTH REGISTER", "OAUTH UNLINKED".

#### Step 7: Add OAUTH_LINKED + OAUTH_REGISTER to AuditLogsTable.tsx

- **File**: `src/components/admin/AuditLogsTable.tsx`
- **Action**: Add 3 entries to ACTION_COLORS (after line 15, `OAUTH_LOGIN`). Also add OAUTH_UNLINKED for consistency.

```typescript
OAUTH_LOGIN: 'bg-status-info/10 text-status-info',
OAUTH_LINKED: 'bg-status-success/10 text-status-success',
OAUTH_REGISTER: 'bg-status-success/10 text-status-success',
OAUTH_UNLINKED: 'bg-status-warning/10 text-status-warning',
```

**Color rationale**:
- `OAUTH_LINKED` → `status-success` (matches REGISTER color — positive action)
- `OAUTH_REGISTER` → `status-success` (same as REGISTER on line 13)
- `OAUTH_UNLINKED` → `status-warning` (matches SecurityActivity where it's 'warning')

#### Step 8: Update Technical Documentation

- **Action**: Update integration-state.md changelog with SCRUM-173 entry
- **No API changes** → no api-spec.yml update
- **No data model changes** → no data-model.md update

---

## 6. Implementation Order

1. Step 0: Create feature branch (`feature/SCRUM-173-fullstack`)
2. Step 1: Add OAUTH_REGISTER to AuditAction enum
3. Step 2: Map action → AuditAction in validateOAuthUser()
4. Step 3: Add/update auth.service.spec.ts tests
5. Step 4: Run backend tests
6. Step 5: Add to SecurityActivity.tsx EVENT_CONFIG
7. Step 6: Add to AuditLogFilters.tsx AUDIT_ACTIONS
8. Step 7: Add to AuditLogsTable.tsx ACTION_COLORS
9. Step 8: Update documentation

## 7. Testing Checklist

### Backend
- [ ] `npx jest auth.service.spec.ts` — all tests pass
- [ ] New test: OAUTH_LOGIN logged for action='login'
- [ ] New test: OAUTH_LINKED logged for action='linked'
- [ ] New test: OAUTH_REGISTER logged for action='created'
- [ ] `npx jest --coverage` — no regressions

### Frontend
- [ ] SecurityActivity shows "OAuth Account Linked" for OAUTH_LINKED events
- [ ] SecurityActivity shows "OAuth Account Created" for OAUTH_REGISTER events
- [ ] AuditLogFilters dropdown includes OAUTH_LINKED, OAUTH_REGISTER, OAUTH_UNLINKED
- [ ] AuditLogsTable shows correct colors for new action types
- [ ] `next build` — no TypeScript errors

## 8. Error Response Format

N/A — no new API endpoints or error responses.

## 9. Dependencies

- No new packages required (backend or frontend)
- Uses existing `AuditAction` enum, `AuditService.log()`, and frontend component patterns

## 10. Notes

- **Backward compatibility**: Existing `OAUTH_LOGIN` records in the database remain valid. No migration needed. Only new OAuth events get differentiated actions.
- **No double-logging risk**: `findOrCreateByOAuth` creates OAuthAccount directly via Prisma (not via `linkOAuthProvider`), so the auto-link path will NOT trigger both OAUTH_LOGIN and OAUTH_LINKED.
- **DTO unchanged**: `list-security-activity-query.dto.ts` has NO enum validation — only pagination. No changes needed.
- **validateOAuthLink() unchanged**: Already correct — calls `linkOAuthProvider()` which independently logs `OAUTH_LINKED`.
- **Admin consistency**: OAUTH_UNLINKED was missing from AuditLogFilters and AuditLogsTable — added for completeness alongside new entries.

## 11. Next Steps After Implementation

- Future: Consider adding OAUTH_LINKED/OAUTH_REGISTER to email notifications (if security email alerts are implemented)
- Existing OAUTH_LOGIN records could optionally be backfilled via a migration script (not required for this ticket)

## 12. Implementation Verification

- [ ] Code Quality: No linting errors, follows existing patterns
- [ ] Functionality: Audit log differentiates login/linked/created correctly
- [ ] Testing: 3 new test cases pass, no regressions
- [ ] Integration: Frontend displays correct labels and colors for all OAuth actions
- [ ] Documentation: integration-state.md updated
