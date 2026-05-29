# SCRUM-152: OAuth Flow Errors Reveal Internal Mechanism Details — Backend Plan

- **Ticket**: SCRUM-152
- **Scope**: backend
- **Sprint**: 5 — Security Hardening
- **Priority**: HIGH (H-06)
- **Security references**: CWE-200, CWE-209

---

### 1. Codebase State Snapshot

- **Date**: 2026-03-09
- **Last completed ticket**: SCRUM-151 (session service idle message unified)
- **Integration state verified**: Yes
- **Branch**: main (clean)

**Files verified**:

| File | Key observations |
|------|-----------------|
| `google.strategy.ts:78` | `done(new Error('Invalid or expired OAuth state parameter'), undefined)` — hardcoded, leaks OAuth state mechanism |
| `google.strategy.ts:84` | `done(new Error('No email provided by Google'), undefined)` — hardcoded, reveals provider name (low risk) |
| `github.strategy.ts:78` | `done(new Error('Invalid or expired OAuth state parameter'))` — hardcoded, leaks OAuth state mechanism |
| `github.strategy.ts:84` | `done(new Error('No email provided by GitHub'))` — hardcoded, reveals provider name (low risk) |
| `oauth-callback.filter.ts:14-20` | **AMPLIFIER**: extracts `exception.message` from any Error/HttpException and passes it to frontend via `?error=` URL param |
| `error-messages.ts:4` | `AUTHENTICATION_FAILED: 'Authentication failed'` — already exists, can be reused |

**Constructor signatures verified**:
- `GoogleStrategy(authService: AuthService, oauthStateStore: OAuthStateStore)` — no changes needed
- `GitHubStrategy(authService: AuthService, oauthStateStore: OAuthStateStore)` — no changes needed
- `OAuthCallbackFilter` — no constructor (stateless filter)

**Methods verified to exist**:
- `GoogleStrategy.validate()` — line 62
- `GitHubStrategy.validate()` — line 65
- `OAuthCallbackFilter.catch()` — line 10

**Guard dependency chain verified**: No guard changes.

**Discrepancies with integration-state.md**: None.

### 2. Overview

The `OAuthCallbackFilter` extracts the raw `exception.message` from any thrown error and passes it to the frontend via the `?error=` query parameter. This acts as an **amplifier** — even if only one strategy throws a specific message, the filter will faithfully relay it to the client.

Two hardcoded error messages in the OAuth strategies reveal internal details:
1. `"Invalid or expired OAuth state parameter"` — reveals the CSRF-prevention mechanism (state parameter validation)
2. `"No email provided by [Google|GitHub]"` — reveals provider name (lower risk, but still non-generic)

The primary fix is to make the `OAuthCallbackFilter` always return the generic `"Authentication failed"` message to the frontend and log the actual error server-side. As defense-in-depth, the strategy error messages are also replaced with the generic constant.

### 3. Architecture Context

- **Modules involved**: AuthModule (no module config changes)
- **Affected files**: OAuthCallbackFilter, GoogleStrategy, GitHubStrategy
- **No new modules/guards/DI changes**
- **Passport callback pattern**: Strategies use `done(error, user)` — the error is a plain `Error` object (not HttpException), which Passport converts to an exception caught by the filter

### 4. Implementation Steps

#### Step 1: Fix OAuthCallbackFilter (oauth-callback.filter.ts)

**File**: `nexacore-api/src/auth/guards/oauth-callback.filter.ts`

```typescript
// BEFORE
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class OAuthCallbackFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    let message = 'Authentication failed';
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : (body as any)?.message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const encoded = encodeURIComponent(message);
    response.redirect(`${frontendUrl}/auth/callback?error=${encoded}`);
  }
}

// AFTER
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ErrorMessages } from '../../common/constants/error-messages';

@Catch()
export class OAuthCallbackFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthCallbackFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Log actual error for debugging — never expose to client
    if (exception instanceof HttpException) {
      this.logger.warn(`OAuth callback failed: ${exception.message}`);
    } else if (exception instanceof Error) {
      this.logger.warn(`OAuth callback failed: ${exception.message}`);
    } else {
      this.logger.warn('OAuth callback failed with unknown error');
    }

    // Always return generic message to frontend
    const encoded = encodeURIComponent(ErrorMessages.auth.AUTHENTICATION_FAILED);
    response.redirect(`${frontendUrl}/auth/callback?error=${encoded}`);
  }
}
```

