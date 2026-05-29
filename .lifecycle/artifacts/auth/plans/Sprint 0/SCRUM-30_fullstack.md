# Fullstack Implementation Spec: SCRUM-30 Advanced RBAC & Permissions

## Overview

Evolve the EM NexaCore platform from a simple 3-role system (USER, ADMIN, SUPERADMIN) to a granular, permission-based access control model. This story introduces a `Permission` entity, a many-to-many `RolePermission` join table, a `PermissionsGuard` with `@RequirePermissions()` decorator, default permission seeding per role, admin endpoints for dynamic permission assignment, in-memory permission caching with TTL, and frontend permission integration via a `usePermissions()` hook and `<Can>` component. SUPERADMIN continues to bypass all permission checks, consistent with the existing role bypass policy.

**Epic**: SCRUM-22 -- Auth Security Hardening & Enterprise Features
**Story**: SCRUM-30 -- Advanced RBAC & Permissions (Layer 8 of 8, MEDIUM priority)
**Sub-tasks**: SCRUM-81 through SCRUM-87

---

## Architecture Context

### Current State (Before SCRUM-30)

```
User.role = SUPERADMIN | ADMIN | USER
                 |
                 v
         RolesGuard checks @Roles(Role.ADMIN)
         SUPERADMIN bypasses all checks
         No granular permissions - all-or-nothing per role
```

### Target State (After SCRUM-30)

```
User.role ──> RolePermission (M:M) ──> Permission
                 |                          |
                 v                          v
         PermissionsGuard checks      resource:action format
         @RequirePermissions(...)      e.g. "users:read"
         SUPERADMIN bypasses           Cached in memory (5min TTL)

Guards stack: JwtAuthGuard -> RolesGuard (optional) -> PermissionsGuard
```

### Permission String Format

All permissions follow `resource:action` convention:

| Resource | Actions | Permission Strings |
|---|---|---|
| `users` | read, write, delete | `users:read`, `users:write`, `users:delete` |
| `audit-logs` | read | `audit-logs:read` |
| `permissions` | read, write | `permissions:read`, `permissions:write` |
| `dashboard` | read | `dashboard:read` |
| `settings` | read, write | `settings:read`, `settings:write` |

### Default Role-Permission Matrix

| Permission | USER | ADMIN | SUPERADMIN |
|---|---|---|---|
| `dashboard:read` | Yes | Yes | * (bypass) |
| `users:read` | No | Yes | * (bypass) |
| `users:write` | No | Yes | * (bypass) |
| `users:delete` | No | Yes | * (bypass) |
| `audit-logs:read` | No | Yes | * (bypass) |
| `permissions:read` | No | Yes | * (bypass) |
| `permissions:write` | No | No | * (bypass) |
| `settings:read` | Yes | Yes | * (bypass) |
| `settings:write` | No | Yes | * (bypass) |

> **SUPERADMIN Policy**: SUPERADMIN always bypasses permission checks at the guard level. Permissions are never explicitly assigned to SUPERADMIN in the database -- the guard short-circuits.

### Endpoint-to-Guard Mapping (Updated)

| Endpoint | Guards | Current | After SCRUM-30 |
|---|---|---|---|
| `GET /users` | JwtAuth + Roles(ADMIN) | RolesGuard | RolesGuard + PermissionsGuard(`users:read`) |
| `GET /users/:id` | JwtAuth + Roles(ADMIN) | RolesGuard | RolesGuard + PermissionsGuard(`users:read`) |
| `PATCH /users/:id` | JwtAuth + Roles(ADMIN) | RolesGuard | RolesGuard + PermissionsGuard(`users:write`) |
| `DELETE /users/:id` | JwtAuth + Roles(ADMIN) | RolesGuard | RolesGuard + PermissionsGuard(`users:delete`) |
| `GET /permissions` | JwtAuth + Roles(ADMIN) | N/A (new) | PermissionsGuard(`permissions:read`) |
| `GET /permissions/roles/:role` | JwtAuth + Roles(ADMIN) | N/A (new) | PermissionsGuard(`permissions:read`) |
| `PUT /permissions/roles/:role` | JwtAuth + Roles(ADMIN) | N/A (new) | PermissionsGuard(`permissions:write`) |
| `GET /auth/me` | JwtAuth | No change | No change (no permission needed) |
| `PATCH /users/me` | JwtAuth | No change | No change (self-service) |

---

## Endpoint Specification

### New Endpoints: Permissions Management

#### `GET /permissions` -- List All Permissions

Returns all defined permissions in the system.

**Guards**: `JwtAuthGuard`, `RolesGuard(@Roles(Role.ADMIN))`, `PermissionsGuard(@RequirePermissions('permissions:read'))`

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "key": "users:read",
      "description": "View user list and details",
      "resource": "users",
      "action": "read",
      "createdAt": "2026-02-26T00:00:00.000Z"
    }
  ]
}
```

#### `GET /permissions/roles/:role` -- Get Permissions for a Role

Returns all permissions assigned to a specific role.

**Guards**: `JwtAuthGuard`, `RolesGuard(@Roles(Role.ADMIN))`, `PermissionsGuard(@RequirePermissions('permissions:read'))`

**Params**: `role` - one of `USER`, `ADMIN`

**Response** `200 OK`:
```json
{
  "role": "ADMIN",
  "permissions": [
    {
      "id": "uuid",
      "key": "users:read",
      "description": "View user list and details",
      "resource": "users",
      "action": "read"
    }
  ]
}
```

**Error** `400 Bad Request`:
```json
{
  "statusCode": 400,
  "message": "Cannot query permissions for SUPERADMIN (bypasses all checks)"
}
```

#### `PUT /permissions/roles/:role` -- Set Permissions for a Role

Replaces all permission assignments for a role. Uses PUT (full replacement) rather than PATCH (partial) to ensure atomic, idempotent updates.

**Guards**: `JwtAuthGuard`, `RolesGuard(@Roles(Role.ADMIN))`, `PermissionsGuard(@RequirePermissions('permissions:write'))`

**Params**: `role` - one of `USER`, `ADMIN`

**Body**:
```json
{
  "permissionKeys": ["users:read", "dashboard:read", "settings:read"]
}
```

**Response** `200 OK`:
```json
{
  "role": "USER",
  "permissions": [
    { "key": "users:read", "description": "View user list and details" },
    { "key": "dashboard:read", "description": "View dashboard" },
    { "key": "settings:read", "description": "View application settings" }
  ]
}
```

**Error** `400 Bad Request`:
```json
{
  "statusCode": 400,
  "message": "Invalid permission keys: invalid:permission"
}
```

**Error** `400 Bad Request`:
```json
{
  "statusCode": 400,
  "message": "Cannot assign permissions to SUPERADMIN (bypasses all checks)"
}
```

#### `GET /auth/me` -- Updated Response

The `/auth/me` endpoint response is extended to include the user's resolved permissions array.

**Response** `200 OK` (additions shown):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "ADMIN",
  "permissions": ["users:read", "users:write", "users:delete", "audit-logs:read", "dashboard:read", "settings:read", "settings:write", "permissions:read"]
}
```

