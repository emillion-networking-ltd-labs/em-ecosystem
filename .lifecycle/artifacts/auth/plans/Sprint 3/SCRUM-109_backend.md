# Backend Implementation Plan: SCRUM-109 Suspicious Login Detection + Alerting

## Codebase State Snapshot

- **Date**: 2026-03-03
- **Last completed ticket**: SCRUM-108 (IP Geolocation + Impossible Travel Detection)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/security/security.module.ts` — minimal module, only CsrfGuard as APP_GUARD
  - `src/audit/audit.service.ts` — 3 methods (log, findAll, findById), no time-window queries
  - `src/audit/enums/audit-action.enum.ts` — 28 values, last added: IMPOSSIBLE_TRAVEL_DETECTED, LOGIN_BLOCKED_TRAVEL
  - `src/auth/auth.service.ts` — 11 deps, checkImpossibleTravel() at lines 710-731, handleTravelBlock() at lines 733-756
  - `src/mail/mail.service.ts` — 9 public methods, sendImpossibleTravelAlert() as most recent addition
  - `src/sessions/sessions.service.ts` — 3 deps (PrismaService, AuditService, GeolocationService)
  - `src/users/users.service.ts` — findAll() supports role filter
  - `prisma/schema.prisma` — AuditLog model with @@index on [action], [userId], [createdAt]; Session model with locationCountry field
- **Constructor signatures verified**:
  - `AuthService(UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService, TrustedDeviceService, ImpossibleTravelService)` — 10 params (11th will be SuspiciousLoginService)
  - `AuditService(PrismaService)` — 1 param
  - `MailService(MailerService)` — 1 param
  - `SecurityModule` — no imports, only APP_GUARD provider
  - `SessionsService(PrismaService, AuditService, GeolocationService)` — 3 params
- **Guard dependency chain verified**: No new controllers or guards in this ticket (backend-only internal service)

## Overview

Implement a `SuspiciousLoginService` that analyzes audit log patterns in real-time (at login time) and triggers alerts for 4 types of suspicious activity: brute-force attacks, credential stuffing, unusual login hours, and logins from new countries. The service follows the same fail-open, fire-and-forget pattern established by `ImpossibleTravelService` (SCRUM-108). No new REST endpoints — detection is an internal side effect integrated into the existing auth flow.

## Architecture Context

- **Modules involved**: SecurityModule (hosts SuspiciousLoginService), AuditModule (time-window queries), MailModule (alert emails), UsersModule (admin user queries), AuthModule (integration point)
- **Components affected**: SuspiciousLoginService (new), AuditService (extended), MailService (extended), AuthService (extended), SecurityModule (expanded)
- **No new controllers, DTOs, or guards** — purely internal detection service
- **Key pattern**: Mirrors ImpossibleTravelService architecture — detection at login time, fail-open, fire-and-forget audit + email

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch
- **Branch Naming**: `feature/SCRUM-109-backend`
- **Implementation Steps**:
  1. Ensure on latest `main` branch: `git checkout main && git pull origin main`
  2. Create new branch: `git checkout -b feature/SCRUM-109-backend`
  3. Verify branch creation: `git branch`
- **Notes**: SCRUM-108 must be fully committed (verified: commit `abde3c0` on `feature/SCRUM-108-backend`). Start from `main` which should include SCRUM-108 changes once merged. If SCRUM-108 is not yet merged to main, branch from `feature/SCRUM-108-backend` instead.

### Step 1: Add AuditAction Enum Values

- **Files**: `prisma/schema.prisma`, `src/audit/enums/audit-action.enum.ts`
- **Action**: Add 4 new enum values for suspicious login detection events
- **Implementation Steps**:
  1. In `prisma/schema.prisma`, add to the `AuditAction` enum (after `LOGIN_BLOCKED_TRAVEL`):
     - `BRUTE_FORCE_DETECTED`
     - `CREDENTIAL_STUFFING_DETECTED`
     - `UNUSUAL_LOGIN_HOURS`
     - `NEW_COUNTRY_LOGIN`
  2. In `src/audit/enums/audit-action.enum.ts`, add the same 4 values to the TypeScript enum
  3. Run `npx prisma generate` to regenerate the Prisma client
- **Dependencies**: None
- **Implementation Notes**: The Prisma enum and TypeScript enum must stay in sync. No migration needed — enum values in Prisma are stored as strings.

### Step 2: Add AuditService Time-Window Query Methods

- **File**: `src/audit/audit.service.ts`
- **Action**: Add two new query methods for efficient time-window counting
- **Function Signatures**:
  ```typescript
  async countRecentActions(params: {
    action: AuditAction;
    userId: string;
    windowMinutes: number;
  }): Promise<number>

  async countRecentActionsByIp(params: {
    action: AuditAction;
    ipAddress: string;
    windowMinutes: number;
  }): Promise<number>
  ```
- **Implementation Steps**:
  1. `countRecentActions()`:
     - Calculate `sinceDate = new Date(Date.now() - windowMinutes * 60 * 1000)`
     - Use `this.prisma.auditLog.count({ where: { action, userId, createdAt: { gte: sinceDate } } })`
     - Return the count
  2. `countRecentActionsByIp()`:
     - Same pattern but filter by `ipAddress` instead of `userId`
     - Use `this.prisma.auditLog.count({ where: { action, ipAddress, createdAt: { gte: sinceDate } } })`
     - Return the count
  3. Add one more method for de-duplication:
     ```typescript
     async hasRecentAction(params: {
       action: AuditAction;
       userId?: string;
       ipAddress?: string;
       windowMinutes: number;
     }): Promise<boolean>
     ```
     - Uses `findFirst` with the same time-window filter
     - Returns `true` if an entry exists (for alert de-duplication)
  4. Add a method for querying distinct countries from sessions:
     - This is NOT in AuditService — it will be a direct Prisma query in SuspiciousLoginService
- **Dependencies**: AuditAction enum (Step 1)
- **Implementation Notes**: The existing @@index on [action], [userId], [createdAt] covers the `countRecentActions` query efficiently. For `countRecentActionsByIp`, the [action] index plus ipAddress filter should be adequate for now. Consider a composite index `@@index([action, ipAddress, createdAt])` if performance degrades.

### Step 3: Add Prisma Composite Index for Time-Window Queries

- **File**: `prisma/schema.prisma`
- **Action**: Add a composite index to optimize the most frequent queries
- **Implementation Steps**:
  1. Add to the `AuditLog` model:
     ```prisma
     @@index([action, userId, createdAt])
     ```
  2. Run `npx prisma generate`
- **Implementation Notes**: This composite index optimizes the `countRecentActions()` query which is called on every login. The existing single-column indexes on [action], [userId], [createdAt] remain useful for other queries.

### Step 4: Create Suspicious Login Constants

- **File**: `src/security/constants/suspicious-login.constants.ts` (NEW)
- **Action**: Define configurable thresholds as constants with environment variable overrides
- **Implementation Steps**:
  1. Create the file with the following constants:
     ```typescript
     export const BRUTE_FORCE_WINDOW_MINUTES = parseInt(
       process.env.BRUTE_FORCE_WINDOW_MINUTES || '15',
       10,
     );
     export const BRUTE_FORCE_THRESHOLD = parseInt(
       process.env.BRUTE_FORCE_THRESHOLD || '10',
       10,
     );
     export const CREDENTIAL_STUFFING_THRESHOLD = parseInt(
       process.env.CREDENTIAL_STUFFING_THRESHOLD || '20',
       10,
     );
     export const UNUSUAL_HOURS_SAMPLE_SIZE = parseInt(
       process.env.UNUSUAL_HOURS_SAMPLE_SIZE || '20',
       10,
     );
     export const UNUSUAL_HOURS_STDDEV_THRESHOLD = parseInt(
       process.env.UNUSUAL_HOURS_STDDEV_THRESHOLD || '3',
       10,
     );
     export const UNUSUAL_HOURS_MIN_LOGINS = 5;
     ```
  2. Export all constants
- **Dependencies**: None
- **Implementation Notes**: Follow the same pattern as `src/geolocation/constants/geolocation.constants.ts` and `src/auth/constants/auth.constants.ts`. Use `parseInt` with defaults for env var overrides.

### Step 5: Create SuspiciousLoginService

- **File**: `src/security/suspicious-login.service.ts` (NEW)
- **Action**: Create the main detection service with 4 detection methods
- **Constructor Signature**:
  ```typescript
  @Injectable()
  export class SuspiciousLoginService {
    constructor(
      private readonly auditService: AuditService,
      private readonly mailService: MailService,
      private readonly prisma: PrismaService,
      private readonly usersService: UsersService,
    ) {}
  }
  ```
- **Implementation Steps**:
  1. **`async checkBruteForce(params: { userId: string; ipAddress: string; userAgent?: string | null }): Promise<void>`**
     - Count recent LOGIN_FAILURE for `userId` within `BRUTE_FORCE_WINDOW_MINUTES`
     - If count >= `BRUTE_FORCE_THRESHOLD`:
       - Check de-duplication: `hasRecentAction({ action: BRUTE_FORCE_DETECTED, userId, windowMinutes: BRUTE_FORCE_WINDOW_MINUTES })`
       - If no existing alert: fire `BRUTE_FORCE_DETECTED` audit event with metadata `{ failureCount, windowMinutes, ipAddress }`
       - Send admin alert email via `sendSecurityAlertToAdmins('BRUTE_FORCE', { userId, ipAddress, failureCount })`
     - Wrap entire method in try/catch → log error, never throw (fail-open)

  2. **`async checkCredentialStuffing(params: { ipAddress: string; userAgent?: string | null }): Promise<void>`**
     - Count recent LOGIN_FAILURE for `ipAddress` (any user) within `BRUTE_FORCE_WINDOW_MINUTES`
     - If count >= `CREDENTIAL_STUFFING_THRESHOLD`:
       - Check de-duplication: `hasRecentAction({ action: CREDENTIAL_STUFFING_DETECTED, ipAddress, windowMinutes: BRUTE_FORCE_WINDOW_MINUTES })`
       - If no existing alert: fire `CREDENTIAL_STUFFING_DETECTED` audit event with metadata `{ failureCount, windowMinutes, ipAddress }`
       - Send admin alert email via `sendSecurityAlertToAdmins('CREDENTIAL_STUFFING', { ipAddress, failureCount })`
     - Wrap in try/catch (fail-open)

  3. **`async checkUnusualLoginHours(params: { userId: string; loginTime: Date }): Promise<void>`**
     - Query last N successful logins: `this.prisma.auditLog.findMany({ where: { action: LOGIN_SUCCESS, userId }, orderBy: { createdAt: 'desc' }, take: UNUSUAL_HOURS_SAMPLE_SIZE })`
     - If fewer than `UNUSUAL_HOURS_MIN_LOGINS` results → return (insufficient data)
     - Extract hours from each login's `createdAt`
     - Calculate mean and standard deviation of login hours
     - **Circular hour handling**: Use circular statistics (convert hours to radians, compute mean direction) to correctly handle midnight crossings (e.g., 23:00 and 01:00 should be close, not 22 hours apart)
     - If current login hour deviates more than `UNUSUAL_HOURS_STDDEV_THRESHOLD` stddevs from the mean → fire `UNUSUAL_LOGIN_HOURS` audit event with metadata `{ loginHour, meanHour, stdDev }`
     - **No email** — purely informational audit event
     - Wrap in try/catch (fail-open)

  4. **`async checkNewCountryLogin(params: { userId: string; email: string; firstName?: string | null; currentCountry: string | null; ipAddress: string; userAgent?: string | null }): Promise<void>`**
     - If `currentCountry` is null → return (no geo data available)
     - Query distinct countries: `this.prisma.session.findMany({ where: { userId, locationCountry: { not: null } }, distinct: ['locationCountry'], select: { locationCountry: true } })`
     - Extract country codes into a Set
     - If current country is NOT in the Set AND Set is not empty (skip for first-ever login with geo data):
       - Fire `NEW_COUNTRY_LOGIN` audit event with metadata `{ newCountry: currentCountry, previousCountries: [...countries], ipAddress }`
       - Send user alert email via `sendNewCountryLoginAlert(email, { firstName, newCountry, previousCountries, ipAddress, userAgent })`
     - Wrap in try/catch (fail-open)

  5. **Public orchestrator method: `async analyzeLoginFailure(params: { userId: string; ipAddress: string; userAgent?: string | null }): Promise<void>`**
     - Calls `checkBruteForce()` and `checkCredentialStuffing()` in parallel via `Promise.all()`
     - Both calls are fire-and-forget (each already has internal try/catch)
     - Called after each LOGIN_FAILURE event

  6. **Public orchestrator method: `async analyzeLoginSuccess(params: { userId: string; email: string; firstName?: string | null; ipAddress: string; userAgent?: string | null; currentCountry: string | null; loginTime: Date }): Promise<void>`**
     - Calls `checkUnusualLoginHours()` and `checkNewCountryLogin()` in parallel via `Promise.all()`
     - Both calls are fire-and-forget (each already has internal try/catch)
     - Called after each LOGIN_SUCCESS event

- **Dependencies**: AuditService, MailService, PrismaService, UsersService, constants from Step 4
- **Implementation Notes**:
  - **Fail-open**: Every detection method wraps its logic in try/catch and logs errors silently
  - **Fire-and-forget**: Orchestrator methods return immediately; internal audit + email calls use `.catch(() => {})` where needed
  - **De-duplication**: Always check `hasRecentAction()` before firing an alert to prevent alert storms
  - **Circular statistics for hours**: Standard deviation of hours near midnight (e.g., 23, 0, 1) requires converting to radians. Use: `meanAngle = atan2(mean(sin(hours * π/12)), mean(cos(hours * π/12)))`, then convert back to hours. Angular deviation uses the same circular approach.

### Step 6: Add MailService Methods + Templates

- **Files**: `src/mail/mail.service.ts`, `src/mail/templates/security-alert-admin.hbs` (NEW), `src/mail/templates/new-country-login-alert.hbs` (NEW)
- **Action**: Add 2 new public methods and 2 new HBS templates

#### 6a: `sendSecurityAlertToAdmins()`

- **Function Signature**:
  ```typescript
  async sendSecurityAlertToAdmins(
    alertType: string,
    details: {
      userId?: string;
      userEmail?: string;
      ipAddress: string;
      location?: string;
      failureCount?: number;
      timestamp: Date;
    },
    adminEmails: string[],
  ): Promise<void>
  ```
- **Implementation Steps**:
  1. For each admin email, send email using `this.mailerService.sendMail()` with:
     - `to`: admin email
     - `subject`: `[Security Alert] ${alertType} detected — EM NexaCore`
     - `template`: `'security-alert-admin'`
     - `context`: `{ alertType, ...details, timestamp formatted, currentYear }`
  2. Wrap in try/catch — log error, never throw
- **Template** (`security-alert-admin.hbs`):
  - Header: Red warning banner with alert type
  - Details table: Alert type, affected user (email), IP address, location (if available), failure count (if applicable), timestamp
  - Recommended actions section (review audit logs, check user sessions)
  - CTA button: "Review Audit Logs"
  - Footer: standard EM NexaCore footer
  - Follow the same HTML/CSS pattern as `impossible-travel-alert.hbs`

#### 6b: `sendNewCountryLoginAlert()`

- **Function Signature**:
  ```typescript
  async sendNewCountryLoginAlert(
    email: string,
    params: {
      firstName?: string | null;
      newCountry: string;
      previousCountries: string[];
      ipAddress: string;
      userAgent?: string | null;
    },
  ): Promise<void>
  ```
- **Implementation Steps**:
  1. Parse user agent with existing `parseUserAgent()` helper
  2. Send email using `this.mailerService.sendMail()` with:
     - `to`: email
     - `subject`: `New login location detected — EM NexaCore`
     - `template`: `'new-country-login-alert'`
     - `context`: `{ name: firstName || email.split('@')[0], newCountry, previousCountries: previousCountries.join(', '), device, ipAddress, sessionsUrl, frontendUrl, currentYear }`
  3. Wrap in try/catch — log error, never throw
- **Template** (`new-country-login-alert.hbs`):
  - Header: "Login from a new location"
  - Body: "We noticed a login to your account from {{newCountry}}, a country you haven't logged in from before."
  - Details table: New country, previous countries, device, IP address
  - CTA button: "Review Active Sessions"
  - Footer: standard EM NexaCore footer
  - Follow the same HTML/CSS pattern as `impossible-travel-alert.hbs`

- **Implementation Notes**: The `adminEmails` parameter is passed by the caller (SuspiciousLoginService) which queries UsersService for ADMIN/SUPERADMIN users. This keeps MailService stateless (no UsersService dependency).

### Step 7: Update SecurityModule

- **File**: `src/security/security.module.ts`
- **Action**: Register SuspiciousLoginService and add required module imports
- **Implementation Steps**:
  1. Add imports: `AuditModule`, `MailModule`, `UsersModule`
  2. Add `SuspiciousLoginService` to `providers` array (alongside existing APP_GUARD)
  3. Add `SuspiciousLoginService` to `exports` array (so AuthModule can inject it)
  4. Final module structure:
     ```typescript
     @Module({
       imports: [AuditModule, MailModule, UsersModule],
       providers: [
         {
           provide: APP_GUARD,
           useClass: CsrfGuard,
         },
         SuspiciousLoginService,
       ],
       exports: [SuspiciousLoginService],
     })
     export class SecurityModule {}
     ```
- **Dependencies**: AuditModule, MailModule, UsersModule must be importable
- **Implementation Notes**: SecurityModule is NOT @Global, so AuthModule will need to import it. However, since SecurityModule is already imported by AppModule (for CsrfGuard APP_GUARD), and its exports are only available to importing modules, AuthModule must add SecurityModule to its imports array.

### Step 8: Integrate SuspiciousLoginService into AuthService

- **File**: `src/auth/auth.service.ts`
- **Action**: Inject SuspiciousLoginService and add detection calls at login failure and success points
- **Implementation Steps**:
  1. Add constructor parameter: `private readonly suspiciousLoginService: SuspiciousLoginService` (12th dependency)
  2. Add import for SuspiciousLoginService

  3. **After LOGIN_FAILURE audit logging** — add `analyzeLoginFailure()` call:
     - Locate the existing `this.auditService.log({ action: AuditAction.LOGIN_FAILURE, ... })` calls in `login()` method
     - After each LOGIN_FAILURE audit log, add (fire-and-forget):
       ```typescript
       this.suspiciousLoginService.analyzeLoginFailure({
         userId: user.id,
         ipAddress: requestMeta.ipAddress,
         userAgent: requestMeta.userAgent,
       }).catch(() => {});
       ```
     - There are multiple failure points in `login()`:
       - Invalid password (after lockout check)
       - MFA verification failure (in `generateTokensForMfa`)
     - Add to all LOGIN_FAILURE points

  4. **After LOGIN_SUCCESS / successful token generation** — add `analyzeLoginSuccess()` call:
     - Create a private helper method:
       ```typescript
       private checkSuspiciousPatterns(
         user: { id: string; email: string; firstName?: string | null },
         requestMeta: { ipAddress: string; userAgent?: string | null },
         session?: { locationCountry?: string | null },
       ): void {
         this.suspiciousLoginService.analyzeLoginSuccess({
           userId: user.id,
           email: user.email,
           firstName: user.firstName,
           ipAddress: requestMeta.ipAddress,
           userAgent: requestMeta.userAgent,
           currentCountry: session?.locationCountry ?? null,
           loginTime: new Date(),
         }).catch(() => {});
       }
       ```
     - Call `checkSuspiciousPatterns()` at the same integration points as `checkImpossibleTravel()`:
       - After trusted device MFA skip (login success path)
       - After normal login (no MFA required)
       - After `validateOAuthUser()` success
       - After `generateTokensForMfa()` success
     - The country comes from the session that was just created (SessionsService populates locationCountry via GeolocationService). To access it, either:
       - a) Query the session after creation: `const session = await this.sessionsService.findLatestByUserId(user.id)` — requires adding a method
       - b) Perform the geolocation lookup inline: `const geo = this.geolocationService?.lookupIp(requestMeta.ipAddress)` — simpler
       - **Recommended**: Use approach (b) — inject GeolocationService (already @Global) and do a quick lookup for the country code. This avoids an extra DB query.
     - **Alternative (simpler)**: Since `generateTokens()` calls `sessionsService.createSession()` which already does the geo lookup internally, and we can't easily access the session's country from AuthService without an extra query, we can pass `null` for country and let the SuspiciousLoginService query the session table directly (it already does this in `checkNewCountryLogin` via `this.prisma.session.findMany`). The newly created session will already have the country populated by the time the async `checkNewCountryLogin` runs.
     - **Final decision**: Do NOT inject GeolocationService into AuthService. Pass `null` for `currentCountry` in the `checkSuspiciousPatterns()` call. Instead, modify `checkNewCountryLogin()` in SuspiciousLoginService to query the LATEST session for the user to get the current country. This keeps AuthService's dependency count manageable and avoids duplicate geo lookups.

  5. **Revised `checkNewCountryLogin()` approach**:
     - Query the latest session: `this.prisma.session.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })`
     - Use `session.locationCountry` as the current country
     - Query previous distinct countries excluding the latest session
     - This is self-contained within SuspiciousLoginService

  6. **Revised `checkSuspiciousPatterns()` helper**:
     ```typescript
     private checkSuspiciousPatterns(
       user: { id: string; email: string; firstName?: string | null },
       requestMeta: { ipAddress: string; userAgent?: string | null },
     ): void {
       this.suspiciousLoginService.analyzeLoginSuccess({
         userId: user.id,
         email: user.email,
         firstName: user.firstName ?? null,
         ipAddress: requestMeta.ipAddress,
         userAgent: requestMeta.userAgent ?? null,
         loginTime: new Date(),
       }).catch(() => {});
     }
     ```
     - No `currentCountry` parameter — SuspiciousLoginService queries it internally

- **Dependencies**: SuspiciousLoginService (from SecurityModule)
- **Implementation Notes**:
  - AuthModule must import SecurityModule to access SuspiciousLoginService
  - Fail-open: `.catch(() => {})` on all calls ensures login is never blocked
  - Fire-and-forget: calls are non-blocking (no `await`)

### Step 9: Update AuthModule Imports

- **File**: `src/auth/auth.module.ts`
- **Action**: Import SecurityModule to make SuspiciousLoginService available for injection into AuthService
- **Implementation Steps**:
  1. Add `SecurityModule` to the `imports` array of AuthModule
  2. Add the import statement: `import { SecurityModule } from '../security/security.module';`
- **Implementation Notes**: SecurityModule imports UsersModule. AuthModule already uses `forwardRef(() => UsersModule)`. There should be no circular dependency since SecurityModule does not import AuthModule. Verify during build.

### Step 10: Admin Email Query in SuspiciousLoginService

- **Action**: In `SuspiciousLoginService`, implement the admin email fetching logic
- **Implementation Steps**:
  1. Add a private helper method:
     ```typescript
     private async getAdminEmails(): Promise<string[]> {
       const admins = await this.prisma.user.findMany({
         where: {
           role: { in: ['ADMIN', 'SUPERADMIN'] },
           isActive: true,
         },
         select: { email: true },
       });
       return admins.map(a => a.email);
     }
     ```
  2. Call `getAdminEmails()` inside `checkBruteForce()` and `checkCredentialStuffing()` before sending admin alerts
  3. Pass the emails array to `mailService.sendSecurityAlertToAdmins()`
- **Implementation Notes**: Use `PrismaService` directly instead of `UsersService.findAll()` to avoid the overhead of pagination and SafeUser transformation. We only need email addresses. This also removes the need to inject UsersService — simplifying the dependency chain.
- **Revised constructor** (removing UsersService dependency):
  ```typescript
  constructor(
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}
  ```

### Step 11: Write Unit Tests for SuspiciousLoginService

- **File**: `src/security/tests/suspicious-login.service.spec.ts` (NEW)
- **Action**: Comprehensive unit tests covering all 4 detection methods + orchestrators
- **Implementation Steps**:
  1. **Setup**: Mock `AuditService`, `MailService`, `PrismaService`
  2. **Brute-Force Detection tests** (~6 tests):
     - Should not alert when failure count is below threshold
     - Should fire BRUTE_FORCE_DETECTED audit + admin email when threshold exceeded
     - Should de-duplicate: no alert if BRUTE_FORCE_DETECTED already exists in window
     - Should not throw on internal error (fail-open)
     - Should use configurable window and threshold
     - Should call getAdminEmails() to fetch admin recipients
  3. **Credential Stuffing Detection tests** (~5 tests):
     - Should not alert when failure count from IP is below threshold
     - Should fire CREDENTIAL_STUFFING_DETECTED audit + admin email when threshold exceeded
     - Should de-duplicate alerts
     - Should not throw on internal error (fail-open)
     - Should query by IP address (not userId)
  4. **Unusual Login Hours Detection tests** (~6 tests):
     - Should skip when user has fewer than 5 logins (insufficient data)
     - Should not flag when login is within normal hours
     - Should fire UNUSUAL_LOGIN_HOURS when login is >3 stddev from mean
     - Should handle circular hours correctly (e.g., logins around midnight)
     - Should not send email (audit only)
     - Should not throw on internal error (fail-open)
  5. **New Country Login Detection tests** (~6 tests):
     - Should not alert when country is null (no geo data)
     - Should not alert when country has been seen before
     - Should fire NEW_COUNTRY_LOGIN audit + user email when country is new
     - Should skip for first-ever login (no previous sessions with country data)
     - Should query distinct countries from sessions table
     - Should not throw on internal error (fail-open)
  6. **Orchestrator tests** (~4 tests):
     - `analyzeLoginFailure()` calls both `checkBruteForce()` and `checkCredentialStuffing()`
     - `analyzeLoginSuccess()` calls both `checkUnusualLoginHours()` and `checkNewCountryLogin()`
     - Orchestrators do not throw even if sub-checks fail
     - All calls are parallel (verify with spy timing)
  7. **Admin email query tests** (~2 tests):
     - Should fetch active ADMIN and SUPERADMIN emails
     - Should return empty array when no admins exist (no email sent)

- **Target**: ~29 tests, >90% coverage on new code

### Step 12: Update Existing Test Files

- **Files**: `src/auth/tests/auth.service.spec.ts`, `src/audit/tests/audit.service.spec.ts`, `src/mail/tests/mail.service.spec.ts`
- **Action**: Add mocks for new dependencies and tests for new methods

#### 12a: `auth.service.spec.ts`
- Add `SuspiciousLoginService` mock to providers:
  ```typescript
  {
    provide: SuspiciousLoginService,
    useValue: {
      analyzeLoginFailure: jest.fn().mockResolvedValue(undefined),
      analyzeLoginSuccess: jest.fn().mockResolvedValue(undefined),
    },
  }
  ```
- Add import for SuspiciousLoginService
- Add variable: `let suspiciousLoginService: jest.Mocked<SuspiciousLoginService>;`
- Add assignment in `beforeEach`: `suspiciousLoginService = module.get(SuspiciousLoginService);`
- Add tests (~4 tests):
  - Should call `analyzeLoginFailure()` after failed login
  - Should call `analyzeLoginSuccess()` after successful login
  - Should call `analyzeLoginSuccess()` after OAuth login
  - Should not block login when suspicious pattern check throws (fail-open)
- Update `createServiceWithExpiry` helper if it exists (same mock pattern)

#### 12b: `audit.service.spec.ts`
- Add tests for new methods (~4 tests):
  - `countRecentActions()` should count entries within time window
  - `countRecentActionsByIp()` should count entries by IP within time window
  - `hasRecentAction()` should return true when matching entry exists
  - `hasRecentAction()` should return false when no matching entry

#### 12c: `mail.service.spec.ts`
- Add tests for new methods (~4 tests):
  - `sendSecurityAlertToAdmins()` should send email to each admin
  - `sendSecurityAlertToAdmins()` should not throw on SMTP error
  - `sendNewCountryLoginAlert()` should send with correct params
  - `sendNewCountryLoginAlert()` should not throw on SMTP error

### Step 13: Build and Verify

- **Action**: Run full build and test suite
- **Implementation Steps**:
  1. `npx prisma generate` — regenerate client with new enum values
  2. `npx nest build` — must compile with zero errors
  3. `npx jest --coverage` — all tests must pass, 90%+ coverage on new code
  4. Fix any compilation or test failures
  5. Verify no regressions in existing tests

### Step 14: Update Technical Documentation

- **Action**: Update integration-state.md, data-model.md, and .env.example
- **Implementation Steps**:
  1. **`ai-specs/specs/integration-state.md`**:
     - Update "Last update" header to SCRUM-109
     - SecurityModule row: add imports (AuditModule, MailModule), add provider (SuspiciousLoginService), add export (SuspiciousLoginService)
     - AuthModule row: add SecurityModule to imports
     - Add AuthService dependency: `SuspiciousLoginService`
     - Add new chain: `SuspiciousLoginService → AuditService, MailService, PrismaService`
     - Add SuspiciousLoginService to test mock requirements for AuthService
     - Add SCRUM-109 changelog entry
  2. **`ai-specs/specs/data-model.md`**:
     - Add 4 new AuditAction values to enum table and Prisma enum section
     - Add composite index note to AuditLog model
  3. **`.env.example`** (if it exists):
     - Add the 6 new environment variables with their defaults

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add AuditAction enum values (Prisma + TypeScript)
3. Step 2: Add AuditService time-window query methods
4. Step 3: Add Prisma composite index
5. Step 4: Create suspicious login constants
6. Step 5: Create SuspiciousLoginService
7. Step 6: Add MailService methods + HBS templates
8. Step 7: Update SecurityModule (imports, providers, exports)
9. Step 8: Integrate into AuthService
10. Step 9: Update AuthModule imports
11. Step 10: Admin email query (part of Step 5 implementation)
12. Step 11: Write unit tests for SuspiciousLoginService
13. Step 12: Update existing test files
14. Step 13: Build and verify
15. Step 14: Update technical documentation

## Testing Checklist

- [ ] `nest build` compiles successfully
- [ ] All existing 631+ tests pass
- [ ] New SuspiciousLoginService tests: ~29 tests, all passing
- [ ] Updated auth.service.spec.ts: +4 new tests
- [ ] Updated audit.service.spec.ts: +4 new tests
- [ ] Updated mail.service.spec.ts: +4 new tests
- [ ] Total new tests: ~41
- [ ] Coverage on new code: >90% statements, branches, functions, lines
- [ ] No regressions in overall coverage thresholds
- [ ] Manual verification scenarios:
  - [ ] Simulate 10+ failed logins → BRUTE_FORCE_DETECTED audit event created
  - [ ] Simulate 20+ failed logins from same IP → CREDENTIAL_STUFFING_DETECTED audit event created
  - [ ] Login at unusual hour → UNUSUAL_LOGIN_HOURS audit event (verify with test data)
  - [ ] Login from new country → NEW_COUNTRY_LOGIN audit + user email
  - [ ] Duplicate alerts suppressed within window
  - [ ] Detection failure does not block login

## Error Response Format

No new HTTP error responses — this is an internal detection service. All errors are silently caught (fail-open pattern). The only user-visible effect is audit log entries and email alerts. No login is ever blocked by this service.

## Dependencies

- **No new npm packages required**
- **Internal dependencies**:
  - AuditService (extended with 3 new methods)
  - MailService (extended with 2 new methods)
  - PrismaService (direct queries for admin emails, sessions, audit logs)
  - GeolocationService (indirectly — Session.locationCountry populated by SCRUM-108)
- **SCRUM-108**: Must be complete (verified: ✅)

## Notes

- **Fail-open is non-negotiable**: Every detection method has internal try/catch. The orchestrator methods also have safety catches. Login must NEVER be blocked by this service.
- **Fire-and-forget**: All audit logging and email sending are non-blocking. Use `.catch(() => {})` for detached promises.
- **De-duplication**: Before firing any alert, check `hasRecentAction()` to prevent alert storms during sustained attacks.
- **Circular statistics**: The unusual hours detection must handle midnight correctly. Standard linear mean/stddev will fail for hours like [23, 0, 1]. Use atan2(mean(sin), mean(cos)) for angular mean.
- **No UsersService dependency**: Fetch admin emails directly via PrismaService to avoid importing the full UsersService chain. This simplifies SecurityModule's import requirements — remove `UsersModule` from imports if not needed.
- **No new REST endpoints**: This ticket is purely internal. Dashboard/admin UI endpoints for reviewing alerts would be a separate ticket.
- **All detection is alert-only**: No blocking. Blocking remains with existing lockout mechanism (MAX_FAILED_ATTEMPTS=5 with escalating lockout) and impossible travel detection (SCRUM-108).

## Next Steps After Implementation

1. Run `/commit SCRUM-109` to commit all changes
2. Run `/update-docs SCRUM-109` to create implementation record
3. Consider future tickets:
   - Admin dashboard endpoint to view suspicious login events (GET /audit-logs with action filter)
   - Configurable per-user alert preferences
   - Machine learning–based anomaly scoring

## Implementation Verification

- [ ] **Code Quality**: All methods follow NestJS best practices, proper dependency injection, no circular dependencies
- [ ] **Functionality**: All 4 detection types work correctly with proper thresholds
- [ ] **Fail-Open**: Verified that detection failures never block login (test exists)
- [ ] **Fire-and-Forget**: All async operations are non-blocking
- [ ] **De-Duplication**: Alert storms prevented by hasRecentAction() checks
- [ ] **Testing**: 90%+ coverage on new code, all existing tests pass
- [ ] **Integration**: SecurityModule properly wired, AuthModule imports correct
- [ ] **Documentation**: integration-state.md, data-model.md updated
- [ ] **Build**: `nest build` + `nest start` succeed
