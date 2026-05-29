# Fullstack Implementation Plan: SCRUM-25 Comprehensive Audit Logging System

## Overview

**Epic**: SCRUM-22 (Auth Security Hardening)
**Layer**: 3 of 8 -- CRITICAL priority
**Jira Ticket**: SCRUM-25

### Problem Statement
The EM NexaCore platform currently has zero audit logging. No security-relevant events are recorded anywhere in the system -- not login attempts, not password changes, not admin actions, not SUPERADMIN role bypasses, not account lockouts, not OAuth logins. This makes it impossible to detect brute force attacks, investigate privilege abuse, perform forensic analysis after incidents, or satisfy compliance requirements.

### Compliance Requirements
This is a blocker for:
- **PCI-DSS** (Requirement 10): Track and monitor all access to network resources and cardholder data
- **SOC 2** (CC7.2): Monitoring of system components for anomalies
- **GDPR** (Article 30): Records of processing activities; audit trail for data subject access

### Events to Log (Complete List)
| Category | Event | Severity |
|----------|-------|----------|
| Authentication | LOGIN_SUCCESS | INFO |
| Authentication | LOGIN_FAILURE | WARN |
| Authentication | LOGOUT | INFO |
| Authentication | REGISTER | INFO |
| Authentication | TOKEN_REFRESH | INFO |
| Authentication | OAUTH_LOGIN (Google/GitHub) | INFO |
| Account Security | ACCOUNT_LOCKED | WARN |
| Account Security | ACCOUNT_UNLOCKED | INFO |
| Account Security | PASSWORD_CHANGE | WARN |
| User Management | PROFILE_UPDATE | INFO |
| Admin Actions | USER_ROLE_CHANGE | WARN |
| Admin Actions | USER_DEACTIVATED | WARN |
| Admin Actions | USER_ACTIVATED | INFO |
| Admin Actions | USER_DELETED | WARN |
| Privilege Escalation | SUPERADMIN_BYPASS | WARN |

## Architecture Context

### Data Flow
```
HTTP Request
  --> NestJS Controller method executes
    --> Service method performs business logic
      --> AuditService.log() called explicitly at each event point
        --> Prisma writes AuditLog row to PostgreSQL
          --> (async, non-blocking -- errors caught and logged, never bubble up)

Admin GET /audit-logs
  --> AuditLogController (ADMIN-protected)
    --> AuditService.findAll(query)
      --> Prisma queries with filters + pagination
        --> Returns paginated AuditLog[]
```

### Design Decisions
1. **Explicit service calls over interceptors**: Audit logging requires contextual data (e.g., "which user was the target of a role change", "was login successful or failed", "which OAuth provider"). A generic NestJS interceptor cannot capture this context. Instead, `AuditService.log()` is called explicitly at each event point inside `AuthService` and `UsersService` where the full context is available.
2. **Fire-and-forget writes**: Audit log writes must never block or fail the primary operation. All `AuditService.log()` calls use `.catch()` to swallow errors and log them to `console.error` instead.
3. **Structured JSON metadata**: Each audit event stores a free-form `metadata` JSON field for event-specific details (e.g., `{ provider: 'GOOGLE' }` for OAuth, `{ oldRole: 'USER', newRole: 'ADMIN' }` for role changes).
4. **No separate security module**: The audit log is a cross-cutting concern. It gets its own `AuditModule` that is imported by `AppModule`, with `AuditService` injected into `AuthService` and `UsersService`.

## Endpoint Specification

### Query Audit Logs
| Attribute | Value |
|-----------|-------|
| Method | `GET` |
| URL | `/audit-logs` |
| Auth | Bearer JWT, `ADMIN` or `SUPERADMIN` role |
| Query Params | `page` (int, default 1), `limit` (int, default 20, max 100), `action` (AuditAction enum, optional), `userId` (UUID, optional), `startDate` (ISO 8601, optional), `endDate` (ISO 8601, optional), `sortOrder` ('asc' \| 'desc', default 'desc') |
| Response 200 | `{ data: AuditLog[], meta: { total, page, limit, totalPages } }` |
| Response 401 | `{ success: false, error: { message, code: 'UNAUTHORIZED', statusCode: 401 } }` |
| Response 403 | `{ success: false, error: { message, code: 'FORBIDDEN', statusCode: 403 } }` |

### Get Single Audit Log
| Attribute | Value |
|-----------|-------|
| Method | `GET` |
| URL | `/audit-logs/:id` |
| Auth | Bearer JWT, `ADMIN` or `SUPERADMIN` role |
| Params | `id` (UUID) |
| Response 200 | `AuditLog` object |
| Response 404 | `{ success: false, error: { message: 'Audit log not found', code: 'NOT_FOUND', statusCode: 404 } }` |

### AuditLog Response Shape
```typescript
{
  id: string;           // UUID
  action: AuditAction;  // enum value
  userId: string | null;
  targetUserId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;    // ISO 8601
}
```

## Database Changes

### New Enum: `AuditAction`
```prisma
enum AuditAction {
  LOGIN_SUCCESS
  LOGIN_FAILURE
  LOGOUT
  REGISTER
  TOKEN_REFRESH
  OAUTH_LOGIN
  ACCOUNT_LOCKED
  ACCOUNT_UNLOCKED
  PASSWORD_CHANGE
  PROFILE_UPDATE
  USER_ROLE_CHANGE
  USER_DEACTIVATED
  USER_ACTIVATED
  USER_DELETED
  SUPERADMIN_BYPASS
}
```