> For SUPERADMIN users, `permissions` is returned as `["*"]` to indicate full access.

---

## Database Changes

### New Prisma Models

```prisma
model Permission {
  id          String           @id @default(uuid())
  key         String           @unique    // e.g. "users:read"
  description String
  resource    String                      // e.g. "users"
  action      String                      // e.g. "read"
  createdAt   DateTime         @default(now())

  rolePermissions RolePermission[]

  @@index([resource])
  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(uuid())
  role         Role
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())

  @@unique([role, permissionId])
  @@index([role])
  @@map("role_permissions")
}
```

### Migration SQL

```sql
-- CreateTable: permissions
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: role_permissions
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "role_permissions"("role", "permissionId");
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Files to Create

### Backend

| # | File | Purpose |
|---|---|---|
| 1 | `nexacore-api/src/permissions/permissions.module.ts` | NestJS module for permissions feature |
| 2 | `nexacore-api/src/permissions/permissions.service.ts` | Business logic: CRUD, role-permission lookups, cache |
| 3 | `nexacore-api/src/permissions/permissions.controller.ts` | REST endpoints for permission management |
| 4 | `nexacore-api/src/permissions/dto/set-role-permissions.dto.ts` | Validation DTO for `PUT /permissions/roles/:role` |
| 5 | `nexacore-api/src/permissions/entities/permission.entity.ts` | Permission & RolePermission type definitions |
| 6 | `nexacore-api/src/permissions/permissions.cache.ts` | In-memory cache for role-permission lookups |
| 7 | `nexacore-api/src/permissions/permissions.seed.ts` | Default permission seeder (run on app bootstrap) |
| 8 | `nexacore-api/src/permissions/constants/default-permissions.ts` | Permission definitions and default role mappings |
| 9 | `nexacore-api/src/auth/guards/permissions.guard.ts` | PermissionsGuard implementation |
| 10 | `nexacore-api/src/common/decorators/permissions.decorator.ts` | `@RequirePermissions()` decorator |
| 11 | `nexacore-api/prisma/migrations/YYYYMMDDHHMMSS_add_permissions_rbac/migration.sql` | Database migration |

### Frontend

| # | File | Purpose |
|---|---|---|
| 12 | `nexacore-dashboard/src/context/PermissionsContext.tsx` | PermissionsProvider + `usePermissions()` hook |
| 13 | `nexacore-dashboard/src/components/guards/Can.tsx` | `<Can permission="...">` conditional render component |
| 14 | `nexacore-dashboard/src/components/guards/PermissionRoute.tsx` | Route-level permission guard component |
| 15 | `nexacore-dashboard/src/app/admin/permissions/page.tsx` | Admin permissions management page |
| 16 | `nexacore-dashboard/src/components/admin/PermissionsMatrix.tsx` | Visual role-permission matrix editor |

### Tests

| # | File | Purpose |
|---|---|---|
| 17 | `nexacore-api/tests/permissions/permissions.service.spec.ts` | Unit tests for PermissionsService |
| 18 | `nexacore-api/tests/permissions/permissions.controller.spec.ts` | Unit tests for PermissionsController |
| 19 | `nexacore-api/tests/auth/permissions.guard.spec.ts` | Unit tests for PermissionsGuard |
| 20 | `nexacore-api/tests/permissions/permissions.cache.spec.ts` | Unit tests for PermissionsCache |

---

## Files to Modify

| # | File | Changes |
|---|---|---|
| 1 | `nexacore-api/prisma/schema.prisma` | Add `Permission` and `RolePermission` models |
| 2 | `nexacore-api/src/app.module.ts` | Import `PermissionsModule` |
| 3 | `nexacore-api/src/users/users.controller.ts` | Add `@RequirePermissions()` to admin endpoints alongside existing `@Roles()` |
| 4 | `nexacore-api/src/auth/auth.controller.ts` | Modify `getMe()` to include permissions in response |
| 5 | `nexacore-api/src/auth/auth.module.ts` | Import `PermissionsModule` for guard dependency injection |
| 6 | `nexacore-api/src/auth/guards/roles.guard.ts` | Minor: ensure guard ordering compatibility with PermissionsGuard |
| 7 | `nexacore-api/src/common/interfaces/jwt-payload.interface.ts` | Add optional `permissions` field for cache hint |
| 8 | `nexacore-api/src/users/entities/user.entity.ts` | Add `permissions` to `SafeUser` response type |
| 9 | `nexacore-dashboard/src/lib/types.ts` | Add `permissions` field to `SafeUser`, add permission types |
| 10 | `nexacore-dashboard/src/context/AuthContext.tsx` | Integrate PermissionsContext; pass permissions from `/auth/me` |
| 11 | `nexacore-dashboard/src/app/layout.tsx` | Wrap app with `PermissionsProvider` |
| 12 | `nexacore-dashboard/src/components/guards/AdminRoute.tsx` | Optionally use `usePermissions()` for more granular checks |
| 13 | `nexacore-dashboard/src/app/admin/page.tsx` | Wrap admin actions with `<Can>` for granular UI |
| 14 | `nexacore-dashboard/src/components/admin/UsersTable.tsx` | Conditionally show/hide action buttons based on permissions |

---

## Implementation Steps

### Step 1: Database Schema -- Permission and RolePermission Models

**SCRUM-81**: Permission model and migration

**File**: `nexacore-api/prisma/schema.prisma` (MODIFY)

Add to the existing schema after the `User` model:

```prisma
model Permission {
  id          String           @id @default(uuid())
  key         String           @unique
  description String
  resource    String
  action      String
  createdAt   DateTime         @default(now())

  rolePermissions RolePermission[]

  @@index([resource])
  @@map("permissions")
}

model RolePermission {
  id           String     @id @default(uuid())
  role         Role
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())

  @@unique([role, permissionId])
  @@index([role])
  @@map("role_permissions")
}
```

Run migration:
```bash
cd nexacore-api && npx prisma migrate dev --name add_permissions_rbac
```

---

### Step 2: Permission Constants and Default Mappings

**SCRUM-81**: Permission model and migration

**File**: `nexacore-api/src/permissions/constants/default-permissions.ts` (CREATE)

```typescript
import { Role } from '../../users/enums/role.enum';

export interface PermissionDefinition {
  key: string;
  description: string;
  resource: string;
  action: string;
}

