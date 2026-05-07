import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsCache } from './permissions.cache';
import { Role } from '../users/enums/role.enum';
import { ErrorMessages } from '../common/constants/error-messages';
import {
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from './constants/default-permissions';
import type {
  Permission,
  RolePermissionsResponse,
} from './entities/permission.entity';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: PermissionsCache,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedPermissions();
  }

  async seedPermissions(): Promise<void> {
    // Upsert all permission definitions
    for (const perm of DEFAULT_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { key: perm.key },
        update: { description: perm.description },
        create: {
          key: perm.key,
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
        },
      });
    }

    // Seed role-permission assignments only if role has zero assignments
    for (const [role, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const existingCount = await this.prisma.rolePermission.count({
        where: { role: role as Role },
      });

      if (existingCount > 0) {
        this.logger.log(
          `Role ${role} already has ${existingCount} permission(s) — skipping seed`,
        );
        continue;
      }

      const permissions = await this.prisma.permission.findMany({
        where: { key: { in: keys } },
      });

      if (permissions.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissions.map((p) => ({
            role: role as Role,
            permissionId: p.id,
          })),
        });
        this.logger.log(
          `Seeded ${permissions.length} permission(s) for role: ${role}`,
        );
      }
    }

    this.cache.invalidateAll();
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async getPermissionKeysForRole(role: Role): Promise<string[]> {
    if (role === Role.SUPERADMIN) {
      return ['*'];
    }

    const cached = this.cache.get(role);
    if (cached) return cached;

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });

    const keys = rolePermissions.map((rp) => rp.permission.key);
    this.cache.set(role, keys);
    return keys;
  }

  async getPermissionsForRole(role: Role): Promise<RolePermissionsResponse> {
    if (role === Role.SUPERADMIN) {
      throw new BadRequestException(
        ErrorMessages.permission.INVALID_ROLE_OPERATION,
      );
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
      orderBy: { permission: { resource: 'asc' } },
    });

    return {
      role,
      permissions: rolePermissions.map((rp) => rp.permission),
    };
  }

  async setPermissionsForRole(
    role: Role,
    keys: string[],
    actingUserRole?: Role,
  ): Promise<void> {
    if (role === Role.SUPERADMIN) {
      throw new BadRequestException(
        ErrorMessages.permission.INVALID_ROLE_OPERATION,
      );
    }

    // Prevent ADMIN from escalating their own role's permissions
    if (actingUserRole === Role.ADMIN && role === Role.ADMIN) {
      throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
    }

    // Validate all keys exist
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
    });

    const foundKeys = new Set(permissions.map((p) => p.key));
    const invalidKeys = keys.filter((k) => !foundKeys.has(k));

    if (invalidKeys.length > 0) {
      throw new BadRequestException(
        `Invalid permission keys: ${invalidKeys.join(', ')}`,
      );
    }

    // Transaction: delete all then create new
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { role } }),
      this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
          role,
          permissionId: p.id,
        })),
      }),
    ]);

    this.cache.invalidate(role);
  }

  async roleHasPermission(role: Role, key: string): Promise<boolean> {
    const keys = await this.getPermissionKeysForRole(role);
    if (keys.includes('*')) return true;
    return keys.includes(key);
  }

  async roleHasAllPermissions(
    role: Role,
    requiredKeys: string[],
  ): Promise<boolean> {
    const keys = await this.getPermissionKeysForRole(role);
    if (keys.includes('*')) return true;
    return requiredKeys.every((k) => keys.includes(k));
  }
}
