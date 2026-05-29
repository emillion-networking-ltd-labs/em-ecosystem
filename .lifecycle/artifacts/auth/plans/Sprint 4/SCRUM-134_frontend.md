# Frontend Implementation Plan: SCRUM-134 User Security Activity Dashboard

## 1. Overview

Add a security activity section to the profile page showing active sessions and recent security events. The backend detects brute force, credential stuffing, unusual login hours, new country logins, and impossible travel — but users have no in-app visibility. This ticket surfaces that data.

**Architecture**: Next.js 14 App Router, `apiClient` singleton, local component state, TailwindCSS. **Fullstack scope**: requires a new backend endpoint for user-scoped security events (the existing `GET /audit-logs` is ADMIN-only).

## 2. Architecture Context

### Components/Pages Involved
- **New (backend)**: `GET /users/me/security-activity` endpoint in UsersController — user-scoped audit log query
- **New (frontend)**: `src/lib/security-activity-api.ts` — API functions
- **New (frontend)**: `src/components/profile/SecurityActivity.tsx` — main security dashboard component
- **Modified (frontend)**: `src/lib/types.ts` — add security event types
- **Modified (frontend)**: `src/app/profile/page.tsx` — add SecurityActivity component
- **Modified (backend)**: `src/users/users.controller.ts` — new endpoint
- **Modified (backend)**: `src/users/users.service.ts` — new method (delegates to AuditService)

### Routing Considerations
- `/profile` — existing protected page, gains SecurityActivity section
- No new routes needed

### State Management
- **SecurityActivity**: Local `useState` for sessions, events, loading, error, pagination
- No context changes — uses existing `useAuth()` for `user`

### Key Backend Context
- `GET /auth/sessions` — **already exists**, returns active sessions for the calling user (JwtAuthGuard only, no ADMIN). Returns `SessionResponse[]` with id, deviceInfo, ipAddress, userAgent, locationCity, locationCountry, createdAt, lastUsedAt, expiresAt, isCurrent.
- `GET /audit-logs` — **ADMIN-only**, cannot be used by regular users. But `AuditService.findAll()` supports `userId` filter internally.
- `DELETE /auth/sessions/:id` — **already exists**, user can revoke own sessions.
- `POST /auth/logout-all` — **already exists**, revokes all user sessions.
- **AuditAction enum**: 35 values. Security-relevant subset for the dashboard: LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, PASSWORD_CHANGE, MFA_ENABLED, MFA_DISABLED, ACCOUNT_LOCKED, ACCOUNT_UNLOCKED, BRUTE_FORCE_DETECTED, CREDENTIAL_STUFFING_DETECTED, UNUSUAL_LOGIN_HOURS, NEW_COUNTRY_LOGIN, IMPOSSIBLE_TRAVEL_DETECTED, LOGIN_BLOCKED_TRAVEL, DEVICE_TRUSTED, DEVICE_UNTRUSTED, PASSKEY_REGISTERED, PASSKEY_DELETED, PASSKEY_AUTH_SUCCESS, PASSKEY_AUTH_FAILURE, OAUTH_UNLINKED, EMAIL_CHANGE_REQUESTED, EMAIL_CHANGED, OAUTH_LOGIN.

## 3. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to feature branch
- **Branch**: `feature/SCRUM-134-frontend`
- **Implementation Steps**:
  1. Ensure on latest `main`: `git checkout main && git pull origin main`
  2. Create branch: `git checkout -b feature/SCRUM-134-frontend`
  3. Verify: `git branch`
- **Notes**: Must be the FIRST step before any code changes.

### Step 1: Backend — Add User-Scoped Security Activity Endpoint

- **Files**: `nexacore-api/src/users/users.controller.ts`, `nexacore-api/src/users/users.service.ts`
- **Action**: Add `GET /users/me/security-activity` endpoint that returns the calling user's security-relevant audit logs

#### 1a. Add Endpoint to UsersController

```typescript
@Get('me/security-activity')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Get current user security activity' })
@ApiResponse({ status: 200, description: 'User security events' })
async getMySecurityActivity(
  @Request() req: { user: { id: string } },
  @Query() query: ListSecurityActivityQueryDto,
) {
  return this.usersService.getSecurityActivity(req.user.id, query);
}
```

- **Guard**: `JwtAuthGuard` only (no RolesGuard, no PermissionsGuard) — any authenticated user can view their own activity
- **Route position**: Place BEFORE any `@Get(':id')` routes to avoid param conflict

