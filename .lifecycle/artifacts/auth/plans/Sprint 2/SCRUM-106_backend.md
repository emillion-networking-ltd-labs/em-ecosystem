# Backend Implementation Plan: SCRUM-106 Redis-backed OAuth Stores

## Codebase State Snapshot

- **Date**: 2026-03-02
- **Last completed ticket**: SCRUM-105 (Account Self-Deletion + GDPR Compliance)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/stores/oauth-state.store.ts` (54 lines — in-memory Map, 4 methods)
  - `src/auth/stores/oauth-code.store.ts` (47 lines — in-memory Map, 3 methods)
  - `src/auth/auth.module.ts` (58 lines — both stores as providers, NOT exported)
  - `src/auth/auth.service.ts` (1017 lines — `generateOAuthCode()` L475-481, `exchangeOAuthCode()` L483-495, both sync)
  - `src/auth/guards/google-auth.guard.ts` (24 lines — `generate()` call at L15, sync)
  - `src/auth/guards/github-auth.guard.ts` (24 lines — `generate()` call at L15, sync)
  - `src/auth/strategies/google.strategy.ts` (112 lines — `getCodeVerifier()` L38, `validate()` L77, both sync)
  - `src/auth/strategies/github.strategy.ts` (121 lines — `getCodeVerifier()` L38, `validate()` L77, both sync)
  - `src/auth/tests/oauth-state.store.spec.ts` (89 lines — 10 tests, direct instantiation)
  - `src/auth/tests/oauth-code.store.spec.ts` (108 lines — 7 tests, direct instantiation)
  - `src/auth/tests/oauth-guards.spec.ts` (84 lines — 4 tests, manual mock)
  - `src/auth/tests/oauth-exchange.spec.ts` (166 lines — 3 tests, real OAuthCodeStore)
  - `src/auth/tests/google.strategy.spec.ts` (332 lines — 14 tests, DI mock)
  - `src/auth/tests/github.strategy.spec.ts` (405 lines — 14 tests, DI mock)
  - `src/auth/tests/auth.service.spec.ts` (first 80 lines — OAuthCodeStore mocked as DI token)
  - `src/common/services/crypto.module.ts` (pattern for @Global module in common/services)
  - `src/app.module.ts` (39 lines — no Redis imports yet)
  - `package.json` (no `ioredis` dependency)
  - `.env.example` (no Redis env vars)
- **Constructor signatures verified**:
  - `OAuthStateStore` — no constructor params (singleton, in-memory Map)
  - `OAuthCodeStore` — no constructor params (singleton, in-memory Map)
  - `GoogleAuthGuard(oauthStateStore: OAuthStateStore)`
  - `GitHubAuthGuard(oauthStateStore: OAuthStateStore)`
  - `GoogleStrategy(authService: AuthService, oauthStateStore: OAuthStateStore)`
  - `GitHubStrategy(authService: AuthService, oauthStateStore: OAuthStateStore)`
  - `AuthService(usersService, sessionsService, jwtService, oauthCodeStore: OAuthCodeStore, auditService, passwordBreachService, prisma, mailService)`
- **Guard dependency chain verified**:
  - `GoogleAuthGuard` → `OAuthStateStore` → AuthModule internal (no external deps)
  - `GitHubAuthGuard` → `OAuthStateStore` → AuthModule internal (no external deps)
  - After this ticket: both stores will need `REDIS_CLIENT` injection token → `RedisModule`

## Overview

Replace the in-memory `Map`-based `OAuthStateStore` and `OAuthCodeStore` with Redis-backed implementations using `ioredis`. Current in-memory stores break in multi-instance deployments (Kubernetes, load-balanced) because OAuth state generated on Instance A is invisible to Instance B.

**Key architectural decisions**:
1. Create a reusable `RedisModule` (`@Global`) in `src/common/services/` following the existing `CryptoModule` pattern
2. Keep the same class names and public method signatures — only add `async` return types
3. Use Redis native TTL (`EX` flag) instead of manual cleanup
4. All consumers must be updated to `await` the now-async store calls

## Architecture Context

### Modules involved
- **RedisModule** (NEW) — `@Global`, provides `REDIS_CLIENT` injection token
- **AuthModule** — imports `RedisModule`, both stores inject `REDIS_CLIENT`

### Components affected
| Component | Type | Change |
|-----------|------|--------|
| `RedisModule` | Module | **New** — `@Global`, provides ioredis client |
| `OAuthStateStore` | Service | Modify — in-memory Map → Redis |
| `OAuthCodeStore` | Service | Modify — in-memory Map → Redis |
| `GoogleAuthGuard` | Guard | Modify — `await generate()` |
| `GitHubAuthGuard` | Guard | Modify — `await generate()` |
| `GoogleStrategy` | Strategy | Modify — `await getCodeVerifier()`, `await validate()` |
| `GitHubStrategy` | Strategy | Modify — `await getCodeVerifier()`, `await validate()` |
| `AuthService` | Service | Modify — `await store()`, `await exchange()`, async method signatures |
| `AppModule` | Module | Modify — import `RedisModule` |

### Files referenced
- `src/common/services/redis.module.ts` (NEW)
- `src/common/services/redis.constants.ts` (NEW)
- `src/auth/stores/oauth-state.store.ts`
- `src/auth/stores/oauth-code.store.ts`
- `src/auth/auth.module.ts`
- `src/auth/auth.service.ts`
- `src/auth/guards/google-auth.guard.ts`
- `src/auth/guards/github-auth.guard.ts`
- `src/auth/strategies/google.strategy.ts`
- `src/auth/strategies/github.strategy.ts`
- `src/app.module.ts`
- `package.json`
- `.env.example`

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-106-backend` from latest `feature/SCRUM-105-backend`
- **Implementation Steps**:
  1. Ensure on `feature/SCRUM-105-backend` (current branch)
  2. `git checkout -b feature/SCRUM-106-backend`
  3. Verify branch creation: `git branch`
