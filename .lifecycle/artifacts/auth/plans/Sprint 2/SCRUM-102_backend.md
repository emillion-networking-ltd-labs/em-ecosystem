# Backend Implementation Plan: SCRUM-102 Login Notification Emails

## Codebase State Snapshot
- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-101 (per integration-state.md)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/auth/auth.service.ts` — login() lines 160-338, generateTokensForMfa() lines 506-523, validateOAuthUser() lines 407-439, generateTokens() lines 525-561, constructor lines 97-105
  - `nexacore-api/src/mail/mail.service.ts` — 99 lines, 3 methods, Logger + MailerService injection
  - `nexacore-api/src/mail/templates/password-changed.hbs` — 66 lines, full HTML email template
  - `nexacore-api/src/sessions/sessions.service.ts` — createSession(), getActiveSessions()
  - `nexacore-api/prisma/schema.prisma` — Session model lines 71-89 (ipAddress, userAgent fields)
  - `nexacore-api/src/auth/tests/auth.service.spec.ts` — MailService mock at lines 200-205
  - `nexacore-api/src/mail/tests/mail.service.spec.ts` — 135 lines, MailerService mock pattern
- **Constructor signatures verified**: AuthService (8 deps, MailService at line 105), MailService (MailerService)
- **Guard dependency chain verified**: N/A — no guard changes

## Overview

Send a "New sign-in detected" notification email when a user logs in from a new IP address or user agent. Detection compares the current request metadata against existing active sessions. First-ever logins are excluded (nothing suspicious about the first session). The email is non-blocking (fire-and-forget) to avoid impacting login response time.

## Architecture Context

- **Modules involved**: AuthModule (already imports MailModule + SessionsModule), MailModule
- **Components affected**: MailService (new method), AuthService (detection logic in 3 locations), email template (new .hbs file)
- **No DI, module, guard, or controller changes**
- **Pattern**: Follows `sendPasswordChangeNotification()` exactly — non-blocking, error-logged, no throw

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-102-backend`
- **Steps**:
  1. `git checkout feature/SCRUM-101-backend` (latest branch)
  2. `git checkout -b feature/SCRUM-102-backend`
  3. `git branch` to verify

### Step 1: Add sendLoginNotificationEmail() to MailService

- **File**: `nexacore-api/src/mail/mail.service.ts`
- **Action**: Add new method after `sendPasswordChangeNotification()` (after line 98)
- **Signature**:
  ```typescript
  async sendLoginNotificationEmail(
    email: string,
    ipAddress: string,
    userAgent: string | null,
    firstName?: string | null,
  ): Promise<void>
  ```
- **Implementation**:
  1. Compute `frontendUrl` from env (same pattern as other methods)
  2. Parse `userAgent` into a human-readable device string (simple parsing: extract browser + OS from UA string, fallback to `'Unknown device'`)
  3. Format login time as ISO string
  4. Call `this.mailerService.sendMail()` with:
     - `to: email`
     - `subject: 'New sign-in to your EM NexaCore account'`
     - `template: 'login-notification'`
     - `context: { name, ipAddress, device, loginTime, sessionsUrl, frontendUrl, currentYear }`
  5. `sessionsUrl` = `${frontendUrl}/dashboard/security/sessions`
  6. Log success/failure following existing pattern
  7. **Do NOT throw** on failure

- **User-Agent Parsing Helper** (private method in MailService):
  ```typescript
  private parseUserAgent(ua: string | null): string
  ```
  - Simple regex-based parsing: extract browser name (Chrome, Firefox, Safari, Edge) + OS (Windows, macOS, Linux, Android, iOS)
  - Example output: `"Chrome on Windows"`, `"Safari on macOS"`, `"Firefox on Linux"`
  - Fallback: `"Unknown device"`
  - Keep it simple — no external dependency needed

### Step 2: Create login-notification.hbs Email Template

- **File**: `nexacore-api/src/mail/templates/login-notification.hbs` (new file)
- **Action**: Create Handlebars template following `password-changed.hbs` structure
- **Template context variables**:
  - `{{name}}` — firstName or email prefix
  - `{{device}}` — parsed user agent (e.g., "Chrome on Windows")
  - `{{ipAddress}}` — IP address string
  - `{{loginTime}}` — ISO formatted timestamp
  - `{{sessionsUrl}}` — link to manage sessions
  - `{{frontendUrl}}` — frontend base URL
  - `{{currentYear}}` — copyright year
