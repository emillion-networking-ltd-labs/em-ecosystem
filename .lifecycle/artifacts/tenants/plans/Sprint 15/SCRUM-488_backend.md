---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-488
sprint: Sprint 15
scope: backend
module: tenants
date: 2026-05-19
status: draft
last_completed_ticket: SCRUM-487
framework_version: 0.15.0
---

# Backend Implementation Plan: SCRUM-488 Prisma Tenant-Filter Middleware (AUTH v2 Phase 0.2)

## 1. Codebase State Snapshot

- **Date**: 2026-05-19
- **Last completed ticket**: SCRUM-487 (Tenant primitives + bootstrap migration, merged `1f4aa16` on `main`)
- **Integration state verified**: Yes — `ai-specs/specs/integration-state.md` re-read post-SCRUM-487 update (2026-05-19 changelog row); TenantsModule listed as `@Global`, AuditModule listed as non-global, both already in `AppModule.imports`.
- **Framework version**: 0.15.0 (from `em-development-framework/VERSION`).

### Files verified against live code

Every claim below traces back to one of these files actually read on 2026-05-19:

- `nexacore-api/src/app.module.ts` — confirms `OnlineMlScorerInterceptor` registered as `APP_INTERCEPTOR`; `AuditModule`, `TenantsModule`, `PrismaModule` all in `imports[]`.
- `nexacore-api/src/main.ts:67` — confirms `app.useGlobalFilters(new HttpExceptionFilter())`.
- `nexacore-api/src/prisma/prisma.service.ts` — confirms `class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy`, constructor takes 0 args, uses `PrismaPg` adapter.
- `nexacore-api/src/prisma/prisma.module.ts` — confirms `@Global() @Module({ providers: [PrismaService], exports: [PrismaService] })`.
- `nexacore-api/src/tenants/tenants.service.ts` — confirms 4 methods (`findById`, `findBySlug`, `create`, `update`) and constructor `(prisma: PrismaService)`. `findFirstActiveMembership` does NOT exist.
- `nexacore-api/src/tenants/tenants.module.ts` — `@Global() @Module({ providers: [TenantsService], exports: [TenantsService] })`.
- `nexacore-api/src/common/interceptors/online-ml-scorer.interceptor.ts` — confirms the pattern to mirror (RxJS `tap()`, fail-open wrapper, AUTH_SKIP_PATHS early return).
- `nexacore-api/src/audit/audit.service.ts` — confirms `AuditService` constructor `(prisma: PrismaService)` and the `log(entry: AuditLogEntry): Promise<void>` API.
- `nexacore-api/src/audit/audit.module.ts` — confirms NO `@Global` decorator; AuditModule must be explicitly imported.
- `nexacore-api/src/audit/enums/audit-action.enum.ts` — confirms current 40 values; `TENANT_FILTER_BYPASS` does NOT exist.
- `nexacore-api/src/audit/interfaces/audit-log-entry.interface.ts` — confirms `AuditLogEntry { action, userId?, targetUserId?, ipAddress?, userAgent?, metadata? }`.
- `nexacore-api/src/common/filters/http-exception.filter.ts` — confirms `@Catch()` universal filter; maps `HttpException` subclasses (including `ForbiddenException`) to JSON envelope.
- `nexacore-api/src/common/constants/error-messages.ts` — confirms current namespaces; `tenantContext` namespace does NOT exist.
- `nexacore-api/prisma/schema.prisma` — confirms `User`, `TenantMembership` (with `@@unique([tenantId, userId])` + `@@index([userId, status])`), `AuditAction` enum at lines 21-60.
- `nexacore-api/prisma/migrations/20260328194437_add_oauth_auto_verified_audit_action/migration.sql` — sample enum-extension migration: `ALTER TYPE "AuditAction" ADD VALUE 'OAUTH_AUTO_VERIFIED';` standalone.
- `nexacore-api/package.json` — confirms `@prisma/client ^7.8.0` and `prisma ^7.8.0`; jest `coverageThreshold` = `branches 80 / functions 85 / lines 90 / statements 90`.
- `nexacore-api/src/auth/strategies/jwt.strategy.ts` — confirms `validate()` returns `SafeUser` (no `tenantId` in JWT v1); Passport attaches result to `req.user`.

### Constructor signatures verified (current state)

- `PrismaService()` — 0 args. `extends PrismaClient`. Adapter built in body.
- `TenantsService(prisma: PrismaService)` — 1 arg.
- `AuditService(prisma: PrismaService)` — 1 arg.
- `OnlineMlScorerInterceptor(scorer: OnlineMlScorerService)` — 1 arg. Model for the new interceptor.

### Methods verified to exist (integration points this plan references)

- `TenantsService.findById(id): Promise<Tenant | null>` — `tenants.service.ts:24-26`.
- `TenantsService.create(dto): Promise<Tenant>` — `tenants.service.ts:50-72`.
- `AuditService.log(entry: AuditLogEntry): Promise<void>` — `audit.service.ts:14-30`.
- `PrismaClient.$extends({ query: { $allModels: { ... } } })` — Prisma 7.8.0 API (verified via `@prisma/client` typings).

### Guard dependency chain verified

This plan introduces NO new `@UseGuards()` declarations. Existing chains (JwtAuthGuard, RolesGuard, PermissionsGuard) unchanged. The new `TenantContextInterceptor` is a GLOBAL `APP_INTERCEPTOR`, not a guard.

### Discrepancies with integration-state.md

None. `integration-state.md` was just refreshed by SCRUM-487's `/update-docs` (2026-05-19) and matches live code at HEAD `1f4aa16`.

### Plan-time decisions (locked from `/enrich-us`)