#### 1b. Create DTO

- **File**: `nexacore-api/src/users/dto/list-security-activity-query.dto.ts` (NEW)

```typescript
import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListSecurityActivityQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

#### 1c. Add Service Method

- **File**: `nexacore-api/src/users/users.service.ts`

```typescript
// Security-relevant actions to surface to users
private static readonly SECURITY_ACTIONS: AuditAction[] = [
  AuditAction.LOGIN_SUCCESS,
  AuditAction.LOGIN_FAILURE,
  AuditAction.OAUTH_LOGIN,
  AuditAction.LOGOUT,
  AuditAction.PASSWORD_CHANGE,
  AuditAction.MFA_ENABLED,
  AuditAction.MFA_DISABLED,
  AuditAction.ACCOUNT_LOCKED,
  AuditAction.ACCOUNT_UNLOCKED,
  AuditAction.BRUTE_FORCE_DETECTED,
  AuditAction.CREDENTIAL_STUFFING_DETECTED,
  AuditAction.UNUSUAL_LOGIN_HOURS,
  AuditAction.NEW_COUNTRY_LOGIN,
  AuditAction.IMPOSSIBLE_TRAVEL_DETECTED,
  AuditAction.LOGIN_BLOCKED_TRAVEL,
  AuditAction.DEVICE_TRUSTED,
  AuditAction.DEVICE_UNTRUSTED,
  AuditAction.PASSKEY_REGISTERED,
  AuditAction.PASSKEY_DELETED,
  AuditAction.PASSKEY_AUTH_SUCCESS,
  AuditAction.PASSKEY_AUTH_FAILURE,
  AuditAction.OAUTH_UNLINKED,
  AuditAction.EMAIL_CHANGE_REQUESTED,
  AuditAction.EMAIL_CHANGED,
];

async getSecurityActivity(userId: string, query: ListSecurityActivityQueryDto) {
  const { page = 1, limit = 20, sortOrder = 'desc' } = query;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    action: { in: UsersService.SECURITY_ACTIONS },
  };

  const [data, total] = await Promise.all([
    this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      },
    }),
    this.prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

- **Dependencies**: AuditAction enum import, PrismaService (already injected)
- **Security**: Hardcoded `userId` from JWT — users cannot query other users' events
- **Performance**: Uses existing composite index `(action, userId, createdAt)` on AuditLog
- **Exclusions**: No `userId`/`targetUserId` fields exposed — prevents information leakage about other users. No `refreshTokenHash` or sensitive session data.

#### 1d. Write Tests

- **File**: `nexacore-api/tests/users/users.service.spec.ts` — add tests for `getSecurityActivity()`
- **File**: `nexacore-api/tests/users/users.controller.spec.ts` — add test for `GET /users/me/security-activity`
- **Test cases**:
  1. Returns paginated security events for the user
  2. Only returns SECURITY_ACTIONS (not TOKEN_REFRESH, PROFILE_UPDATE, etc.)
  3. Respects pagination (page, limit)
  4. Returns empty data array when no events exist
  5. Controller rejects unauthenticated requests (401)

### Step 2: Add Frontend Types

- **File**: `nexacore-dashboard/src/lib/types.ts`
- **Action**: Add types for security events and sessions

```typescript
export type SecurityEvent = {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type SessionResponse = {
  id: string;
  deviceInfo: string | null;
  ipAddress: string;
  userAgent: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
};
```

- **Implementation Notes**:
  - `SecurityEvent.action` is a string (not a union type) to avoid maintaining a duplicate of the backend enum — the frontend categorizes actions via a lookup map
  - `SessionResponse` mirrors the backend's session entity shape (without `refreshTokenHash`, `tokenFamily`, `isRevoked`)
  - `MessageResponse` should already exist on this branch from main (if not, add it)

### Step 3: Create Security Activity API Module

- **File**: `nexacore-dashboard/src/lib/security-activity-api.ts` (NEW)
- **Action**: API functions for security events and sessions

```typescript
import { apiClient } from './api';
import type { PaginatedResponse, SecurityEvent, SessionResponse, MessageResponse } from './types';

export function getSecurityActivity(
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<SecurityEvent>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiClient.get<PaginatedResponse<SecurityEvent>>(`/users/me/security-activity?${params}`);
}

export function getActiveSessions(): Promise<SessionResponse[]> {
  return apiClient.get<SessionResponse[]>('/auth/sessions');
}

export function revokeSession(sessionId: string): Promise<MessageResponse> {
  return apiClient.delete<MessageResponse>(`/auth/sessions/${sessionId}`);
}

export function revokeAllSessions(): Promise<MessageResponse> {
  return apiClient.post<MessageResponse>('/auth/logout-all', {});
}
```

