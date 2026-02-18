import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '../../users/enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    jest.clearAllMocks();

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: { role: Role }) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext({ role: Role.USER });

      expect(guard.canActivate(context as never)).toBe(true);
    });

    it('should return true when roles array is empty', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const context = createMockContext({ role: Role.USER });

      expect(guard.canActivate(context as never)).toBe(true);
    });

    it('should return true when user has the required role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockContext({ role: Role.ADMIN });

      expect(guard.canActivate(context as never)).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.USER]);
      const context = createMockContext({ role: Role.USER });

      expect(guard.canActivate(context as never)).toBe(true);
    });

    it('should throw ForbiddenException when user lacks required role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockContext({ role: Role.USER });

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
  });
});