| ID | Decision | Rationale |
|----|----------|-----------|
| D-A | Prisma 7 Client Extension (`$extends({query:...})`), NOT legacy `$use()` | `$use()` deprecated in Prisma 5+, broken for some operations in 7+. |
| D-B | `AsyncLocalStorage`, NOT NestJS REQUEST-scope providers | REQUEST-scope cascades transitively → singleton perf collapse. ALS is native Node, zero cost across async boundaries. |
| D-C | Tenant-scoped models in this ticket = Phase 0.1 set only (`TenantSettings`, `TenantMembership`, `TenantInvitation`) | Session / AuditLog / TrustedDevice get `tenantId` in Phase 0.3 or 1 per program doc §2.2. |
| D-D | Bypass = scope-based (`TenantContext.runWithBypass(reason, fn)`), NOT Prisma argument | Prevents accidental per-query bypass; forces explicit audited entry point. |
| D-E | Tenant context source = `TenantContextInterceptor` (APP_INTERCEPTOR), resolves `findFirstActiveMembership(req.user.sub)` | Bridge until JWT v2 (Phase 1) carries `tenantId` in payload. |
| D-F | Fail-closed: tenant-scoped query without context AND without bypass throws `TenantContextMissingError` | Mapped to `ForbiddenException` at controller boundary by existing `HttpExceptionFilter`. |
| D-G | **Audit of bypass entry happens in the INTERCEPTOR (not in the Prisma extension)** | Operator decision 2026-05-19: prevents `AuditService` ↔ `PrismaService` DI cycle. `AuditModule` stays non-global. Semantically correct: audit the decision, not its derived effects. |
| D-H | PrismaModule refactored to **useFactory** provider; `class PrismaService extends PrismaClient` kept as class-shaped injection token only | Cleanest pattern to install a `$extends` client at boot time without forcing all 13 consumers to use `@Inject(...)`. NestJS resolves `PrismaService` token to the factory's returned extended client. `onModuleInit`/`onModuleDestroy` lifecycle migrates from the class to module-level hooks (`PrismaModule implements OnApplicationShutdown`). |

### CI Gate Anticipation (per workflow-standards §22 / SCRUM-485)

| CI gate                                       | Expected behavior |
|-----------------------------------------------|-------------------|
| Job 1: `py_compile (all tools)`               | PASS / unchanged (no Python tooling touched) |
| Job 2: `Schema validate (changed artifacts)`  | PASS — new `.md` artifacts (plan + verify + record) route via existing `changes/tenants/{plans,records}/` SCHEMA_BY_PATH rules from SCRUM-487 |
| Job 2: `Groundedness (warn-only)`             | PASS / unchanged |
| Job 2: `Audit: coupling check (warn-only)`    | PASS / unchanged (no F-resolutions or G-findings touched) |
| Job 2: `Audit: completion check (warn-only)`  | SKIP (no new audit folder) |
| Job 3: `Schema validate (historical)`         | SKIP (no `ai-specs/schemas/**` change) |
| Job 4: `Smoke test: state-machine.py`         | PASS / unchanged |
| Job 5: `pytest (linchpin tests)`              | PASS / unchanged |
| em-ecosystem CI Layer 4 (Backend Tests)       | **conditional** — pre-existing 89.85% < 90% line threshold. This ticket adds ~80 new test cases against newly-introduced units (`TenantContext`, extension, interceptor, helper) which are heavily testable → expected net-positive coverage. Target +1.0pp local jest coverage. If SCRUM-490 (coverage sweep) lands first, this is moot. |

**SKIP_PATHS / SCHEMA_BY_PATH expectations**: NO new `.md` or `.yml` files outside `ai-specs/changes/tenants/{plans,records}/Sprint 15/`. Zero new routing rules needed.

## 2. Regression Impact Analysis

### Blast radius

**Direct dependents (import `PrismaService`)** — 13 production files. None require constructor signature changes; the factory swap is consumer-transparent at the TypeScript-token level.

| File | Reads/writes any Phase 0.1 tenant-scoped model (`TenantSettings`, `TenantMembership`, `TenantInvitation`)? |
|------|-----------------------------------------------------------------------------------------------------------|
| `src/audit/audit.service.ts` | No — writes `auditLog` only (not in scoped set Phase 0.2) |
| `src/auth/passkey.service.ts` | No |
| `src/auth/email-verification.service.ts` | No |
| `src/auth/trusted-device.service.ts` | No (Phase 0.2 — `TrustedDevice.tenantId` lands Phase 0.3/1) |
| `src/auth/password-reset.service.ts` | No |
| `src/tenants/tenants.service.ts` | **YES** — reads/writes `Tenant` and `TenantSettings`. New method `findFirstActiveMembership` reads `TenantMembership`. |
| `src/geolocation/impossible-travel.service.ts` | No |
| `src/security/suspicious-login.service.ts` | No |
| `src/users/users.service.ts` | No (User is NOT in scoped set) |
| `src/permissions/permissions.service.ts` | No (Permission / RolePermission are NOT in scoped set) |
| `src/sessions/sessions.service.ts` | No (Phase 0.2 — `Session.tenantId` lands Phase 0.3/1) |
| `src/auth/tests/auth-test.helpers.ts` | Test helper — not production |

**Transitive dependents (consumers of modified modules)**: zero — `PrismaModule` exports remain `[PrismaService]` (token unchanged).

**Test dependents (mock `PrismaService` in `.spec.ts`)** — 7 spec files. All mock via a `Record<string, jest.Mock>` pattern; none instantiate `PrismaService` itself. Switching to a factory-produced extended client does NOT affect test mocks because consumer-surface model proxies (`prisma.user.findMany`, etc.) are preserved.

### Breaking changes identified

| Class/Function | Change | Consequence | Mitigation |
|----------------|--------|-------------|------------|
| `PrismaService` | `class PrismaService extends PrismaClient` kept as type+token; `PrismaModule` provider switches from class-instance to `useFactory` | `onModuleInit`/`onModuleDestroy` defined on the class WILL NOT FIRE (factory bypasses class instantiation). Class body methods become dead code. | Factory itself calls `$connect()`. `PrismaModule` implements `OnApplicationShutdown` to call `$disconnect()`. Delete the dead `onModuleInit`/`onModuleDestroy` methods from the class to prevent confusion. |
| `TenantsService` | NEW method `findFirstActiveMembership(userId): Promise<TenantMembership \| null>` | Additive — zero impact on existing consumers. | Constructor signature unchanged. |
| `AuditAction` enum (Prisma + TS) | NEW value `TENANT_FILTER_BYPASS` | Additive — no existing code references this value. | Migration `ALTER TYPE "AuditAction" ADD VALUE 'TENANT_FILTER_BYPASS';` standalone; matches OAUTH_AUTO_VERIFIED migration pattern. |
| `ErrorMessages` constant | NEW `tenantContext` namespace | Additive. | None needed. |
| `app.module.ts` providers | NEW `APP_INTERCEPTOR` for `TenantContextInterceptor` | One additional global interceptor wraps every request. Negligible perf cost — measured one DB hit (membership lookup) per authenticated request, indexed by `@@index([userId, status])`. | Acceptable. Phase 1 (JWT v2 with `tenantId` in payload) eliminates the DB hit. |

### API contract impact