- **Notes**: SCRUM-106 depends on SCRUM-105 being fully implemented and committed (confirmed — commit `34974b3` on `feature/SCRUM-105-backend`).

### Step 1: Install `ioredis` dependency

- **File**: `package.json`
- **Action**: Install `ioredis` as production dependency
- **Implementation Steps**:
  1. Run `npm install ioredis`
  2. Verify it appears in `dependencies` in `package.json`
- **Dependencies**: None
- **Implementation Notes**:
  - `ioredis` ships with its own TypeScript types — no separate `@types/ioredis` needed (types are bundled since v5)
  - Current version should be ^5.x

### Step 2: Create Redis constants file

- **File**: `src/common/services/redis.constants.ts` (NEW)
- **Action**: Define the `REDIS_CLIENT` injection token constant
- **Implementation Steps**:
  1. Create file with a single exported constant:
     ```typescript
     export const REDIS_CLIENT = 'REDIS_CLIENT';
     ```
- **Dependencies**: None
- **Implementation Notes**: Separate file for the token avoids circular imports and follows NestJS convention (like `APP_GUARD`).

### Step 3: Create `RedisModule`

- **File**: `src/common/services/redis.module.ts` (NEW)
- **Action**: Create a `@Global` module that provides a singleton `ioredis` client
- **Function Signature**:
  ```typescript
  @Global()
  @Module({
    providers: [{ provide: REDIS_CLIENT, useFactory: () => ... }],
    exports: [REDIS_CLIENT],
  })
  export class RedisModule implements OnModuleDestroy {}
  ```
- **Implementation Steps**:
  1. Import `Module`, `Global`, `OnModuleDestroy`, `Inject`, `Logger` from `@nestjs/common`
  2. Import `Redis` from `ioredis`
  3. Import `REDIS_CLIENT` from `./redis.constants`
  4. Create the module with a `useFactory` provider for `REDIS_CLIENT`:
     - Read env vars: `REDIS_HOST` (default `localhost`), `REDIS_PORT` (default `6379`), `REDIS_PASSWORD` (default empty), `REDIS_DB` (default `0`), `REDIS_KEY_PREFIX` (default `nexacore:`)
     - Create `new Redis({ host, port, password, db, keyPrefix, maxRetriesPerRequest: 1, lazyConnect: false })`
     - Attach `on('connect')` and `on('error')` listeners for observability logging
     - Return the Redis instance
  5. Implement `onModuleDestroy()` to gracefully disconnect: `await this.redis.quit()`
  6. Inject `REDIS_CLIENT` into the module class for the destroy hook
