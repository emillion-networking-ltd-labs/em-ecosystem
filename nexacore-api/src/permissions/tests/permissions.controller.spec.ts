import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PermissionsController } from '../permissions.controller';
import { PermissionsService } from '../permissions.service';
import { AuditService } from '../../audit/audit.service';
import { Role } from '../../users/enums/role.enum';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let service: jest.Mocked<PermissionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: {
            findAll: jest.fn(),
            getPermissionsForRole: jest.fn(),
            setPermissionsForRole: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
    service = module.get(PermissionsService);
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [
        {
          id: 'p1',
          key: 'dashboard:read',
          description: 'Access dashboard',
          resource: 'dashboard',
          action: 'read',
          createdAt: new Date(),
        },
      ];
      service.findAll.mockResolvedValue(mockPermissions);

      const result = await controller.findAll();

      expect(result).toEqual(mockPermissions);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getForRole', () => {
    it('should return permissions for a valid role', async () => {
      const mockResponse = {
        role: Role.USER,
        permissions: [
          {
            id: 'p1',
            key: 'dashboard:read',
            description: 'Access dashboard',
            resource: 'dashboard',
            action: 'read',
            createdAt: new Date(),
          },
        ],
      };
      service.getPermissionsForRole.mockResolvedValue(mockResponse);

      const result = await controller.getForRole('USER');

      expect(result).toEqual(mockResponse);
      expect(service.getPermissionsForRole).toHaveBeenCalledWith(Role.USER);
    });

    it('should accept lowercase role names', async () => {
      service.getPermissionsForRole.mockResolvedValue({
        role: Role.ADMIN,
        permissions: [],
      });

      await controller.getForRole('admin');

      expect(service.getPermissionsForRole).toHaveBeenCalledWith(Role.ADMIN);
    });

    it('should throw for invalid role', async () => {
      await expect(controller.getForRole('INVALID')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should propagate BadRequestException for SUPERADMIN', async () => {
      service.getPermissionsForRole.mockRejectedValue(
        new BadRequestException('SUPERADMIN bypasses all permissions'),
      );

      await expect(controller.getForRole('SUPERADMIN')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('setForRole', () => {
    it('should update permissions and return success', async () => {
      service.setPermissionsForRole.mockResolvedValue(undefined);

      const mockReq = { user: { role: Role.ADMIN } } as any;
      const result = await controller.setForRole('USER', {
        permissionKeys: ['dashboard:read'],
      }, mockReq);

      expect(result).toEqual({ message: 'Permissions updated successfully' });
      expect(service.setPermissionsForRole).toHaveBeenCalledWith(
        Role.USER,
        ['dashboard:read'],
        Role.ADMIN,
      );
    });

    it('should propagate BadRequestException for invalid keys', async () => {
      service.setPermissionsForRole.mockRejectedValue(
        new BadRequestException('Invalid permission keys: bad:key'),
      );

      const mockReq = { user: { role: Role.ADMIN } } as any;
      await expect(
        controller.setForRole('USER', { permissionKeys: ['bad:key'] }, mockReq),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