- **Implementation Notes**:
  - `getActiveSessions()` uses existing `GET /auth/sessions` endpoint
  - `revokeSession()` uses existing `DELETE /auth/sessions/:id` endpoint
  - `revokeAllSessions()` uses existing `POST /auth/logout-all` endpoint
  - `getSecurityActivity()` uses the new `GET /users/me/security-activity` endpoint from Step 1

### Step 4: Create SecurityActivity Component

- **File**: `nexacore-dashboard/src/components/profile/SecurityActivity.tsx` (NEW)
- **Action**: Security dashboard component with two sections: Active Sessions + Recent Security Events

#### 4a. Component Structure

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getActiveSessions,
  getSecurityActivity,
  revokeSession,
  revokeAllSessions,
} from '@/lib/security-activity-api';
import type { SessionResponse, SecurityEvent } from '@/lib/types';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
```

#### 4b. State

```typescript
const { user, logout } = useAuth();

// Sessions
const [sessions, setSessions] = useState<SessionResponse[]>([]);
const [sessionsLoading, setSessionsLoading] = useState(true);

// Security events
const [events, setEvents] = useState<SecurityEvent[]>([]);
const [eventsPage, setEventsPage] = useState(1);
const [eventsMeta, setEventsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
const [eventsLoading, setEventsLoading] = useState(true);

// Actions
const [revoking, setRevoking] = useState<string | null>(null); // sessionId being revoked
const [showRevokeAll, setShowRevokeAll] = useState(false);
const [revokingAll, setRevokingAll] = useState(false);
```

#### 4c. Data Fetching

```typescript
const fetchSessions = useCallback(async () => {
  setSessionsLoading(true);
  try {
    const data = await getActiveSessions();
    setSessions(data);
  } catch {
    // silently fail — empty state shown
  } finally {
    setSessionsLoading(false);
  }
}, []);

const fetchEvents = useCallback(async (page: number) => {
  setEventsLoading(true);
  try {
    const res = await getSecurityActivity(page, 10);
    setEvents(res.data);
    setEventsMeta(res.meta);
  } catch {
    // silently fail
  } finally {
    setEventsLoading(false);
  }
}, []);

useEffect(() => { fetchSessions(); }, [fetchSessions]);
useEffect(() => { fetchEvents(eventsPage); }, [fetchEvents, eventsPage]);
```

#### 4d. Session Actions

```typescript
const handleRevoke = async (sessionId: string) => {
  setRevoking(sessionId);
  try {
    await revokeSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  } catch {
    // silently fail
  } finally {
    setRevoking(null);
  }
};

const handleRevokeAll = async () => {
  setRevokingAll(true);
  try {
    await revokeAllSessions();
    await logout();
  } catch {
    // silently fail
  } finally {
    setRevokingAll(false);
    setShowRevokeAll(false);
  }
};
```

#### 4e. Event Categorization Helpers

Define a lookup map for event display metadata:

```typescript
const EVENT_CONFIG: Record<string, { label: string; category: 'info' | 'success' | 'warning' | 'danger' }> = {
  LOGIN_SUCCESS:                { label: 'Login',                    category: 'success' },
  LOGIN_FAILURE:                { label: 'Failed Login',             category: 'danger' },
  OAUTH_LOGIN:                  { label: 'OAuth Login',              category: 'success' },
  LOGOUT:                       { label: 'Logout',                   category: 'info' },
  PASSWORD_CHANGE:              { label: 'Password Changed',         category: 'warning' },
  MFA_ENABLED:                  { label: 'MFA Enabled',              category: 'success' },
  MFA_DISABLED:                 { label: 'MFA Disabled',             category: 'warning' },
  ACCOUNT_LOCKED:               { label: 'Account Locked',           category: 'danger' },
  ACCOUNT_UNLOCKED:             { label: 'Account Unlocked',         category: 'info' },
  BRUTE_FORCE_DETECTED:         { label: 'Brute Force Detected',     category: 'danger' },
  CREDENTIAL_STUFFING_DETECTED: { label: 'Credential Stuffing',      category: 'danger' },
  UNUSUAL_LOGIN_HOURS:          { label: 'Unusual Login Hour',       category: 'warning' },
  NEW_COUNTRY_LOGIN:            { label: 'New Country Login',        category: 'warning' },
  IMPOSSIBLE_TRAVEL_DETECTED:   { label: 'Impossible Travel',        category: 'danger' },
  LOGIN_BLOCKED_TRAVEL:         { label: 'Login Blocked (Travel)',   category: 'danger' },
  DEVICE_TRUSTED:               { label: 'Device Trusted',           category: 'success' },
  DEVICE_UNTRUSTED:             { label: 'Device Revoked',           category: 'warning' },
  PASSKEY_REGISTERED:           { label: 'Passkey Registered',       category: 'success' },
  PASSKEY_DELETED:              { label: 'Passkey Deleted',          category: 'warning' },
  PASSKEY_AUTH_SUCCESS:          { label: 'Passkey Login',            category: 'success' },
  PASSKEY_AUTH_FAILURE:          { label: 'Passkey Login Failed',     category: 'danger' },
  OAUTH_UNLINKED:               { label: 'OAuth Unlinked',           category: 'warning' },
  EMAIL_CHANGE_REQUESTED:       { label: 'Email Change Requested',   category: 'info' },
  EMAIL_CHANGED:                { label: 'Email Changed',            category: 'warning' },
};

const CATEGORY_STYLES = {
  info:    'bg-surface-subtle text-content-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger:  'bg-error/10 text-error',
};
```

#### 4f. Render Structure

The component renders as a single profile card with two collapsible-style sections:

```tsx
return (
  <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
    <h2 className="mb-6 text-body-sm font-semibold uppercase tracking-wider text-content-primary">
      Security Activity
    </h2>

    {/* Section 1: Active Sessions */}
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-body-sm font-medium text-content-primary">Active Sessions</h3>
        {sessions.length > 1 && (
          <button
            onClick={() => setShowRevokeAll(true)}
            className="text-caption text-error hover:underline"
          >
            Revoke All
          </button>
        )}
      </div>

      {sessionsLoading ? (
        <p className="py-4 text-center text-body-sm text-content-tertiary">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="py-4 text-center text-body-sm text-content-tertiary">No active sessions.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-xl border border-border-default p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-medium text-content-primary">
                    {session.deviceInfo || 'Unknown Device'}
                  </span>
                  {session.isCurrent && (
                    <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-caption text-content-tertiary">
                  {session.ipAddress}
                  {session.locationCity && ` · ${session.locationCity}`}
                  {session.locationCountry && `, ${session.locationCountry}`}
                  {' · '}
                  {new Date(session.lastUsedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              {!session.isCurrent && (
                <button
                  onClick={() => handleRevoke(session.id)}
                  disabled={revoking === session.id}
                  className="ml-3 rounded-md border border-error-border px-3 py-1 text-caption text-error hover:bg-error-bg disabled:opacity-50"
                >
                  {revoking === session.id ? 'Revoking...' : 'Revoke'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Divider */}
    <div className="mb-6 border-t border-border-default" />

    {/* Section 2: Recent Security Events */}
    <div>
      <h3 className="mb-3 text-body-sm font-medium text-content-primary">Recent Events</h3>

      {eventsLoading ? (
        <p className="py-4 text-center text-body-sm text-content-tertiary">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="py-4 text-center text-body-sm text-content-tertiary">No security events.</p>
      ) : (
        <>
          <div className="space-y-2">
            {events.map((event) => {
              const config = EVENT_CONFIG[event.action] || { label: event.action, category: 'info' as const };
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-xl border border-border-default p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_STYLES[config.category]}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="mt-1 text-caption text-content-tertiary">
                      {event.ipAddress || 'System'}
                      {' · '}
                      {new Date(event.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {eventsMeta.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={eventsMeta.page}
                totalPages={eventsMeta.totalPages}
                onPageChange={setEventsPage}
              />
            </div>
          )}
        </>
      )}
    </div>

    {/* Revoke All confirmation modal */}
    <ConfirmModal
      open={showRevokeAll}
      onClose={() => setShowRevokeAll(false)}
      onConfirm={handleRevokeAll}
      title="Revoke All Sessions"
      description="This will log you out of all devices and end all active sessions. You will need to log in again."
      confirmLabel="Revoke All"
      variant="danger"
      loading={revokingAll}
    />
  </div>
);
```

- **Dependencies**: `useAuth`, `getActiveSessions`, `getSecurityActivity`, `revokeSession`, `revokeAllSessions`, `ConfirmModal`, `Pagination`, types
- **Notes**:
  - "Revoke All" uses existing `ConfirmModal` (no form-validation-based disable needed — just loading)
  - Current session shows "Current" badge, no revoke button (revoking current = logout)
  - Events show color-coded category badges for visual threat indicators
  - Danger events (brute force, credential stuffing, impossible travel, failed logins, account locked) highlighted in red
  - Warning events (password change, MFA disabled, unusual hours, new country) highlighted in amber
  - Success events (login, MFA enabled, passkey registered) highlighted in green
  - Info events (logout, email change requested) shown in neutral

### Step 5: Add SecurityActivity to Profile Page

- **File**: `nexacore-dashboard/src/app/profile/page.tsx`
- **Action**: Import and render SecurityActivity after ConnectedAccounts (before DeleteAccount if it exists on the branch)

```typescript
import SecurityActivity from '@/components/profile/SecurityActivity';
```

Add `<SecurityActivity />` in the profile page component list:
```tsx
<ProfileForm />
<ChangePasswordForm />
<AccountInfo />
<ConnectedAccounts />
<SecurityActivity />
```

### Step 6: Build Verification

- **Action**: Verify both backend and frontend builds pass
- **Implementation Steps**:
  1. Backend: Run `npm run build` in `nexacore-api/` — 0 TypeScript errors
  2. Backend: Run `npm test` in `nexacore-api/` — all tests pass
  3. Frontend: Run `npm run build` in `nexacore-dashboard/` — 0 errors, all pages compile

### Step 7: Update Technical Documentation

- **Action**: Review and update technical documentation according to changes made
- **Implementation Steps**:
  1. **Review Changes**: Analyze all code changes from steps 1-5
  2. **Update `api-spec.yml`**: Add `GET /users/me/security-activity` endpoint definition
  3. **Update `integration-state.md`**: Add SCRUM-134 changelog entry
  4. **Verify Documentation**: Confirm all changes accurately reflected, English only
- **References**: Follow `documentation-standards.mdc`
- **Notes**: MANDATORY step before considering implementation complete

## 4. Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-134-frontend`
2. **Step 1**: Backend — Add `GET /users/me/security-activity` endpoint + DTO + service method + tests
3. **Step 2**: Add frontend types (`SecurityEvent`, `SessionResponse`)
4. **Step 3**: Create `security-activity-api.ts` module
5. **Step 4**: Create `SecurityActivity.tsx` component
6. **Step 5**: Add SecurityActivity to profile page
7. **Step 6**: Build verification (backend + frontend)
8. **Step 7**: Update technical documentation

## 5. Testing Checklist

### Backend Tests
- [ ] `getSecurityActivity()` returns paginated events for the user
- [ ] Only SECURITY_ACTIONS returned (TOKEN_REFRESH, PROFILE_UPDATE excluded)
- [ ] Pagination works correctly (page, limit, totalPages)
- [ ] Empty results return `{ data: [], meta: { total: 0, ... } }`
- [ ] Controller rejects unauthenticated requests (401)
- [ ] User can only see their own events (userId hardcoded from JWT)

### Build Verification
- [ ] Backend: `npm run build` passes
- [ ] Backend: `npm test` passes
- [ ] Frontend: `next build` passes with 0 errors

### Manual Verification
- [ ] Active sessions section shows current and other sessions
- [ ] Current session shows "Current" badge, no revoke button
- [ ] Revoke button removes individual session from list
- [ ] "Revoke All" opens confirmation modal, on confirm logs user out
- [ ] Security events section shows recent events with color-coded badges
- [ ] Danger events (failed login, brute force, etc.) shown in red
- [ ] Warning events (password change, MFA disabled, etc.) shown in amber
- [ ] Success events (login, MFA enabled, etc.) shown in green
- [ ] Pagination works when more than 10 events exist
- [ ] Empty state shown when no sessions or events
- [ ] Loading state shown during data fetch

## 6. Error Handling Patterns

| Error Source | Error | Frontend Behavior |
|-------------|-------|-------------------|
| Sessions API | Network error | Empty sessions list (silent fail) |
| Events API | Network error | Empty events list (silent fail) |
| Revoke session | 404 (already revoked) | Session removed from list (optimistic) |
| Revoke session | Network error | Button re-enables (silent fail) |
| Revoke all | Network error | Modal closes, stays on page |
| Events API | 401 (token expired) | ApiClient handles refresh automatically |

## 7. UI/UX Considerations

### TailwindCSS & Theme
- Card: `rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card` (matches all profile cards)
- Section titles: `text-body-sm font-medium text-content-primary` (sub-headings within card)
- Card title: `text-body-sm font-semibold uppercase tracking-wider text-content-primary` (main heading)
- Session/event rows: `rounded-xl border border-border-default p-3` (matches ConnectedAccounts row pattern)
- Category badges: `rounded px-1.5 py-0.5 text-[10px] font-medium` with category-specific bg/text
- Revoke button: `border border-error-border text-caption text-error hover:bg-error-bg` (matches Disconnect button)
- Divider between sections: `border-t border-border-default`

### Responsive Design
- Card: full width within `max-w-2xl` container (profile page constraint)
- Session rows: flex with `min-w-0 flex-1` for text truncation on small screens
- Pagination: centered below events list

### Accessibility
- Revoke buttons have clear text labels
- Color badges are supplemented with text labels (not color-only)
- ConfirmModal for destructive "Revoke All" action
- Loading states communicated via text

### Loading States
- Sessions section: "Loading sessions..." while fetching
- Events section: "Loading events..." while fetching
- Individual revoke: button shows "Revoking..." and is disabled
- Revoke all: ConfirmModal shows loading state on confirm button

## 8. Dependencies

### External Libraries
- None needed — no new dependencies for this ticket

### Internal Components Used
- `ConfirmModal` (`@/components/ui/ConfirmModal`) — Revoke All confirmation (no custom disabled needed)
- `Pagination` (`@/components/ui/Pagination`) — events pagination
- `apiClient` (`@/lib/api`) — API singleton (via security-activity-api.ts)
- `useAuth` (`@/hooks/useAuth`) — user, logout

### Backend Dependencies
- `AuditService` — already available in UsersModule via AuditModule import
- `PrismaService` — already injected in UsersService
- No new module imports needed — UsersModule already imports AuditModule

## 9. Notes

- **Fullstack scope**: This ticket requires a new backend endpoint because `GET /audit-logs` is ADMIN-only. The new `GET /users/me/security-activity` endpoint is minimal — it delegates to Prisma directly (not AuditService.findAll) to keep the response shape lean and avoid exposing targetUserId.
- **Security**: The endpoint hardcodes `userId` from the JWT — users cannot query other users' activity. No targetUserId, no user relations exposed.
- **Event category map**: Defined as a static lookup in the component rather than importing backend enum. This avoids a backend dependency and handles unknown actions gracefully (fallback to 'info' category).
- **Session management**: Reuses existing endpoints (`GET /auth/sessions`, `DELETE /auth/sessions/:id`, `POST /auth/logout-all`). No new session endpoints needed.
- **"Revoke All" calls logout**: Since revoking all sessions includes the current session, the frontend calls `logout()` to clear local auth state after the API call.
- **MessageResponse on main**: May or may not be on main. Check and add if needed (same pattern as SCRUM-128-132).
- **All code and documentation in English**.

## 10. Next Steps After Implementation

1. Run builds: `npm run build` (backend) + `npm run build` (frontend) — must pass
2. Run tests: `npm test` (backend) — all pass
3. Manual testing with backend running (localhost:3000 + localhost:3001)
4. Test security events flow: perform login attempts, change password, enable MFA → verify events appear
5. Test session management: verify sessions list, revoke individual, revoke all
6. Create PR: `feature/SCRUM-134-frontend` → `main`
7. Update Jira ticket SCRUM-134 status

## 11. Implementation Verification

### Code Quality
- [ ] No TypeScript errors (both builds pass)
- [ ] Consistent naming (PascalCase components, camelCase functions)
- [ ] No `any` types — all properly typed
- [ ] Backend endpoint secured with JwtAuthGuard

### Functionality
- [ ] Sessions fetched and displayed with device, IP, location, time
- [ ] Current session identified and marked
- [ ] Individual session revocation works
- [ ] Revoke all sessions works (with confirmation + logout)
- [ ] Security events fetched and displayed with category badges
- [ ] Pagination works for events
- [ ] Empty states shown correctly

### Integration
- [ ] Auth token refresh still works
- [ ] Profile page renders all sections correctly
- [ ] New endpoint accessible to regular users (not ADMIN-only)
- [ ] Existing session endpoints still work

### Documentation
- [ ] `api-spec.yml` updated with `GET /users/me/security-activity`
- [ ] `integration-state.md` updated with SCRUM-134 changelog
- [ ] Implementation record created after completion