### New Model: `AuditLog`
```prisma
model AuditLog {
  id            String      @id @default(uuid())
  action        AuditAction
  userId        String?     // The user who performed the action (null for failed logins of non-existent users)
  targetUserId  String?     // The user affected by the action (for admin actions)
  ipAddress     String?     // Request IP (X-Forwarded-For or remoteAddress)
  userAgent     String?     // Request User-Agent header
  metadata      Json?       // Flexible JSON for event-specific data
  createdAt     DateTime    @default(now())

  user          User?       @relation("AuditLogUser", fields: [userId], references: [id], onDelete: SetNull)
  targetUser    User?       @relation("AuditLogTarget", fields: [targetUserId], references: [id], onDelete: SetNull)

  @@index([action])
  @@index([userId])
  @@index([targetUserId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### User Model Changes
Add two relation fields to the existing `User` model (no schema change needed beyond the relation annotations):
```prisma
model User {
  // ... existing fields ...

  auditLogs       AuditLog[] @relation("AuditLogUser")
  auditLogsTarget AuditLog[] @relation("AuditLogTarget")

  @@map("users")
}
```

### Migration
- Migration name: `add_audit_log`
- Command: `npx prisma migrate dev --name add_audit_log`
- This creates the `audit_logs` table, the `AuditAction` enum type in PostgreSQL, the foreign keys with `ON DELETE SET NULL`, and four indexes.

## Files to Create

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `nexacore-api/src/audit/audit.module.ts` | NestJS module, exports `AuditService` |
| 2 | `nexacore-api/src/audit/audit.service.ts` | Core service: `log()` and `findAll()` and `findById()` methods |
| 3 | `nexacore-api/src/audit/audit.controller.ts` | REST controller for querying audit logs (ADMIN-protected) |
| 4 | `nexacore-api/src/audit/dto/list-audit-logs-query.dto.ts` | Validated query DTO with pagination, filters |
| 5 | `nexacore-api/src/audit/dto/audit-log-response.dto.ts` | Swagger response DTO for documentation |
| 6 | `nexacore-api/src/audit/enums/audit-action.enum.ts` | TypeScript enum mirroring Prisma `AuditAction` |
| 7 | `nexacore-api/src/audit/interfaces/audit-log-entry.interface.ts` | Interface for `AuditService.log()` input |
| 8 | `nexacore-api/src/audit/tests/audit.service.spec.ts` | Unit tests for AuditService |
| 9 | `nexacore-api/src/audit/tests/audit.controller.spec.ts` | Unit tests for AuditLogController |
| 10 | `nexacore-dashboard/src/app/admin/audit-logs/page.tsx` | Audit log viewer page |
| 11 | `nexacore-dashboard/src/components/admin/AuditLogsTable.tsx` | Table component for audit log entries |
| 12 | `nexacore-dashboard/src/components/admin/AuditLogFilters.tsx` | Filter bar component (action type, date range, user search) |

## Files to Modify

| # | File Path | Changes |
|---|-----------|---------|
| 1 | `nexacore-api/prisma/schema.prisma` | Add `AuditAction` enum, `AuditLog` model, relation fields on `User` |
| 2 | `nexacore-api/src/app.module.ts` | Import `AuditModule` |
| 3 | `nexacore-api/src/auth/auth.module.ts` | Import `AuditModule`, inject into providers via `AuthService` |
| 4 | `nexacore-api/src/auth/auth.service.ts` | Inject `AuditService`, add logging calls in `register()`, `login()`, `refreshTokens()`, `validateOAuthUser()`, `logout()` |
| 5 | `nexacore-api/src/users/users.module.ts` | Import `AuditModule` |
| 6 | `nexacore-api/src/users/users.service.ts` | Inject `AuditService`, add logging calls in `changePassword()`, `adminUpdateUser()`, `softDelete()`, `updateProfile()`, `lockAccount()`, `resetFailedAttempts()` |
| 7 | `nexacore-api/src/auth/guards/roles.guard.ts` | Add `AuditService` injection, log `SUPERADMIN_BYPASS` when SUPERADMIN bypasses a role check |
| 8 | `nexacore-api/src/auth/auth.controller.ts` | Pass `Request` object (IP, user-agent) through to service methods for audit context |
| 9 | `nexacore-api/src/users/users.controller.ts` | Pass `Request` object through to service methods for audit context |
| 10 | `nexacore-dashboard/src/lib/types.ts` | Add `AuditLog` type, `AuditAction` union type |
| 11 | `nexacore-dashboard/src/components/layout/Sidebar.tsx` | Add "Audit Logs" nav item under admin section |
| 12 | `nexacore-api/src/auth/tests/auth.service.spec.ts` | Update mock providers to include `AuditService` |
| 13 | `nexacore-api/src/users/tests/users.service.spec.ts` | Update mock providers to include `AuditService` |

## Implementation Steps (Ordered)

### Step 0: Create Feature Branch
```bash
cd em-ecosystem-code
git checkout -b feature/SCRUM-25-audit-logging
```

### Step 1: Define the AuditAction Enum (TypeScript)
- **File**: `nexacore-api/src/audit/enums/audit-action.enum.ts`
- **Action**: Create TypeScript enum that mirrors the Prisma enum
- **Code**:
```typescript
export enum AuditAction {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  OAUTH_LOGIN = 'OAUTH_LOGIN',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DELETED = 'USER_DELETED',
  SUPERADMIN_BYPASS = 'SUPERADMIN_BYPASS',
}
```
- **Dependencies**: None

### Step 2: Define the AuditLogEntry Interface
- **File**: `nexacore-api/src/audit/interfaces/audit-log-entry.interface.ts`
- **Action**: Create the interface used as input to `AuditService.log()`
- **Code**:
```typescript
import { AuditAction } from '../enums/audit-action.enum';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string | null;
  targetUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}
```
- **Dependencies**: `AuditAction` enum from Step 1

### Step 3: Update Prisma Schema
- **File**: `nexacore-api/prisma/schema.prisma`
- **Action**: Add `AuditAction` enum, `AuditLog` model, and relation fields on `User`
- **Implementation Steps**:
  1. After the `Provider` enum, add the `AuditAction` enum with all 15 values
  2. After the `User` model's `updatedAt` field and before `@@map("users")`, add the two relation fields:
     ```prisma
     auditLogs       AuditLog[] @relation("AuditLogUser")
     auditLogsTarget AuditLog[] @relation("AuditLogTarget")
     ```
  3. After the `User` model, add the complete `AuditLog` model (see Database Changes section)
- **Dependencies**: None

### Step 4: Run Prisma Migration
- **Command**:
```bash
cd nexacore-api
npx prisma migrate dev --name add_audit_log
npx prisma generate
```
- **Implementation Steps**:
  1. Run the migration to create the `audit_logs` table and `AuditAction` enum in PostgreSQL
  2. Regenerate the Prisma Client so the TypeScript types include `AuditLog`
  3. Verify migration succeeded by checking `prisma/migrations/` for the new directory
- **Dependencies**: Step 3

### Step 5: Create AuditService
- **File**: `nexacore-api/src/audit/audit.service.ts`
- **Action**: Implement core audit logging service
- **Code**:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from './enums/audit-action.enum';
import { AuditLogEntry } from './interfaces/audit-log-entry.interface';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write an audit log entry. Fire-and-forget -- errors are caught and logged
   * but never propagated to the caller.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId ?? null,
          targetUserId: entry.targetUserId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: entry.metadata ?? undefined,
        },
      });
    } catch (error) {
      // Never let audit logging failure break the main flow
      this.logger.error(
        `Failed to write audit log: ${entry.action}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async findAll(query: {
    page: number;
    limit: number;
    action?: AuditAction;
    userId?: string;
    startDate?: string;
    endDate?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: unknown[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page, limit, action, userId, startDate, endDate, sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.OR = [{ userId }, { targetUserId: userId }];
    }

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
          targetUser: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        targetUser: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    });
  }
}
```
- **Implementation Steps**:
  1. Create the service class with PrismaService injection
  2. Implement `log()` with try/catch that swallows errors
  3. Implement `findAll()` with dynamic `where` clause construction and pagination
  4. Implement `findById()` with user relation includes
- **Dependencies**: Step 2, Step 4 (Prisma Client generated)

### Step 6: Create ListAuditLogsQueryDto
- **File**: `nexacore-api/src/audit/dto/list-audit-logs-query.dto.ts`
- **Action**: Create validated DTO for the query endpoint
- **Code**:
```typescript
import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '../enums/audit-action.enum';

