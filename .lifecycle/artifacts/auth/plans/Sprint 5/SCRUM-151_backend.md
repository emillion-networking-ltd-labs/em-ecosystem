# SCRUM-151: Session Service Reveals Internal Session State Details — Backend Plan

- **Ticket**: SCRUM-151
- **Scope**: backend
- **Sprint**: 5 — Security Hardening
- **Priority**: HIGH (H-05)
- **Security references**: CWE-200

---

### 1. Codebase State Snapshot

- **Date**: 2026-03-09
- **Last completed ticket**: SCRUM-149 (SUPERADMIN bypass mechanism exposed in error messages)
- **Integration state verified**: Yes
- **Branch**: main (clean)

**Files verified**:

| File | Key observations |
|------|-----------------|
| `sessions.service.ts:1-5` | Imports: `UnauthorizedException`, `NotFoundException`. Constructor: `SessionsService(prisma: PrismaService, auditService: AuditService, geolocationService: GeolocationService)`. |
| `sessions.service.ts:149-160` | `revokeSession(sessionId, userId)`: Line 153 — `throw new NotFoundException(ErrorMessages.session.NOT_FOUND)` when `!session \|\| session.userId !== userId`. |
| `sessions.service.ts:92-140` | `rotateRefreshToken()`: 4 failure paths all use `ErrorMessages.auth.INVALID_REFRESH_TOKEN` — already generic. |
| `auth.service.ts:460-500` | `refreshTokens()`: Lines 465, 470 use `ErrorMessages.auth.INVALID_REFRESH_TOKEN` (generic). Line 499 uses `ErrorMessages.auth.SESSION_EXPIRED` = "Session expired due to inactivity" — specific. |
| `error-messages.ts:9-11` | `INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token'`, `TOKEN_REVOKED: 'Token has been revoked'`, `SESSION_EXPIRED: 'Session expired due to inactivity'` |
| `error-messages.ts:20-22` | `session: { NOT_FOUND: 'Session not found' }` |
| `sessions.service.spec.ts:430-448` | Test line 439: `rejects.toThrow('Session not found')`. Test line 447: only asserts `NotFoundException` type, not message. |
| `auth.service.spec.ts:2171-2181` | Test: "should throw UnauthorizedException when session is idle" — asserts `'Session expired due to inactivity'` at line 2181. |
| `auth.service.spec.ts:2702-2714` | Test: "should still throw on idle session when audit rejects" — only asserts `UnauthorizedException` type. |

**Constructor signatures verified**:
- `SessionsService(prisma, auditService, geolocationService)` — no changes needed
- No constructor modifications in this ticket

**Methods verified to exist**:
- `revokeSession(sessionId, userId)` — line 149 of sessions.service.ts
- `refreshTokens(refreshToken, ctx?)` — line 457 of auth.service.ts (offset from read)

**Guard dependency chain verified**: No guard changes.

**Discrepancies with integration-state.md**: None.

### 2. Overview

Two session-related error messages reveal internal session state to clients, enabling attackers to map the session lifecycle:

1. **`"Session not found"`** in `revokeSession()` — confirms session non-existence via NotFoundException (404)
2. **`"Session expired due to inactivity"`** in `refreshTokens()` — reveals specific idle-timeout reason, distinct from the generic `"Invalid or expired refresh token"` used by all other paths

The main `rotateRefreshToken()` path was already fixed by SCRUM-140 to use a single generic message for all 4 failure cases. These 2 paths were missed.

### 3. Architecture Context

- **Modules involved**: SessionsModule, AuthModule (no module config changes)
- **Affected services**: SessionsService (1 message), AuthService (1 message)
- **No new modules/guards/DI changes**

### 4. Implementation Steps

#### Step 1: Change revokeSession error (sessions.service.ts:152-153)

**File**: `nexacore-api/src/sessions/sessions.service.ts`

```typescript
// BEFORE (line 152-153)
if (!session || session.userId !== userId) {
  throw new NotFoundException(ErrorMessages.session.NOT_FOUND);
}

// AFTER
if (!session || session.userId !== userId) {
  throw new NotFoundException(ErrorMessages.session.NOT_FOUND);
}
```

**Decision**: Keep `NotFoundException` with `ErrorMessages.session.NOT_FOUND` ("Session not found") for `revokeSession()`.

**Rationale**: This endpoint (DELETE /auth/sessions/:id) is a user-initiated action to revoke a specific session from the "Active Sessions" UI. The user needs to know if the session they're trying to revoke doesn't exist or was already revoked. This is NOT the same as the refresh token flow where all errors should be opaque. The endpoint is behind JwtAuthGuard and the userId comes from the JWT — the user can only attempt to revoke their own sessions. The response doesn't reveal sessions belonging to OTHER users (both `!session` and `session.userId !== userId` return the same 404).

**However**, the `"Session not found"` message is fine as-is. The real issue in the ticket was "Session expired" and "Session revoked" as separate messages — those were already unified by SCRUM-140 in `rotateRefreshToken`. The `revokeSession` 404 is standard REST semantics for a self-service resource deletion endpoint.

**SKIP this step** — no change needed.

#### Step 2: Change refreshTokens idle check error (auth.service.ts:499)

**File**: `nexacore-api/src/auth/auth.service.ts`

