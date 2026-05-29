# Backend Implementation Plan: SCRUM-108 IP Geolocation + Impossible Travel Detection

## 1. Codebase State Snapshot

- **Date**: 2026-03-03
- **Last completed ticket**: SCRUM-107 (Device Fingerprinting + Trusted Devices)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.service.ts` — 1050 lines. Constructor: 9 deps (UsersService, SessionsService, JwtService, OAuthCodeStore, AuditService, PasswordBreachService, PrismaService, MailService, TrustedDeviceService). `login()` at line 163, `notifyIfNewDevice()` at lines 638-670, `validateOAuthUser()` at line 471, `generateTokensForMfa()` at line 572.
  - `src/auth/auth.module.ts` — 61 lines. Imports: UsersModule (forwardRef), AuditModule, SessionsModule, CryptoModule, MailModule, PassportModule, JwtModule. Providers: AuthService, MfaService, JwtStrategy, GoogleStrategy, GitHubStrategy, OAuthStateStore, OAuthCodeStore, PasswordBreachService, TrustedDeviceService. Exports: AuthService, PasswordBreachService, TrustedDeviceService.
  - `src/auth/auth.controller.ts` — Constructor: 5 deps (AuthService, SessionsService, JwtService, PermissionsService, TrustedDeviceService). `extractRequestMeta()` at lines 63-71 returns `{ ipAddress, userAgent }`. `login()` at lines 146-162 extracts fingerprint from `X-Device-Fingerprint` header.
  - `src/sessions/sessions.service.ts` — 237 lines. Constructor: 2 deps (PrismaService, AuditService). `createSession()` at lines 30-56 receives `{ userId, refreshToken, tokenFamily?, deviceInfo?, ipAddress, userAgent?, expiresAt }`.
  - `src/sessions/sessions.module.ts` — 11 lines. Imports: AuditModule. Providers: SessionsService. Exports: SessionsService.
  - `src/mail/mail.service.ts` — Constructor: 1 dep (MailerService). `sendLoginNotificationEmail()` at lines 100-131. `parseUserAgent()` at lines 249-266. 8 public send methods.
  - `prisma/schema.prisma` — Session model at lines 85-104 (id, userId, tokenFamily, refreshTokenHash, deviceInfo, ipAddress, userAgent, isRevoked, createdAt, lastUsedAt, expiresAt, 4 indexes). AuditAction enum at lines 21-46 (25 values, last: DEVICE_UNTRUSTED).
  - `src/audit/enums/audit-action.enum.ts` — 27 lines. 25 values matching Prisma schema.
  - `src/auth/constants/auth.constants.ts` — 101 lines. Last constants: TRUSTED_DEVICE_TTL_DAYS, MAX_TRUSTED_DEVICES_PER_USER.
  - `src/app.module.ts` — Imports: RedisModule, ThrottlerModule, PrismaModule, AuthModule, UsersModule, AuditModule, SecurityModule, MailModule, PermissionsModule.
  - `package.json` — `maxmind` NOT in dependencies. Must be installed.
- **Constructor signatures verified**: AuthService (9 deps), AuthController (5 deps), SessionsService (2 deps), MailService (1 dep)
- **Guard dependency chain verified**: No new guards needed. All endpoints in this ticket use existing `JwtAuthGuard` (no deps, always available).

## 2. Overview

Implement IP geolocation resolution and impossible travel detection within the authentication flow. A new `GeolocationModule` provides a `GeolocationService` (MaxMind GeoLite2 local database lookup with LRU cache) and an `ImpossibleTravelService` (Haversine distance/time analysis). On every successful login, the system resolves the client IP to city-level coordinates, stores them on the session, and compares against the user's most recent session to detect physically impossible travel speeds. Anomalies trigger configurable responses: alert-only (default), MFA challenge, or login block.

## 3. Architecture Context

- **New module**: `GeolocationModule` (`@Global`) — provides GeolocationService and ImpossibleTravelService to any module without explicit imports
- **Components affected**:
  - NEW: `GeolocationService` — MaxMind `.mmdb` reader with LRU cache, fail-open
  - NEW: `ImpossibleTravelService` — Haversine distance, speed analysis, anomaly detection with configurable response strategy
  - NEW: `GeolocationResult` interface
  - NEW: `ImpossibleTravelAlert` interface
  - NEW: `geolocation.constants.ts` — configurable thresholds
  - NEW: `impossible-travel-alert.hbs` — email template
  - MODIFIED: `SessionsService.createSession()` — accept and store geo fields
  - MODIFIED: `AuthService` — inject ImpossibleTravelService, call detection after successful auth in `login()`, `validateOAuthUser()`, `generateTokensForMfa()`
  - MODIFIED: `MailService` — add `sendImpossibleTravelAlert()` method
  - MODIFIED: `prisma/schema.prisma` — geo fields on Session, 2 new AuditAction values
  - MODIFIED: `audit-action.enum.ts` — 2 new values
  - MODIFIED: `app.module.ts` — import GeolocationModule
- **No new guards**: All detection is internal to the auth flow. No new endpoints.

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-108-backend` from latest `feature/SCRUM-107-backend`
- **Branch Naming**: `feature/SCRUM-108-backend`
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-107-backend`
  2. `git pull origin feature/SCRUM-107-backend`
  3. `git checkout -b feature/SCRUM-108-backend`
  4. `git branch` — verify

### Step 1: Install MaxMind Package

- **File**: `package.json`
- **Action**: Add `maxmind` NPM package (pure JS `.mmdb` reader)
- **Implementation Steps**:
  1. Run `npm install maxmind`
  2. Verify in `package.json` dependencies
  3. Create `data/` directory at project root for `.mmdb` files
  4. Add `data/*.mmdb` to `.gitignore` (database file must not be committed)
- **Dependencies**: None
- **Implementation Notes**: The `maxmind` package is a pure JavaScript reader — no native bindings, no build step. The GeoLite2-City.mmdb file must be downloaded separately from MaxMind (free account required). For development, tests will mock the reader entirely.

### Step 2: Update Prisma Schema

- **File**: `prisma/schema.prisma`
- **Action**: Add geolocation fields to Session model and 2 new AuditAction values
- **Implementation Steps**:
  1. Add to AuditAction enum (after `DEVICE_UNTRUSTED` at line 45):
     ```prisma
     IMPOSSIBLE_TRAVEL_DETECTED
     LOGIN_BLOCKED_TRAVEL
     ```
  2. Add optional geo fields to Session model (after `userAgent` at line 95):
     ```prisma
     locationCity    String?
     locationCountry String?
     latitude        Float?
     longitude       Float?
     ```
  3. Run `npx prisma generate` to regenerate client (do NOT run `prisma migrate`)
- **Dependencies**: None
- **Implementation Notes**: All 4 geo fields are optional (`?`) — geolocation may not be available for private IPs or when the DB is missing. No new indexes needed (queries filter by userId which is already indexed).

### Step 3: Update AuditAction TypeScript Enum

- **File**: `src/audit/enums/audit-action.enum.ts`
- **Action**: Add 2 new values matching Prisma schema
- **Implementation Steps**:
  1. Add after `DEVICE_UNTRUSTED`:
     ```typescript
     IMPOSSIBLE_TRAVEL_DETECTED = 'IMPOSSIBLE_TRAVEL_DETECTED',
     LOGIN_BLOCKED_TRAVEL = 'LOGIN_BLOCKED_TRAVEL',
     ```
- **Dependencies**: None

### Step 4: Create Geolocation Constants

- **File**: `src/geolocation/constants/geolocation.constants.ts` (NEW)
- **Action**: Define configurable thresholds for geolocation and impossible travel
- **Implementation Steps**:
  1. Create directory `src/geolocation/constants/`
  2. Create constants file:
     ```typescript
     /**
      * Path to MaxMind GeoLite2-City database file.
      */
     export const MAXMIND_DB_PATH =
       process.env.MAXMIND_DB_PATH || './data/GeoLite2-City.mmdb';

     /**
      * LRU cache max entries for IP geolocation lookups.
      */
     export const GEOLOCATION_CACHE_MAX_SIZE = parseInt(
       process.env.GEOLOCATION_CACHE_MAX_SIZE || '10000',
       10,
     );

     /**
      * LRU cache TTL in hours.
      */
     export const GEOLOCATION_CACHE_TTL_HOURS = parseInt(
       process.env.GEOLOCATION_CACHE_TTL_HOURS || '24',
       10,
     );

     /**
      * Maximum plausible travel speed in km/h.
      * Default: 900 km/h (approximate commercial airplane speed).
      * If required speed exceeds this, flag as impossible travel.
      */
     export const IMPOSSIBLE_TRAVEL_SPEED_KMH = parseInt(
       process.env.IMPOSSIBLE_TRAVEL_SPEED_KMH || '900',
       10,
     );

     /**
      * Minimum distance in km to trigger impossible travel check.
      * Prevents false positives from nearby cities with inaccurate geolocation.
      */
     export const IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM = parseInt(
       process.env.IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM || '100',
       10,
     );

     /**
      * Anomaly response strategy.
      * - alert_only: Log audit + send email alert. Login proceeds.
      * - challenge: Force MFA re-verification (override trusted device). If no MFA, alert_only.
      * - block: Reject login with 403 + send email alert.
      */
     export const IMPOSSIBLE_TRAVEL_ALERT_STRATEGY =
       (process.env.IMPOSSIBLE_TRAVEL_ALERT_STRATEGY || 'alert_only') as
         | 'alert_only'
         | 'challenge'
         | 'block';

     /**
      * RFC 1918 / RFC 4193 private IP ranges.
      * These cannot be geolocated and should be skipped.
      */
     export const PRIVATE_IP_PREFIXES = [
       '127.',
       '10.',
       '172.16.', '172.17.', '172.18.', '172.19.',
       '172.20.', '172.21.', '172.22.', '172.23.',
       '172.24.', '172.25.', '172.26.', '172.27.',
       '172.28.', '172.29.', '172.30.', '172.31.',
       '192.168.',
       '::1',
       'fc', 'fd',
     ];
     ```
- **Dependencies**: None

### Step 5: Create GeolocationResult Interface

- **File**: `src/geolocation/interfaces/geolocation-result.interface.ts` (NEW)
- **Action**: Define the geolocation lookup result type
- **Implementation Steps**:
  1. Create directory `src/geolocation/interfaces/`
  2. Create interface:
     ```typescript
     export interface GeolocationResult {
       city: string | null;
       country: string | null;
       countryCode: string | null;
       latitude: number;
       longitude: number;
     }

     export interface ImpossibleTravelResult {
       isAnomalous: boolean;
       previousLocation: GeolocationResult | null;
       currentLocation: GeolocationResult;
       distanceKm: number;
       elapsedHours: number;
       requiredSpeedKmh: number;
       strategy: 'alert_only' | 'challenge' | 'block';
       actionTaken: 'allowed' | 'challenged' | 'blocked';
     }
     ```
- **Dependencies**: None

### Step 6: Create GeolocationService

- **File**: `src/geolocation/geolocation.service.ts` (NEW)
- **Action**: Implement MaxMind GeoLite2 lookup with LRU cache and fail-open
- **Implementation Steps**:
  1. Create injectable service with Logger
  2. Implement `onModuleInit()`:
     - Attempt to open MaxMind DB from `MAXMIND_DB_PATH`
     - If file not found or corrupt, log WARNING and set `this.reader = null` (fail-open)
     - Initialize LRU cache (Map with max size + TTL tracking)
  3. Implement `isPrivateIp(ip: string): boolean`:
     - Check against `PRIVATE_IP_PREFIXES`
     - Also handle `localhost`, `unknown`, empty string
     - Return true for any non-routable IP
  4. Implement `lookupIp(ip: string): GeolocationResult | null`:
     - If `isPrivateIp(ip)` → return null
     - If `this.reader === null` → return null (DB not loaded)
     - Check LRU cache → return if found and not expired
     - Call `this.reader.get(ip)` (MaxMind lookup)
     - Extract city name, country name, country ISO code, latitude, longitude
     - If any required field missing → return null
     - Store in cache with timestamp
     - Return `GeolocationResult`
     - Wrap entire lookup in try/catch → log error, return null (fail-open)
  5. Implement `evictExpiredCache(): void`:
     - Called lazily on cache operations
     - Remove entries older than `GEOLOCATION_CACHE_TTL_HOURS`
     - Evict oldest when cache exceeds `GEOLOCATION_CACHE_MAX_SIZE`
  6. Implement `onModuleDestroy()`:
     - Close MaxMind reader if open
     - Clear cache
- **Dependencies**: `maxmind` (npm package), Logger (NestJS built-in)
- **Implementation Notes**: The MaxMind `Reader` is opened ONCE on module init and reused (thread-safe, read-only). Each lookup is <1ms for local `.mmdb` files. The LRU cache is a simple Map with timestamp — no external library needed. `fail-open` is critical: if the DB is missing or a lookup fails, authentication MUST NOT be blocked.

### Step 7: Create ImpossibleTravelService

- **File**: `src/geolocation/impossible-travel.service.ts` (NEW)
- **Action**: Implement Haversine distance calculation and impossible travel detection
- **Implementation Steps**:
  1. Create injectable service with dependencies: `GeolocationService`, `PrismaService`, `AuditService`, `MailService`
  2. Implement `haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number`:
     - Earth radius: 6371 km
     - Standard Haversine formula
     - Return distance in km (rounded to 1 decimal)
  3. Implement `async detectImpossibleTravel(params: { userId: string, ipAddress: string, email: string, firstName: string | null, userAgent: string | null, mfaEnabled: boolean }): Promise<ImpossibleTravelResult | null>`:
     - Call `geolocationService.lookupIp(ipAddress)` → if null, return null (skip check)
     - Query most recent non-revoked session for userId with non-null latitude/longitude:
       ```typescript
       this.prisma.session.findFirst({
         where: { userId, isRevoked: false, latitude: { not: null } },
         orderBy: { createdAt: 'desc' },
         select: { locationCity: true, locationCountry: true, latitude: true, longitude: true, createdAt: true, ipAddress: true },
       })
       ```
     - If no previous session with geo data → return null (first login or no history)
     - If same IP address → return null (same device/network)
     - Calculate distance using `haversineDistance()`
     - If distance < `IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM` → return null (too close, could be geo inaccuracy)
     - Calculate elapsed hours: `(now - previousSession.createdAt) / (1000 * 60 * 60)`
     - If elapsed hours <= 0 → use 0.001 to avoid division by zero
     - Calculate required speed: `distanceKm / elapsedHours`
     - If required speed <= `IMPOSSIBLE_TRAVEL_SPEED_KMH` → return result with `isAnomalous: false`
     - **Anomaly detected**:
       - Determine `actionTaken` based on `IMPOSSIBLE_TRAVEL_ALERT_STRATEGY`:
         - `alert_only` → `actionTaken: 'allowed'`
         - `challenge` → if `mfaEnabled`, `actionTaken: 'challenged'`; else `actionTaken: 'allowed'`
         - `block` → `actionTaken: 'blocked'`
       - Audit log: `IMPOSSIBLE_TRAVEL_DETECTED` with full metadata
       - Send email alert (non-blocking, fire-and-forget)
       - Return `ImpossibleTravelResult` with `isAnomalous: true`
  4. Implement `private async sendTravelAlert(params: { email, firstName, previousLocation, currentLocation, distanceKm, elapsedHours, requiredSpeedKmh, actionTaken, ipAddress, userAgent }): Promise<void>`:
     - Call `mailService.sendImpossibleTravelAlert(...)` in try/catch
     - Log error on failure, never throw
- **Dependencies**: GeolocationService, PrismaService, AuditService, MailService
- **Implementation Notes**: The detection runs AFTER successful authentication (password verified, MFA passed if applicable). The result is used by AuthService to decide whether to return tokens or force MFA/block. The previous session query filters by `isRevoked: false` and `latitude: { not: null }` to only compare against geolocated sessions.

### Step 8: Create GeolocationModule

- **File**: `src/geolocation/geolocation.module.ts` (NEW)
- **Action**: Register module as @Global, export services
- **Implementation Steps**:
  1. Create module:
     ```typescript
     @Global()
     @Module({
       imports: [AuditModule, MailModule],
       providers: [GeolocationService, ImpossibleTravelService],
       exports: [GeolocationService, ImpossibleTravelService],
     })
     export class GeolocationModule {}
     ```
- **Dependencies**: AuditModule (for AuditService in ImpossibleTravelService), MailModule (for MailService in ImpossibleTravelService)
- **Implementation Notes**: `@Global()` makes GeolocationService and ImpossibleTravelService available to all modules without explicit imports. This follows the same pattern as PrismaModule, RedisModule, CryptoModule. AuditModule and MailModule must be imported because ImpossibleTravelService depends on AuditService and MailService.

### Step 9: Register GeolocationModule in AppModule

- **File**: `src/app.module.ts`
- **Action**: Add GeolocationModule to imports array
- **Implementation Steps**:
  1. Import `GeolocationModule` from `./geolocation/geolocation.module`
  2. Add to `imports` array (after `PrismaModule`, before `AuthModule`)
- **Dependencies**: None
- **Implementation Notes**: GeolocationModule must be registered before AuthModule so that GeolocationService and ImpossibleTravelService are available when AuthModule initializes.

### Step 10: Modify SessionsService to Store Geolocation

- **File**: `src/sessions/sessions.service.ts`
- **Action**: Inject GeolocationService and populate geo fields on session creation
- **Implementation Steps**:
  1. Import `GeolocationService` from `../geolocation/geolocation.service`
  2. Add `GeolocationService` as 3rd constructor dependency
  3. In `createSession()` (line 30), after computing `tokenFamily` and before `prisma.session.create()`:
     ```typescript
     const geo = this.geolocationService.lookupIp(params.ipAddress);
     ```
  4. Add geo fields to `prisma.session.create()` data:
     ```typescript
     data: {
       // ... existing fields ...
       locationCity: geo?.city || null,
       locationCountry: geo?.countryCode || null,
       latitude: geo?.latitude || null,
       longitude: geo?.longitude || null,
     },
     ```
- **Dependencies**: GeolocationService (@Global — no module import needed in SessionsModule)
- **Implementation Notes**: `lookupIp()` is synchronous-like (in-memory DB + cache), so it doesn't add meaningful latency. The geo fields are all optional, so null values work fine when geolocation is unavailable.

### Step 11: Add sendImpossibleTravelAlert to MailService

- **File**: `src/mail/mail.service.ts`
- **Action**: Add new email method for impossible travel alerts
- **Implementation Steps**:
  1. Add method after `sendAccountDeletionConfirmation()`:
     ```typescript
     async sendImpossibleTravelAlert(
       email: string,
       params: {
         firstName?: string | null;
         previousCity: string | null;
         previousCountry: string | null;
         currentCity: string | null;
         currentCountry: string | null;
         distanceKm: number;
         elapsedHours: number;
         requiredSpeedKmh: number;
         ipAddress: string;
         userAgent: string | null;
         actionTaken: 'allowed' | 'challenged' | 'blocked';
       },
     ): Promise<void> {
       const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
       const sessionsUrl = `${frontendUrl}/dashboard/security/sessions`;
       try {
         await this.mailerService.sendMail({
           to: email,
           subject: 'Suspicious login detected on your EM NexaCore account',
           template: 'impossible-travel-alert',
           context: {
             name: params.firstName || email.split('@')[0],
             previousLocation: this.formatLocation(params.previousCity, params.previousCountry),
             currentLocation: this.formatLocation(params.currentCity, params.currentCountry),
             distanceKm: Math.round(params.distanceKm),
             elapsedTime: this.formatElapsedTime(params.elapsedHours),
             device: this.parseUserAgent(params.userAgent),
             ipAddress: params.ipAddress,
             actionTaken: params.actionTaken,
             wasBlocked: params.actionTaken === 'blocked',
             sessionsUrl,
             frontendUrl,
             currentYear: new Date().getFullYear(),
           },
         });
         this.logger.log(`Impossible travel alert sent to ${email}`);
       } catch (error) {
         this.logger.error(
           `Failed to send impossible travel alert to ${email}`,
           error,
         );
       }
     }
     ```
  2. Add private helper `formatLocation(city: string | null, country: string | null): string`:
     - If both: `"Madrid, ES"`
     - If city only: `"Madrid"`
     - If country only: `"ES"`
     - Else: `"Unknown location"`
  3. Add private helper `formatElapsedTime(hours: number): string`:
     - If hours < 1: `"${Math.round(hours * 60)} minutes"`
     - Else: `"${hours.toFixed(1)} hours"`
- **Dependencies**: None new (MailerService already injected)

### Step 12: Create Impossible Travel Alert Email Template

- **File**: `src/mail/templates/impossible-travel-alert.hbs` (NEW)
- **Action**: Create Handlebars email template for impossible travel alerts
- **Implementation Steps**:
  1. Create template following the same structure as `login-notification.hbs`:
     - Header: "Suspicious Login Detected"
     - Body: greeting with name, warning about unusual login activity
     - Details table: Previous location, Current location, Distance, Time between logins, Device, IP address
     - If `wasBlocked`: message that login was blocked for security
     - If not blocked: recommendation to review active sessions
     - Call-to-action button: "Review Active Sessions" → `sessionsUrl`
     - Footer with year
- **Dependencies**: None
- **Implementation Notes**: Follow exact styling of existing templates (inline CSS, table-based layout for email client compatibility).

### Step 13: Integrate Impossible Travel Detection into AuthService

- **File**: `src/auth/auth.service.ts`
- **Action**: Inject ImpossibleTravelService and call detection after successful auth
- **Implementation Steps**:
  1. Import `ImpossibleTravelService` from `../geolocation/impossible-travel.service`
  2. Import `ImpossibleTravelResult` from `../geolocation/interfaces/geolocation-result.interface`
  3. Add `ImpossibleTravelService` as 10th constructor dependency (after `trustedDeviceService`)
  4. Create private helper method:
     ```typescript
     private async checkImpossibleTravel(
       user: { id: string; email: string; firstName: string | null; mfaEnabled: boolean },
       requestMeta: { ipAddress: string; userAgent?: string | null },
     ): Promise<ImpossibleTravelResult | null> {
       try {
         return await this.impossibleTravelService.detectImpossibleTravel({
           userId: user.id,
           ipAddress: requestMeta.ipAddress,
           email: user.email,
           firstName: user.firstName,
           userAgent: requestMeta.userAgent || null,
           mfaEnabled: user.mfaEnabled,
         });
       } catch {
         // Fail-open: never block auth due to travel detection errors
         return null;
       }
     }
     ```
  5. **In `login()` (line 163)** — after the MFA trusted device check resolves (around line 332, after the existing MFA block ends), BEFORE `notifyIfNewDevice()`:
     - After `generateTokens()` is called and before the final return:
       ```typescript
       const travelResult = await this.checkImpossibleTravel(
         user,
         requestMeta,
       );

       if (travelResult?.isAnomalous) {
         if (travelResult.actionTaken === 'blocked') {
           this.auditService.log({
             action: AuditAction.LOGIN_BLOCKED_TRAVEL,
             userId: user.id,
             ipAddress: requestMeta.ipAddress,
             userAgent: requestMeta.userAgent,
             metadata: {
               previousLocation: travelResult.previousLocation,
               currentLocation: travelResult.currentLocation,
               distanceKm: travelResult.distanceKm,
               elapsedHours: travelResult.elapsedHours,
               requiredSpeedKmh: travelResult.requiredSpeedKmh,
             },
           }).catch(() => {});
           throw new ForbiddenException(
             'Login blocked due to suspicious location activity. Please try again later or contact support.',
           );
         }
         if (travelResult.actionTaken === 'challenged' && user.mfaEnabled) {
           // Force MFA even if device was trusted
           const mfaToken = this.jwtService.sign(
             { sub: user.id, type: 'mfa-challenge' },
             { expiresIn: '5m' as StringValue, secret: this.mfaChallengeSecret },
           );
           return { mfaRequired: true, mfaToken };
         }
       }
       ```
     - This check must be placed at THREE points in `login()`:
       a. After normal password login token generation (non-MFA path)
       b. After trusted device MFA skip (lines 303-332)
       c. The MFA path is handled by `generateTokensForMfa()` — see below
  6. **In `validateOAuthUser()` (line 471)** — after `generateTokens()` and before the final return, add the same `checkImpossibleTravel()` call. For OAuth, use `actionTaken === 'blocked'` to throw ForbiddenException, but skip `challenged` (OAuth doesn't have MFA challenge flow).
  7. **In `generateTokensForMfa()` (line 572)** — after `generateTokens()` and before the final return, add the same `checkImpossibleTravel()` call. For MFA completion, only `block` applies (user already completed MFA challenge).
- **Dependencies**: ImpossibleTravelService (@Global — no module import needed)
- **Implementation Notes**: The detection runs AFTER authentication succeeds. The `block` strategy throws `ForbiddenException` (403) which will revoke the just-created session if tokens haven't been returned yet. The `challenge` strategy only applies in `login()` where we can redirect to MFA. In `validateOAuthUser()` and `generateTokensForMfa()`, only `block` is actionable. ALL checks are wrapped in try/catch for fail-open.

### Step 14: Write Unit Tests

- **File**: `src/geolocation/tests/geolocation.service.spec.ts` (NEW)
- **Action**: Comprehensive tests for GeolocationService
- **Test Categories**:
  1. **isPrivateIp()**:
     - Should return true for 127.0.0.1 (loopback)
     - Should return true for 10.x.x.x (class A private)
     - Should return true for 172.16-31.x.x (class B private)
     - Should return true for 192.168.x.x (class C private)
     - Should return true for ::1 (IPv6 loopback)
     - Should return true for 'unknown' and empty string
     - Should return false for valid public IPs (e.g., 8.8.8.8)
  2. **lookupIp()**:
     - Should return GeolocationResult for valid public IP
     - Should return null for private IP
     - Should return null when reader is null (DB not loaded)
     - Should return cached result on second lookup
     - Should return null on MaxMind lookup error (fail-open)
  3. **Cache behavior**:
     - Should evict oldest entries when max size reached
     - Should expire entries after TTL

- **File**: `src/geolocation/tests/impossible-travel.service.spec.ts` (NEW)
- **Action**: Comprehensive tests for ImpossibleTravelService
- **Test Categories**:
  1. **haversineDistance()**:
     - Should return 0 for same coordinates
     - Should calculate correct distance (Madrid → New York ≈ 5762 km)
     - Should calculate correct distance (London → Tokyo ≈ 9561 km)
  2. **detectImpossibleTravel()**:
     - Should return null when geolocation returns null (private IP)
     - Should return null when no previous session exists
     - Should return null when same IP address
     - Should return null when distance < min threshold
     - Should return isAnomalous=false when travel speed is plausible
     - Should return isAnomalous=true when travel speed exceeds threshold
     - Should set actionTaken='allowed' when strategy=alert_only
     - Should set actionTaken='challenged' when strategy=challenge and MFA enabled
     - Should set actionTaken='allowed' when strategy=challenge and MFA disabled
     - Should set actionTaken='blocked' when strategy=block
     - Should audit log IMPOSSIBLE_TRAVEL_DETECTED on anomaly
     - Should send email alert on anomaly (non-blocking)
     - Should not throw when email fails (fire-and-forget)

- **File**: `src/auth/tests/auth.service.spec.ts` (MODIFY)
- **Action**: Add ImpossibleTravelService mock and tests
- **Implementation Steps**:
  1. Import `ImpossibleTravelService`
  2. Add mock: `{ detectImpossibleTravel: jest.fn().mockResolvedValue(null) }`
  3. Add to providers and variable declaration
  4. Add tests:
     - Should allow login when travel detection returns null
     - Should block login when travel result says 'blocked'
     - Should force MFA when travel result says 'challenged' and MFA enabled
     - Should allow login when travel detection throws (fail-open)

- **File**: `src/sessions/tests/sessions.service.spec.ts` (MODIFY)
- **Action**: Add GeolocationService mock
- **Implementation Steps**:
  1. Import `GeolocationService`
  2. Add mock: `{ lookupIp: jest.fn().mockReturnValue({ city: 'Madrid', country: 'Spain', countryCode: 'ES', latitude: 40.4168, longitude: -3.7038 }) }`
  3. Add to providers
  4. Add tests:
     - Should store geo fields on session creation
     - Should store null geo fields when lookupIp returns null

- **File**: `src/mail/tests/mail.service.spec.ts` (MODIFY)
- **Action**: Add tests for sendImpossibleTravelAlert
- **Implementation Steps**:
  1. Add tests:
     - Should send impossible travel alert email
     - Should not throw when email fails
     - Should format location correctly

### Step 15: Build, Test, and Verify

- **Action**: Post-implementation integrity checks
- **Implementation Steps**:
  1. `npx prisma generate` — regenerate client with new Session fields and AuditAction values
  2. `npx nest build` — must compile clean
  3. `npx jest --maxWorkers=1 --forceExit` — all tests must pass (expect ~630+)
  4. `npx jest --coverage` — verify thresholds met (>98% stmts, >86% branches)

### Step 16: Update Technical Documentation

- **Action**: Update all affected documentation
- **Implementation Steps**:
  1. **`ai-specs/specs/data-model.md`**:
     - Add 4 optional geo fields to Session entity (locationCity, locationCountry, latitude, longitude)
     - Add IMPOSSIBLE_TRAVEL_DETECTED, LOGIN_BLOCKED_TRAVEL to AuditAction enum table
     - Update Session entity in Prisma schema section
  2. **`ai-specs/specs/api-spec.yml`**:
     - Update Session schema to include locationCity, locationCountry
     - Update GET /sessions/active response to show geo fields
     - Add 403 error response to POST /auth/login for blocked travel
  3. **`ai-specs/specs/integration-state.md`**:
     - Add GeolocationModule to Module Registry (@Global, imports: AuditModule+MailModule, exports: GeolocationService+ImpossibleTravelService)
     - Update SessionsService dependency chain (add GeolocationService)
     - Update AuthService dependency chain (add ImpossibleTravelService)
     - Update test mock requirements for SessionsService and AuthService
     - Add changelog entry
  4. **`.env.example`**:
     - Add MAXMIND_DB_PATH, GEOLOCATION_CACHE_MAX_SIZE, GEOLOCATION_CACHE_TTL_HOURS, IMPOSSIBLE_TRAVEL_SPEED_KMH, IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM, IMPOSSIBLE_TRAVEL_ALERT_STRATEGY

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Install maxmind package
3. Step 2: Update Prisma schema (Session geo fields, AuditAction values)
4. Step 3: Update AuditAction TypeScript enum
5. Step 4: Create geolocation constants
6. Step 5: Create GeolocationResult interface
7. Step 6: Create GeolocationService (MaxMind lookup, LRU cache)
8. Step 7: Create ImpossibleTravelService (Haversine, detection, alerts)
9. Step 8: Create GeolocationModule
10. Step 9: Register GeolocationModule in AppModule
11. Step 10: Modify SessionsService to store geolocation
12. Step 11: Add sendImpossibleTravelAlert to MailService
13. Step 12: Create impossible travel alert email template
14. Step 13: Integrate detection into AuthService (login, OAuth, MFA)
15. Step 14: Write unit tests (~35 new tests)
16. Step 15: Build + test + coverage
17. Step 16: Update technical documentation

## 6. Testing Checklist

- [ ] `geolocation.service.spec.ts`: All IP classification, lookup, cache, fail-open tests pass
- [ ] `impossible-travel.service.spec.ts`: All distance, speed, detection, strategy, audit, email tests pass
- [ ] `auth.service.spec.ts`: Travel detection integration tests pass (allow, block, challenge, fail-open)
- [ ] `sessions.service.spec.ts`: Geo field storage tests pass (with and without geo data)
- [ ] `mail.service.spec.ts`: Impossible travel alert email tests pass
- [ ] All ~630+ existing tests still pass (no regressions)
- [ ] `nest build` compiles clean
- [ ] `prisma generate` succeeds
- [ ] Coverage thresholds met

## 7. Error Response Format

**Login blocked due to impossible travel (strategy=block):**
```json
{
  "statusCode": 403,
  "message": "Login blocked due to suspicious location activity. Please try again later or contact support.",
  "error": "Forbidden"
}
```

**Normal login (detection runs silently, audit logged):**
```json
{
  "accessToken": "eyJhbG...",
  "user": { ... }
}
```

**Login with impossible travel + strategy=challenge + MFA enabled:**
```json
{
  "mfaRequired": true,
  "mfaToken": "eyJhbG..."
}
```

## 8. Partial Update Support

N/A — no PATCH operations. Geolocation is resolved at session creation time.

## 9. Dependencies

- **`maxmind`**: NPM package (pure JS `.mmdb` reader, ~50KB). No native bindings, no build step. MIT license.
- **MaxMind GeoLite2-City database**: Free download from MaxMind (requires account). ~70MB `.mmdb` file. Updated monthly. Not committed to git.
- **No other external libraries**: Haversine calculation uses basic trigonometry (Math.sin, Math.cos, Math.atan2, Math.sqrt). LRU cache uses native Map.

## 10. Notes

- **Fail-open is non-negotiable**: Every geolocation and travel detection operation must be wrapped in try/catch. If MaxMind DB is missing, if a lookup fails, if the service throws — authentication MUST proceed. This is a defense-in-depth feature, not a gatekeeper.
- **MaxMind DB not in repo**: The `.mmdb` file must be downloaded separately. Tests mock the reader entirely. Add `data/*.mmdb` to `.gitignore`. Include download instructions in `.env.example` or README.
- **Detection runs post-auth**: The impossible travel check happens AFTER the user has successfully authenticated (password correct, MFA passed). It's a secondary security layer.
- **Non-blocking alerts**: Email alerts use fire-and-forget pattern (`.catch(() => {})`). Audit logging is also non-blocking.
- **No new endpoints**: This feature is purely internal to the auth flow. Geo data surfaces through existing endpoints (GET /sessions/active).
- **Minimum distance threshold**: The `IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM` (default 100km) prevents false positives from nearby cities where MaxMind geo accuracy is ±50km.
- **@Global module**: GeolocationModule is `@Global()` to avoid importing it in every module that needs geolocation. This matches PrismaModule, RedisModule, CryptoModule patterns.

## 11. Next Steps After Implementation

- Frontend: display session location (city, country) in active sessions view (separate ticket)
- Set up MaxMind GeoLite2 auto-update cron job (monthly database refresh)
- Consider storing geolocation on AuditLog entries for richer forensics
- Monitor false positive rate and tune `IMPOSSIBLE_TRAVEL_SPEED_KMH` threshold

## 12. Implementation Verification

- [ ] `maxmind` installed and in `package.json`
- [ ] Session model has 4 optional geo fields in Prisma schema
- [ ] GeolocationService opens MaxMind DB on init, fails gracefully if missing
- [ ] GeolocationService.lookupIp() returns null for private IPs
- [ ] LRU cache working (cache hit on second lookup, eviction on overflow)
- [ ] ImpossibleTravelService.haversineDistance() returns correct distances
- [ ] detectImpossibleTravel() returns null for skip cases (private IP, no history, same IP, short distance)
- [ ] detectImpossibleTravel() correctly detects anomalies (speed > threshold)
- [ ] strategy=alert_only logs audit + sends email, login proceeds
- [ ] strategy=challenge forces MFA when enabled
- [ ] strategy=block throws ForbiddenException (403)
- [ ] AuthService.login() integrates detection correctly
- [ ] AuthService.validateOAuthUser() integrates detection correctly
- [ ] AuthService.generateTokensForMfa() integrates detection correctly
- [ ] MailService.sendImpossibleTravelAlert() sends formatted email
- [ ] SessionsService.createSession() stores geo fields
- [ ] All tests pass, build clean, coverage thresholds met
- [ ] Documentation updated (data-model.md, api-spec.yml, integration-state.md)

## 13. Module-Level Planning

- **Module Scope**: NEW `GeolocationModule` (`@Global`). No entity CRUD — this is an infrastructure/utility module.
- **Entity Design**: No new entity. Session model extended with 4 optional fields. 2 new AuditAction values.
- **API Surface**: No new endpoints. Existing GET /sessions/active response enriched with locationCity, locationCountry.
- **Cross-Module Dependencies**: GeolocationService used by SessionsService. ImpossibleTravelService used by AuthService. Both available via @Global.
- **Domain Events**: IMPOSSIBLE_TRAVEL_DETECTED, LOGIN_BLOCKED_TRAVEL audit actions.
- **Transaction Boundaries**: None. All operations are independent writes (session creation, audit log, email).
- **Permissions**: No new permissions — geolocation is automatic, travel detection is system-level.

## 14. Satellite App Planning

N/A — NexaCore internal changes only.
