# Backend Implementation Plan: SCRUM-115 Production Hardening

## Codebase State Snapshot

- **Date**: 2026-03-03
- **Last completed ticket**: SCRUM-111 (OAuth Account Unlinking) — commit `9ec8283` on `feature/SCRUM-111-backend`
- **Integration state verified**: Yes
- **Sprint**: Sprint 3 — Auth Enterprise (id=37)
- **Files verified against live code**:
  - `src/main.ts` (68 lines) — Swagger setup at lines 55-64, unconditionally enabled. Imports: SwaggerModule, DocumentBuilder (line 4). No Logger import. No NODE_ENV check around Swagger. Bootstrap order: validateProductionSecrets → NestFactory.create → HTTPS redirect → Helmet → cookieParser → CORS → ValidationPipe → HttpExceptionFilter → Swagger → listen.
  - `src/common/services/redis.module.ts` (55 lines) — @Global @Module with useFactory (lines 14-45). Reads: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_KEY_PREFIX. ioredis options: host, port, password, db, keyPrefix, maxRetriesPerRequest:1, lazyConnect:false. Logger('RedisModule'). Events: 'connect' + 'error'. OnModuleDestroy: redis.quit(). Exports: REDIS_CLIENT. No TLS.
  - `src/common/services/redis.constants.ts` (2 lines) — `REDIS_CLIENT = 'REDIS_CLIENT'`
  - `.env.example` (40 lines) — 27 env vars including 5 Redis vars. No SWAGGER_ENABLED, no REDIS_TLS vars.
- **Jest config** (package.json): `collectCoverageFrom` excludes `!main.ts` and `!**/*.module.ts`. Both excluded from coverage.
- **ENV test pattern** (validate-production-secrets.spec.ts, security.config.spec.ts): `jest.resetModules()` + `process.env = {...originalEnv}` + `jest.mock()`.
- **No existing test files**: No main.spec.ts, no redis.module.spec.ts.
- **REDIS_CLIENT consumers**: OAuthStateStore, OAuthCodeStore, PasskeyService.

## Overview

Two production hardening changes with no new modules, controllers, services, DTOs, guards, or npm dependencies:

1. **Swagger env-gate**: Conditionally enable Swagger UI. Enabled by default in development; disabled in production unless overridden via `SWAGGER_ENABLED=true`.
2. **Redis TLS**: Optional TLS support via `REDIS_TLS_ENABLED` and `REDIS_TLS_REJECT_UNAUTHORIZED` env vars. When enabled, passes `tls` options to ioredis constructor.
3. **Env documentation**: 3 new env vars in `.env.example`.

## Architecture Context

- **Module changes**: None. RedisModule unchanged structurally.
- **New components**: None.
- **Modified components**: main.ts (Swagger gate), redis.module.ts (TLS options + logging), .env.example (3 new vars)
- **New test file**: `src/common/services/tests/redis.module.spec.ts`
- **Coverage note**: Both main.ts and `*.module.ts` are excluded from Jest coverage collection. Tests still run but don't affect thresholds.

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-115-backend` from latest code
- **Steps**:
  1. `git checkout feature/SCRUM-111-backend && git pull`
  2. `git checkout -b feature/SCRUM-115-backend`

### Step 1: Swagger Env-Gate in main.ts

- **File**: `src/main.ts`
- **Action**: Wrap Swagger setup (lines 55-64) in conditional. Add Logger import.

#### 1.1: Add Logger to @nestjs/common import (line 3)

```typescript
import { ValidationPipe, Logger } from '@nestjs/common';
```

#### 1.2: Replace lines 55-64 with conditional Swagger block

```typescript
const swaggerEnabled =
  process.env.SWAGGER_ENABLED === 'true' ||
  process.env.NODE_ENV !== 'production';