NO endpoints added, modified, or removed. `api-spec.yml` requires NO update.

### Schema migration impact

Single forward-only DDL: `ALTER TYPE "AuditAction" ADD VALUE 'TENANT_FILTER_BYPASS';`. Postgres `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block — Prisma's migration runner emits the statement standalone (verified against the OAUTH_AUTO_VERIFIED migration). Backward compatible: no existing row references the new value.

### Test files requiring updates

The 7 spec files that mock `PrismaService` do NOT require updates (mock surface unchanged). However:

- `src/tenants/tests/tenants.service.spec.ts` — ADD 2 tests for `findFirstActiveMembership` (happy path with ordered memberships + empty case).
- NEW spec files (Phase 0.2 surface):
  - `src/common/context/tests/tenant-context.spec.ts`
  - `src/common/context/tests/tenant-context.errors.spec.ts`
  - `src/prisma/tests/tenant-filter.extension.spec.ts`
  - `src/common/interceptors/tests/tenant-context.interceptor.spec.ts`
  - `src/common/interceptors/tests/audit-bypass.helper.spec.ts`

### Blast radius size

**5 production MOD files + 2 production NEW directories** (`src/common/context/`, plus 3 new files in existing `src/prisma/`, `src/common/interceptors/`, `src/tenants/`). Below the 5-file extra-review threshold for any single module, but spans 3 modules (prisma, common, tenants) — flag for `/verify` to inspect cross-module integration explicitly.

## 3. Overview

Ship the multi-tenant **defense-in-depth** primitive defined in program doc §2.4: every Prisma query against a registered tenant-scoped model is automatically constrained to the current tenant via a Prisma Client Extension; the current tenant comes from an `AsyncLocalStorage` slot populated by a global NestJS interceptor; opting out requires an explicit `runWithBypass(reason, fn)` scope that is audited at entry. No future query needs to remember `where: { tenantId }` — the middleware enforces it transparently and fails closed if context is missing.

Phase 0.2 ships the INFRASTRUCTURE (extension, context library, interceptor, helper, audit enum value) and turns it on for the 3 Phase-0.1 tenant-scoped models. Adding `tenantId` columns to Session / AuditLog / TrustedDevice and adopting the middleware for those models is **Phase 0.3 or Phase 1** — explicitly out of scope here. The registry of scoped model names is a single file so future phases extend it with a one-line append.

Architecture principles applied:

- **Fail-closed**: missing context on a scoped model throws; never silently bypasses.
- **Audit-on-decision**: bypass is audited where the choice is made (interceptor / explicit helper call), not where the queries execute. Operator decision 2026-05-19; avoids the `AuditService` ↔ `PrismaService` DI cycle.
- **Forward-compatible**: interceptor's tenant-resolution contract works with JWT v1 (membership lookup) AND JWT v2 (payload-only lookup) — Phase 1 swap is one method body change.
- **Test-first observability**: every public API path (run, runWithBypass, getOrThrow, helper, interceptor) has direct spec coverage; the extension is tested through a mock PrismaClient that records args.

## 4. Architecture Context

### Modules involved

- **PrismaModule** (existing, `@Global`) — provider switches from class-instance to factory. Module declares `OnApplicationShutdown` to call `$disconnect()`.
- **TenantsModule** (existing, `@Global`, from SCRUM-487) — `TenantsService` gains one new method.
- **CommonContext (new lightweight surface)** — pure-TS library under `src/common/context/`. No NestJS module declaration; consumers import functions directly. Rationale: `AsyncLocalStorage` is process-global state; wrapping it in DI adds friction without benefit.
- **AuditModule** (existing, non-global) — no change. The TenantContextInterceptor imports `AuditService` via the global container because `AuditModule` is in `AppModule.imports` and the interceptor is declared in `AppModule.providers`.

### Components affected

| Layer | Component | Disposition |
|-------|-----------|-------------|
| Data | `prisma.service.ts` | Class body trimmed; module provider becomes factory |
| Data | `prisma.module.ts` | Provider switch; `OnApplicationShutdown` lifecycle |
| Data | `tenant-filter.extension.ts` (NEW) | Prisma Client Extension factory |
| Data | `prisma/migrations/<date>_add_tenant_filter_bypass_audit_action/migration.sql` (NEW) | Enum extension |
| Schema | `prisma/schema.prisma` | One new `AuditAction` value |
| Context | `common/context/tenant-context.ts` (NEW) | ALS holder + public API |
| Context | `common/context/tenant-context.errors.ts` (NEW) | Error subclasses |
| Context | `common/context/scoped-models.ts` (NEW) | Registry constant |
| Service | `tenants.service.ts` | +1 method |
| Audit | `audit-action.enum.ts` | +1 value |
| Audit | `common/interceptors/audit-bypass.helper.ts` (NEW) | Wraps `runWithBypass` + `AuditService.log()` |
| Pipeline | `common/interceptors/tenant-context.interceptor.ts` (NEW) | Global APP_INTERCEPTOR |
| Wiring | `app.module.ts` | Register interceptor |
| Errors | `common/constants/error-messages.ts` | +`tenantContext` namespace |
| Tests | 5 new `.spec.ts` files + 1 extension to `tenants.service.spec.ts` | See §7 |

### Files referenced

Every file path used in §6 traces to either an existing file read in §1 or a NEW file listed above. Zero placeholder paths.

## 5. Architecture Context — Detailed Patterns

### 5.1 Prisma Client Extension shape

```typescript
// src/prisma/tenant-filter.extension.ts (sketch — final code in /develop)
import { Prisma } from '@prisma/client';
import { TenantContext } from '../common/context/tenant-context';
import { SCOPED_MODELS } from '../common/context/scoped-models';
import { CrossTenantViolationError } from '../common/context/tenant-context.errors';

export function buildTenantFilterExtension() {
  return Prisma.defineExtension({
    name: 'tenant-filter',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!SCOPED_MODELS.includes(model as string)) {
            return query(args);
          }
          if (TenantContext.isBypassed()) {
            return query(args);
          }
          const active = TenantContext.getOrThrow();
          const patched = injectTenantId(operation, args, active);
          return query(patched);
        },
      },
    },
  });
}
```

`injectTenantId` is a pure function (testable in isolation) that:

- For `findFirst | findUnique | findMany | count | aggregate | groupBy | updateMany | deleteMany`: ensures `args.where.tenantId === active` (or sets it). If `args.where.tenantId` is explicitly set to a different value → throws `CrossTenantViolationError`.
- For `create | createMany`: ensures `args.data.tenantId === active`.
- For `update | delete | upsert`: ensures `args.where.tenantId === active` AND for upsert `args.create.tenantId === active`.
- For unknown operation: pass-through (defensive — Prisma may add ops in minor versions).

### 5.2 TenantContext shape (pure TS, no NestJS DI)

```typescript
// src/common/context/tenant-context.ts (sketch)
import { AsyncLocalStorage } from 'async_hooks';
import {
  TenantContextMissingError,
  BypassWithoutReasonError,
} from './tenant-context.errors';