export const DEFAULT_PERMISSIONS: PermissionDefinition[] = [
  // Dashboard
  { key: 'dashboard:read', description: 'View dashboard', resource: 'dashboard', action: 'read' },

  // Users
  { key: 'users:read', description: 'View user list and details', resource: 'users', action: 'read' },
  { key: 'users:write', description: 'Create and update users', resource: 'users', action: 'write' },
  { key: 'users:delete', description: 'Delete (deactivate) users', resource: 'users', action: 'delete' },

  // Audit Logs
  { key: 'audit-logs:read', description: 'View audit logs', resource: 'audit-logs', action: 'read' },

  // Permissions
  { key: 'permissions:read', description: 'View role-permission assignments', resource: 'permissions', action: 'read' },
  { key: 'permissions:write', description: 'Modify role-permission assignments', resource: 'permissions', action: 'write' },

  // Settings
  { key: 'settings:read', description: 'View application settings', resource: 'settings', action: 'read' },
  { key: 'settings:write', description: 'Modify application settings', resource: 'settings', action: 'write' },
];

/**
 * Default permission-key assignments per role.
 * SUPERADMIN is NOT listed here — it bypasses all permission checks at the guard level.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [Role.USER]: [
    'dashboard:read',
    'settings:read',
  ],
  [Role.ADMIN]: [
    'dashboard:read',
    'users:read',
    'users:write',
    'users:delete',
    'audit-logs:read',
    'permissions:read',
    'settings:read',
    'settings:write',
  ],
};
```

---

### Step 3: Permission Entity Types

**File**: `nexacore-api/src/permissions/entities/permission.entity.ts` (CREATE)

```typescript
export interface Permission {
  id: string;
  key: string;
  description: string;
  resource: string;
  action: string;
  createdAt: Date;
}

export interface RolePermission {
  id: string;
  role: string;
  permissionId: string;
  permission?: Permission;
  createdAt: Date;
}

export interface RolePermissionsResponse {
  role: string;
  permissions: Pick<Permission, 'id' | 'key' | 'description' | 'resource' | 'action'>[];
}
```

---

### Step 4: In-Memory Permission Cache

**SCRUM-86**: Permission caching

**File**: `nexacore-api/src/permissions/permissions.cache.ts` (CREATE)

```typescript
import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  permissions: string[];
  expiresAt: number;
}

@Injectable()
export class PermissionsCache {
  private readonly logger = new Logger(PermissionsCache.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached permissions for a role.
   * Returns null if not cached or expired.
   */
  get(role: string): string[] | null {
    const entry = this.cache.get(role);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(role);
      this.logger.debug(`Cache expired for role: ${role}`);
      return null;
    }

    this.logger.debug(`Cache hit for role: ${role}`);
    return entry.permissions;
  }

  /**
   * Set permissions for a role in cache with TTL.
   */
  set(role: string, permissions: string[], ttlMs?: number): void {
    const ttl = ttlMs ?? this.DEFAULT_TTL_MS;
    this.cache.set(role, {
      permissions,
      expiresAt: Date.now() + ttl,
    });
    this.logger.debug(`Cached ${permissions.length} permissions for role: ${role} (TTL: ${ttl}ms)`);
  }

  /**
   * Invalidate cache for a specific role.
   * Call this after role-permission assignments change.
   */
  invalidate(role: string): void {
    this.cache.delete(role);
    this.logger.debug(`Cache invalidated for role: ${role}`);
  }

  /**
   * Invalidate all cached entries.
   */
  invalidateAll(): void {
    this.cache.clear();
    this.logger.debug('All permission caches invalidated');
  }

  /**
   * Get cache statistics for monitoring.
   */
  getStats(): { size: number; roles: string[] } {
    return {
      size: this.cache.size,
      roles: Array.from(this.cache.keys()),
    };
  }
}
```

---

### Step 5: Permissions Service

**SCRUM-82, SCRUM-83, SCRUM-85**: Role-permission mapping, dynamic assignment, caching integration

**File**: `nexacore-api/src/permissions/permissions.service.ts` (CREATE)

```typescript
import {
  Injectable,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../users/enums/role.enum';
import { PermissionsCache } from './permissions.cache';
import {
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from './constants/default-permissions';
import type { Permission, RolePermissionsResponse } from './entities/permission.entity';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: PermissionsCache,
  ) {}

  /**
   * Seed default permissions on module initialization.
   * Uses upsert to be idempotent (safe to run multiple times).
   */
  async onModuleInit(): Promise<void> {
    await this.seedPermissions();
  }

  // ── Seeding ──

  async seedPermissions(): Promise<void> {
    this.logger.log('Seeding default permissions...');

    // 1. Upsert all permission definitions
    for (const perm of DEFAULT_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { key: perm.key },
        update: {
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
        },
        create: {
          key: perm.key,
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
        },
      });
    }

    // 2. Seed default role-permission mappings (only if role has no permissions yet)
    for (const [role, permissionKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const existingCount = await this.prisma.rolePermission.count({
        where: { role: role as Role },
      });

      if (existingCount === 0) {
        const permissions = await this.prisma.permission.findMany({
          where: { key: { in: permissionKeys } },
        });

        await this.prisma.rolePermission.createMany({
          data: permissions.map((p) => ({
            role: role as Role,
            permissionId: p.id,
          })),
          skipDuplicates: true,
        });

        this.logger.log(`Seeded ${permissions.length} permissions for role: ${role}`);
      } else {
        this.logger.log(`Role ${role} already has ${existingCount} permissions, skipping seed`);
      }
    }

    // Invalidate cache after seeding
    this.cache.invalidateAll();
    this.logger.log('Permission seeding complete');
  }

  // ── Queries ──

  /**
   * List all defined permissions.
   */
  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    }) as Promise<Permission[]>;
  }

  /**
   * Get all permission keys for a role.
   * Uses cache with 5-minute TTL to avoid DB queries on every request.
   */
  async getPermissionKeysForRole(role: Role): Promise<string[]> {
    // SUPERADMIN bypasses — return wildcard
    if (role === Role.SUPERADMIN) {
      return ['*'];
    }

    // Check cache first
    const cached = this.cache.get(role);
    if (cached) return cached;

    // Query DB
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });

    const keys = rolePermissions.map((rp) => (rp as { permission: { key: string } }).permission.key);

    // Cache result
    this.cache.set(role, keys);

    return keys;
  }

  /**
   * Get full permission objects for a role.
   */
  async getPermissionsForRole(role: Role): Promise<RolePermissionsResponse> {
    if (role === Role.SUPERADMIN) {
      throw new BadRequestException(
        'Cannot query permissions for SUPERADMIN (bypasses all checks)',
      );
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
      orderBy: { permission: { resource: 'asc' } },
    });

    return {
      role,
      permissions: rolePermissions.map((rp) => {
        const perm = rp as { permission: Permission };
        return {
          id: perm.permission.id,
          key: perm.permission.key,
          description: perm.permission.description,
          resource: perm.permission.resource,
          action: perm.permission.action,
        };
      }),
    };
  }

  // ── Mutations ──

  /**
   * Replace all permissions for a role (atomic operation).
   * Deletes existing assignments and creates new ones in a transaction.
   */
  async setPermissionsForRole(
    role: Role,
    permissionKeys: string[],
  ): Promise<RolePermissionsResponse> {
    if (role === Role.SUPERADMIN) {
      throw new BadRequestException(
        'Cannot assign permissions to SUPERADMIN (bypasses all checks)',
      );
    }

    // Validate all keys exist
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
    });

    const foundKeys = new Set(permissions.map((p) => p.key));
    const invalidKeys = permissionKeys.filter((k) => !foundKeys.has(k));

    if (invalidKeys.length > 0) {
      throw new BadRequestException(
        `Invalid permission keys: ${invalidKeys.join(', ')}`,
      );
    }

    // Atomic: delete all existing + create new
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({
        where: { role },
      }),
      this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
          role,
          permissionId: p.id,
        })),
      }),
    ]);

    // Invalidate cache for this role
    this.cache.invalidate(role);

    this.logger.log(`Updated permissions for role ${role}: ${permissionKeys.join(', ')}`);

    return {
      role,
      permissions: permissions.map((p) => ({
        id: p.id,
        key: p.key,
        description: p.description,
        resource: p.resource,
        action: p.action,
      })),
    };
  }

  /**
   * Check if a role has a specific permission.
   * Used by PermissionsGuard.
   */
  async roleHasPermission(role: Role, permissionKey: string): Promise<boolean> {
    if (role === Role.SUPERADMIN) return true;

    const keys = await this.getPermissionKeysForRole(role);
    return keys.includes(permissionKey);
  }

  /**
   * Check if a role has ALL of the specified permissions.
   * Used by PermissionsGuard when multiple permissions are required.
   */
  async roleHasAllPermissions(role: Role, permissionKeys: string[]): Promise<boolean> {
    if (role === Role.SUPERADMIN) return true;

    const keys = await this.getPermissionKeysForRole(role);
    return permissionKeys.every((k) => keys.includes(k));
  }
}
```

---

### Step 6: DTO for Setting Role Permissions

**File**: `nexacore-api/src/permissions/dto/set-role-permissions.dto.ts` (CREATE)

```typescript
import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetRolePermissionsDto {
  @ApiProperty({
    description: 'Array of permission keys to assign to the role',
    example: ['users:read', 'dashboard:read', 'settings:read'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  permissionKeys: string[];
}
```

---

### Step 7: `@RequirePermissions()` Decorator

**SCRUM-83**: Permission guard and decorator

**File**: `nexacore-api/src/common/decorators/permissions.decorator.ts` (CREATE)

```typescript
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for an endpoint.
 * Can accept one or more permission keys.
 * All specified permissions must be present (AND logic).
 *
 * @example
 * @RequirePermissions('users:read')
 * @RequirePermissions('users:write', 'users:delete')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

---

### Step 8: PermissionsGuard

**SCRUM-83**: Permission guard and decorator

**File**: `nexacore-api/src/auth/guards/permissions.guard.ts` (CREATE)

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { PermissionsService } from '../../permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2. Get user from request (set by JwtAuthGuard)
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: Role } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // 3. SUPERADMIN bypasses all permission checks
    if (user.role === Role.SUPERADMIN) {
      return true;
    }

    // 4. Check if user's role has all required permissions
    const hasAllPermissions = await this.permissionsService.roleHasAllPermissions(
      user.role,
      requiredPermissions,
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
```

---

### Step 9: Permissions Controller

**SCRUM-85**: Dynamic permission assignment endpoints

**File**: `nexacore-api/src/permissions/permissions.controller.ts` (CREATE)

```typescript
import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Role } from '../users/enums/role.enum';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'List all defined permissions' })
  @ApiResponse({ status: 200, description: 'Returns all permissions' })
  async findAll() {
    const data = await this.permissionsService.findAll();
    return { data };
  }

  @Get('roles/:role')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  @ApiResponse({ status: 200, description: 'Returns role permissions' })
  @ApiResponse({ status: 400, description: 'Invalid role or SUPERADMIN queried' })
  async getForRole(@Param('role') roleParam: string) {
    const role = this.parseRole(roleParam);
    return this.permissionsService.getPermissionsForRole(role);
  }

  @Put('roles/:role')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('permissions:write')
  @ApiOperation({ summary: 'Set permissions for a role (full replacement)' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role, SUPERADMIN, or invalid permission keys' })
  async setForRole(
    @Param('role') roleParam: string,
    @Body() dto: SetRolePermissionsDto,
  ) {
    const role = this.parseRole(roleParam);
    return this.permissionsService.setPermissionsForRole(role, dto.permissionKeys);
  }

  /**
   * Parse and validate the role path parameter.
   */
  private parseRole(roleParam: string): Role {
    const normalizedRole = roleParam.toUpperCase();
    if (!Object.values(Role).includes(normalizedRole as Role)) {
      throw new BadRequestException(
        `Invalid role: ${roleParam}. Valid roles: ${Object.values(Role).join(', ')}`,
      );
    }
    return normalizedRole as Role;
  }
}
```

---

### Step 10: Permissions Module

**File**: `nexacore-api/src/permissions/permissions.module.ts` (CREATE)

```typescript
import { Module, Global } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsCache } from './permissions.cache';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Global() // Global so PermissionsGuard can inject PermissionsService from any module
@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsCache, PermissionsGuard],
  exports: [PermissionsService, PermissionsCache, PermissionsGuard],
})
export class PermissionsModule {}
```

---

### Step 11: Register PermissionsModule in AppModule

**File**: `nexacore-api/src/app.module.ts` (MODIFY)

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, PermissionsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

---

### Step 12: Add `@RequirePermissions()` to Users Controller

**SCRUM-83**: Permission guard applied to existing endpoints

**File**: `nexacore-api/src/users/users.controller.ts` (MODIFY)

```typescript
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Role } from './enums/role.enum';
import { toSafeUser } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Self-service endpoints (no permission check needed) ──

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(req.user.id, dto);
    return { message: 'Password changed successfully' };
  }

  // ── Admin endpoints (role + permission checks) ──

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('users:read')
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('users:read')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return { error: 'User not found' };
    }
    return toSafeUser(user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('users:write')
  async adminUpdateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @Request() req: { user: { role: Role } },
  ) {
    return this.usersService.adminUpdateUser(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('users:delete')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.softDelete(id);
    return { message: 'User deactivated successfully' };
  }
}
```

---

### Step 13: Extend `/auth/me` to Include Permissions

**File**: `nexacore-api/src/auth/auth.controller.ts` (MODIFY)

Update the `getMe()` method to resolve and include the user's permissions:

```typescript
// Add import at top:
import { PermissionsService } from '../permissions/permissions.service';

