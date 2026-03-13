import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PermissionsService } from '../permissions.service';
import { PermissionsCache } from '../permissions.cache';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../users/enums/role.enum';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: jest.Mocked<PrismaService>;
  let cache: PermissionsCache;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        PermissionsCache,
        {
          provide: PrismaService,
          useValue: {
            permission: {
              upsert: jest.fn().mockResolvedValue({}),
              findMany: jest.fn().mockResolvedValue([]),
            },
            rolePermission: {
              count: jest.fn().mockResolvedValue(0),
              createMany: jest.fn().mockResolvedValue({ count: 0 }),
              findMany: jest.fn().mockResolvedValue([]),
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            $transaction: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prisma = module.get(PrismaService);
    cache = module.get(PermissionsCache);
  });

  describe('getPermissionKeysForRole', () => {
    it('should return ["*"] for SUPERADMIN', async () => {
      const result = await service.getPermissionKeysForRole(Role.SUPERADMIN);
      expect(result).toEqual(['*']);
    });

    it('should return cached permissions on cache hit', async () => {
      cache.set(Role.USER, ['dashboard:read', 'settings:read']);

      const result = await service.getPermissionKeysForRole(Role.USER);

      expect(result).toEqual(['dashboard:read', 'settings:read']);
      expect(prisma.rolePermission.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and cache on cache miss', async () => {
      prisma.rolePermission.findMany.mockResolvedValue([
        {
          id: '1',
          role: Role.USER,
          permissionId: 'p1',
          createdAt: new Date(),
          permission: {
            id: 'p1',
            key: 'dashboard:read',
            description: 'Access dashboard',
            resource: 'dashboard',
            action: 'read',
            createdAt: new Date(),
          },
        },
      ] as any);

      const result = await service.getPermissionKeysForRole(Role.USER);

      expect(result).toEqual(['dashboard:read']);
      expect(prisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { role: Role.USER },
        include: { permission: true },
      });

      // Verify it was cached
      expect(cache.get(Role.USER)).toEqual(['dashboard:read']);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should throw for SUPERADMIN', async () => {
      await expect(
        service.getPermissionsForRole(Role.SUPERADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return role permissions response', async () => {
      const mockPermission = {
        id: 'p1',
        key: 'dashboard:read',
        description: 'Access dashboard',
        resource: 'dashboard',
        action: 'read',
        createdAt: new Date(),
      };
      prisma.rolePermission.findMany.mockResolvedValue([
        {
          id: 'rp1',
          role: Role.USER,
          permissionId: 'p1',
          createdAt: new Date(),
          permission: mockPermission,
        },
      ] as any);

      const result = await service.getPermissionsForRole(Role.USER);

      expect(result.role).toBe(Role.USER);
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].key).toBe('dashboard:read');
    });
  });

  describe('setPermissionsForRole', () => {
    it('should throw for SUPERADMIN', async () => {
      await expect(
        service.setPermissionsForRole(Role.SUPERADMIN, ['dashboard:read']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for invalid permission keys', async () => {
      prisma.permission.findMany.mockResolvedValue([]);

      await expect(
        service.setPermissionsForRole(Role.USER, ['invalid:key']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update permissions and invalidate cache', async () => {
      const mockPermission = {
        id: 'p1',
        key: 'dashboard:read',
        description: 'Access dashboard',
        resource: 'dashboard',
        action: 'read',
        createdAt: new Date(),
      };
      prisma.permission.findMany.mockResolvedValue([mockPermission] as any);
      prisma.$transaction.mockResolvedValue(undefined);

      cache.set(Role.USER, ['old:permission']);

      await service.setPermissionsForRole(Role.USER, ['dashboard:read']);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(cache.get(Role.USER)).toBeNull();
    });
  });

  describe('roleHasPermission', () => {
    it('should return true for SUPERADMIN', async () => {
      const result = await service.roleHasPermission(
        Role.SUPERADMIN,
        'anything',
      );
      expect(result).toBe(true);
    });

    it('should return true when role has the permission', async () => {
      cache.set(Role.USER, ['dashboard:read', 'settings:read']);

      const result = await service.roleHasPermission(
        Role.USER,
        'dashboard:read',
      );
      expect(result).toBe(true);
    });

    it('should return false when role lacks the permission', async () => {
      cache.set(Role.USER, ['dashboard:read']);

      const result = await service.roleHasPermission(Role.USER, 'users:delete');
      expect(result).toBe(false);
    });
  });

  describe('roleHasAllPermissions', () => {
    it('should return true for SUPERADMIN', async () => {
      const result = await service.roleHasAllPermissions(Role.SUPERADMIN, [
        'users:read',
        'users:delete',
      ]);
      expect(result).toBe(true);
    });

    it('should return true when role has all permissions', async () => {
      cache.set(Role.ADMIN, ['users:read', 'users:write', 'users:delete']);

      const result = await service.roleHasAllPermissions(Role.ADMIN, [
        'users:read',
        'users:write',
      ]);
      expect(result).toBe(true);
    });

    it('should return false when role is missing one permission', async () => {
      cache.set(Role.USER, ['dashboard:read']);

      const result = await service.roleHasAllPermissions(Role.USER, [
        'dashboard:read',
        'users:delete',
      ]);
      expect(result).toBe(false);
    });
  });

  // ─── seedPermissions ──────────────────────────────────────────

  describe('seedPermissions', () => {
    it('should upsert all default permissions', async () => {
      prisma.permission.upsert.mockResolvedValue({} as any);
      prisma.rolePermission.count.mockResolvedValue(0);
      prisma.permission.findMany.mockResolvedValue([
        { id: 'p1', key: 'dashboard:read' },
      ] as any);
      prisma.rolePermission.createMany.mockResolvedValue({ count: 1 });

      await service.seedPermissions();

      // Should upsert for each DEFAULT_PERMISSIONS entry (9 permissions)
      expect(prisma.permission.upsert).toHaveBeenCalled();
      expect(prisma.permission.upsert.mock.calls.length).toBeGreaterThanOrEqual(
        9,
      );
    });

    it('should skip seeding role permissions when role already has assignments', async () => {
      prisma.permission.upsert.mockResolvedValue({} as any);
      prisma.rolePermission.count.mockResolvedValue(5); // already has assignments

      await service.seedPermissions();

      expect(prisma.rolePermission.createMany).not.toHaveBeenCalled();
    });

    it('should seed role permissions when role has zero assignments', async () => {
      prisma.permission.upsert.mockResolvedValue({} as any);
      prisma.rolePermission.count.mockResolvedValue(0);
      prisma.permission.findMany.mockResolvedValue([
        { id: 'p1', key: 'dashboard:read' },
        { id: 'p2', key: 'settings:read' },
      ] as any);
      prisma.rolePermission.createMany.mockResolvedValue({ count: 2 });

      await service.seedPermissions();

      expect(prisma.rolePermission.createMany).toHaveBeenCalled();
    });

    it('should invalidate cache after seeding', async () => {
      jest.spyOn(cache, 'invalidateAll');
      prisma.permission.upsert.mockResolvedValue({} as any);
      prisma.rolePermission.count.mockResolvedValue(5);

      await service.seedPermissions();

      expect(cache.invalidateAll).toHaveBeenCalled();
    });
  });

  // ─── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all permissions ordered by resource and action', async () => {
      const mockPermissions = [
        {
          id: 'p1',
          key: 'audit-logs:read',
          resource: 'audit-logs',
          action: 'read',
        },
        {
          id: 'p2',
          key: 'dashboard:read',
          resource: 'dashboard',
          action: 'read',
        },
      ];
      prisma.permission.findMany.mockResolvedValue(mockPermissions as any);

      const result = await service.findAll();

      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });
      expect(result).toEqual(mockPermissions);
    });
  });
});