export class ListAuditLogsQueryDto {
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
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({ description: 'Filter by user ID (as actor or target)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```
- **Dependencies**: `AuditAction` enum from Step 1

### Step 7: Create AuditLogController
- **File**: `nexacore-api/src/audit/audit.controller.ts`
- **Action**: Create REST controller for querying audit logs
- **Code**:
```typescript
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of audit logs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden -- requires ADMIN role' })
  async listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      action: query.action,
      userId: query.userId,
      startDate: query.startDate,
      endDate: query.endDate,
      sortOrder: query.sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log entry by ID' })
  @ApiResponse({ status: 200, description: 'Audit log entry' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLog(@Param('id') id: string) {
    const log = await this.auditService.findById(id);
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }
    return log;
  }
}
```
- **Dependencies**: Step 5 (AuditService), Step 6 (DTO), existing guards/decorators

### Step 8: Create AuditModule
- **File**: `nexacore-api/src/audit/audit.module.ts`
- **Action**: Create the NestJS module that wires everything together
- **Code**:
```typescript
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogController } from './audit.controller';

@Module({
  controllers: [AuditLogController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
```
- **Implementation Steps**:
  1. Create module with controller and service
  2. Export `AuditService` so other modules can inject it
  3. Note: `PrismaModule` is `@Global()` so it does not need to be imported here
- **Dependencies**: Steps 5, 7

### Step 9: Register AuditModule in AppModule
- **File**: `nexacore-api/src/app.module.ts`
- **Action**: Import `AuditModule` into the application root module
- **Change**:
```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AuditModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```
- **Dependencies**: Step 8

### Step 10: Update AuthModule to Import AuditModule
- **File**: `nexacore-api/src/auth/auth.module.ts`
- **Action**: Add `AuditModule` to imports so `AuditService` is available for injection in `AuthService`
- **Change**: Add `import { AuditModule } from '../audit/audit.module';` and add `AuditModule` to the `imports` array.
```typescript
@Module({
  imports: [
    UsersModule,
    AuditModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ ... }),
  ],
  // ...
})
export class AuthModule {}
```
- **Dependencies**: Step 8

### Step 11: Update UsersModule to Import AuditModule
- **File**: `nexacore-api/src/users/users.module.ts`
- **Action**: Add `AuditModule` to imports so `AuditService` is available for injection in `UsersService`
- **Change**:
```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```
- **Dependencies**: Step 8

### Step 12: Update AuthController to Pass Request Context
- **File**: `nexacore-api/src/auth/auth.controller.ts`
- **Action**: Extract IP address and User-Agent from the request and pass to service methods. This is needed so `AuthService` can include network context in audit log entries.
- **Implementation Steps**:
  1. Import `Req` from `@nestjs/common` (or use the existing `Request` decorator with expanded typing)
  2. For `register()`: Add `@Request() req` parameter, extract `ip` and `user-agent`, pass as options object to `authService.register()`
  3. For `login()`: Same pattern -- pass request context to `authService.login()`
  4. For `logout()`: Pass request context to `authService.logout()`
  5. For `googleAuthCallback()` and `githubAuthCallback()`: Pass request context to enable OAuth login audit logging
- **Key Change Pattern** (example for login):
```typescript
@Post('login')
@HttpCode(HttpStatus.OK)
async login(
  @Body() loginDto: LoginDto,
  @Request() req: { ip: string; headers: { 'user-agent'?: string } },
) {
  return this.authService.login(loginDto, {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || null,
  });
}
```
- **Dependencies**: Step 10 (AuditModule imported into AuthModule)

### Step 13: Update UsersController to Pass Request Context
- **File**: `nexacore-api/src/users/users.controller.ts`
- **Action**: Extract IP address and User-Agent from the request and pass to service methods
- **Implementation Steps**:
  1. For `changePassword()`: Add request context parameter, pass to `usersService.changePassword()`
  2. For `updateProfile()`: Pass request context
  3. For `adminUpdateUser()`: Pass request context (expand existing `req.user` typing to include `ip` and `headers`)
  4. For `deleteUser()`: Add request parameter, pass context
- **Key Change Pattern** (example for adminUpdateUser):
```typescript
@Patch(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async adminUpdateUser(
  @Param('id') id: string,
  @Body() dto: AdminUpdateUserDto,
  @Request() req: { user: { id: string; role: Role }; ip: string; headers: { 'user-agent'?: string } },
) {
  return this.usersService.adminUpdateUser(id, dto, req.user, {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || null,
  });
}
```
- **Dependencies**: Step 11 (AuditModule imported into UsersModule)

### Step 14: Instrument AuthService with Audit Logging
- **File**: `nexacore-api/src/auth/auth.service.ts`
- **Action**: Inject `AuditService` and add audit log calls at every auth event point
- **Function Signature Change**:
```typescript
// Add to constructor
constructor(
  private readonly usersService: UsersService,
  private readonly jwtService: JwtService,
  private readonly auditService: AuditService,
) {}

// Define request context type
type RequestContext = { ipAddress: string | null; userAgent: string | null };
```
- **Implementation Steps**:
  1. Add `AuditService` import and inject in constructor
  2. Define a `RequestContext` type alias for `{ ipAddress: string | null; userAgent: string | null }`
  3. Add `ctx: RequestContext` as final parameter to `register()`, `login()`, `refreshTokens()`, `validateOAuthUser()`, `logout()`
  4. In `register()` -- after successful user creation and token generation:
     ```typescript
     this.auditService.log({
       action: AuditAction.REGISTER,
       userId: user.id,
       ipAddress: ctx.ipAddress,
       userAgent: ctx.userAgent,
       metadata: { email: dto.email },
     }).catch(() => {});
     ```
  5. In `login()` -- after successful login:
     ```typescript
     this.auditService.log({
       action: AuditAction.LOGIN_SUCCESS,
       userId: user.id,
       ipAddress: ctx.ipAddress,
       userAgent: ctx.userAgent,
     }).catch(() => {});
     ```
  6. In `login()` -- on invalid credentials (user not found):
     ```typescript
     this.auditService.log({
       action: AuditAction.LOGIN_FAILURE,
       ipAddress: ctx.ipAddress,
       userAgent: ctx.userAgent,
       metadata: { email: dto.email, reason: 'user_not_found' },
     }).catch(() => {});
     ```
  7. In `login()` -- on account locked:
     ```typescript
     this.auditService.log({
       action: AuditAction.LOGIN_FAILURE,
       userId: user.id,
       ipAddress: ctx.ipAddress,
       userAgent: ctx.userAgent,
       metadata: { reason: 'account_locked' },
     }).catch(() => {});
     ```
  8. In `login()` -- on wrong password:
     ```typescript
     this.auditService.log({
       action: AuditAction.LOGIN_FAILURE,
       userId: user.id,
       ipAddress: ctx.ipAddress,
       userAgent: ctx.userAgent,
       metadata: { reason: 'invalid_password', failedAttempts: updated.failedAttempts },
     }).catch(() => {});
     ```
  9. In `login()` -- when account gets locked due to max attempts:
     ```typescript
     this.auditService.log({
       action: AuditAction.ACCOUNT_LOCKED,
       userId: user.id,
       ipAddress: ctx.ipAddress,
       userAgent: ctx.userAgent,
       metadata: { reason: 'max_failed_attempts', failedAttempts: MAX_FAILED_ATTEMPTS },
     }).catch(() => {});
     ```
  10. In `refreshTokens()` -- after successful refresh:
      ```typescript
      this.auditService.log({
        action: AuditAction.TOKEN_REFRESH,
        userId: user.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      }).catch(() => {});
      ```
  11. In `validateOAuthUser()` -- after successful OAuth login:
      ```typescript
      this.auditService.log({
        action: AuditAction.OAUTH_LOGIN,
        userId: user.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { provider: profile.provider },
      }).catch(() => {});
      ```
  12. In `logout()` -- after invalidating refresh token:
      ```typescript
      this.auditService.log({
        action: AuditAction.LOGOUT,
        userId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      }).catch(() => {});
      ```
- **Dependencies**: Steps 5, 10, 12

### Step 15: Instrument UsersService with Audit Logging
- **File**: `nexacore-api/src/users/users.service.ts`
- **Action**: Inject `AuditService` and add audit log calls at every user management event point
- **Function Signature Change**:
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly auditService: AuditService,
) {}

type RequestContext = { ipAddress: string | null; userAgent: string | null };
```
- **Implementation Steps**:
  1. Add `AuditService` import and inject in constructor
  2. Add `ctx: RequestContext & { actorId: string }` as final parameter to `changePassword()`, `updateProfile()`, `adminUpdateUser()`, `softDelete()`
  3. In `changePassword()` -- after successful password change:
     ```typescript
     this.auditService.log({
       action: AuditAction.PASSWORD_CHANGE,
       userId: ctx.actorId,
       ipAddress: ctx.ipAddress,
       userAgent: ctx.userAgent,
     }).catch(() => {});
     ```
  4. In `updateProfile()` -- after successful update:
     ```typescript
     this.auditService.log({
       action: AuditAction.PROFILE_UPDATE,
       userId: ctx.actorId,
       ipAddress: ctx.ipAddress,
       userAgent: ctx.userAgent,
       metadata: { updatedFields: Object.keys(dto) },
     }).catch(() => {});
     ```
  5. In `adminUpdateUser()` -- when role changes:
     ```typescript
     if (dto.role !== undefined && dto.role !== target.role) {
       this.auditService.log({
         action: AuditAction.USER_ROLE_CHANGE,
         userId: ctx.actorId,
         targetUserId: targetId,
         ipAddress: ctx.ipAddress,
         userAgent: ctx.userAgent,
         metadata: { oldRole: target.role, newRole: dto.role },
       }).catch(() => {});
     }
     ```
  6. In `adminUpdateUser()` -- when isActive changes:
     ```typescript
     if (dto.isActive !== undefined && dto.isActive !== target.isActive) {
       this.auditService.log({
         action: dto.isActive ? AuditAction.USER_ACTIVATED : AuditAction.USER_DEACTIVATED,
         userId: ctx.actorId,
         targetUserId: targetId,
         ipAddress: ctx.ipAddress,
         userAgent: ctx.userAgent,
       }).catch(() => {});
     }
     ```
  7. In `softDelete()` -- after successful soft-delete:
     ```typescript
     this.auditService.log({
       action: AuditAction.USER_DELETED,
       userId: ctx.actorId,
       targetUserId: targetId,
       ipAddress: ctx.ipAddress,
       userAgent: ctx.userAgent,
       metadata: { targetEmail: target.email },
     }).catch(() => {});
     ```
  8. In `lockAccount()` -- add optional context parameter for when it is called directly:
     ```
     Note: lockAccount is called from AuthService.login() which already logs ACCOUNT_LOCKED.
     No additional logging needed here to avoid duplication.
     ```
- **Dependencies**: Steps 5, 11, 13

### Step 16: Instrument RolesGuard for SUPERADMIN Bypass Logging
- **File**: `nexacore-api/src/auth/guards/roles.guard.ts`
- **Action**: Log `SUPERADMIN_BYPASS` when a SUPERADMIN user bypasses a required role check
- **Implementation Details**: NestJS guards can inject services via the module system. Since `RolesGuard` is used as a class reference in `@UseGuards(RolesGuard)`, it is instantiated by the DI container, which means we CAN inject services.
- **Code**:
```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{
        user?: { id: string; role: Role };
        ip: string;
        headers: Record<string, string>;
      }>();
    const user = request.user;

    // SUPERADMIN bypasses all role checks
    if (user?.role === Role.SUPERADMIN) {
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      // Only log bypass if there are actual role requirements being bypassed
      if (requiredRoles && requiredRoles.length > 0) {
        const handler = context.getHandler().name;
        const controller = context.getClass().name;
        this.auditService.log({
          action: AuditAction.SUPERADMIN_BYPASS,
          userId: user.id,
          ipAddress: request.ip || null,
          userAgent: request.headers?.['user-agent'] || null,
          metadata: {
            requiredRoles,
            endpoint: `${controller}.${handler}`,
          },
        }).catch(() => {});
      }

      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
```
- **Important Note**: Since `RolesGuard` now depends on `AuditService`, and `RolesGuard` is used by controllers in both `AuthModule` and `UsersModule`, both modules must import `AuditModule`. This is already handled in Steps 10 and 11. Additionally, `RolesGuard` is provided by its containing module context (it is not a global guard), so the DI container resolves `AuditService` from the importing module's scope.
- **Dependencies**: Steps 5, 10, 11

### Step 17: Update Existing Tests -- AuthService
- **File**: `nexacore-api/src/auth/tests/auth.service.spec.ts`
- **Action**: Add `AuditService` mock to the test module providers so existing tests continue to pass with the new dependency
- **Implementation Steps**:
  1. Add import: `import { AuditService } from '../../audit/audit.service';`
  2. Add mock provider in the `providers` array of `Test.createTestingModule`:
     ```typescript
     {
       provide: AuditService,
       useValue: {
         log: jest.fn().mockResolvedValue(undefined),
       },
     },
     ```
  3. Update `authService.login()`, `authService.register()`, `authService.logout()`, `authService.refreshTokens()`, and `authService.validateOAuthUser()` calls to include the new `ctx` parameter:
     ```typescript
     const ctx = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };
     ```
  4. Add new test cases verifying audit logging is called (see Testing Checklist)
- **Dependencies**: Step 14

### Step 18: Update Existing Tests -- UsersService
- **File**: `nexacore-api/src/users/tests/users.service.spec.ts`
- **Action**: Add `AuditService` mock to the test module providers
- **Implementation Steps**:
  1. Add import for `AuditService`
  2. Add mock provider (same pattern as Step 17)
  3. Update method calls that now require `ctx` parameter
  4. Add new test cases for audit log verification
- **Dependencies**: Step 15

### Step 19: Create AuditService Unit Tests
- **File**: `nexacore-api/src/audit/tests/audit.service.spec.ts`
- **Action**: Create comprehensive unit tests for AuditService
- **Code Structure**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../enums/audit-action.enum';

describe('AuditService', () => {
  let auditService: AuditService;
  let prismaService: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    auditService = module.get<AuditService>(AuditService);
  });

  describe('log', () => {
    it('should create audit log entry with all fields', async () => {
      // Arrange
      const entry = {
        action: AuditAction.LOGIN_SUCCESS,
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { extra: 'data' },
      };

      // Act
      await auditService.log(entry);

      // Assert
      expect(prismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN_SUCCESS',
          userId: 'user-123',
          targetUserId: null,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: { extra: 'data' },
        },
      });
    });

    it('should handle null optional fields gracefully', async () => {
      await auditService.log({ action: AuditAction.LOGIN_FAILURE });

      expect(prismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          targetUserId: null,
          ipAddress: null,
          userAgent: null,
        }),
      });
    });

    it('should not throw when prisma.create fails', async () => {
      prismaService.auditLog.create.mockRejectedValue(new Error('DB error'));

      await expect(
        auditService.log({ action: AuditAction.LOGIN_SUCCESS }),
      ).resolves.toBeUndefined();
    });

    it('should log error to console when prisma.create fails', async () => {
      const loggerSpy = jest.spyOn(auditService['logger'], 'error');
      prismaService.auditLog.create.mockRejectedValue(new Error('DB error'));

      await auditService.log({ action: AuditAction.LOGIN_SUCCESS });

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated results with meta', async () => {
      prismaService.auditLog.findMany.mockResolvedValue([{ id: '1' }]);
      prismaService.auditLog.count.mockResolvedValue(1);

      const result = await auditService.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by action type', async () => {
      await auditService.findAll({
        page: 1,
        limit: 20,
        action: AuditAction.LOGIN_SUCCESS,
      });

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'LOGIN_SUCCESS' }),
        }),
      );
    });

    it('should filter by userId (as actor or target)', async () => {
      await auditService.findAll({
        page: 1,
        limit: 20,
        userId: 'user-123',
      });

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ userId: 'user-123' }, { targetUserId: 'user-123' }],
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      await auditService.findAll({
        page: 1,
        limit: 20,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should respect sortOrder parameter', async () => {
      await auditService.findAll({
        page: 1,
        limit: 20,
        sortOrder: 'asc',
      });

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      prismaService.auditLog.count.mockResolvedValue(45);

      const result = await auditService.findAll({ page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findById', () => {
    it('should return audit log with user relations', async () => {
      const mockLog = { id: '1', action: 'LOGIN_SUCCESS', user: { email: 'a@b.com' } };
      prismaService.auditLog.findUnique.mockResolvedValue(mockLog);

      const result = await auditService.findById('1');

      expect(result).toEqual(mockLog);
      expect(prismaService.auditLog.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          include: expect.any(Object),
        }),
      );
    });

    it('should return null for non-existent id', async () => {
      prismaService.auditLog.findUnique.mockResolvedValue(null);

      const result = await auditService.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
```
- **Dependencies**: Step 5

### Step 20: Create AuditLogController Unit Tests
- **File**: `nexacore-api/src/audit/tests/audit.controller.spec.ts`
- **Action**: Create unit tests for the controller
- **Code Structure**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditLogController } from '../audit.controller';
import { AuditService } from '../audit.service';
import { AuditAction } from '../enums/audit-action.enum';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    auditService = module.get(AuditService);
  });

  describe('listAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockResult = {
        data: [{ id: '1' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      auditService.findAll.mockResolvedValue(mockResult);

      const result = await controller.listAuditLogs({});

      expect(result).toEqual(mockResult);
    });

    it('should pass all query filters to service', async () => {
      auditService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

      await controller.listAuditLogs({
        page: 2,
        limit: 50,
        action: AuditAction.LOGIN_SUCCESS,
        userId: 'user-123',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        sortOrder: 'asc',
      });

      expect(auditService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 50,
        action: AuditAction.LOGIN_SUCCESS,
        userId: 'user-123',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        sortOrder: 'asc',
      });
    });

    it('should use default values when query params missing', async () => {
      auditService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

      await controller.listAuditLogs({});

      expect(auditService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
    });
  });

  describe('getAuditLog', () => {
    it('should return audit log by id', async () => {
      const mockLog = { id: '1', action: 'LOGIN_SUCCESS' };
      auditService.findById.mockResolvedValue(mockLog);

      const result = await controller.getAuditLog('1');

      expect(result).toEqual(mockLog);
    });

    it('should throw NotFoundException for invalid id', async () => {
      auditService.findById.mockResolvedValue(null);

      await expect(controller.getAuditLog('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```
- **Dependencies**: Steps 7, 19

### Step 21: Add Frontend Types
- **File**: `nexacore-dashboard/src/lib/types.ts`
- **Action**: Add `AuditAction` type, `AuditLogUser` type, and `AuditLog` type
- **Code to append**:
```typescript
export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'REGISTER'
  | 'TOKEN_REFRESH'
  | 'OAUTH_LOGIN'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'USER_ROLE_CHANGE'
  | 'USER_DEACTIVATED'
  | 'USER_ACTIVATED'
  | 'USER_DELETED'
  | 'SUPERADMIN_BYPASS';

export type AuditLogUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
};

export type AuditLog = {
  id: string;
  action: AuditAction;
  userId: string | null;
  targetUserId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: AuditLogUser | null;
  targetUser: AuditLogUser | null;
};
```
- **Dependencies**: None (frontend types only)

### Step 22: Create AuditLogFilters Component
- **File**: `nexacore-dashboard/src/components/admin/AuditLogFilters.tsx`
- **Action**: Create a filter bar with action type dropdown, date range pickers, and a user search input
- **Code**:
```typescript
'use client';

import { Search } from 'lucide-react';
import type { AuditAction } from '@/lib/types';

type AuditLogFiltersProps = {
  action: AuditAction | '';
  onActionChange: (action: AuditAction | '') => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
};

const AUDIT_ACTIONS: { value: AuditAction; label: string }[] = [
  { value: 'LOGIN_SUCCESS', label: 'Login Success' },
  { value: 'LOGIN_FAILURE', label: 'Login Failure' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'REGISTER', label: 'Register' },
  { value: 'TOKEN_REFRESH', label: 'Token Refresh' },
  { value: 'OAUTH_LOGIN', label: 'OAuth Login' },
  { value: 'ACCOUNT_LOCKED', label: 'Account Locked' },
  { value: 'ACCOUNT_UNLOCKED', label: 'Account Unlocked' },
  { value: 'PASSWORD_CHANGE', label: 'Password Change' },
  { value: 'PROFILE_UPDATE', label: 'Profile Update' },
  { value: 'USER_ROLE_CHANGE', label: 'Role Change' },
  { value: 'USER_DEACTIVATED', label: 'User Deactivated' },
  { value: 'USER_ACTIVATED', label: 'User Activated' },
  { value: 'USER_DELETED', label: 'User Deleted' },
  { value: 'SUPERADMIN_BYPASS', label: 'SUPERADMIN Bypass' },
];

export default function AuditLogFilters({
  action,
  onActionChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  search,
  onSearchChange,
}: AuditLogFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {/* Action type dropdown */}
      <select
        value={action}
        onChange={(e) => onActionChange(e.target.value as AuditAction | '')}
        className="h-10 rounded-lg border border-border-default bg-transparent px-4 text-body-sm text-content-primary outline-none"
      >
        <option value="">All actions</option>
        {AUDIT_ACTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>

      {/* Date range */}
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="h-10 rounded-lg border border-border-default bg-transparent px-3 text-body-sm text-content-primary outline-none"
      />
      <span className="text-body-sm text-content-tertiary">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="h-10 rounded-lg border border-border-default bg-transparent px-3 text-body-sm text-content-primary outline-none"
      />

      {/* User search (searches by email) */}
      <div className="flex w-56 items-center gap-2 rounded-full border border-border-default bg-surface-secondary px-4">
        <Search size={16} className="text-content-tertiary" />
        <input
          type="text"
          placeholder="Filter by user..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 flex-1 bg-transparent text-body-sm text-content-primary outline-none placeholder:text-content-placeholder"
        />
      </div>
    </div>
  );
}
```
- **Dependencies**: Step 21

### Step 23: Create AuditLogsTable Component
- **File**: `nexacore-dashboard/src/components/admin/AuditLogsTable.tsx`
- **Action**: Create table component following the existing UsersTable pattern
- **Code**:
```typescript
'use client';

import type { AuditLog, AuditAction } from '@/lib/types';

type AuditLogsTableProps = {
  logs: AuditLog[];
};

const actionBadgeClasses: Record<AuditAction, string> = {
  LOGIN_SUCCESS: 'bg-[#e6fdf0] text-success',
  LOGIN_FAILURE: 'bg-[#fde6e6] text-error',
  LOGOUT: 'bg-surface-subtle text-content-secondary',
  REGISTER: 'bg-[#e6f1fd] text-info',
  TOKEN_REFRESH: 'bg-surface-subtle text-content-secondary',
  OAUTH_LOGIN: 'bg-[#e6f1fd] text-info',
  ACCOUNT_LOCKED: 'bg-[#fde6e6] text-error',
  ACCOUNT_UNLOCKED: 'bg-[#e6fdf0] text-success',
  PASSWORD_CHANGE: 'bg-[#fdf6e6] text-warning',
  PROFILE_UPDATE: 'bg-surface-subtle text-content-secondary',
  USER_ROLE_CHANGE: 'bg-[#fdf6e6] text-warning',
  USER_DEACTIVATED: 'bg-[#fde6e6] text-error',
  USER_ACTIVATED: 'bg-[#e6fdf0] text-success',
  USER_DELETED: 'bg-[#fde6e6] text-error',
  SUPERADMIN_BYPASS: 'bg-[#edeefc] text-[#4f507f]',
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

function formatAction(action: AuditAction): string {
  return action.replace(/_/g, ' ');
}

function formatUser(user: AuditLog['user']): string {
  if (!user) return '--';
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.email.split('@')[0];
}

function formatMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '--';
  const entries = Object.entries(metadata);
  if (entries.length === 0) return '--';
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ');
}

export default function AuditLogsTable({ logs }: AuditLogsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border-default bg-surface-primary shadow-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              Action
            </th>
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              Actor
            </th>
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              Target
            </th>
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              IP Address
            </th>
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-border-default last:border-b-0 hover:bg-surface-subtle"
            >
              <td className="whitespace-nowrap px-4 py-3 text-body-sm text-content-primary">
                {formatTimestamp(log.createdAt)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-caption font-medium ${
                    actionBadgeClasses[log.action] || 'bg-surface-subtle text-content-secondary'
                  }`}
                >
                  {formatAction(log.action)}
                </span>
              </td>
              <td className="px-4 py-3 text-body-sm text-content-primary">
                {formatUser(log.user)}
              </td>
              <td className="px-4 py-3 text-body-sm text-content-primary">
                {formatUser(log.targetUser)}
              </td>
              <td className="px-4 py-3 text-body-sm text-content-tertiary">
                {log.ipAddress || '--'}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-body-sm text-content-tertiary">
                {formatMetadata(log.metadata)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```
- **Dependencies**: Step 21

### Step 24: Create Audit Logs Page
- **File**: `nexacore-dashboard/src/app/admin/audit-logs/page.tsx`
- **Action**: Create the admin audit log viewer page, following the pattern established by `admin/page.tsx`
- **Code**:
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminRoute from '@/components/guards/AdminRoute';
import AuditLogsTable from '@/components/admin/AuditLogsTable';
import AuditLogFilters from '@/components/admin/AuditLogFilters';
import Pagination from '@/components/ui/Pagination';
import { apiClient } from '@/lib/api';
import type { AuditLog, AuditAction, PaginatedResponse } from '@/lib/types';

const LIMIT = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  });
  const [action, setAction] = useState<AuditAction | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(LIMIT),
        });
        if (action) params.set('action', action);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        const res = await apiClient.get<PaginatedResponse<AuditLog>>(
          `/audit-logs?${params}`,
        );
        setLogs(res.data);
        setMeta(res.meta);
      } catch {
        // silently fail -- users will see empty table
      } finally {
        setLoading(false);
      }
    },
    [action, startDate, endDate],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <AdminRoute>
      <DashboardLayout>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-body-sm font-semibold text-content-primary">
            Audit Logs
          </h1>
          <p className="mt-1 text-caption text-content-tertiary">
            Security event history and activity trail
          </p>
        </div>

        {/* Filters */}
        <AuditLogFilters
          action={action}
          onActionChange={setAction}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-body-sm text-content-tertiary">
              Loading audit logs...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-border-default bg-surface-primary">
            <p className="text-body-sm text-content-tertiary">
              No audit logs found.
            </p>
          </div>
        ) : (
          <>
            <AuditLogsTable logs={logs} />
            {meta.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(page) => fetchLogs(page)}
                />
              </div>
            )}
          </>
        )}
      </DashboardLayout>
    </AdminRoute>
  );
}
```
- **Dependencies**: Steps 22, 23

### Step 25: Add Audit Logs Navigation to Sidebar
- **File**: `nexacore-dashboard/src/components/layout/Sidebar.tsx`
- **Action**: Add "Audit Logs" as a new navigation item in the admin section
- **Implementation Steps**:
  1. Import `ScrollText` from `lucide-react`
  2. Add to the `adminItems` array:
     ```typescript
     const adminItems = [
       { href: '/admin', label: 'Admin', icon: Shield },
       { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
     ];
     ```
- **Dependencies**: Step 24

### Step 26: Update Technical Documentation
- **Action**: Update `ai-specs/specs/api-spec.yml` to document the new `/audit-logs` endpoints
- **Implementation Steps**:
  1. Add the `AuditLog` schema definition
  2. Add the `AuditAction` enum schema
  3. Add `GET /audit-logs` path with query parameters
  4. Add `GET /audit-logs/{id}` path
  5. Update the total endpoint count in project documentation

## Testing Checklist

### Unit Tests -- AuditService (`audit.service.spec.ts`)
- [ ] `log()` -- creates audit entry with all fields populated
- [ ] `log()` -- handles null userId, targetUserId, ipAddress, userAgent, metadata
- [ ] `log()` -- does not throw when Prisma create fails
- [ ] `log()` -- calls Logger.error when Prisma create fails
- [ ] `findAll()` -- returns correct pagination meta
- [ ] `findAll()` -- filters by action enum value
- [ ] `findAll()` -- filters by userId as actor OR target (OR clause)
- [ ] `findAll()` -- filters by date range (gte/lte)
- [ ] `findAll()` -- applies sort order correctly
- [ ] `findAll()` -- includes user and targetUser relations with select
- [ ] `findById()` -- returns log with relations
- [ ] `findById()` -- returns null for non-existent ID

### Unit Tests -- AuditLogController (`audit.controller.spec.ts`)
- [ ] `listAuditLogs()` -- calls service with correct params from query DTO
- [ ] `listAuditLogs()` -- uses default values when query params missing
- [ ] `getAuditLog()` -- returns log entry when found
- [ ] `getAuditLog()` -- throws NotFoundException when not found

### Unit Tests -- AuthService (updated `auth.service.spec.ts`)
- [ ] `register()` -- calls `auditService.log()` with `AuditAction.REGISTER`
- [ ] `login()` success -- calls `auditService.log()` with `AuditAction.LOGIN_SUCCESS`
- [ ] `login()` user not found -- calls `auditService.log()` with `AuditAction.LOGIN_FAILURE` and reason `user_not_found`
- [ ] `login()` account locked -- calls `auditService.log()` with `AuditAction.LOGIN_FAILURE` and reason `account_locked`
- [ ] `login()` wrong password -- calls `auditService.log()` with `AuditAction.LOGIN_FAILURE` and reason `invalid_password`
- [ ] `login()` max attempts reached -- calls `auditService.log()` with `AuditAction.ACCOUNT_LOCKED`
- [ ] `refreshTokens()` success -- calls `auditService.log()` with `AuditAction.TOKEN_REFRESH`
- [ ] `validateOAuthUser()` -- calls `auditService.log()` with `AuditAction.OAUTH_LOGIN` and provider metadata
- [ ] `logout()` -- calls `auditService.log()` with `AuditAction.LOGOUT`
- [ ] All log calls include ipAddress and userAgent from ctx

### Unit Tests -- UsersService (updated `users.service.spec.ts`)
- [ ] `changePassword()` -- calls `auditService.log()` with `AuditAction.PASSWORD_CHANGE`
- [ ] `updateProfile()` -- calls `auditService.log()` with `AuditAction.PROFILE_UPDATE` and field list
- [ ] `adminUpdateUser()` role change -- calls `auditService.log()` with `AuditAction.USER_ROLE_CHANGE` and old/new role
- [ ] `adminUpdateUser()` deactivation -- calls `auditService.log()` with `AuditAction.USER_DEACTIVATED`
- [ ] `adminUpdateUser()` activation -- calls `auditService.log()` with `AuditAction.USER_ACTIVATED`
- [ ] `softDelete()` -- calls `auditService.log()` with `AuditAction.USER_DELETED`

### Unit Tests -- RolesGuard (updated `roles.guard.spec.ts`)
- [ ] SUPERADMIN bypassing role check -- calls `auditService.log()` with `AuditAction.SUPERADMIN_BYPASS`
- [ ] SUPERADMIN accessing unprotected route (no required roles) -- does NOT call `auditService.log()`
- [ ] Non-SUPERADMIN users -- guard behaves identically to before (no audit logging)

### Integration Tests
- [ ] `POST /auth/login` with valid credentials -- creates `LOGIN_SUCCESS` audit row in database
- [ ] `POST /auth/login` with invalid credentials -- creates `LOGIN_FAILURE` audit row
- [ ] `GET /audit-logs` with ADMIN token -- returns 200 with paginated results
- [ ] `GET /audit-logs` with USER token -- returns 403
- [ ] `GET /audit-logs` without token -- returns 401
- [ ] `GET /audit-logs?action=LOGIN_SUCCESS` -- filters correctly
- [ ] `GET /audit-logs?startDate=...&endDate=...` -- filters by date range

### Manual Verification
- [ ] Log in to the dashboard as ADMIN, navigate to Audit Logs page -- table loads
- [ ] Perform a login/logout cycle -- verify events appear in audit log table
- [ ] Change a user's role -- verify `USER_ROLE_CHANGE` event appears with old/new role in metadata
- [ ] Log in as SUPERADMIN, access an ADMIN-only endpoint -- verify `SUPERADMIN_BYPASS` event appears
- [ ] Filter by action type -- verify only matching events shown
- [ ] Filter by date range -- verify correct date filtering
- [ ] Verify pagination works with > 20 audit entries

## Error Handling

| Scenario | Handling |
|----------|----------|
| Audit write fails (Prisma error) | Error is caught, logged via NestJS `Logger.error()`, primary operation continues unaffected |
| `GET /audit-logs` without auth | 401 from JwtAuthGuard (standard behavior) |
| `GET /audit-logs` with insufficient role | 403 from RolesGuard (standard behavior) |
| `GET /audit-logs/:id` with non-existent ID | 404 NotFoundException thrown by controller |
| Invalid query parameters | 400 from ValidationPipe (existing global pipe handles class-validator errors) |
| Invalid date format in startDate/endDate | 400 from `@IsDateString()` validator |
| Database connection failure during audit write | Caught by try/catch in `AuditService.log()`, logged, not propagated |

**Critical Design Principle**: Audit logging must NEVER cause a user-facing failure. Every `auditService.log()` call is followed by `.catch(() => {})` at the call site, and the `log()` method itself wraps the Prisma call in try/catch. This double safety net ensures that even if the audit system is completely down, authentication and user management continue to function normally.

## Non-Functional Requirements

### Log Retention
- **Default retention**: Indefinite (no automatic deletion)
- **Future consideration**: Add a scheduled job (cron) to archive/delete logs older than configurable retention period (e.g., 90 days, 1 year). This is out of scope for SCRUM-25 but should be tracked as a follow-up ticket.
- **Index strategy**: Indexes on `action`, `userId`, `targetUserId`, and `createdAt` ensure fast filtering even with millions of rows.

### Performance Impact
- **Write overhead**: Each audit log is a single `INSERT` into PostgreSQL. At ~0.5ms per insert, this adds negligible latency to operations.
- **Fire-and-forget pattern**: The `.catch(() => {})` call pattern means the primary operation does NOT await the audit write completion (the Promise runs concurrently). The `await` inside `AuditService.log()` ensures the write completes but the caller is not blocked.
- **NOTE**: For highest performance, the `.catch(() => {})` pattern at the call site means the caller does NOT await. However, inside `AuditService.log()`, the `await` ensures the Prisma call is resolved before the method's Promise resolves. Because the call site ignores the Promise (`this.auditService.log(...).catch(...)`), the caller proceeds immediately. This is an important distinction.
- **Read overhead**: The `GET /audit-logs` endpoint uses indexed queries with pagination (max 100 per page). The `include` with `select` on relations minimizes data transfer.

### Storage Estimates
| Metric | Estimate |
|--------|----------|
| Average row size | ~500 bytes (UUID fields, short strings, small JSON) |
| Events per active user per day | ~5-10 (login, refresh, maybe a profile update) |
| 100 active users, 30 days | ~15,000-30,000 rows = ~7.5-15 MB |
| 1,000 active users, 365 days | ~1.8-3.6 million rows = ~900 MB - 1.8 GB |
| Recommended monitoring threshold | Alert at 5 million rows; implement archival strategy |

### Security Considerations
- Audit logs are **read-only** from the API. There is no `DELETE` or `PATCH` endpoint for audit logs. Only direct database access can modify or delete them.
- The `metadata` JSON field may contain email addresses (for failed logins of non-existent accounts). This is acceptable for security audit purposes but should be considered in GDPR data subject access requests.
- IP addresses stored in audit logs are PII under GDPR. The retention policy should account for this.

## Dependencies

### Backend Dependencies
- No new npm packages required. All functionality is built with existing NestJS + Prisma stack.
- **Prisma Client**: Regeneration required after schema change (handled in Step 4).

### Frontend Dependencies
- No new npm packages required. Uses existing `lucide-react` for icons, existing UI components (`Pagination`, `AdminRoute`, `DashboardLayout`).

### Service Dependencies
- PostgreSQL database must be accessible for migration.
- Existing `PrismaModule` (global) provides `PrismaService` to `AuditModule`.

## Documentation Updates

| Document | Update Required |
|----------|----------------|
| `ai-specs/specs/api-spec.yml` | Add `GET /audit-logs` and `GET /audit-logs/:id` endpoint definitions |
| `ai-specs/specs/data-model.md` | Add `AuditLog` entity (16th entity) and `AuditAction` enum (13th enum) |
| `ai-specs/specs/backend-standards.mdc` | Add section on audit logging conventions and fire-and-forget pattern |
| `ai-specs/specs/frontend-standards.mdc` | Document audit logs page under admin routes |

## Definition of Done

- [ ] **Schema**: `AuditAction` enum and `AuditLog` model exist in `schema.prisma`; migration applied successfully
- [ ] **Backend module**: `AuditModule` created with `AuditService`, `AuditLogController`, DTOs, enum, and interface files
- [ ] **AppModule**: `AuditModule` imported in `app.module.ts`
- [ ] **AuthService instrumented**: All 9 event points (register, login success, login failure x3, account locked, token refresh, OAuth login, logout) produce audit log entries
- [ ] **UsersService instrumented**: All 6 event points (password change, profile update, role change, user deactivated, user activated, user deleted) produce audit log entries
- [ ] **RolesGuard instrumented**: `SUPERADMIN_BYPASS` logged when SUPERADMIN bypasses role restrictions
- [ ] **Request context**: IP address and User-Agent captured and stored for all audit events
- [ ] **Fire-and-forget**: Audit log failures never break primary operations (verified by unit test that mocks a Prisma failure)
- [ ] **API endpoint**: `GET /audit-logs` returns paginated, filterable audit logs (ADMIN-protected)
- [ ] **API endpoint**: `GET /audit-logs/:id` returns a single audit log entry (ADMIN-protected)
- [ ] **Frontend page**: Audit logs viewer accessible at `/admin/audit-logs` with table, filters (action, date range), and pagination
- [ ] **Frontend navigation**: "Audit Logs" link appears in sidebar for ADMIN/SUPERADMIN users
- [ ] **Unit tests**: All new and updated test files pass with 85%+ branch coverage, 90%+ line coverage
- [ ] **Existing tests**: All previously passing tests still pass (no regressions from adding `AuditService` dependency)
- [ ] **Swagger**: New endpoints documented and visible at `/api/docs`
- [ ] **Linting**: `npm run lint` passes with no errors
- [ ] **Build**: `npm run build` succeeds for both `nexacore-api` and `nexacore-dashboard`
- [ ] **No TODO comments**: All implementation is complete; no placeholder code