// Update constructor:
constructor(
  private readonly authService: AuthService,
  private readonly permissionsService: PermissionsService,
) {}

// Update getMe method:
@Get('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get current authenticated user profile' })
@ApiResponse({ status: 200, description: 'Returns user profile with permissions' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async getMe(@Request() req: { user: SafeUser }) {
  const permissions = await this.permissionsService.getPermissionKeysForRole(req.user.role);
  return {
    ...req.user,
    permissions,
  };
}
```

**File**: `nexacore-api/src/auth/auth.module.ts` (MODIFY)

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { UsersModule } from '../users/users.module';
// PermissionsModule is @Global — no explicit import needed here,
// PermissionsService will be available via DI automatically.

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GitHubStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

> **Note**: Because `PermissionsModule` is decorated with `@Global()`, `PermissionsService` is available for injection in `AuthController` without explicitly importing `PermissionsModule` in `AuthModule`.

---

### Step 14: Update Backend User Entity Types

**File**: `nexacore-api/src/users/entities/user.entity.ts` (MODIFY)

Add an extended SafeUser type that includes permissions:

```typescript
import { Role } from '../enums/role.enum';
import { Provider } from '../enums/provider.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: Role;
  provider: Provider;
  providerId: string | null;
  emailVerified: boolean;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<User, 'passwordHash' | 'refreshToken'>;

/** SafeUser extended with resolved permission keys (returned by /auth/me) */
export type SafeUserWithPermissions = SafeUser & {
  permissions: string[];
};

export function toSafeUser(user: User): SafeUser {
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    provider: user.provider,
    providerId: user.providerId,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    failedAttempts: user.failedAttempts,
    lockedUntil: user.lockedUntil,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return safeUser;
}
```

---

### Step 15: Update Frontend Types

**File**: `nexacore-dashboard/src/lib/types.ts` (MODIFY)

```typescript
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'USER';

export type SafeUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  provider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  providerId: string | null;
  emailVerified: boolean;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  permissions?: string[]; // NEW: populated by /auth/me
};

export type AuthResponse = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
};