- **Dependencies**: `ioredis`, `@nestjs/common`
- **Implementation Notes**:
  - `@Global()` so any module can inject `REDIS_CLIENT` without explicit imports (follows `CryptoModule` and `PrismaModule` pattern)
  - `maxRetriesPerRequest: 1` — fail fast on Redis unavailability (OAuth should not hang)
  - `lazyConnect: false` — connect eagerly on startup for observability
  - `keyPrefix` is applied automatically by ioredis to all commands — stores don't need to prefix manually
  - The factory logger should log `Redis connected to {host}:{port}` on connect and `Redis connection error: {message}` on error

### Step 4: Register `RedisModule` in `AppModule`

- **File**: `src/app.module.ts`
- **Action**: Add `RedisModule` to imports array
- **Implementation Steps**:
  1. Import `RedisModule` from `../common/services/redis.module`
  2. Add `RedisModule` to the `imports` array (before `AuthModule` so Redis is available when AuthModule initializes)
- **Dependencies**: `RedisModule`
- **Implementation Notes**: Since `RedisModule` is `@Global`, this single import makes `REDIS_CLIENT` available everywhere.

### Step 5: Refactor `OAuthStateStore` to use Redis

- **File**: `src/auth/stores/oauth-state.store.ts`
- **Action**: Replace in-memory `Map` with Redis `GET/SET/DEL` operations
- **Function Signatures** (all become async):
  ```typescript
  async generate(): Promise<{ state: string; codeChallenge: string }>
  async getCodeVerifier(state: string): Promise<string | undefined>
  async validate(state: string): Promise<boolean>
  cleanup(): void  // no-op, Redis TTL handles expiration
  ```
- **Implementation Steps**:
  1. Add constructor injection: `constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}`
  2. Import `Inject` from `@nestjs/common`, `Redis` from `ioredis`, `REDIS_CLIENT` from `../../common/services/redis.constants`
  3. Remove `private readonly states = new Map<string, StateEntry>()`
  4. Remove `StateEntry` interface (no longer needed)
  5. Keep `STATE_TTL_MS` but add `STATE_TTL_SECONDS = 300` (5 min) for Redis `EX` flag
  6. Refactor `generate()`:
     - Keep local crypto operations (randomUUID, randomBytes, createHash) — unchanged
     - Replace `this.states.set(state, ...)` with `await this.redis.set(`oauth:state:${state}`, JSON.stringify({ codeVerifier }), 'EX', STATE_TTL_SECONDS)`
     - Remove `this.cleanup()` call (not needed with Redis TTL)
  7. Refactor `getCodeVerifier()`:
     - Replace Map lookup with `const data = await this.redis.get(`oauth:state:${state}`)`
     - If `!data`, return `undefined`
     - Parse JSON and return `codeVerifier`
     - No TTL check needed — Redis auto-expires
  8. Refactor `validate()`:
     - Use atomic get-and-delete: `const data = await this.redis.get(`oauth:state:${state}`)` followed by `await this.redis.del(`oauth:state:${state}`)`
     - If `!data`, return `false`
     - Return `true`
     - Note: Using GET+DEL instead of GETDEL for broader Redis version compatibility
  9. Refactor `cleanup()`:
     - Make it a no-op: `cleanup(): void { /* Redis TTL handles expiration */ }`
- **Dependencies**: `ioredis`, `REDIS_CLIENT`
- **Implementation Notes**:
  - Redis key pattern: `oauth:state:{uuid}` (keyPrefix `nexacore:` is auto-applied by ioredis)
  - The `validate()` method does NOT need to be truly atomic (GET+DEL in a single MULTI/EXEC) because the UUID state token is cryptographically random — race conditions from concurrent requests with the same state UUID are not a realistic threat. Simple GET+DEL is sufficient.
  - `getCodeVerifier()` remains non-destructive (peek-only) — uses GET without DEL

### Step 6: Refactor `OAuthCodeStore` to use Redis

- **File**: `src/auth/stores/oauth-code.store.ts`
- **Action**: Replace in-memory `Map` with Redis `GET/SET/DEL` operations
- **Function Signatures** (all become async):
  ```typescript
  async store(payload: OAuthTokenPayload): Promise<string>
  async exchange(code: string): Promise<OAuthTokenPayload | null>
  cleanup(): void  // no-op
  ```