if (swaggerEnabled) {
  const config = new DocumentBuilder()
    .setTitle('EM NexaCore API')
    .setDescription(
      'EM Ecosystem Core Platform — Authentication & User Management',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
} else {
  const logger = new Logger('Bootstrap');
  logger.log('Swagger UI disabled (production mode)');
}
```

**Logic**: `SWAGGER_ENABLED=true` overrides production (useful for staging). `NODE_ENV !== 'production'` keeps dev/test enabled by default. Both conditions use `||` — either is sufficient.

### Step 2: Redis TLS Configuration in redis.module.ts

- **File**: `src/common/services/redis.module.ts`
- **Action**: Read 2 new env vars, build conditional TLS options, pass to ioredis, update connect log.

#### 2.1: Add TLS env var reading (after line 23, keyPrefix)

```typescript
const tlsEnabled = process.env.REDIS_TLS_ENABLED === 'true';
const tlsRejectUnauthorized =
  process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false';
```

- `tlsEnabled`: opt-in, defaults to false
- `tlsRejectUnauthorized`: opt-out, defaults to true (secure default)

#### 2.2: Add tls to ioredis constructor options (spread pattern)

```typescript
const client = new Redis({
  host,
  port,
  password,
  db,
  keyPrefix,
  maxRetriesPerRequest: 1,
  lazyConnect: false,
  ...(tlsEnabled && { tls: { rejectUnauthorized: tlsRejectUnauthorized } }),
});
```

Using `...(tlsEnabled && { tls: {...} })` ensures the `tls` key is entirely absent when disabled.

#### 2.3: Update connect log to include TLS indicator

```typescript
client.on('connect', () => {
  logger.log(
    `Redis connected to ${host}:${port}${tlsEnabled ? ' (TLS)' : ''}`,
  );
});
```

### Step 3: Update .env.example

- **File**: `.env.example`

#### 3.1: Add SWAGGER_ENABLED after PORT line (line 5)

```env
# Swagger UI (enabled by default in non-production; set to 'true' to enable in production)
SWAGGER_ENABLED=""
```

#### 3.2: Add Redis TLS vars after existing Redis section (after REDIS_KEY_PREFIX)

```env
# Redis TLS (required for cloud-managed Redis: AWS ElastiCache, Azure Cache)
REDIS_TLS_ENABLED="false"
REDIS_TLS_REJECT_UNAUTHORIZED="true"
```

### Step 4: Build Verification

1. `npx nest build` — zero errors
2. No new npm dependencies needed

### Step 5: Unit Tests — Redis Module TLS Configuration

- **File**: `src/common/services/tests/redis.module.spec.ts` (NEW)
- **Action**: Test useFactory logic by mocking ioredis constructor and verifying options.

#### Testing approach

Mock `ioredis` via `jest.mock()` to intercept constructor calls. Use `Test.createTestingModule({ imports: [RedisModule] }).compile()` to trigger the useFactory. Assert on mock constructor's `calls[0][0]` for options.

#### Test cases (~8 tests):

| # | Describe | Test | Key Assertion |
|---|----------|------|---------------|
| 1 | TLS configuration | No TLS when REDIS_TLS_ENABLED not set | Constructor called without `tls` key |
| 2 | TLS configuration | No TLS when REDIS_TLS_ENABLED is 'false' | Constructor called without `tls` key |
| 3 | TLS configuration | TLS enabled when REDIS_TLS_ENABLED is 'true' | `tls: { rejectUnauthorized: true }` |
| 4 | TLS configuration | rejectUnauthorized=false when explicitly set | `tls: { rejectUnauthorized: false }` |
| 5 | TLS configuration | rejectUnauthorized defaults to true | `tls: { rejectUnauthorized: true }` |
| 6 | default configuration | Default host/port when env not set | `host: 'localhost', port: 6379` |
| 7 | default configuration | Custom host/port from env | Uses env values |
| 8 | logging | TLS indicator in connect log | '(TLS)' in log message |

### Step 6: Full Test Suite + Coverage

1. `npx jest --coverage` — all tests pass, all thresholds met
2. No regressions in existing 741 tests
3. Expected: ~749 total tests
4. Coverage: stmts ≥90%, branches ≥85%, funcs ≥90%, lines ≥90%

### Step 7: Runtime Verification

1. `npx nest start` — 53 routes, no DI errors
2. Swagger UI accessible at `/api/docs` in dev mode
3. Redis connects normally without TLS

### Step 8: Update Technical Documentation

| File | Changes |
|------|---------|
| `ai-specs/specs/integration-state.md` | Changelog entry for SCRUM-115 only. No module/guard/controller changes. |

No changes to api-spec.yml (no new endpoints) or data-model.md (no schema changes).

## Implementation Order

1. Step 0: Feature branch
2. Step 1: Swagger env-gate in main.ts
3. Step 2: Redis TLS in redis.module.ts
4. Step 3: .env.example updates
5. Step 4: Build verification
6. Step 5: Redis module unit tests
7. Step 6: Full test suite + coverage
8. Step 7: Runtime verification
9. Step 8: Documentation (integration-state.md changelog)

## Testing Checklist

- [ ] `nest build` compiles with zero errors
- [ ] All existing 741 tests pass (no regressions)
- [ ] redis.module.spec.ts: ~8 new tests passing
- [ ] Coverage thresholds met
- [ ] `nest start` loads, 53 routes registered
- [ ] Swagger: accessible in dev mode (default)
- [ ] Swagger: disabled when NODE_ENV=production, SWAGGER_ENABLED unset
- [ ] Swagger: enabled when NODE_ENV=production, SWAGGER_ENABLED=true
- [ ] Redis: connects without TLS by default
- [ ] Redis: TLS options passed when REDIS_TLS_ENABLED=true
- [ ] Redis: '(TLS)' in connect log when TLS enabled
- [ ] Redis: rejectUnauthorized defaults to true

## Error Response Format

N/A — Infrastructure configuration only. No new HTTP endpoints or error responses.

## Dependencies

- No new npm dependencies
- Uses existing: ioredis (built-in TLS), @nestjs/swagger, @nestjs/common Logger

## Notes

- **Backward compatibility**: All changes backward-compatible. Existing environments without new env vars behave identically.
- **SWAGGER_ENABLED=""** in .env.example: empty string ≠ 'true', so gating depends solely on NODE_ENV. Developers copy .env.example and get Swagger enabled by default.
- **Coverage exclusions**: main.ts and *.module.ts excluded from coverage. Tests validate correctness but don't affect thresholds.
- **No Prisma changes**: No schema changes, no migration.

## Implementation Verification

- [ ] Code Quality: Follows existing NestJS patterns, consistent Logger usage
- [ ] Functionality: Swagger conditional + Redis TLS work in all env combinations
- [ ] Security: Production defaults are Swagger disabled, TLS rejectUnauthorized true
- [ ] Testing: ~8 new tests, all thresholds met
- [ ] Integration: No DI changes, 53 routes
- [ ] Documentation: integration-state.md changelog updated

## Files Summary

### New (1 file)
- `src/common/services/tests/redis.module.spec.ts`

### Modified (3 files)
- `src/main.ts` — Swagger env-gate + Logger import
- `src/common/services/redis.module.ts` — TLS env vars + options + log indicator
- `.env.example` — +3 env vars with comments