- **Content structure**:
  - Headline: "New sign-in detected"
  - Body: "Hi {{name}}, we detected a new sign-in to your account."
  - Info block (table with gray background): Device: {{device}}, IP Address: {{ipAddress}}, Time: {{loginTime}}
  - CTA button: "Manage Sessions" → `{{sessionsUrl}}`
  - Warning text (red #ef4444): "If you didn't sign in, secure your account immediately."
  - Footer: copyright year

### Step 3: Add New-Device Detection to AuthService.login()

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: After `generateTokens()` call in login() (after line 322), add detection + notification logic
- **Implementation**:
  1. Query existing active sessions for this user EXCLUDING the just-created session:
     ```typescript
     const previousSessions = await this.prisma.session.findMany({
       where: {
         userId: user.id,
         isRevoked: false,
         expiresAt: { gt: new Date() },
       },
       select: { ipAddress: true, userAgent: true },
     });
     ```
  2. Skip if no previous sessions (first-ever login — nothing suspicious)
  3. Check if current IP or userAgent is new:
     ```typescript
     if (previousSessions.length > 0) {
       const knownIp = previousSessions.some(s => s.ipAddress === requestMeta.ipAddress);
       const knownUa = previousSessions.some(s => s.userAgent === (requestMeta.userAgent || null));
       if (!knownIp || !knownUa) {
         this.mailService
           .sendLoginNotificationEmail(user.email, requestMeta.ipAddress, requestMeta.userAgent || null, user.firstName)
           .catch(() => {});
       }
     }
     ```
  4. Place this AFTER the audit log block (after line 331) and BEFORE the return (line 333) to keep detection non-blocking and after the audit log

- **Notes**: Uses `this.prisma` directly (already injected at line 104) rather than SessionsService to get a lightweight query with only the fields needed. The just-created session WILL be in the results but that's fine — it will match the current IP/UA, so it doesn't affect the "new device" detection. Actually, we need to exclude it. Since generateTokens returns `sessionId`, we could use it. But simpler: query sessions created BEFORE the current one using `createdAt: { lt: new Date() }`. Even simpler: the new session has the same IP/UA as the request, so `knownIp`/`knownUa` will be true from the new session itself. This means we DON'T need to exclude it — the logic is self-correcting. Wait, that defeats the purpose. We need sessions BEFORE the current login. Use `id: { not: sessionId }` — but we don't have sessionId in login().

  **Revised approach**: Extract sessionId from generateTokens return and use it to exclude:
  ```typescript
  const { accessToken, refreshToken, sessionId } = await this.generateTokens(user, requestMeta);

  // New device detection
  const previousSessions = await this.prisma.session.findMany({
    where: {
      userId: user.id,
      id: { not: sessionId },
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    select: { ipAddress: true, userAgent: true },
  });
  ```
  This correctly excludes the just-created session.

### Step 4: Add New-Device Detection to AuthService.validateOAuthUser()

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: After `generateTokens()` in validateOAuthUser() (after line 422), add same detection logic
- **Implementation**: Same pattern as Step 3, using the sessionId from generateTokens return. Place after audit log (line 432) and before return (line 434).

### Step 5: Add New-Device Detection to AuthService.generateTokensForMfa()

- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: After `generateTokens()` in generateTokensForMfa() (after line 517), add same detection logic
- **Implementation**: Same pattern as Step 3. This covers the MFA post-verification login path.
- **Notes**: To avoid code duplication across 3 locations, extract a private helper method:
  ```typescript
  private async notifyIfNewDevice(
    user: { id: string; email: string; firstName: string | null },
    sessionId: string,
    requestMeta: { ipAddress: string; userAgent?: string | null },
  ): Promise<void>
  ```
  This method encapsulates the session query + comparison + mail send logic. Called from login(), validateOAuthUser(), and generateTokensForMfa() with `.catch(() => {})`.

### Step 6: Add MailService Tests

- **File**: `nexacore-api/src/mail/tests/mail.service.spec.ts`
- **Action**: Add test describe block for `sendLoginNotificationEmail`
- **Tests** (4):
  1. `should send login notification email with correct parameters` — verify to, subject, template, context
  2. `should use email prefix as name when firstName is null` — verify name fallback
  3. `should not throw when mailer fails` — verify resilience
  4. `should parse user agent into device string` — verify UA parsing produces readable output

### Step 7: Add AuthService Tests

- **File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`
- **Action**: Add `sendLoginNotificationEmail` to the MailService mock (line 203), add session mock to PrismaService, add test cases
- **Mock updates**:
  - MailService mock: add `sendLoginNotificationEmail: jest.fn().mockResolvedValue(undefined)`
  - PrismaService mock: add `session: { findMany: jest.fn().mockResolvedValue([]) }`
- **Tests** (5):
  1. `should send login notification when IP is new` — mock findMany returning sessions with different IP, verify mailService.sendLoginNotificationEmail called
  2. `should send login notification when userAgent is new` — mock findMany returning sessions with different UA
  3. `should NOT send notification on first-ever login` — mock findMany returning empty array (no previous sessions)
  4. `should NOT send notification when IP and UA are known` — mock findMany returning sessions matching current IP+UA
  5. `should not fail login when notification email fails` — mock sendLoginNotificationEmail rejecting, verify login still returns tokens

### Step 8: Update integration-state.md

- **File**: `ai-specs/ai-specs/specs/integration-state.md`
- **Action**: Update header + changelog
- **Implementation**:
  1. Update header: "Last update: SCRUM-102 (2026-03-02)"
  2. Add changelog entry:
     ```
     | 2026-03-02 | SCRUM-102 | Login notification emails: sendLoginNotificationEmail() added to MailService with login-notification.hbs template. New-device detection (IP/UA comparison against existing sessions) added to AuthService.login(), validateOAuthUser(), and generateTokensForMfa() via private notifyIfNewDevice() helper. First-ever login excluded. Non-blocking fire-and-forget pattern. No DI or module changes. ~9 new tests. |
     ```

### Step 9: Verify Implementation

- **Action**: Build, test, and verify
- **Steps**:
  1. `cd nexacore-api && npx nest build` — must compile clean
  2. `npx jest --maxWorkers=1 --forceExit` — all tests must pass
  3. Verify test count increased by ~9 (from 478)
  4. Verify the app still starts in dev mode

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add sendLoginNotificationEmail() to MailService
3. Step 2: Create login-notification.hbs template
4. Step 3: Add detection to login() (extract notifyIfNewDevice helper)
5. Step 4: Add detection to validateOAuthUser()
6. Step 5: Add detection to generateTokensForMfa()
7. Step 6: Add MailService tests
8. Step 7: Add AuthService tests
9. Step 8: Update integration-state.md
10. Step 9: Verify (build + test)

## Testing Checklist

- [ ] Email sent on new IP (email/password login)
- [ ] Email sent on new userAgent (email/password login)
- [ ] Email sent on new device (OAuth login)
- [ ] Email sent on new device (post-MFA login)
- [ ] Email NOT sent on first-ever login (no previous sessions)
- [ ] Email NOT sent when IP+UA are both known
- [ ] Email failure does not fail login flow
- [ ] MailService method sends correct parameters
- [ ] UA parsing produces readable device string
- [ ] All existing 478 tests still pass
- [ ] `nest build` compiles clean

## Error Response Format

No HTTP error responses — login notification is purely a side effect. If email sending fails, it is silently logged and the login response is unaffected.

## Dependencies

- No new packages needed
- No DI, module, or constructor changes
- Uses existing MailService, PrismaService, MailerService, HandlebarsAdapter

## Notes

- **Fire-and-forget pattern**: `this.notifyIfNewDevice(...).catch(() => {})` — consistent with audit logging pattern
- **User-Agent parsing**: Simple regex extraction, no external library (ua-parser-js would be overkill for "Browser on OS" format)
- **Session query efficiency**: Uses `select: { ipAddress: true, userAgent: true }` to fetch only needed fields. Query is on indexed field `userId` + `isRevoked`.
- **DRY**: notifyIfNewDevice() private helper avoids triplicating the detection logic across login/OAuth/MFA flows
- **First login exclusion**: If previousSessions is empty (length 0), skip notification — the first login is expected, not suspicious
- **The just-created session is excluded** by filtering `id: { not: sessionId }` to prevent false negatives

## Implementation Verification

- [ ] **Code Quality**: Single helper method, no code duplication, follows existing patterns
- [ ] **Functionality**: New device detection works for email, OAuth, and MFA logins
- [ ] **Testing**: ~9 new tests (4 mail + 5 auth) covering all branches
- [ ] **Integration**: `nest build` + `nest start` clean in dev mode
- [ ] **Documentation**: integration-state.md updated