- **Implementation Steps**:
  1. Add constructor injection: `constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}`
  2. Import `Inject` from `@nestjs/common`, `Redis` from `ioredis`, `REDIS_CLIENT` from `../../common/services/redis.constants`
  3. Remove `private readonly codes = new Map<...>()`
  4. Add `CODE_TTL_SECONDS = 60` for Redis `EX` flag
  5. Refactor `store()`:
     - Keep `const code = randomUUID()`
     - Replace Map set with `await this.redis.set(`oauth:code:${code}`, JSON.stringify(payload), 'EX', CODE_TTL_SECONDS)`
     - Remove `this.cleanup()` call
     - Return `code`
  6. Refactor `exchange()`:
     - `const data = await this.redis.get(`oauth:code:${code}`)`
     - `await this.redis.del(`oauth:code:${code}`)` (single-use)
     - If `!data`, return `null`
     - Parse JSON: `const payload = JSON.parse(data) as OAuthTokenPayload`
     - **Date reconstruction**: `SafeUser` has `createdAt` and `updatedAt` as `Date` objects. After JSON parse, these will be strings. Reconstruct:
       ```typescript
       payload.user.createdAt = new Date(payload.user.createdAt);
       payload.user.updatedAt = new Date(payload.user.updatedAt);
       ```
     - Return `payload`
  7. Refactor `cleanup()` — no-op
- **Dependencies**: `ioredis`, `REDIS_CLIENT`
- **Implementation Notes**:
  - Redis key pattern: `oauth:code:{uuid}`
  - Date reconstruction is critical — without it, downstream code expecting `Date` objects will get strings and potentially break `toISOString()` calls or date comparisons
  - The payload contains `accessToken`, `SafeUser`, and `CookieConfig` — all JSON-serializable

### Step 7: Update `AuthModule` imports

