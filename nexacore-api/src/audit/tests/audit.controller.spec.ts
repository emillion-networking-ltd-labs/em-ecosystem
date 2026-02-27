import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditLogController } from '../audit.controller';
import { AuditService } from '../audit.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { AuditAction } from '../enums/audit-action.enum';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            log: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            roleHasAllPermissions: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    auditService = module.get(AuditService);
  });

  describe('listAuditLogs', () => {
    it('should return paginated audit logs with default query', async () => {
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      auditService.findAll.mockResolvedValue(mockResult);

      const result = await controller.listAuditLogs({});

      expect(auditService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        action: undefined,
        userId: undefined,
        startDate: undefined,
        endDate: undefined,
        sortOrder: undefined,
      });
      expect(result).toEqual(mockResult);
    });

    it('should pass filters to service', async () => {
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      auditService.findAll.mockResolvedValue(mockResult);

      await controller.listAuditLogs({
        page: 2,
        limit: 10,
        action: AuditAction.LOGIN_FAILURE,
        userId: 'user-1',
        sortOrder: 'asc',
      });

      expect(auditService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        action: AuditAction.LOGIN_FAILURE,
        userId: 'user-1',
        startDate: undefined,
        endDate: undefined,
        sortOrder: 'asc',
      });
    });
  });

  describe('getAuditLog', () => {
    it('should return a single audit log entry', async () => {
      const mockLog = {
        id: 'log-1',
        action: AuditAction.LOGIN_SUCCESS,
        userId: 'user-1',
        targetUserId: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        metadata: null,
        createdAt: new Date(),
        user: { id: 'user-1', email: 'test@example.com' },
        targetUser: null,
      };
      auditService.findById.mockResolvedValue(mockLog);

      const result = await controller.getAuditLog('log-1');

      expect(auditService.findById).toHaveBeenCalledWith('log-1');
      expect(result).toEqual(mockLog);
    });

    it('should throw NotFoundException when log not found', async () => {
      auditService.findById.mockResolvedValue(null);

      await expect(controller.getAuditLog('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