**Rationale**: This is the primary fix. The filter was acting as an amplifier — extracting internal error details and forwarding them to the frontend. Now it always sends the generic "Authentication failed" and logs the actual error server-side for debugging.

#### Step 2: Replace hardcoded state error in GoogleStrategy (google.strategy.ts:78)

**File**: `nexacore-api/src/auth/strategies/google.strategy.ts`

```typescript
// BEFORE (line 78)
done(new Error('Invalid or expired OAuth state parameter'), undefined);

// AFTER
done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED), undefined);
```

Add import at top of file:
```typescript
import { ErrorMessages } from '../../common/constants/error-messages';
```

**Note**: `"No email provided by Google"` at line 84 is kept as-is. After the filter fix, this message never reaches the frontend. It's useful for server-side debugging and the provider name in a server log is not an information disclosure risk.

#### Step 3: Replace hardcoded state error in GitHubStrategy (github.strategy.ts:78)

**File**: `nexacore-api/src/auth/strategies/github.strategy.ts`

```typescript
// BEFORE (line 78)
done(new Error('Invalid or expired OAuth state parameter'));

// AFTER
done(new Error(ErrorMessages.auth.AUTHENTICATION_FAILED));
```

Add import at top of file:
```typescript
import { ErrorMessages } from '../../common/constants/error-messages';
```

**Note**: Same rationale — `"No email provided by GitHub"` at line 84 is kept for server-side debugging.

#### Step 4: Update GoogleStrategy test assertions (google.strategy.spec.ts)

**File**: `nexacore-api/src/auth/tests/google.strategy.spec.ts`

```typescript
// BEFORE (line 168)
expect(error.message).toBe('Invalid or expired OAuth state parameter');
// BEFORE (line 188)
expect(error.message).toBe('Invalid or expired OAuth state parameter');

// AFTER (both lines)
expect(error.message).toBe('Authentication failed');
```

#### Step 5: Update GitHubStrategy test assertions (github.strategy.spec.ts)

**File**: `nexacore-api/src/auth/tests/github.strategy.spec.ts`

```typescript
// BEFORE (line 166)
expect(error.message).toBe('Invalid or expired OAuth state parameter');
// BEFORE (line 185)
expect(error.message).toBe('Invalid or expired OAuth state parameter');

// AFTER (both lines)
expect(error.message).toBe('Authentication failed');
```

#### Step 6: Evaluate "No email" messages

**Decision**: KEEP `"No email provided by Google"` and `"No email provided by GitHub"` as-is.

**Rationale**:
- After Step 1, the OAuthCallbackFilter never passes internal messages to the frontend
- These messages are valuable for server-side debugging (knowing which provider failed to return an email)
- The provider name is already known to the user (they initiated the OAuth flow with that provider)
- The message only reaches server logs, never the client

### 5. Testing Checklist

#### Tests to UPDATE (4 assertions across 2 files):

| # | Test | File | Line | Change |
|---|------|------|------|--------|
| 1 | "should return error when state validation fails" | google.strategy.spec.ts | 168 | `'Invalid or expired OAuth state parameter'` → `'Authentication failed'` |
| 2 | "should return error when state is missing" | google.strategy.spec.ts | 188 | `'Invalid or expired OAuth state parameter'` → `'Authentication failed'` |
| 3 | "should return error when state validation fails" | github.strategy.spec.ts | 166 | `'Invalid or expired OAuth state parameter'` → `'Authentication failed'` |
| 4 | "should return error when state is missing" | github.strategy.spec.ts | 185 | `'Invalid or expired OAuth state parameter'` → `'Authentication failed'` |

#### Tests UNCHANGED:

