import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '../../users/enums/role.enum';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let auditService: { log: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    guard = new RolesGuard(reflector, auditService as unknown as AuditService);
  });

  const createMockContext = (user?: { id?: string; role: Role }) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        method: 'GET',
        route: { path: '/test' },
      }),
    }),
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext({ id: 'u1', role: Role.USER });

      expect(guard.canActivate(context as never)).toBe(true);
    });

    it('should return true when roles array is empty', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const context = createMockContext({ id: 'u1', role: Role.USER });

      expect(guard.canActivate(context as never)).toBe(true);
    });

    it('should return true when user has the required role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockContext({ id: 'u1', role: Role.ADMIN });

      expect(guard.canActivate(context as never)).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.USER]);
      const context = createMockContext({ id: 'u1', role: Role.USER });

      expect(guard.canActivate(context as never)).toBe(true);
    });

    it('should throw ForbiddenException when user lacks required role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockContext({ id: 'u1', role: Role.USER });

      expect(() => guard.canActivate(context as never)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when no user on request', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockContext(undefined);

      expect(() => guard.canActivate(context as never)).toThrow(
        ForbiddenException,
      );
    });

    it('should allow SUPERADMIN to bypass role checks and log SUPERADMIN_BYPASS', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockContext({ id: 'sa-1', role: Role.SUPERADMIN });

      const result = guard.canActivate(context as never);

      expect(result).toBe(true);
      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.SUPERADMIN_BYPASS,
        userId: 'sa-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        metadata: {
          requiredRoles: [Role.ADMIN],
          endpoint: 'GET /test',
        },
      });
    });

    it('should allow SUPERADMIN without logging when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext({ id: 'sa-1', role: Role.SUPERADMIN });

      const result = guard.canActivate(context as never);

      expect(result).toBe(true);
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should coalesce missing ip to null in SUPERADMIN audit log', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: 'sa-1', role: Role.SUPERADMIN },
            headers: {},
            method: 'POST',
            route: { path: '/admin' },
          }),
        }),
      };

      guard.canActivate(context as never);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        }),
      );
    });

    it('should coalesce missing headers/method/route in SUPERADMIN audit log', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: 'sa-1', role: Role.SUPERADMIN },
          }),
        }),
      };

      guard.canActivate(context as never);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
          metadata: {
            requiredRoles: [Role.ADMIN],
            endpoint: ' ',
          },
        }),
      );
    });
  });
});