interface ContextSlot {
  tenantId: string | null;     // null while bypassed
  bypassReason: string | null; // non-null implies bypass mode
}

const als = new AsyncLocalStorage<ContextSlot>();

export const TenantContext = {
  run<T>(tenantId: string, fn: () => T | Promise<T>): T | Promise<T> {
    return als.run({ tenantId, bypassReason: null }, fn);
  },
  runWithBypass<T>(reason: string, fn: () => T | Promise<T>): T | Promise<T> {
    if (!reason) throw new BypassWithoutReasonError();
    return als.run({ tenantId: null, bypassReason: reason }, fn);
  },
  getActiveTenantId(): string | null { return als.getStore()?.tenantId ?? null; },
  isBypassed(): boolean { return als.getStore()?.bypassReason !== null && als.getStore()?.bypassReason !== undefined; },
  getBypassReason(): string | null { return als.getStore()?.bypassReason ?? null; },
  getOrThrow(): string {
    const id = TenantContext.getActiveTenantId();
    if (!id) throw new TenantContextMissingError();
    return id;
  },
};
```

### 5.3 Factory provider for PrismaService

```typescript
// src/prisma/prisma.module.ts (sketch)
import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaService } from './prisma.service';
import { buildTenantFilterExtension } from './tenant-filter.extension';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: async () => {
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
        const base = new PrismaClient({ adapter });
        await base.$connect();
        return base.$extends(buildTenantFilterExtension()) as unknown as PrismaService;
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule implements OnApplicationShutdown {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async onApplicationShutdown(): Promise<void> {
    await (this.prisma as unknown as PrismaClient).$disconnect();
  }
}
```

`PrismaService` class declaration shrinks to just the class shell (used for the token + type only):

```typescript
// src/prisma/prisma.service.ts (sketch — onModuleInit/onModuleDestroy methods removed)
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }
}
```

### 5.4 Interceptor + audit-bypass helper

```typescript
// src/common/interceptors/tenant-context.interceptor.ts (sketch)
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenants: TenantsService) {}

  async intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: { sub?: string } }>();
    const sub = req.user?.sub;
    if (!sub) {
      // Unauthenticated path — bypass without audit (documented exception).
      return new Observable((sub) => {
        TenantContext.runWithBypass('unauthenticated', () => {
          next.handle().subscribe(sub);
        });
      });
    }
    const membership = await this.tenants.findFirstActiveMembership(sub);
    if (!membership) {
      throw new ForbiddenException(ErrorMessages.tenantContext.MISSING);
    }
    return new Observable((subscriber) => {
      TenantContext.run(membership.tenantId, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
```

```typescript
// src/common/interceptors/audit-bypass.helper.ts (sketch)
export async function auditAndRunBypass<T>(
  audit: AuditService,
  reason: string,
  ctx: { userId?: string; ipAddress?: string; userAgent?: string },
  fn: () => T | Promise<T>,
): Promise<T> {
  await audit.log({
    action: AuditAction.TENANT_FILTER_BYPASS,
    userId: ctx.userId ?? null,
    ipAddress: ctx.ipAddress ?? null,
    userAgent: ctx.userAgent ?? null,
    metadata: { reason },
  });
  return TenantContext.runWithBypass(reason, fn) as Promise<T>;
}
```

The helper is the production hook for future platform-admin code paths. Phase 0.2 ships it tested but never calls it from a controller — that's Phase 1 work.

### 5.5 Scoped models registry

```typescript
// src/common/context/scoped-models.ts
export const SCOPED_MODELS = [
  'TenantSettings',
  'TenantMembership',
  'TenantInvitation',
] as const;

export type TenantScopedModel = (typeof SCOPED_MODELS)[number];
```

One-line append in Phase 0.3 / Phase 1 grows the surface.

## 6. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to `feature/SCRUM-488-tenants-backend`.
- **Branch Naming**: MANDATORY `feature/SCRUM-488-tenants-backend` (not `feature/SCRUM-488` — separates concerns per workflow-standards.mdc).
- **Implementation Steps**:
  1. `git checkout main && git pull origin main` — verify HEAD is `1f4aa16` or later (SCRUM-487 merged).
  2. `git checkout -b feature/SCRUM-488-tenants-backend`.
  3. `git branch` — confirm new branch is active.
- **Notes**: NEVER branch from another feature branch. Refer to `ai-specs/specs/backend-standards.mdc` "Development Workflow" + `workflow-standards.mdc §15` (AUTH change-control — this ticket touches `prisma.service.ts` + `schema.prisma`, BOTH §15.1 boundary files; PR must cite §15 review path at `/commit` and split-PR is NOT required because no `src/auth/**` source code is touched).

### Step 1: Add `TENANT_FILTER_BYPASS` to AuditAction enum + migration

- **Files**: `nexacore-api/prisma/schema.prisma` (MOD), `nexacore-api/prisma/migrations/<timestamp>_add_tenant_filter_bypass_audit_action/migration.sql` (NEW), `nexacore-api/src/audit/enums/audit-action.enum.ts` (MOD).
- **Action**: Append the enum value at both the Prisma schema and TS layer.
- **Implementation Steps**:
  1. Edit `schema.prisma`: append `TENANT_FILTER_BYPASS` as the last value inside `enum AuditAction { ... }` (around line 58).
  2. Hand-write migration directory `prisma/migrations/<UTC timestamp>_add_tenant_filter_bypass_audit_action/migration.sql` with single line:
     ```sql
     -- AlterEnum
     ALTER TYPE "AuditAction" ADD VALUE 'TENANT_FILTER_BYPASS';
     ```
     Pattern matches `20260328194437_add_oauth_auto_verified_audit_action/migration.sql` exactly.
  3. Apply via `npx prisma migrate deploy` (DB user lacks CREATE DATABASE so `migrate dev` shadow DB is blocked — same Accepted-Trivial pattern as SCRUM-487 Step 2).
  4. Run `npx prisma generate`.
  5. Append `TENANT_FILTER_BYPASS = 'TENANT_FILTER_BYPASS'` to `audit-action.enum.ts` as the final entry (after `OAUTH_AUTO_VERIFIED`).
- **Implementation Notes**: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block — Prisma's migration runner emits it standalone (no `BEGIN/COMMIT`). Smoke-verify with `psql -c "SELECT 'TENANT_FILTER_BYPASS'::\"AuditAction\";"`.

### Step 2: Create TenantContext library + errors

- **Files**: `nexacore-api/src/common/context/tenant-context.ts` (NEW), `nexacore-api/src/common/context/tenant-context.errors.ts` (NEW).
- **Action**: Pure-TS library implementing the public API in §5.2.
- **Function Signature**:
  ```typescript
  export const TenantContext: {
    run<T>(tenantId: string, fn: () => T | Promise<T>): T | Promise<T>;
    runWithBypass<T>(reason: string, fn: () => T | Promise<T>): T | Promise<T>;
    getActiveTenantId(): string | null;
    isBypassed(): boolean;
    getBypassReason(): string | null;
    getOrThrow(): string;
  };
  ```
- **Implementation Steps**:
  1. Create `tenant-context.errors.ts` with three Error subclasses: `TenantContextMissingError`, `CrossTenantViolationError`, `BypassWithoutReasonError`. Each `extends Error` with a `name` property set to the class name (for matchers in tests).
  2. Create `tenant-context.ts` with one module-private `AsyncLocalStorage<ContextSlot>` instance and the exported `TenantContext` object literal.
  3. `getOrThrow()` reads `getActiveTenantId()` and throws `TenantContextMissingError` if `null`.
  4. `isBypassed()` returns `true` iff the current store exists AND `bypassReason !== null`.
- **Dependencies**: `async_hooks` (Node built-in). No NestJS imports.
- **Implementation Notes**: ALS instances are module-scoped — do NOT re-instantiate per-test (would break propagation). Tests use `TenantContext.run(...)` to set scope.

### Step 3: Create scoped-models registry

- **File**: `nexacore-api/src/common/context/scoped-models.ts` (NEW).
- **Action**: Export the frozen registry array and union type.
- **Implementation Steps**: Single-file constant as shown in §5.5.
- **Implementation Notes**: Use `as const` for type-narrowing. Future tickets append by editing this one file.

### Step 4: Build Prisma Client Extension

- **File**: `nexacore-api/src/prisma/tenant-filter.extension.ts` (NEW).
- **Action**: Implement the `$extends` factory described in §5.1, plus the `injectTenantId(operation, args, active)` pure helper.
- **Function Signature**:
  ```typescript
  export function buildTenantFilterExtension(): ReturnType<typeof Prisma.defineExtension>;
  export function injectTenantId(operation: string, args: any, active: string): any; // exported only for unit tests
  ```
- **Implementation Steps**:
  1. Use `Prisma.defineExtension({ name: 'tenant-filter', query: { $allModels: { $allOperations: async ({...}) => ... } } })`.
  2. In the operation handler: registry check → `if (!SCOPED_MODELS.includes(model as string)) return query(args);`.
  3. Bypass check: `if (TenantContext.isBypassed()) return query(args);`.
  4. Resolve active tenant: `const active = TenantContext.getOrThrow();` (throws if no context).
  5. Call `injectTenantId(operation, args, active)` then `return query(patchedArgs);`.
  6. Implement `injectTenantId` as a switch over the operation set listed in §5.1. For read ops with no `args.where` → wrap into `args.where = { tenantId: active }`. For read ops with `args.where.tenantId` set → if mismatching → throw `CrossTenantViolationError`. For write ops (`create`, `createMany`, `upsert.create`) → inject into `args.data` (handling `createMany.data` array).
- **Implementation Notes**: Export `injectTenantId` for direct unit testing without an actual PrismaClient mock. The extension itself is tested via a mock `query` function that records the args it receives.

### Step 5: Refactor PrismaModule to factory + install extension

- **Files**: `nexacore-api/src/prisma/prisma.service.ts` (MOD — trim class body), `nexacore-api/src/prisma/prisma.module.ts` (MOD — factory provider + `OnApplicationShutdown`).
- **Action**: Apply pattern in §5.3.
- **Implementation Steps**:
  1. `prisma.service.ts`: remove `onModuleInit` and `onModuleDestroy` methods + `OnModuleInit, OnModuleDestroy` imports/interfaces. Keep the constructor with the adapter (kept ONLY for type compatibility — the class is no longer instantiated by NestJS in the new flow, but TypeScript needs the constructor signature for `extends PrismaClient` to type-check).
  2. `prisma.module.ts`: replace `providers: [PrismaService]` with the factory provider shown in §5.3. Implement `OnApplicationShutdown` to call `$disconnect()` on the injected extended client.
  3. Verify all 13 consumer files still type-check (`nest build`) — they should, since the factory return value's consumer surface (`prisma.user.findMany`, etc.) is the same.
- **Implementation Notes**: This is the most subtle change. The `as unknown as PrismaService` cast in the factory is necessary because `$extends` returns a wider type than the bare `PrismaService` class; we lose the extension-typing at the injection boundary (acceptable — extension is transparent to callers).

### Step 6: Add `findFirstActiveMembership` to TenantsService

- **File**: `nexacore-api/src/tenants/tenants.service.ts` (MOD).
- **Action**: Add ONE method returning the user's first active membership ordered deterministically.
- **Function Signature**:
  ```typescript
  async findFirstActiveMembership(userId: string): Promise<TenantMembership | null>;
  ```
- **Implementation Steps**:
  1. Use bypass scope to read from a scoped model without context:
     ```typescript
     return TenantContext.runWithBypass('tenant-context-resolution', () =>
       this.prisma.tenantMembership.findFirst({
         where: { userId, status: 'active' },
         orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
       }),
     ) as Promise<TenantMembership | null>;
     ```
     **Why bypass here**: this method is the BOOTSTRAP of tenant context resolution itself; it cannot rely on context being set, and it queries a tenant-scoped model. Bypass with documented reason is the correct primitive. NO audit log written for this bootstrap case — documented exception alongside the `'unauthenticated'` case.
  2. Add new method below `update()`.
- **Implementation Notes**: Postgres index `@@index([userId, status])` already exists from SCRUM-487 schema — query is single-index lookup. The `'tenant-context-resolution'` reason string is treated by the helper / interceptor as audit-exempt at the call site (interceptor never calls `auditAndRunBypass` for this path).

### Step 7: Create TenantContextInterceptor + audit-bypass helper

- **Files**: `nexacore-api/src/common/interceptors/tenant-context.interceptor.ts` (NEW), `nexacore-api/src/common/interceptors/audit-bypass.helper.ts` (NEW).
- **Action**: Wire request → tenant context per §5.4 + ship the production helper for future bypass paths.
- **Implementation Steps**:
  1. Interceptor: `@Injectable()` class implementing `NestInterceptor`. Constructor injects `TenantsService`. `intercept()` resolves tenant per §5.4 (bypass for unauthenticated, lookup for authenticated, ForbiddenException for authenticated-but-zero-memberships).
  2. Use RxJS observable wrapping pattern: `new Observable((subscriber) => { TenantContext.run(tenantId, () => next.handle().subscribe(subscriber)); })`. This ensures ALS context propagates through the entire RxJS chain.
  3. Helper (`auditAndRunBypass`): standalone exported function per §5.4. Takes `AuditService` instance, reason, request context fields, and the function to run inside the bypass scope. Logs FIRST (audit-on-decision), then runs.
- **Implementation Notes**: Subtle ALS interaction: `als.run(slot, fn)` wraps `fn` and any async work it schedules. RxJS pipelines preserve ALS via `unhandledRejection` / `setImmediate` because Node's async hooks integrate with all native primitives. Verified pattern (matches Prisma docs' own tenancy example).

### Step 8: Register interceptor in app.module.ts

- **File**: `nexacore-api/src/app.module.ts` (MOD).
- **Action**: Add `TenantContextInterceptor` as a second `APP_INTERCEPTOR`.
- **Implementation Steps**:
  1. Import `TenantContextInterceptor`.
  2. Add to `providers[]`:
     ```typescript
     { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
     ```
  3. Confirm order with existing `OnlineMlScorerInterceptor` does not matter (both `tap()` independently; ALS propagates regardless).
- **Implementation Notes**: `AuditModule` and `TenantsModule` are already in `AppModule.imports[]` (verified §1). No new module imports needed.

### Step 9: Add `ErrorMessages.tenantContext` namespace

- **File**: `nexacore-api/src/common/constants/error-messages.ts` (MOD).
- **Action**: Append a new namespace after `tenants`:
  ```typescript
  tenantContext: {
    MISSING: 'Tenant context required for this operation',
    CROSS_TENANT: 'Cross-tenant access denied',
    BYPASS_WITHOUT_REASON: 'Tenant filter bypass requires a reason',
  },
  ```
- **Implementation Notes**: User-visible messages must not leak internal implementation detail (per SCRUM-433 hygiene). Validation that the error class names map to these strings is enforced by the interceptor (`ForbiddenException(ErrorMessages.tenantContext.MISSING)`).

### Step 10: Write tests (suites A–E)

- **Files** (5 NEW + 1 MOD):
  - `src/common/context/tests/tenant-context.spec.ts` (NEW) — suite A
  - `src/common/context/tests/tenant-context.errors.spec.ts` (NEW) — error class invariants
  - `src/prisma/tests/tenant-filter.extension.spec.ts` (NEW) — suite B
  - `src/common/interceptors/tests/tenant-context.interceptor.spec.ts` (NEW) — suite C
  - `src/common/interceptors/tests/audit-bypass.helper.spec.ts` (NEW) — helper
  - `src/tenants/tests/tenants.service.spec.ts` (MOD) — suite D (2 new tests for `findFirstActiveMembership`)
- **Suite A (`tenant-context.spec.ts`)**:
  - `run(tenantId, sync fn)` — observed inside `fn`; undefined outside `run`.
  - `run(tenantId, async fn)` — context propagates across `await`.
  - Nested `run(A, () => run(B, fn))` — innermost wins; outer restored on exit.
  - `runWithBypass(reason, fn)` — `isBypassed()=true`, `getBypassReason()=reason`.
  - `getOrThrow()` throws `TenantContextMissingError` outside context AND outside bypass.
  - `runWithBypass('')` throws `BypassWithoutReasonError`.
- **Suite B (`tenant-filter.extension.spec.ts`)**:
  - Test the exported `injectTenantId(op, args, active)` directly with each of the 13 operations:
    - `findMany` with no where → injects.
    - `findMany` with where but no tenantId → injects.
    - `findMany` with where.tenantId === active → no-op.
    - `findMany` with where.tenantId ≠ active → throws `CrossTenantViolationError`.
    - `create` with data.tenantId absent → injects into `data`.
    - `create` with data.tenantId === active → no-op.
    - `create` with data.tenantId ≠ active → throws.
    - `createMany` with array data → injects into each item.
    - `update` / `delete` / `upsert` — symmetric coverage.
  - Test the `$allOperations` handler with a stubbed `query` function and stubbed `TenantContext` (using `TenantContext.run(...)` to set context):
    - Non-scoped model (e.g. `'User'`) → `query` receives untouched args.
    - Scoped model + no context + no bypass → throws.
    - Scoped model + bypass scope → `query` receives untouched args; verify `TenantContext.isBypassed()` was checked.
- **Suite C (`tenant-context.interceptor.spec.ts`)**:
  - Authenticated request with 1 active membership → handler observes `TenantContext.getActiveTenantId() === membership.tenantId`.
  - Authenticated request with multiple memberships → deterministic ordering (oldest `joinedAt` first; tiebreak by `id` asc).
  - Authenticated request with 0 active memberships → interceptor throws `ForbiddenException` (mapped via `HttpExceptionFilter` to JSON envelope with message `Tenant context required for this operation`).
  - Unauthenticated request (no `req.user`) → handler observes `isBypassed()===true` AND `getBypassReason()==='unauthenticated'` AND NO `AuditService.log()` call.
- **Suite D (`tenants.service.spec.ts` — extend)**:
  - `findFirstActiveMembership` happy path: user with 3 memberships → returns oldest active by `joinedAt ASC`.
  - `findFirstActiveMembership` empty: user with 0 active memberships → returns `null`.
- **Suite E (`audit-bypass.helper.spec.ts`)**:
  - `auditAndRunBypass` happy path: calls `audit.log({action: TENANT_FILTER_BYPASS, ...})` THEN runs `fn` inside bypass scope; verifies order.
  - `auditAndRunBypass` audit-fails-quiet: if `audit.log` rejects, the bypass STILL proceeds (audit failure is logged via Nest Logger but does not block the operation — matches existing `AuditService.log()` behavior which swallows errors internally).
  - Verify `fn` observes `TenantContext.isBypassed()===true` and `getBypassReason()===reason`.
- **Coverage target**: full project ≥+1.0pp over the current 89.85% line baseline (heavily testable units, ~80 new test cases expected).

### Step 11: nest build + jest + lint

- **Action**: Final pre-`/verify` quality gates.
- **Implementation Steps**:
  1. `npm run build` — must exit clean (catches DI/TS errors).
  2. `npx jest --maxWorkers=1 --forceExit` — must show full 1071 baseline + new suites, 0 failures.
  3. `npx eslint 'src/common/context/**/*.ts' 'src/prisma/tenant-filter.extension.ts' 'src/common/interceptors/tenant-context.interceptor.ts' 'src/common/interceptors/audit-bypass.helper.ts'` — zero errors. Auto-fix with `--fix` if trivial.
  4. `npx prettier --write` on the new files (Husky pre-commit will enforce this anyway).
  5. `npx prisma migrate status` — confirms the new migration is `Applied`.

### Step N+1: Update Technical Documentation

- **Action**: DEFERRED-BY-DESIGN to `/update-docs` per workflow-standards.mdc.
- **Files to update at `/update-docs`**:
  - `ai-specs/specs/integration-state.md`:
    - Module Registry: PrismaModule note about factory provider + `OnApplicationShutdown` lifecycle.
    - Global Interceptors: add `TenantContextInterceptor` (depends on `TenantsService`).
    - Service Dependency Chains: add `TenantsService → PrismaService + (via TenantContext bootstrap bypass scope)`.
    - Changelog row for 2026-05-19 SCRUM-488.
  - `ai-specs/specs/data-model.md`: add `TENANT_FILTER_BYPASS` to `AuditAction [IMPLEMENTED]` table.
  - `ai-specs/changes/auth/programs/AUTH-v2.md` §6: Phase 0.2 marked COMPLETE; next milestone = Phase 0.3 (HTTP surface).
  - `ai-specs/specs/api-spec.yml`: **no change** (no endpoints introduced).
- **References**: `ai-specs/specs/documentation-standards.mdc`.

## 7. Implementation Order

1. **Step 0** — Create feature branch
2. **Step 1** — Add `TENANT_FILTER_BYPASS` enum + migration
3. **Step 2** — TenantContext library + errors
4. **Step 3** — Scoped-models registry
5. **Step 4** — Prisma Client Extension (includes `injectTenantId`)
6. **Step 5** — Refactor PrismaModule to factory provider; trim PrismaService class
7. **Step 6** — Add `findFirstActiveMembership` to TenantsService
8. **Step 7** — TenantContextInterceptor + auditAndRunBypass helper
9. **Step 8** — Register interceptor in app.module.ts
10. **Step 9** — Add `ErrorMessages.tenantContext`
11. **Step 10** — Write all 5 new spec files + 2 new tests in tenants.service.spec.ts
12. **Step 11** — Build + jest + lint + prisma migrate status

(Step N+1 documentation update runs at `/update-docs`, not here.)

## 8. Testing Checklist

Post-implementation verification (operator's eyes pass over):

- [ ] Migration applied: `psql -c "SELECT 'TENANT_FILTER_BYPASS'::\"AuditAction\";"` returns the value.
- [ ] `nest build` exit 0.
- [ ] `npx jest --maxWorkers=1 --forceExit` — full project ≥ 1071 baseline + new suites, 0 failures.
- [ ] Coverage report: branches ≥ 80% / functions ≥ 85% / lines / statements net-positive (target +1.0pp on `lines` vs main).
- [ ] ESLint clean on all 6 NEW files.
- [ ] Prettier clean on all 6 NEW files (Husky enforces — local pre-commit must pass).
- [ ] `npx prisma migrate status` shows the new migration as `Applied`.
- [ ] Suite A (TenantContext) — 6/6 pass.
- [ ] Suite B (tenant-filter.extension) — `injectTenantId` happy/error/cross-tenant + `$allOperations` registry-check/bypass/no-context paths covered.
- [ ] Suite C (interceptor) — 4 paths covered (auth + 1 mem, auth + multi mem, auth + 0 mem, unauth).
- [ ] Suite D (TenantsService) — 2 new tests for `findFirstActiveMembership` pass; existing 12 tests still pass.
- [ ] Suite E (helper) — 3 paths covered (happy, audit-fails-quiet, scope assertions).

### Regression test checklist

For every file in §2 "Test files requiring updates":

- [ ] `src/tenants/tests/tenants.service.spec.ts` — extended with 2 new tests + existing 12 still pass.
- [ ] 7 spec files that mock `PrismaService` — NO updates required (mock surface unchanged); confirm all still pass.

### Cross-module integration sanity

- [ ] Smoke E2E (manual or scripted): start backend, hit `GET /auth/me` with a valid JWT, verify the response succeeds (interceptor resolved tenant correctly).
- [ ] Smoke E2E: hit `POST /auth/login` (unauthenticated) — verify response succeeds (interceptor ran in bypass scope, no audit row written).

## 9. Error Response Format

All new errors are mapped by the existing `HttpExceptionFilter` (`src/common/filters/http-exception.filter.ts:11`). Final JSON envelope:

| Error class | Throws at | HTTP status | Message (from `ErrorMessages.tenantContext`) |
|-------------|-----------|-------------|-----------------------------------------------|
| `TenantContextMissingError` | Prisma extension when scoped op runs with no context AND no bypass | 500 (via `HttpExceptionFilter` default for non-`HttpException`) | `Internal server error` (the underlying error is logged; the bare-Error class is intentionally NOT mapped to `Forbidden` because it indicates a coding bug — a guarded call site forgot to use the interceptor or helper) |
| `TenantContextMissingError` thrown by **interceptor** for authenticated-but-zero-memberships | Interceptor catches `null` from `findFirstActiveMembership` and throws `ForbiddenException(ErrorMessages.tenantContext.MISSING)` | 403 | `Tenant context required for this operation` |
| `CrossTenantViolationError` | `injectTenantId` when a caller-supplied `where.tenantId` mismatches the active context | 500 (same as above — coding bug, not user-facing condition) | `Internal server error` (underlying logged) |
| `BypassWithoutReasonError` | `TenantContext.runWithBypass('')` | 500 (same; programming error) | `Internal server error` |

Standard `HttpException` envelope:

```json
{
  "success": false,
  "error": {
    "message": "Tenant context required for this operation",
    "code": "FORBIDDEN",
    "statusCode": 403
  }
}
```

User-facing path = only the 403 (authenticated user with no active membership). Other errors are programming bugs caught in dev/test, not production paths.

## 10. Partial Update Support

N/A — no DTOs introduced; no controller endpoints touched.

## 11. Dependencies

External dependencies (already in `package.json` — verified §1):

- `@prisma/client ^7.8.0` — Client Extensions API.
- `@prisma/adapter-pg ^7.8.0` — Postgres adapter (already used by PrismaService).
- `@nestjs/common`, `@nestjs/core` — for `APP_INTERCEPTOR`, `NestInterceptor`, `ForbiddenException`, `OnApplicationShutdown`.
- `rxjs` — for `Observable` wrapping in the interceptor.
- `async_hooks` — Node built-in, no install.

**Zero new dependencies introduced.** This is intentional — the AsyncLocalStorage + Prisma extension stack is fully native.

## 12. Notes

### Business rules

- Phase 0.2 scope is INFRASTRUCTURE. Per program doc §2.4, this is "non-negotiable" defense-in-depth for tenancy.
- Bypass entry points (today: `'unauthenticated'`, `'tenant-context-resolution'`) are documented exceptions. Every NEW bypass case in future phases must come with: (1) a unique reason string, (2) a justification entry in `data-model.md` AuditAction docs, (3) tests verifying audit log entry semantics.
- The interceptor's tenant resolution (membership lookup) is a temporary bridge. Phase 1 (JWT v2) replaces the DB hit with a JWT payload read. The interceptor's CONTRACT (`tenantId: string` resolved per-request before pipeline) stays — only its implementation changes.
- No platform-admin / cross-tenant production code path exists in Phase 0.2. The `auditAndRunBypass` helper ships TESTED but unused in controllers until Phase 1 introduces `User.isPlatformAdmin` and the cross-tenant admin endpoints.

### Workflow / security constraints

- **NOT-§15 review path is REQUIRED**: this PR touches `nexacore-api/src/prisma/prisma.service.ts`, `nexacore-api/src/prisma/prisma.module.ts`, and `nexacore-api/prisma/schema.prisma` (data-access boundary). Per workflow-standards.mdc §15.3.3 single-domain exception: NO split-PR needed (no `src/auth/**` source touched). PR description MUST cite §15 review path; AUTH reviewers auto-requested via CODEOWNERS.
- **NEVER use `--no-verify`** to skip Husky hooks. If a hook fails, fix the underlying issue (typically Prettier formatting).
- **NEVER commit fixes for other tickets on this branch.** If pre-existing bugs surface during implementation, file a separate branch from `main` and merge it independently per workflow-standards.mdc §8.

### Language

All source code, comments, log messages, and audit metadata MUST be in English (per `documentation-standards.mdc`).

## 13. Next Steps After Implementation

1. Run `/verify SCRUM-488` immediately after Step 11 — DO NOT skip verification.
2. After `/verify` PASS / PASS-WITH-DEBT → run `/commit SCRUM-488`.
3. Pre-existing coverage threshold (89.85% < 90%) may still block CI Layer 4 Backend Tests. **Mitigation order**:
   - If SCRUM-490 (coverage sweep) merges first → CI clears automatically.
   - Else, if SCRUM-488 alone clears the threshold via the new heavily-testable units → CI clears organically.
   - Else, admin merge override + document Pre-existing deviation (same path as SCRUM-487).
4. After merge → `/update-docs SCRUM-488` to apply the deferred-by-design documentation updates (Step N+1).
5. Operator action at `/update-docs`: confirm AUTH-v2.md §6 transitions Phase 0.2 to `complete` and surfaces Phase 0.3 as next.

## 14. Implementation Verification

Final verification checklist (operator + agent shared):

### Code Quality
- [ ] All new files have file-level JSDoc explaining purpose + ticket reference.
- [ ] Zero `any` types in production code (test mocks may use `any`).
- [ ] All public functions in `tenant-context.ts` and `tenant-filter.extension.ts` documented.
- [ ] No new `process.env` reads outside ConfigService.
- [ ] No new hardcoded error strings outside `ErrorMessages`.
- [ ] No `@Public()` decorator added.
- [ ] No `ForbiddenException` thrown with a unique inline message (uses `ErrorMessages.tenantContext.MISSING`).

### Functionality
- [ ] AsyncLocalStorage propagates across `await`, `setImmediate`, and RxJS pipelines.
- [ ] Prisma extension intercepts the 13 operations enumerated in §5.1.
- [ ] Bypass scope is observable inside `fn` AND restores prior scope on exit.
- [ ] Missing-context throws on scoped models; unmodified pass-through on non-scoped models.
- [ ] Interceptor runs AFTER JwtAuthGuard (Nest pipeline order — guards before interceptors).

### Testing
- [ ] All test suites A–E green (see §8).
- [ ] Full jest suite (1071 baseline + new) green.
- [ ] Coverage net-positive vs main.

### Regression
- [ ] All 13 PrismaService consumers compile + their existing tests pass.
- [ ] All 7 spec files that mock PrismaService pass without modification.
- [ ] `nest start` does NOT crash with DI resolution errors (smoke test).
- [ ] `prisma migrate status` shows the new migration as `Applied`.

### Integration
- [ ] `app.module.ts` lists both `OnlineMlScorerInterceptor` AND `TenantContextInterceptor` as `APP_INTERCEPTOR`.
- [ ] `PrismaModule` correctly registers `OnApplicationShutdown`; shutdown smoke test (Ctrl+C on dev server) drains the connection pool.
- [ ] HTTP smoke: authenticated request observes tenantId; unauthenticated bypass observable; zero-membership user receives 403.

### Documentation updates
- [ ] Deferred-by-design to `/update-docs` (Step N+1) — checklist applied there.

### NOT-§15 review path
- [ ] PR title includes `[SCRUM-488]`.
- [ ] PR description cites §15 review path + lists data-access boundary files touched.
- [ ] CODEOWNERS auto-requests AUTH reviewers.

---

## Module-Level Planning

**N/A** — this ticket does NOT create a new NexaCore module. It extends `TenantsModule` with one method, refactors `PrismaModule`'s provider shape, and adds infrastructure under `common/context/` + `common/interceptors/`. No entity additions (one `AuditAction` enum value is a value addition, not an entity).

## Satellite App Planning

**N/A** — backend NexaCore-internal infrastructure ticket. No satellite app involved.
