import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuditService } from '../audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../enums/audit-action.enum';

describe('AuditService', () => {
  let auditService: AuditService;
  let prisma: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue(undefined),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    auditService = module.get<AuditService>(AuditService);
  });

  describe('log', () => {
    it('should create an audit log entry via prisma', async () => {
      await auditService.log({
        action: AuditAction.LOGIN_SUCCESS,
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: AuditAction.LOGIN_SUCCESS,
          userId: 'user-1',
          targetUserId: null,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          metadata: undefined,
        },
      });
    });

    it('should handle metadata correctly', async () => {
      await auditService.log({
        action: AuditAction.LOGIN_FAILURE,
        userId: 'user-1',
        metadata: { reason: 'invalid_password', failedAttempts: 3 },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.LOGIN_FAILURE,
          metadata: { reason: 'invalid_password', failedAttempts: 3 },
        }),
      });
    });

    it('should handle targetUserId', async () => {
      await auditService.log({
        action: AuditAction.USER_ROLE_CHANGE,
        userId: 'admin-1',
        targetUserId: 'user-2',
        metadata: { previousRole: 'USER', newRole: 'ADMIN' },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin-1',
          targetUserId: 'user-2',
        }),
      });
    });

    it('should not throw when prisma fails — logs error instead', async () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      prisma.auditLog.create.mockRejectedValue(new Error('DB error'));

      await expect(
        auditService.log({
          action: AuditAction.LOGIN_SUCCESS,
          userId: 'user-1',
        }),
      ).resolves.not.toThrow();

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('should default null values for optional fields', async () => {
      await auditService.log({
        action: AuditAction.REGISTER,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: AuditAction.REGISTER,
          userId: null,
          targetUserId: null,
          ipAddress: null,
          userAgent: null,
          metadata: undefined,
        },
      });
    });
  });

  describe('findAll', () => {
    const mockLogs = [
      {
        id: 'log-1',
        action: AuditAction.LOGIN_SUCCESS,
        userId: 'user-1',
        createdAt: new Date(),
      },
    ];

    it('should return paginated results with default sort', async () => {
      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await auditService.findAll({ page: 1, limit: 20 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result.data).toEqual(mockLogs);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by action', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await auditService.findAll({
        page: 1,
        limit: 10,
        action: AuditAction.LOGIN_FAILURE,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: AuditAction.LOGIN_FAILURE }),
        }),
      );
    });

    it('should filter by userId (searching both userId and targetUserId)', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await auditService.findAll({
        page: 1,
        limit: 10,
        userId: 'user-1',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ userId: 'user-1' }, { targetUserId: 'user-1' }],
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await auditService.findAll({
        page: 1,
        limit: 10,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2026-01-01'),
              lte: new Date('2026-12-31'),
            },
          }),
        }),
      );
    });

    it('should calculate correct pagination skip', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(50);

      const result = await auditService.findAll({ page: 3, limit: 10 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.meta.totalPages).toBe(5);
    });

    it('should support ascending sort order', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await auditService.findAll({
        page: 1,
        limit: 10,
        sortOrder: 'asc',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return audit log entry with user relations', async () => {
      const mockLog = {
        id: 'log-1',
        action: AuditAction.LOGIN_SUCCESS,
        userId: 'user-1',
        user: { id: 'user-1', email: 'test@example.com' },
      };
      prisma.auditLog.findUnique.mockResolvedValue(mockLog);

      const result = await auditService.findById('log-1');

      expect(result).toEqual(mockLog);
      expect(prisma.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        include: expect.objectContaining({
          user: expect.any(Object),
          targetUser: expect.any(Object),
        }),
      });
    });

    it('should return null when log not found', async () => {
      prisma.auditLog.findUnique.mockResolvedValue(null);

      const result = await auditService.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
