# Backend Implementation Plan: SCRUM-135 Add GET /users/me/security-activity Endpoint

## Codebase State Snapshot

- **Date**: 2026-03-05
- **Last completed ticket**: SCRUM-134 (User security activity dashboard — frontend only)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/users/users.controller.ts` — 174 lines, 9 endpoints (5 self-service, 4 admin), constructor: `UsersService` (1 dep)
  - `src/users/users.service.ts` — 721 lines, constructor: `PrismaService, AuditService, SessionsService, MailService, PasswordBreachService (forwardRef), TrustedDeviceService (forwardRef), TokenDenyListService (forwardRef)` (7 deps)
  - `src/users/users.module.ts` — 15 lines, imports: `[AuditModule, SessionsModule, MailModule, forwardRef(() => AuthModule)]`
  - `src/audit/audit.service.ts` — 184 lines, `findAll()` method at line 33, constructor: `PrismaService` (1 dep)
  - `src/audit/dto/list-audit-logs-query.dto.ts` — 55 lines, pagination pattern with class-validator
  - `src/users/dto/list-users-query.dto.ts` — 34 lines, simpler pagination DTO pattern
  - `src/users/tests/users.controller.spec.ts` — 346 lines, mock pattern: `UsersService, Reflector, AuditService, PermissionsService`
  - `src/users/tests/users.service.spec.ts` — exists (not read, will be modified)
  - `nexacore-dashboard/src/lib/security-activity-api.ts` — frontend calls `GET /users/me/security-activity?page=X&limit=Y`
  - `nexacore-dashboard/src/lib/types.ts` — `SecurityEvent { id, action, ipAddress, userAgent, metadata, createdAt }`, `PaginatedResponse<T> { data: T[], meta: { total, page, limit, totalPages } }`
- **Constructor signatures verified**:
  - `UsersController(private readonly usersService: UsersService)` — 1 dependency
  - `UsersService(prisma, auditService, sessionsService, mailService, passwordBreachService, trustedDeviceService, tokenDenyListService)` — 7 dependencies
  - `AuditService(private readonly prisma: PrismaService)` — 1 dependency
- **Methods verified to exist**:
  - `UsersService.findAll()` at line 191 — existing pagination pattern (Promise.all with findMany + count)
  - `AuditService.findAll()` at line 33 — reference pagination with audit logs
- **Guard dependency chain verified**:
  - `JwtAuthGuard` — no dependencies, always available via Passport global registry
  - No RolesGuard or PermissionsGuard needed (self-service endpoint)
- **Discrepancies with integration-state.md**: None found

## Overview

Add a `GET /users/me/security-activity` endpoint to the `UsersController` that returns paginated audit logs filtered to the authenticated user's own actions. This is the **only missing backend endpoint** required by the Sprint 4 frontend. The frontend already calls this endpoint from `security-activity-api.ts`.

**Key decision**: Place in `UsersController` (not `AuditController`) because:
1. Route is `/users/me/security-activity` — follows self-service `/users/me/*` pattern
2. `AuditController` uses `RolesGuard + PermissionsGuard` (ADMIN only)
3. No new module imports or DI changes needed — `PrismaService` is `@Global()`

## Architecture Context

- **Module**: UsersModule (no changes to module imports)
- **Controller**: UsersController — add 1 new endpoint
- **Service**: UsersService — add 1 new method (`getSecurityActivity`)
- **DTO**: New `ListSecurityActivityQueryDto` (page, limit only)
- **Guards**: JwtAuthGuard only (same as other self-service endpoints)
- **Database**: Query `auditLog` table via PrismaService (already available in UsersService)

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a new feature branch
- **Branch Naming**: `feature/SCRUM-135-backend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-135-backend`
  3. `git branch` — verify on the new branch

### Step 1: Create DTO — `ListSecurityActivityQueryDto`

- **File**: `src/users/dto/list-security-activity-query.dto.ts` (NEW)
- **Action**: Create a simple pagination DTO following the existing `ListUsersQueryDto` pattern
- **Implementation Steps**:
  1. Create DTO class with two optional properties:
     - `page`: `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)`, default `1`
     - `limit`: `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)`, `@Max(100)`, default `20`
  2. Add `@ApiPropertyOptional()` decorators for Swagger documentation
- **Dependencies**: `class-validator`, `class-transformer`, `@nestjs/swagger`
- **Pattern reference**: `src/users/dto/list-users-query.dto.ts` (lines 5-17) and `src/audit/dto/list-audit-logs-query.dto.ts` (lines 15-29)

### Step 2: Add Service Method — `getSecurityActivity`

- **File**: `src/users/users.service.ts`
- **Action**: Add a new public method after the `findAll()` method (after line 235)
- **Function Signature**:
  ```typescript
  async getSecurityActivity(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    data: { id: string; action: string; ipAddress: string | null; userAgent: string | null; metadata: unknown; createdAt: Date }[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>
  ```
- **Implementation Steps**:
  1. Calculate `skip = (page - 1) * limit`
  2. Define `where = { userId }` — filter by acting user only (NOT targetUserId)
  3. Use `Promise.all` pattern (same as `findAll()` at line 216):
     ```typescript
     const [data, total] = await Promise.all([
       this.prisma.auditLog.findMany({
         where,
         select: { id: true, action: true, ipAddress: true, userAgent: true, metadata: true, createdAt: true },
         orderBy: { createdAt: 'desc' },
         skip,
         take: limit,
       }),
       this.prisma.auditLog.count({ where }),
     ]);
     ```
  4. Return `{ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }`
- **Implementation Notes**:
  - Use `select` (not `include`) to exclude `userId`, `targetUserId`, and user relations from the response — these are sensitive fields users should not see in their own activity feed
  - Filter by `userId` only — events where the user was the actor. Do NOT include `targetUserId` matches (those are admin actions on the user)
  - The response shape matches the frontend `SecurityEvent` type exactly

### Step 3: Add Controller Endpoint

- **File**: `src/users/users.controller.ts`
- **Action**: Add `GET me/security-activity` endpoint in the self-service section (after line 110, before the `// ── Admin endpoints ──` comment at line 112)
- **Implementation Steps**:
  1. Add import for `ListSecurityActivityQueryDto`
  2. Add the endpoint method:
     ```typescript
     @Get('me/security-activity')
     @UseGuards(JwtAuthGuard)
     async getSecurityActivity(
       @Request() req: { user: { id: string } },
       @Query() query: ListSecurityActivityQueryDto,
     ) {
       return this.usersService.getSecurityActivity(
         req.user.id,
         query.page ?? 1,
         query.limit ?? 20,
       );
     }
     ```
  3. **CRITICAL**: This route MUST be declared BEFORE the `@Get(':id')` route (line 122). NestJS matches routes top-to-bottom, and `:id` would capture `me` as a UUID param if placed first. The existing `@Get()` (listUsers) and `@Get(':id')` are both in the admin section below — so placing this in the self-service section (before line 112) is correct.
- **Dependencies**: Import `ListSecurityActivityQueryDto` from `./dto/list-security-activity-query.dto`
- **Implementation Notes**:
  - No `@HttpCode` needed — GET defaults to 200
  - No `@Throttle` needed — global throttler (100/60s) is sufficient for read-only self-service
  - No `RequestContext` extraction needed — this is a read-only query, no audit logging required

### Step 4: Update Existing Tests — `users.controller.spec.ts`

- **File**: `src/users/tests/users.controller.spec.ts`
- **Action**: Add `getSecurityActivity` mock to the service mock object and add test cases
- **Implementation Steps**:
  1. Add `getSecurityActivity: jest.fn()` to the `usersService` mock object (line 23 area, after `unlinkOAuth: jest.fn()`)
  2. Add test suite for the new endpoint:
     ```typescript
     describe('getSecurityActivity', () => {
       it('should delegate to usersService.getSecurityActivity with userId and pagination', async () => {
         const mockResult = {
           data: [
             { id: 'log-1', action: 'LOGIN_SUCCESS', ipAddress: '127.0.0.1', userAgent: 'test', metadata: null, createdAt: new Date() },
           ],
           meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
         };
         usersService.getSecurityActivity.mockResolvedValue(mockResult);
         const result = await controller.getSecurityActivity(mockReq, { page: 1, limit: 20 });
         expect(usersService.getSecurityActivity).toHaveBeenCalledWith('uuid-123', 1, 20);
         expect(result).toEqual(mockResult);
       });

       it('should use default pagination when no query params provided', async () => {
         usersService.getSecurityActivity.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
         await controller.getSecurityActivity(mockReq, {});
         expect(usersService.getSecurityActivity).toHaveBeenCalledWith('uuid-123', 1, 20);
       });
     });
     ```

### Step 5: Add Service Tests — `users.service.spec.ts`

- **File**: `src/users/tests/users.service.spec.ts`
- **Action**: Add test cases for the `getSecurityActivity` method
- **Implementation Steps**:
  1. Add test suite:
     ```
     describe('getSecurityActivity', () => { ... })
     ```
  2. Test cases to cover:
     - **Returns paginated response**: Mock `prisma.auditLog.findMany` + `prisma.auditLog.count`, verify response shape
     - **Filters by userId only**: Verify `where` argument passed to `findMany` is `{ userId: 'test-user-id' }` — NOT targetUserId
     - **Respects pagination**: page=2, limit=10 → skip=10, take=10
     - **Returns empty results**: count=0, findMany=[] → `{ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }`
     - **Orders by createdAt DESC**: Verify `orderBy: { createdAt: 'desc' }`
     - **Uses select (not include)**: Verify `select` includes only id, action, ipAddress, userAgent, metadata, createdAt — no userId, targetUserId, or user relations
     - **Calculates totalPages correctly**: total=45, limit=20 → totalPages=3

### Step 6: Update Technical Documentation

- **File**: `ai-specs/specs/api-spec.yml`
- **Action**: Add `/users/me/security-activity` endpoint definition
- **Implementation Steps**:
  1. Add under the `/users/me/*` section:
     ```yaml
     /users/me/security-activity:
       get:
         tags: [Users]
         summary: Get authenticated user's security activity
         description: Returns paginated audit logs filtered to the authenticated user's own actions. Ordered by createdAt DESC.
         security:
           - bearerAuth: []
         parameters:
           - name: page
             in: query
             schema: { type: integer, minimum: 1, default: 1 }
           - name: limit
             in: query
             schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
         responses:
           '200':
             description: Paginated security events
             content:
               application/json:
                 schema:
                   type: object
                   properties:
                     data:
                       type: array
                       items:
                         $ref: '#/components/schemas/SecurityEvent'
                     meta:
                       $ref: '#/components/schemas/PaginationMeta'
           '401':
             description: Unauthorized
     ```
  2. Add `SecurityEvent` schema to components if not already present:
     ```yaml
     SecurityEvent:
       type: object
       properties:
         id: { type: string, format: uuid }
         action: { type: string }
         ipAddress: { type: string, nullable: true }
         userAgent: { type: string, nullable: true }
         metadata: { type: object, nullable: true }
         createdAt: { type: string, format: date-time }
     ```

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Create `ListSecurityActivityQueryDto`
3. Step 2: Add `getSecurityActivity` to `UsersService`
4. Step 3: Add `GET me/security-activity` to `UsersController`
5. Step 4: Update controller tests
6. Step 5: Add service tests
7. Step 6: Update `api-spec.yml`
8. Post-implementation checks (build, tests, startup)

## Testing Checklist

- [ ] `nest build` compiles clean (0 errors)
- [ ] All existing tests still pass (`jest --maxWorkers=1 --forceExit`)
- [ ] New controller tests pass (2 test cases)
- [ ] New service tests pass (7 test cases)
- [ ] Coverage >= 90% for new code
- [ ] Endpoint returns correct `PaginatedResponse<SecurityEvent>` shape
- [ ] Endpoint returns only the authenticated user's events (userId filter)
- [ ] Endpoint returns 401 without JWT token
- [ ] Default pagination works (page=1, limit=20)
- [ ] Max limit enforced (100)

## Error Response Format

| Status | Condition | Response |
|--------|-----------|----------|
| 200 | Success | `{ data: SecurityEvent[], meta: PaginationMeta }` |
| 401 | No JWT token | `{ statusCode: 401, message: "Unauthorized" }` |
| 400 | Invalid query params (page < 1, limit > 100) | `{ statusCode: 400, message: [...], error: "Bad Request" }` |

## Dependencies

- **No new npm packages required**
- **No new module imports required** — PrismaService is `@Global()`, already available in UsersService
- **No new DI changes** — UsersService already has PrismaService injected

## Notes

- This is a simple, self-contained endpoint with minimal blast radius — only touches UsersController and UsersService
- The endpoint follows the exact same pattern as 5 other self-service endpoints in UsersController
- The frontend (`security-activity-api.ts`) already exists and expects exactly this endpoint path and response shape
- No `AuditService` injection needed — `UsersService` already has `PrismaService` and can query `auditLog` directly
- Route ordering is critical: `me/security-activity` must be declared before `:id` to avoid NestJS route parameter capture

## Next Steps After Implementation

1. Run `/commit SCRUM-135` to create PR, merge to main, delete branch
2. Run `/update-docs SCRUM-135` to create implementation record and update integration-state.md
3. Verify end-to-end: frontend SecurityActivity dashboard connects to the new endpoint

## Implementation Verification

- [ ] **Code Quality**: DTO uses class-validator decorators, service uses typed Prisma queries
- [ ] **Functionality**: Returns only authenticated user's audit logs, paginated, ordered DESC
- [ ] **Security**: userId hardcoded from `req.user.id`, never from query params; sensitive fields excluded via `select`
- [ ] **Testing**: Controller + service tests cover happy path, defaults, empty results, pagination math
- [ ] **Integration**: Response shape matches frontend `PaginatedResponse<SecurityEvent>` exactly
- [ ] **Documentation**: `api-spec.yml` updated with endpoint definition