| Test | File | Reason |
|------|------|--------|
| "should return error when no email" | google.strategy.spec.ts:130 | Message kept as-is (server-side only after filter fix) |
| "should return error when emails undefined" | google.strategy.spec.ts:149 | Same — message kept |
| "should return error when no email" | github.strategy.spec.ts:130 | Same — message kept |
| "should return error when emails undefined" | github.strategy.spec.ts:148 | Same — message kept |
| oauth-exchange.spec.ts tests | auth.service tests | Use mocked AuthService, not affected |

#### Tests to ADD (0):

No new tests needed. The OAuthCallbackFilter behavior change is covered by integration — the filter now always returns the same message regardless of input. Existing strategy tests cover the error message change.

### 6. Implementation Order

1. Step 1: Fix `OAuthCallbackFilter` — add Logger, always use generic message
2. Step 2: Replace state error in `google.strategy.ts`
3. Step 3: Replace state error in `github.strategy.ts`
4. Step 4: Update Google strategy test assertions
5. Step 5: Update GitHub strategy test assertions
6. Run `nest build` — must compile clean
7. Run `jest --maxWorkers=1 --forceExit` — all tests must pass

### 7. Error Response Format

After fix:

| Scenario | Before | After |
|----------|--------|-------|
| OAuth state validation fails | Frontend receives `"Invalid or expired OAuth state parameter"` via `?error=` | Frontend receives `"Authentication failed"` via `?error=` |
| No email from provider | Frontend receives `"No email provided by [Google\|GitHub]"` via `?error=` | Frontend receives `"Authentication failed"` via `?error=` |
| Any OAuth exception | Frontend receives raw exception message via `?error=` | Frontend receives `"Authentication failed"` via `?error=` |

### 8. Dependencies

- `ErrorMessages.auth.AUTHENTICATION_FAILED` — already exists (line 4 of error-messages.ts)
- `Logger` from `@nestjs/common` — already available
- No new dependencies

### 9. Notes

- **OAuthCallbackFilter is the amplifier**: Even if strategies used generic messages, any HttpException thrown by `authService.oauthLogin()` or `authService.exchangeOAuthCode()` would also leak through the filter. The filter fix is therefore the primary defense.
- **"No email" messages kept**: These are valuable debugging messages that, after the filter fix, only appear in server logs. Removing them would make debugging harder with no security benefit.
- **`ErrorMessages.auth.SESSION_EXPIRED` becomes unused after SCRUM-151**: Not related to this ticket, noted for awareness.
- **Audit log**: No audit changes — OAuth failures are not currently audited (separate concern).

### 10. Next Steps

After implementation:
1. Run `nest build` — must compile clean
2. Run `jest --maxWorkers=1 --forceExit` — all tests must pass
3. Proceed to `/commit`

### 11. Implementation Verification

- [ ] `OAuthCallbackFilter` always sends `ErrorMessages.auth.AUTHENTICATION_FAILED` to frontend
- [ ] `OAuthCallbackFilter` logs actual error message server-side via Logger
- [ ] `google.strategy.ts` state error uses `ErrorMessages.auth.AUTHENTICATION_FAILED`
- [ ] `github.strategy.ts` state error uses `ErrorMessages.auth.AUTHENTICATION_FAILED`
- [ ] Both strategy ErrorMessages imports added
- [ ] 4 test assertions updated (2 per strategy)
- [ ] `nest build` compiles clean
- [ ] All tests pass

### 12. Module-Level Planning

No module changes. No new providers, imports, or exports.

### 13. Satellite App Planning

No satellite app impact.

### 14. Cross-Ticket Dependency Checklist

| Ticket | Relationship | Status |
|--------|-------------|--------|
| SCRUM-140 | Parent — error message audit; did NOT cover OAuth strategies or filter | Done |
| SCRUM-149 | Sibling — SUPERADMIN messages (completed) | Done |
| SCRUM-151 | Sibling — session idle message (completed) | Done |
| SCRUM-153 | Sibling — auth controller internal mechanism details (next) | To Do |

### 15. Guard Dependency Chain Verification

No guard changes. OAuth callback endpoints use `@UseFilters(OAuthCallbackFilter)` — this is a filter, not a guard. Google/GitHub auth guards are Passport strategy guards — no modification.