export type ErrorResponse = {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type UpdateProfileDto = {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export type AdminUpdateUserDto = {
  role?: UserRole;
  isActive?: boolean;
};

// NEW: Permission types
export type Permission = {
  id: string;
  key: string;
  description: string;
  resource: string;
  action: string;
};

export type RolePermissionsResponse = {
  role: UserRole;
  permissions: Permission[];
};

export type SetRolePermissionsDto = {
  permissionKeys: string[];
};
```

---

### Step 16: Frontend PermissionsContext

**SCRUM-87**: Frontend permission integration

**File**: `nexacore-dashboard/src/context/PermissionsContext.tsx` (CREATE)

```tsx
'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';

/* ===== Types ===== */

type PermissionsContextType = {
  /** Array of permission keys for the current user (e.g. ['users:read', 'dashboard:read']) */
  permissions: string[];
  /** Check if user has a specific permission */
  hasPermission: (permission: string) => boolean;
  /** Check if user has ALL specified permissions */
  hasAllPermissions: (permissions: string[]) => boolean;
  /** Check if user has ANY of the specified permissions */
  hasAnyPermission: (permissions: string[]) => boolean;
  /** Whether the current user is SUPERADMIN (bypasses all checks) */
  isSuperAdmin: boolean;
};

/* ===== Context ===== */

const PermissionsContext = createContext<PermissionsContextType | null>(null);

/* ===== Provider ===== */

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const permissions = user?.permissions ?? [];

  const value = useMemo<PermissionsContextType>(() => {
    const permSet = new Set(permissions);

    return {
      permissions,
      isSuperAdmin,
      hasPermission: (permission: string) => {
        if (isSuperAdmin) return true;
        if (permSet.has('*')) return true;
        return permSet.has(permission);
      },
      hasAllPermissions: (perms: string[]) => {
        if (isSuperAdmin) return true;
        if (permSet.has('*')) return true;
        return perms.every((p) => permSet.has(p));
      },
      hasAnyPermission: (perms: string[]) => {
        if (isSuperAdmin) return true;
        if (permSet.has('*')) return true;
        return perms.some((p) => permSet.has(p));
      },
    };
  }, [permissions, isSuperAdmin]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/* ===== Hook ===== */

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
```

---

### Step 17: `<Can>` Component

**SCRUM-87**: Frontend permission integration

**File**: `nexacore-dashboard/src/components/guards/Can.tsx` (CREATE)

```tsx
'use client';

import { usePermissions } from '@/context/PermissionsContext';

type CanProps = {
  /** Single permission key to check */
  permission?: string;
  /** Multiple permissions — ALL must be present */
  allPermissions?: string[];
  /** Multiple permissions — ANY must be present */
  anyPermission?: string[];
  /** Content to render when permission is granted */
  children: React.ReactNode;
  /** Optional fallback to render when permission is denied */
  fallback?: React.ReactNode;
};

/**
 * Conditionally renders children based on user permissions.
 *
 * @example
 * <Can permission="users:write">
 *   <button>Edit User</button>
 * </Can>
 *
 * @example
 * <Can allPermissions={['users:write', 'users:delete']}>
 *   <button>Manage Users</button>
 * </Can>
 *
 * @example
 * <Can permission="users:write" fallback={<span>View only</span>}>
 *   <button>Edit</button>
 * </Can>
 */
export default function Can({
  permission,
  allPermissions,
  anyPermission,
  children,
  fallback = null,
}: CanProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  let allowed = false;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (allPermissions) {
    allowed = hasAllPermissions(allPermissions);
  } else if (anyPermission) {
    allowed = hasAnyPermission(anyPermission);
  } else {
    // No permission specified — render children
    allowed = true;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
```

---

### Step 18: `<PermissionRoute>` Guard Component

**File**: `nexacore-dashboard/src/components/guards/PermissionRoute.tsx` (CREATE)

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/context/PermissionsContext';
import ProtectedRoute from './ProtectedRoute';

type PermissionCheckProps = {
  permission?: string;
  allPermissions?: string[];
  anyPermission?: string[];
  redirectTo?: string;
  children: React.ReactNode;
};

function PermissionCheck({
  permission,
  allPermissions,
  anyPermission,
  redirectTo = '/dashboard',
  children,
}: PermissionCheckProps) {
  const { user, isInitialized } = useAuth();
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();
  const router = useRouter();

  let allowed = false;
  if (permission) {
    allowed = hasPermission(permission);
  } else if (allPermissions) {
    allowed = hasAllPermissions(allPermissions);
  } else if (anyPermission) {
    allowed = hasAnyPermission(anyPermission);
  } else {
    allowed = true;
  }

  useEffect(() => {
    if (isInitialized && user && !allowed) {
      router.replace(redirectTo);
    }
  }, [isInitialized, user, allowed, router, redirectTo]);

  if (!user || !allowed) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Route-level permission guard.
 * Wraps ProtectedRoute (handles auth) + PermissionCheck (handles permissions).
 *
 * @example
 * <PermissionRoute permission="permissions:write">
 *   <PermissionsAdminPage />
 * </PermissionRoute>
 */
export default function PermissionRoute({
  children,
  ...props
}: PermissionCheckProps) {
  return (
    <ProtectedRoute>
      <PermissionCheck {...props}>{children}</PermissionCheck>
    </ProtectedRoute>
  );
}
```

---

### Step 19: Integrate PermissionsProvider into App Layout

**File**: `nexacore-dashboard/src/app/layout.tsx` (MODIFY)

Wrap the existing app tree with `PermissionsProvider` inside `AuthProvider`:

```tsx
// Add import:
import { PermissionsProvider } from '@/context/PermissionsContext';

// In the layout JSX, wrap children with PermissionsProvider:
// Before:
//   <AuthProvider>{children}</AuthProvider>
// After:
//   <AuthProvider>
//     <PermissionsProvider>{children}</PermissionsProvider>
//   </AuthProvider>
```

---

### Step 20: Update AuthContext to Store Permissions from `/auth/me`

**File**: `nexacore-dashboard/src/context/AuthContext.tsx` (MODIFY)

The key change is that `/auth/me` now returns `permissions: string[]` on the user object. Since `SafeUser` now includes an optional `permissions` field, the existing `refreshSession` and other flows that call `/auth/me` will automatically capture permissions when the backend returns them. No changes to the reducer are needed -- the permissions travel with the `SafeUser` object.

However, ensure that on login/register (which return `AuthResponse` without permissions), we immediately call `/auth/me` to get the full user with permissions:

```typescript
// In the login callback, after setting the access token:
const login = useCallback(async (email: string, password: string) => {
  dispatch({ type: 'AUTH_START' });
  try {
    const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    await fetch('/api/auth/set-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: data.refreshToken }),
    });
    apiClient.setAccessToken(data.accessToken);
    // Fetch full user with permissions from /auth/me
    const user = await apiClient.get<SafeUser>('/auth/me');
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user, accessToken: data.accessToken },
    });
  } catch (err: unknown) {
    dispatch({
      type: 'AUTH_ERROR',
      payload: extractErrorMessage(err, 'Login failed. Please try again.'),
    });
  }
}, []);
```

Apply the same pattern to `register` and `handleOAuthCallback`. The `refreshSession` already calls `/auth/me` and will get permissions automatically.

---

### Step 21: Admin Permissions Management Page

**File**: `nexacore-dashboard/src/app/admin/permissions/page.tsx` (CREATE)

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminRoute from '@/components/guards/AdminRoute';
import Can from '@/components/guards/Can';
import PermissionsMatrix from '@/components/admin/PermissionsMatrix';
import { apiClient } from '@/lib/api';
import type { Permission, RolePermissionsResponse, UserRole } from '@/lib/types';

const EDITABLE_ROLES: UserRole[] = ['USER', 'ADMIN'];

export default function PermissionsPage() {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all permissions and role assignments in parallel
      const [permsRes, ...roleRes] = await Promise.all([
        apiClient.get<{ data: Permission[] }>('/permissions'),
        ...EDITABLE_ROLES.map((role) =>
          apiClient.get<RolePermissionsResponse>(`/permissions/roles/${role}`),
        ),
      ]);

      setAllPermissions(permsRes.data);

      const mapping: Record<string, string[]> = {};
      roleRes.forEach((res, i) => {
        mapping[EDITABLE_ROLES[i]] = res.permissions.map((p) => p.key);
      });
      setRolePermissions(mapping);
    } catch {
      setError('Failed to load permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveRole = async (role: UserRole, permissionKeys: string[]) => {
    setSaving(role);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.put(`/permissions/roles/${role}`, { permissionKeys });
      setRolePermissions((prev) => ({ ...prev, [role]: permissionKeys }));
      setSuccess(`Permissions for ${role} updated successfully.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError(`Failed to update permissions for ${role}.`);
    } finally {
      setSaving(null);
    }
  };

  return (
    <AdminRoute>
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-body-sm font-semibold text-content-primary">
            Permission Management
          </h1>
          <p className="mt-1 text-body-xs text-content-tertiary">
            Configure granular permissions for each role. SUPERADMIN bypasses all permission checks.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-body-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-body-xs text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-body-sm text-content-tertiary">Loading permissions...</p>
          </div>
        ) : (
          <Can
            permission="permissions:read"
            fallback={
              <div className="flex h-64 items-center justify-center rounded-2xl border border-border-default bg-surface-primary">
                <p className="text-body-sm text-content-tertiary">
                  You do not have permission to view this page.
                </p>
              </div>
            }
          >
            <PermissionsMatrix
              permissions={allPermissions}
              rolePermissions={rolePermissions}
              editableRoles={EDITABLE_ROLES}
              savingRole={saving}
              onSave={handleSaveRole}
            />
          </Can>
        )}
      </DashboardLayout>
    </AdminRoute>
  );
}
```

---

### Step 22: PermissionsMatrix Component

**File**: `nexacore-dashboard/src/components/admin/PermissionsMatrix.tsx` (CREATE)

```tsx
'use client';

import { useState, useMemo } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import Can from '@/components/guards/Can';
import type { Permission, UserRole } from '@/lib/types';

type PermissionsMatrixProps = {
  permissions: Permission[];
  rolePermissions: Record<string, string[]>;
  editableRoles: UserRole[];
  savingRole: string | null;
  onSave: (role: UserRole, permissionKeys: string[]) => Promise<void>;
};

export default function PermissionsMatrix({
  permissions,
  rolePermissions,
  editableRoles,
  savingRole,
  onSave,
}: PermissionsMatrixProps) {
  // Local state to track edits before saving
  const [localState, setLocalState] = useState<Record<string, Set<string>>>({});

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const perm of permissions) {
      if (!groups[perm.resource]) groups[perm.resource] = [];
      groups[perm.resource].push(perm);
    }
    return groups;
  }, [permissions]);

  const getEffectivePermissions = (role: string): Set<string> => {
    if (localState[role]) return localState[role];
    return new Set(rolePermissions[role] ?? []);
  };

  const togglePermission = (role: string, permKey: string) => {
    setLocalState((prev) => {
      const current = prev[role] ?? new Set(rolePermissions[role] ?? []);
      const next = new Set(current);
      if (next.has(permKey)) {
        next.delete(permKey);
      } else {
        next.add(permKey);
      }
      return { ...prev, [role]: next };
    });
  };

  const hasChanges = (role: string): boolean => {
    if (!localState[role]) return false;
    const original = new Set(rolePermissions[role] ?? []);
    const current = localState[role];
    if (original.size !== current.size) return true;
    for (const key of original) {
      if (!current.has(key)) return true;
    }
    return false;
  };

  const handleSave = async (role: UserRole) => {
    const perms = localState[role];
    if (!perms) return;
    await onSave(role, Array.from(perms));
    // Clear local state for this role after save
    setLocalState((prev) => {
      const next = { ...prev };
      delete next[role];
      return next;
    });
  };

  const handleReset = (role: string) => {
    setLocalState((prev) => {
      const next = { ...prev };
      delete next[role];
      return next;
    });
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-default bg-surface-primary">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-6 py-4 text-left text-body-xs font-medium text-content-secondary">
              Permission
            </th>
            {editableRoles.map((role) => (
              <th
                key={role}
                className="px-6 py-4 text-center text-body-xs font-medium text-content-secondary"
              >
                <div className="flex flex-col items-center gap-2">
                  <span>{role}</span>
                  <Can permission="permissions:write">
                    <div className="flex items-center gap-2">
                      {hasChanges(role) && (
                        <>
                          <button
                            onClick={() => handleSave(role)}
                            disabled={savingRole === role}
                            className="rounded-md bg-brand-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
                          >
                            {savingRole === role ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              'Save'
                            )}
                          </button>
                          <button
                            onClick={() => handleReset(role)}
                            className="rounded-md border border-border-default px-3 py-1 text-[11px] font-medium text-content-secondary hover:bg-surface-secondary"
                          >
                            Reset
                          </button>
                        </>
                      )}
                    </div>
                  </Can>
                </div>
              </th>
            ))}
            <th className="px-6 py-4 text-center text-body-xs font-medium text-content-secondary">
              <span className="text-purple-500">SUPERADMIN</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <>
              {/* Resource group header */}
              <tr key={`header-${resource}`} className="bg-surface-secondary/50">
                <td
                  colSpan={editableRoles.length + 2}
                  className="px-6 py-2 text-body-xs font-semibold uppercase tracking-wider text-content-tertiary"
                >
                  {resource}
                </td>
              </tr>
              {/* Permission rows */}
              {perms.map((perm) => (
                <tr
                  key={perm.key}
                  className="border-b border-border-default/50 hover:bg-surface-secondary/30"
                >
                  <td className="px-6 py-3">
                    <div>
                      <code className="text-body-xs font-medium text-content-primary">
                        {perm.key}
                      </code>
                      <p className="text-[11px] text-content-tertiary">
                        {perm.description}
                      </p>
                    </div>
                  </td>
                  {editableRoles.map((role) => {
                    const effective = getEffectivePermissions(role);
                    const isGranted = effective.has(perm.key);
                    return (
                      <td key={`${role}-${perm.key}`} className="px-6 py-3 text-center">
                        <Can
                          permission="permissions:write"
                          fallback={
                            isGranted ? (
                              <Check size={16} className="mx-auto text-green-500" />
                            ) : (
                              <X size={16} className="mx-auto text-content-tertiary/30" />
                            )
                          }
                        >
                          <button
                            onClick={() => togglePermission(role, perm.key)}
                            className="mx-auto flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-surface-secondary"
                          >
                            {isGranted ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <X size={16} className="text-content-tertiary/30" />
                            )}
                          </button>
                        </Can>
                      </td>
                    );
                  })}
                  {/* SUPERADMIN column — always granted */}
                  <td className="px-6 py-3 text-center">
                    <Check size={16} className="mx-auto text-purple-500" />
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Step 23: Update Admin Page with `<Can>` Guards

**File**: `nexacore-dashboard/src/app/admin/page.tsx` (MODIFY)

Update the existing admin page to conditionally render action buttons based on permissions. Add the `<Can>` import and wrap action triggers:

```tsx
// Add import at top:
import Can from '@/components/guards/Can';

// Wrap the Delete action in the modal config and handleDelete with Can:
// In the UsersTable component props, wrap action callbacks:

// Before the return statement, wrap the search + header to show permissions link:
// After the page header (h1), add a link to permissions page:
<Can permission="permissions:read">
  <a
    href="/admin/permissions"
    className="text-body-xs font-medium text-brand-primary hover:underline"
  >
    Manage Permissions
  </a>
</Can>
```

---

### Step 24: Update UsersTable with Permission-based Action Visibility

**File**: `nexacore-dashboard/src/components/admin/UsersTable.tsx` (MODIFY)

Wrap action dropdown items with `<Can>` components:

```tsx
// Add import:
import Can from '@/components/guards/Can';

// In the ActionDropdown or equivalent, wrap each action:
// Change Role button:
<Can permission="users:write">
  <button onClick={() => onChangeRole(user)}>Change Role</button>
</Can>

// Lock/Unlock button:
<Can permission="users:write">
  <button onClick={() => onToggleLock(user)}>Lock/Unlock</button>
</Can>

// Delete button:
<Can permission="users:delete">
  <button onClick={() => onDelete(user)}>Delete</button>
</Can>
```

---

## Permission Seeder Details

**SCRUM-84**: Permission seeder

The seeder runs automatically on application bootstrap via `OnModuleInit` in `PermissionsService`. It is idempotent:

1. **Permission definitions**: Uses `prisma.permission.upsert()` with the `key` field as the unique identifier. Running multiple times updates descriptions but never duplicates.
2. **Role-permission mappings**: Only seeds if the role has zero existing assignments (`count === 0`). This means manual admin changes via the API are never overwritten by restarts.
3. **Order**: Permissions are seeded first (since RolePermission references them via FK).

To re-seed after clearing the database:
```bash
npx prisma migrate reset   # drops DB, re-runs migrations
npm run start:dev           # triggers onModuleInit seeding
```

To add new permissions in future tickets, add entries to `DEFAULT_PERMISSIONS` and `DEFAULT_ROLE_PERMISSIONS` in `constants/default-permissions.ts`. The seeder will create any missing permission definitions on next restart. Existing role assignments are preserved unless the role has zero assignments.

---

## Testing Checklist

### Backend Unit Tests

- [ ] **PermissionsService.seedPermissions()**: Creates all default permissions; is idempotent (run twice, no duplicates)
- [ ] **PermissionsService.getPermissionKeysForRole(USER)**: Returns `['dashboard:read', 'settings:read']`
- [ ] **PermissionsService.getPermissionKeysForRole(ADMIN)**: Returns all admin permissions
- [ ] **PermissionsService.getPermissionKeysForRole(SUPERADMIN)**: Returns `['*']`
- [ ] **PermissionsService.roleHasPermission(ADMIN, 'users:read')**: Returns `true`
- [ ] **PermissionsService.roleHasPermission(USER, 'users:read')**: Returns `false`
- [ ] **PermissionsService.roleHasPermission(SUPERADMIN, 'anything')**: Returns `true`
- [ ] **PermissionsService.setPermissionsForRole(USER, [...])**: Replaces permissions atomically
- [ ] **PermissionsService.setPermissionsForRole(SUPERADMIN, [...])**: Throws `BadRequestException`
- [ ] **PermissionsService.setPermissionsForRole(ADMIN, ['invalid:key'])**: Throws `BadRequestException`
- [ ] **PermissionsCache.get/set/invalidate**: Cache stores, expires after TTL, invalidates correctly
- [ ] **PermissionsGuard**: Allows access when user has required permissions
- [ ] **PermissionsGuard**: Denies access when user lacks required permissions
- [ ] **PermissionsGuard**: Allows SUPERADMIN regardless of permissions
- [ ] **PermissionsGuard**: Allows access when no `@RequirePermissions()` decorator is present

### Backend Integration Tests

- [ ] `GET /permissions` as ADMIN with `permissions:read` -- returns all permissions
- [ ] `GET /permissions` as USER -- returns 403
- [ ] `GET /permissions/roles/USER` -- returns USER permissions
- [ ] `GET /permissions/roles/SUPERADMIN` -- returns 400
- [ ] `PUT /permissions/roles/USER` as SUPERADMIN -- updates successfully
- [ ] `PUT /permissions/roles/USER` as ADMIN without `permissions:write` -- returns 403
- [ ] `GET /users` as ADMIN with `users:read` -- returns user list
- [ ] `GET /users` as ADMIN without `users:read` (permission removed) -- returns 403
- [ ] `DELETE /users/:id` as ADMIN with `users:delete` -- soft deletes
- [ ] `DELETE /users/:id` as ADMIN without `users:delete` -- returns 403
- [ ] `GET /auth/me` -- returns user with `permissions` array

### Frontend Tests

- [ ] `usePermissions()` correctly reports permissions from auth context
- [ ] `<Can permission="users:write">` renders children when user has permission
- [ ] `<Can permission="users:write">` renders fallback when user lacks permission
- [ ] `<Can>` renders children for SUPERADMIN regardless of specific permission
- [ ] `<PermissionRoute permission="permissions:read">` allows access when permission exists
- [ ] `<PermissionRoute permission="permissions:read">` redirects when permission missing
- [ ] Admin page: action buttons hidden when user lacks write/delete permissions
- [ ] Permissions management page: matrix renders correctly
- [ ] Permissions management page: save/reset works for role permission changes

### Build Verification

- [ ] `nest build` succeeds (nexacore-api)
- [ ] `next build` succeeds (nexacore-dashboard)
- [ ] `npx prisma migrate dev` runs without errors
- [ ] No TypeScript errors in either project

---

## Error Handling

| Scenario | Status Code | Error Message |
|---|---|---|
| Missing permission on endpoint | 403 | `Insufficient permissions. Required: users:write` |
| Query SUPERADMIN permissions | 400 | `Cannot query permissions for SUPERADMIN (bypasses all checks)` |
| Assign to SUPERADMIN | 400 | `Cannot assign permissions to SUPERADMIN (bypasses all checks)` |
| Invalid role in path param | 400 | `Invalid role: xyz. Valid roles: SUPERADMIN, ADMIN, USER` |
| Invalid permission key in body | 400 | `Invalid permission keys: invalid:key` |
| Unauthenticated request | 401 | Standard JWT unauthorized |
| Non-admin accessing permissions API | 403 | `Insufficient role` (from RolesGuard) |
| Cache miss | N/A | Transparent -- falls through to DB query, then caches result |

---

## Non-Functional Requirements

### Performance
- **Permission cache TTL**: 5 minutes in-memory per role. A single Map lookup (O(1)) replaces a DB query on every guarded request.
- **Cache invalidation**: Only invalidated when role-permission assignments change via `PUT /permissions/roles/:role`. Normal request flow never invalidates cache.
- **Seeder**: Runs once on bootstrap. Uses `upsert` and `createMany(skipDuplicates)` for minimal DB operations.

### Security
- **SUPERADMIN bypass**: Hardcoded in guard -- not dependent on database state. Even if all permissions are deleted from DB, SUPERADMIN access is unaffected.
- **Guard ordering**: `JwtAuthGuard` -> `RolesGuard` -> `PermissionsGuard`. Authentication is always checked first, then role, then granular permission. This means an unauthenticated request never reaches the permission check.
- **Atomic updates**: `PUT /permissions/roles/:role` uses Prisma `$transaction` to delete-then-create. No partial states.
- **Permission escalation prevention**: `permissions:write` is not in the default ADMIN role. Only SUPERADMIN (via bypass) can modify role-permission mappings by default. An ADMIN must be explicitly granted `permissions:write`.

### Scalability
- The in-memory cache is suitable for single-instance deployments. For multi-instance deployments, replace `PermissionsCache` with a Redis-backed implementation using the same interface (get/set/invalidate). The `PermissionsCache` class is designed as a drop-in injectable service to make this swap trivial.

---

## Dependencies

### Backend

| Package | Version | Purpose | Status |
|---|---|---|---|
| `@nestjs/common` | existing | Guards, decorators, DI | Already installed |
| `@nestjs/core` | existing | Reflector for metadata | Already installed |
| `@prisma/client` | existing | Database ORM | Already installed |
| `class-validator` | existing | DTO validation | Already installed |

No new packages required for the backend.

### Frontend

| Package | Version | Purpose | Status |
|---|---|---|---|
| `lucide-react` | existing | Icons (Check, X, Loader2) | Already installed |

No new packages required for the frontend.

---

## Documentation Updates

| Document | Changes |
|---|---|
| `ai-specs/specs/api-spec.yml` | Add `GET /permissions`, `GET /permissions/roles/:role`, `PUT /permissions/roles/:role` endpoints |
| `ai-specs/specs/data-model.md` | Add `Permission` and `RolePermission` entities |
| `ai-specs/specs/backend-standards.mdc` | Add "Permission Guard" section alongside existing "SUPERADMIN Role Policy" |
| `ai-specs/specs/frontend-standards.mdc` | Document `usePermissions()` hook and `<Can>` component usage |

---

## Definition of Done

- [ ] `Permission` and `RolePermission` Prisma models created and migrated
- [ ] Default permissions seeded automatically on app bootstrap (idempotent)
- [ ] `@RequirePermissions()` decorator created and functional
- [ ] `PermissionsGuard` created, correctly checks role-permission mappings
- [ ] SUPERADMIN bypasses all permission checks in `PermissionsGuard`
- [ ] `PermissionsGuard` added to all admin endpoints in `UsersController`
- [ ] `GET /permissions` returns all defined permissions
- [ ] `GET /permissions/roles/:role` returns permissions for a role
- [ ] `PUT /permissions/roles/:role` atomically updates role permissions
- [ ] Permission cache (5-minute TTL) prevents DB queries on every request
- [ ] Cache invalidated after permission assignment changes
- [ ] `/auth/me` returns `permissions` array in response
- [ ] Frontend `PermissionsProvider` and `usePermissions()` hook created
- [ ] Frontend `<Can>` component conditionally renders based on permissions
- [ ] Frontend `<PermissionRoute>` component guards routes by permission
- [ ] Admin permissions management page with visual matrix editor
- [ ] Existing admin page updated with `<Can>` guards on action buttons
- [ ] All unit tests pass
- [ ] `nest build` and `next build` succeed without errors
- [ ] No TypeScript errors
- [ ] API documentation updated