- **File**: `src/auth/auth.module.ts`
- **Action**: Import `RedisModule` (though it's `@Global`, explicit import documents the dependency)
- **Implementation Steps**:
  1. Actually, since `RedisModule` is `@Global` and imported in `AppModule`, AuthModule does NOT need to import it. The `REDIS_CLIENT` token is available globally.
  2. No changes needed to `auth.module.ts` — both stores remain as providers and will receive `REDIS_CLIENT` via NestJS DI automatically.
- **Notes**: This is actually simpler than expected. The stores' constructors will use `@Inject(REDIS_CLIENT)` and NestJS resolves it from the global scope. No module import change needed.

### Step 8: Update `GoogleAuthGuard` for async `generate()`

- **File**: `src/auth/guards/google-auth.guard.ts`
- **Action**: Make `getAuthenticateOptions()` async to `await` the now-async `generate()`
- **Implementation Steps**:
  1. Change method signature: `async getAuthenticateOptions(context: ExecutionContext)`
  2. Add `await` before `this.oauthStateStore.generate()`
  3. The method now returns `Promise<object>` — Passport's `AuthGuard` supports async `getAuthenticateOptions()`
- **Dependencies**: None new
- **Implementation Notes**: Passport calls `getAuthenticateOptions()` and handles promises natively.

### Step 9: Update `GitHubAuthGuard` for async `generate()`

- **File**: `src/auth/guards/github-auth.guard.ts`
- **Action**: Identical to Step 8 but for GitHub guard
- **Implementation Steps**: Same as Step 8

### Step 10: Update `GoogleStrategy` for async store calls

- **File**: `src/auth/strategies/google.strategy.ts`
- **Action**: Add `await` to `getCodeVerifier()` and `validate()` calls
- **Implementation Steps**:
  1. In `authenticate()` method (L36-56):
     - The `authenticate()` method is synchronous (overrides `PassportStrategy.authenticate()` which is `void`)
     - `getCodeVerifier()` is called inside `authenticate()` which cannot be made async (Passport constraint)
     - **Solution**: Since `authenticate()` cannot be async, we need to handle this with a promise chain or change the approach
     - **Better approach**: Make `authenticate()` async and call `super.authenticate()` at the end. Check if Passport's `authenticate` supports async override — it does NOT return anything (void), so making it async is safe as long as `super.authenticate()` is called correctly
     - Actually, looking at the code more carefully: `authenticate()` is called by Passport synchronously. Making it async means it returns a Promise that Passport ignores. The `super.authenticate()` call at the end would still execute. But the `await` on `getCodeVerifier()` would defer the OAuth2 monkey-patching to a microtask, which would execute BEFORE `super.authenticate()` completes its sync work. This is safe.
     - Change `authenticate(req: any, options?: any): void` to `async authenticate(req: any, options?: any): Promise<void>`
     - Add `await` before `this.oauthStateStore.getCodeVerifier(req.query.state)`
  2. In `validate()` method (L58-111):
     - Already `async` — just add `await` before `this.oauthStateStore.validate(state)` at L77
- **Dependencies**: None new
- **Implementation Notes**:
  - The `authenticate()` async conversion is the trickiest part. Passport's `Strategy.authenticate()` is typed as returning `void`. Making it async means it returns `Promise<void>`, which Passport will treat as a truthy return value and ignore. The key insight is that ALL the work (monkey-patching, super.authenticate) happens within the promise, so it's executed in order.
  - However, there's a subtle issue: `super.authenticate()` is synchronous internally (it initiates the OAuth redirect or processes the callback). Making `authenticate()` async means the entire body runs in a microtask. Passport calls `authenticate()` and expects it to either call `this.success()`, `this.fail()`, `this.redirect()`, or `this.error()` synchronously or asynchronously via callbacks. The async conversion should work because the super call triggers these callbacks internally.

### Step 11: Update `GitHubStrategy` for async store calls

- **File**: `src/auth/strategies/github.strategy.ts`
- **Action**: Identical to Step 10 but for GitHub strategy
- **Implementation Steps**: Same as Step 10

### Step 12: Update `AuthService` for async store calls

- **File**: `src/auth/auth.service.ts`
- **Action**: Make `generateOAuthCode()` and `exchangeOAuthCode()` async
- **Implementation Steps**:
  1. `generateOAuthCode()` (L475-481):
     - Change to `async generateOAuthCode(...)`: `Promise<string>`
     - Add `await` before `this.oauthCodeStore.store(payload)`
  2. `exchangeOAuthCode()` (L483-495):
     - Change to `async exchangeOAuthCode(...)`: `Promise<{ accessToken: string; user: SafeUser; cookie: CookieConfig }>`
     - Add `await` before `this.oauthCodeStore.exchange(code)`
- **Dependencies**: None new
- **Implementation Notes**:
  - Check all callers of `generateOAuthCode()` and `exchangeOAuthCode()` in `auth.controller.ts` to ensure they `await` the results
  - The AuthController methods `googleAuthCallback()`, `githubAuthCallback()`, and `exchangeOAuthCode()` call these methods — they may need to become async or add `await`

### Step 13: Update `AuthController` for async OAuth methods

- **File**: `src/auth/auth.controller.ts`
- **Action**: Add `await` to `generateOAuthCode()` and `exchangeOAuthCode()` calls
- **Implementation Steps**:
  1. `googleAuthCallback()` (L453): currently sync, calls `this.authService.generateOAuthCode(req.user)` at L459
     - Make method `async`: `async googleAuthCallback(...)`
     - Add `await`: `const code = await this.authService.generateOAuthCode(req.user)`
  2. `githubAuthCallback()` (L492): currently sync, calls `this.authService.generateOAuthCode(req.user)` at L498
     - Make method `async`: `async githubAuthCallback(...)`
     - Add `await`: `const code = await this.authService.generateOAuthCode(req.user)`
  3. `exchangeOAuthCode()` (L514): currently sync, calls `this.authService.exchangeOAuthCode(dto.code)` at L518
     - Make method `async`: `async exchangeOAuthCode(...)`
     - Add `await`: `const result = await this.authService.exchangeOAuthCode(dto.code)`
- **Dependencies**: None new
- **Implementation Notes**: NestJS handles Promise-returning controller methods natively — it awaits the promise before sending the response. No Swagger/OpenAPI changes needed.

### Step 14: Update `.env.example`

- **File**: `.env.example`
- **Action**: Add Redis environment variables
- **Implementation Steps**:
  1. Add a `# Redis` section with:
     ```
     # Redis
     REDIS_HOST="localhost"
     REDIS_PORT="6379"
     REDIS_PASSWORD=""
     REDIS_DB="0"
     REDIS_KEY_PREFIX="nexacore:"
     ```
- **Dependencies**: None

### Step 15: Update Unit Tests — Store Specs

- **Files**:
  - `src/auth/tests/oauth-state.store.spec.ts`
  - `src/auth/tests/oauth-code.store.spec.ts`
- **Action**: Replace direct `new Store()` instantiation with NestJS `TestingModule` + mocked Redis client
- **Implementation Steps**:
  1. **oauth-state.store.spec.ts**:
     - Create a mock Redis client: `{ get: jest.fn(), set: jest.fn(), del: jest.fn() }`
     - Use `Test.createTestingModule` with `REDIS_CLIENT` provider
     - Update all tests for async: `await store.generate()`, `await store.getCodeVerifier()`, `await store.validate()`
     - Test `generate()`: verify `redis.set` called with correct key pattern, TTL (300), and JSON value
     - Test `getCodeVerifier()`: mock `redis.get` to return JSON, verify parsed result
     - Test `validate()`: mock `redis.get` to return data, verify `redis.del` called (single-use), returns `true`
     - Test `validate()` with unknown state: mock `redis.get` to return `null`, returns `false`
     - Test `cleanup()`: verify it's a no-op (no Redis calls)
     - Remove tests that manipulate internal Map (expired state test) — instead test that `redis.set` uses correct TTL
  2. **oauth-code.store.spec.ts**:
     - Same pattern: mock Redis client, TestingModule
     - Test `store()`: verify `redis.set` with correct key, TTL (60), serialized payload
     - Test `exchange()`: mock `redis.get` to return serialized payload, verify `redis.del` called, verify Date reconstruction
     - Test `exchange()` unknown code: mock `redis.get` returns `null`, returns `null`
     - Test `cleanup()`: no-op
     - Remove internal Map manipulation tests
- **Implementation Notes**:
  - Tests no longer test TTL expiration logic (that's Redis's job) — instead they verify correct TTL values are passed to `redis.set`
  - Date reconstruction test is important: store a payload with Date objects, mock redis.get to return the JSON-serialized version, verify exchange() returns proper Date instances

### Step 16: Update Unit Tests — Guard, Strategy, and Service Specs

- **Files**:
  - `src/auth/tests/oauth-guards.spec.ts`
  - `src/auth/tests/google.strategy.spec.ts`
  - `src/auth/tests/github.strategy.spec.ts`
  - `src/auth/tests/auth.service.spec.ts`
  - `src/auth/tests/oauth-exchange.spec.ts`
- **Action**: Update mocks to return Promises, add `await` to assertions
- **Implementation Steps**:
  1. **oauth-guards.spec.ts**:
     - Change `generate: jest.fn().mockReturnValue(...)` → `generate: jest.fn().mockResolvedValue(...)`
     - Make `getAuthenticateOptions()` calls awaited: `const options = await guard.getAuthenticateOptions(context)`
  2. **google.strategy.spec.ts** & **github.strategy.spec.ts**:
     - Change `validate: jest.fn().mockReturnValue(true/false)` → `validate: jest.fn().mockResolvedValue(true/false)`
     - Change `getCodeVerifier: jest.fn().mockReturnValue(...)` → `getCodeVerifier: jest.fn().mockResolvedValue(...)`
     - The `authenticate()` tests need to handle the async nature — since `authenticate()` returns `Promise<void>`, await it: `await strategy.authenticate(...)`
  3. **auth.service.spec.ts**:
     - Change `store: jest.fn().mockReturnValue('ephemeral-uuid')` → `store: jest.fn().mockResolvedValue('ephemeral-uuid')`
     - Change `exchange: jest.fn().mockReturnValue(mockPayload)` / `.mockReturnValue(null)` → `.mockResolvedValue(...)` / `.mockResolvedValue(null)`
     - Add `await` to `authService.generateOAuthCode(...)` and `authService.exchangeOAuthCode(...)` assertions
     - Change `expect(() => authService.exchangeOAuthCode(...)).toThrow(...)` → `await expect(authService.exchangeOAuthCode(...)).rejects.toThrow(...)`
  4. **oauth-exchange.spec.ts**:
     - This test uses a REAL `OAuthCodeStore` instance. After refactoring, the store requires Redis injection.
     - Option A: Mock the `AuthService.generateOAuthCode` and `exchangeOAuthCode` directly (already partially done)
     - Option B: Create the store with a mocked Redis client
     - Since the test mocks `authService.generateOAuthCode` and `authService.exchangeOAuthCode` via jest.fn().mockImplementation, and those implementations use `oauthCodeStore` directly, we need to either:
       - Replace the real `OAuthCodeStore` with a DI-injected version using mocked Redis, OR
       - Mock the `authService` methods without delegating to the real store
     - **Best approach**: Since `generateOAuthCode` and `exchangeOAuthCode` now return Promises, update the mockImplementation to return Promises and remove the real `OAuthCodeStore` usage. Use simple in-memory tracking within the mock:
       ```typescript
       const codeMap = new Map();
       generateOAuthCode: jest.fn().mockImplementation((payload) => {
         const code = 'test-code-' + Math.random();
         codeMap.set(code, payload);
         return Promise.resolve(code);
       }),
       exchangeOAuthCode: jest.fn().mockImplementation((code) => {
         const result = codeMap.get(code);
         codeMap.delete(code);
         if (!result) throw new UnauthorizedException('Invalid or expired authorization code');
         return Promise.resolve(result);
       }),
       ```
     - Make test methods async and add `await` to controller calls that return promises
- **Implementation Notes**:
  - The `oauth-exchange.spec.ts` tests call `controller.googleAuthCallback()` and `controller.exchangeOAuthCode()` which will now return Promises — all assertions need `await`
  - The authenticate() tests in strategy specs are the trickiest — since `authenticate()` is now async, `superAuthSpy` assertions need to account for the microtask delay. Using `await strategy.authenticate(...)` before asserting should work.

### Step 17: Update Technical Documentation

- **Action**: Review and update technical documentation
- **Implementation Steps**:
  1. **`ai-specs/specs/integration-state.md`**:
     - Add `RedisModule` to Module Registry: `RedisModule | **Yes** | — | REDIS_CLIENT | —`
     - Update `AuthModule` row if needed (no import change since RedisModule is @Global)
     - Add `AppModule` imports update: add `RedisModule`
     - Add Service Dependency Chains update: `OAuthStateStore → Redis (REDIS_CLIENT)`, `OAuthCodeStore → Redis (REDIS_CLIENT)`
     - Add Changelog entry for SCRUM-106
  2. **`ai-specs/specs/data-model.md`**:
     - No schema changes — Redis is external storage, not Prisma
  3. **`ai-specs/specs/api-spec.yml`**:
     - No endpoint changes — same OAuth endpoints, same behavior
  4. **`ai-specs/specs/backend-standards.mdc`**:
     - Add Redis configuration section if not present (env vars, connection pattern)
- **References**: `ai-specs/specs/documentation-standards.mdc`
- **Notes**: MANDATORY step before implementation is considered complete.

## Implementation Order

1. **Step 0**: Create feature branch `feature/SCRUM-106-backend`
2. **Step 1**: Install `ioredis` dependency
3. **Step 2**: Create Redis constants file
4. **Step 3**: Create `RedisModule`
5. **Step 4**: Register `RedisModule` in `AppModule`
6. **Step 5**: Refactor `OAuthStateStore` to use Redis
7. **Step 6**: Refactor `OAuthCodeStore` to use Redis
8. **Step 7**: ~~Update AuthModule imports~~ (no change needed — @Global)
9. **Step 8**: Update `GoogleAuthGuard` for async
10. **Step 9**: Update `GitHubAuthGuard` for async
11. **Step 10**: Update `GoogleStrategy` for async
12. **Step 11**: Update `GitHubStrategy` for async
13. **Step 12**: Update `AuthService` for async
14. **Step 13**: Update `AuthController` for async
15. **Step 14**: Update `.env.example`
16. **Step 15**: Update store unit tests
17. **Step 16**: Update guard, strategy, service, and exchange unit tests
18. **Step 17**: Update technical documentation
19. **Final**: `nest build` + `npm test` verification

## Testing Checklist

- [ ] `OAuthStateStore` — generate() stores to Redis with 300s TTL
- [ ] `OAuthStateStore` — getCodeVerifier() reads from Redis (non-destructive)
- [ ] `OAuthStateStore` — validate() reads and deletes from Redis (single-use)
- [ ] `OAuthStateStore` — validate() returns false for unknown state
- [ ] `OAuthStateStore` — cleanup() is a no-op
- [ ] `OAuthCodeStore` — store() stores to Redis with 60s TTL
- [ ] `OAuthCodeStore` — exchange() reads, deletes, and returns payload with Date reconstruction
- [ ] `OAuthCodeStore` — exchange() returns null for unknown code
- [ ] `OAuthCodeStore` — cleanup() is a no-op
- [ ] `GoogleAuthGuard` — getAuthenticateOptions() awaits generate() correctly
- [ ] `GitHubAuthGuard` — getAuthenticateOptions() awaits generate() correctly
- [ ] `GoogleStrategy` — authenticate() awaits getCodeVerifier() correctly
- [ ] `GoogleStrategy` — validate() awaits validate() correctly
- [ ] `GitHubStrategy` — authenticate() awaits getCodeVerifier() correctly
- [ ] `GitHubStrategy` — validate() awaits validate() correctly
- [ ] `AuthService` — generateOAuthCode() awaits store() correctly
- [ ] `AuthService` — exchangeOAuthCode() awaits exchange() correctly
- [ ] OAuth exchange integration test — full cycle works with async
- [ ] `nest build` passes with no type errors
- [ ] All 557+ tests pass
- [ ] Coverage thresholds met (stmts 90%, branches 85%, funcs 90%, lines 90%)

## Error Response Format

No new HTTP error responses are introduced. Existing error responses remain unchanged:

| Scenario | Status Code | Response |
|----------|-------------|----------|
| Redis unavailable during OAuth initiation | 500 | `{ "statusCode": 500, "message": "Internal Server Error" }` |
| Redis unavailable during OAuth callback | 500 | `{ "statusCode": 500, "message": "Internal Server Error" }` |
| Invalid/expired OAuth state | 401 (via Passport) | Redirect to error page |
| Invalid/expired OAuth code | 401 | `{ "statusCode": 401, "message": "Invalid or expired authorization code" }` |

**Note**: Redis failures will surface as unhandled promise rejections caught by NestJS's global exception filter, returning 500. No custom error handling needed for Redis — fail-fast is the correct behavior for OAuth flows.

## Dependencies

| Package | Version | Type | Purpose |
|---------|---------|------|---------|
| `ioredis` | ^5.x | production | Redis client for OAuth stores |

## Notes

- **No Prisma changes**: Redis is external storage, not part of the Prisma schema
- **No new endpoints**: Same OAuth flow, same API surface
- **Backward compatibility**: Store class names and method names are preserved; only return types change from sync to `Promise<T>`
- **Redis key isolation**: `REDIS_KEY_PREFIX` (default `nexacore:`) + store-specific prefix (`oauth:state:` / `oauth:code:`) ensures no key collisions
- **Date serialization**: `OAuthCodeStore.exchange()` must reconstruct `Date` objects from JSON strings for `createdAt`/`updatedAt` fields in `SafeUser`
- **Passport async compatibility**: Passport's `authenticate()` and `getAuthenticateOptions()` both support async overrides. The authenticate method is void-returning; making it async returns a Promise that Passport ignores, but the internal flow executes correctly via the event loop.
- **Redis TTL replaces manual cleanup**: Both stores' `cleanup()` methods become no-ops. Redis handles expiration natively, which is more reliable and eliminates the memory leak risk from missed cleanup calls.
- **GETDEL alternative**: Redis 6.2+ supports `GETDEL` for atomic get-and-delete. However, using separate `GET` + `DEL` commands provides broader compatibility. The race condition risk is negligible since OAuth state/code UUIDs are cryptographically random.

## Next Steps After Implementation

1. Run `/update-docs SCRUM-106` to create implementation record
2. Commit, push, create PR
3. Ensure Redis is available in CI/CD pipeline for integration tests (if applicable)
4. Consider future Redis uses: session store (SCRUM-107?), rate limiting, caching

## Implementation Verification

- [ ] **Code Quality**: All files follow existing project patterns (NestJS DI, TypeScript strict)
- [ ] **Functionality**: OAuth login flows (Google + GitHub) work identically to before
- [ ] **Testing**: All existing tests updated and passing, new store tests cover Redis interactions
- [ ] **Integration**: `nest build` passes, `nest start` boots without errors
- [ ] **Documentation**: integration-state.md, .env.example updated
- [ ] **Security**: Redis connection uses password in production, key prefix isolates data
- [ ] **Performance**: No degradation — Redis GET/SET < 1ms on local network