```typescript
// BEFORE (line 499)
throw new UnauthorizedException(ErrorMessages.auth.SESSION_EXPIRED);

// AFTER
throw new UnauthorizedException(ErrorMessages.auth.INVALID_REFRESH_TOKEN);
```

This makes ALL refresh token failure paths return the same generic message:
- JWT verify failed → `INVALID_REFRESH_TOKEN`
- User not found → `INVALID_REFRESH_TOKEN`
- **Session idle (NEW)** → `INVALID_REFRESH_TOKEN`
- Session not found (in rotateRefreshToken) → `INVALID_REFRESH_TOKEN`
- Session expired (in rotateRefreshToken) → `INVALID_REFRESH_TOKEN`
- Session revoked/theft (in rotateRefreshToken) → `INVALID_REFRESH_TOKEN`
- Token hash mismatch (in rotateRefreshToken) → `INVALID_REFRESH_TOKEN`

The audit log already records `SESSION_IDLE_REVOKED` with full metadata for internal tracking.

#### Step 3: Update idle timeout test (auth.service.spec.ts:2181)

**File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`

```typescript
// BEFORE (line 2181)
).rejects.toThrow('Session expired due to inactivity');

// AFTER
).rejects.toThrow('Invalid or expired refresh token');
```

#### Step 4: Evaluate SESSION_EXPIRED constant removal

After Step 2, `ErrorMessages.auth.SESSION_EXPIRED` is no longer used anywhere in the codebase. However, removing it is a separate cleanup concern. Leave it for now — it's not exposed to users and removing constants from the object is not part of the security fix.

### 5. Testing Checklist

#### Tests to UPDATE (1):
| # | Test | File | Line | Change |
|---|------|------|------|--------|
| 1 | "should throw UnauthorizedException when session is idle" | auth.service.spec.ts | 2181 | `'Session expired due to inactivity'` → `'Invalid or expired refresh token'` |

#### Tests UNCHANGED:
| Test | File | Reason |
|------|------|--------|
| "should throw NotFoundException when session does not exist" | sessions.service.spec.ts:430 | `revokeSession` stays as-is (see Step 1 rationale) |
| "should still throw on idle session when audit rejects" | auth.service.spec.ts:2702 | Only asserts exception type, not message |
| All rotateRefreshToken tests | sessions.service.spec.ts | Already use generic message |

### 6. Implementation Order

1. Step 2: Change `SESSION_EXPIRED` → `INVALID_REFRESH_TOKEN` in auth.service.ts
2. Step 3: Update test assertion in auth.service.spec.ts
3. Run `nest build` — must compile clean
4. Run `jest --maxWorkers=1 --forceExit` — all tests must pass

### 7. Error Response Format

After fix:

| Scenario | Before | After |
|----------|--------|-------|
| Refresh with idle session | 401 `"Session expired due to inactivity"` | 401 `"Invalid or expired refresh token"` |

### 8. Dependencies

- `ErrorMessages.auth.INVALID_REFRESH_TOKEN` — already exists
- No new dependencies

### 9. Notes

- **revokeSession stays as-is**: The `"Session not found"` 404 in `revokeSession()` is standard REST semantics for a self-service deletion endpoint behind JwtAuthGuard. It does NOT reveal sessions of other users (both "not found" and "wrong owner" return the same 404). This is different from the opaque refresh token flow.
- **SESSION_EXPIRED constant becomes unused**: After this fix, `ErrorMessages.auth.SESSION_EXPIRED` has no consumers. It could be removed in a future cleanup, but removing it is not part of this security fix.
- **Audit log retains detail**: The audit entry `SESSION_IDLE_REVOKED` with `lastUsedAt` and `idleTimeoutHours` metadata is still logged — only the client-facing message changes.

### 10. Next Steps

After implementation:
1. Run `nest build` — must compile clean
2. Run `jest --maxWorkers=1 --forceExit` — all tests must pass
3. Proceed to `/commit`

### 11. Implementation Verification

- [ ] `auth.service.ts` idle check: throws `INVALID_REFRESH_TOKEN` (not `SESSION_EXPIRED`)
- [ ] All 7 refresh token failure paths return the same `"Invalid or expired refresh token"` message
- [ ] Test assertion updated for idle session test
- [ ] Audit log still records `SESSION_IDLE_REVOKED` with metadata
- [ ] `nest build` compiles clean
- [ ] All tests pass

### 12. Module-Level Planning

No module changes. No new providers, imports, or exports.

### 13. Satellite App Planning

No satellite app impact.

### 14. Cross-Ticket Dependency Checklist

| Ticket | Relationship | Status |
|--------|-------------|--------|
| SCRUM-140 | Parent — fixed rotateRefreshToken (4 paths) but missed idle check in auth.service | Done |
| SCRUM-149 | Sibling — SUPERADMIN error messages (completed) | Done |
| SCRUM-148 | Sibling — permission guard key disclosure (resolved by SCRUM-140) | Done |
| SCRUM-150 | Sibling — CSRF guard fingerprinting (resolved by SCRUM-140) | Done |

### 15. Guard Dependency Chain Verification

No guard changes. POST /auth/refresh uses no guards (cookie-based). DELETE /auth/sessions/:id uses JwtAuthGuard only.
