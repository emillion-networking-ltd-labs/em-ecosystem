import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { Role } from '../enums/role.enum';
import { Provider } from '../enums/provider.enum';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../audit/audit.service';
import { PermissionsService } from '../../permissions/permissions.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    updateProfile: jest.Mock;
    changePassword: jest.Mock;
    requestEmailChange: jest.Mock;
    selfDeleteAccount: jest.Mock;
    unlinkOAuth: jest.Mock;
    getSecurityActivity: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    adminUpdateUser: jest.Mock;
    softDelete: jest.Mock;
  };

  const mockSafeUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: null,
    role: Role.USER,
    provider: Provider.LOCAL,
    providerId: null,
    emailVerified: true,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReq = {
    user: { id: 'uuid-123', role: Role.USER },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  };

  const mockAdminReq = {
    user: { id: 'admin-1', role: Role.ADMIN },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    usersService = {
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      requestEmailChange: jest.fn(),
      selfDeleteAccount: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      adminUpdateUser: jest.fn(),
      softDelete: jest.fn(),
      unlinkOAuth: jest.fn(),
      getSecurityActivity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: PermissionsService,
          useValue: { roleHasAllPermissions: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  // ─── PATCH /users/me ─────────────────────────────────────────

  describe('updateProfile', () => {
    it('should delegate to usersService.updateProfile with userId and context', async () => {
      usersService.updateProfile.mockResolvedValue(mockSafeUser);

      const result = await controller.updateProfile(mockReq, {
        firstName: 'Jane',
      });

      expect(usersService.updateProfile).toHaveBeenCalledWith(
        'uuid-123',
        { firstName: 'Jane' },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual(mockSafeUser);
    });
  });

  // ─── PATCH /users/me/password ────────────────────────────────

  describe('changePassword', () => {
    it('should delegate to usersService.changePassword and return success message', async () => {
      usersService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(mockReq, {
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass2!',
      });

      expect(usersService.changePassword).toHaveBeenCalledWith(
        'uuid-123',
        { currentPassword: 'OldPass1!', newPassword: 'NewPass2!' },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({ message: 'Password changed successfully' });
    });
  });

  // ─── GET /users ──────────────────────────────────────────────

  describe('listUsers', () => {
    it('should delegate to usersService.findAll with query params', async () => {
      const paginatedResult = {
        data: [mockSafeUser],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      usersService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.listUsers({
        page: 1,
        limit: 10,
        role: Role.ADMIN,
      });

      expect(usersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        role: Role.ADMIN,
      });
      expect(result).toEqual(paginatedResult);
    });
  });

  // ─── GET /users/:id ──────────────────────────────────────────

  describe('getUser', () => {
    it('should return SafeUser when user exists', async () => {
      const fullUser = {
        ...mockSafeUser,
        passwordHash: 'hashed',
        mfaSecret: null,
        mfaRecoveryCodes: [],
      };
      usersService.findById.mockResolvedValue(fullUser);

      const result = await controller.getUser('uuid-123');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(controller.getUser('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── PATCH /users/:id ────────────────────────────────────────

  describe('adminUpdateUser', () => {
    it('should delegate to usersService.adminUpdateUser with acting user context', async () => {
      usersService.adminUpdateUser.mockResolvedValue({
        ...mockSafeUser,
        role: Role.ADMIN,
      });

      const result = await controller.adminUpdateUser(
        'uuid-123',
        { role: Role.ADMIN },
        mockAdminReq,
      );

      expect(usersService.adminUpdateUser).toHaveBeenCalledWith(
        'uuid-123',
        { role: Role.ADMIN },
        { id: 'admin-1', role: Role.ADMIN },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  // ─── DELETE /users/:id ───────────────────────────────────────

  describe('deleteUser', () => {
    it('should delegate to usersService.softDelete and return success message', async () => {
      usersService.softDelete.mockResolvedValue(undefined);

      const result = await controller.deleteUser('uuid-123', mockAdminReq);

      expect(usersService.softDelete).toHaveBeenCalledWith(
        'uuid-123',
        'admin-1',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({ message: 'User deactivated successfully' });
    });
  });

  // ─── DELETE /users/me ──────────────────────────────────────

  describe('deleteOwnAccount', () => {
    it('should delegate to usersService.selfDeleteAccount with userId and context', async () => {
      usersService.selfDeleteAccount.mockResolvedValue({
        message: 'Account deleted successfully',
      });

      const result = await controller.deleteOwnAccount(mockReq, {
        password: 'StrongPass1!',
      });

      expect(usersService.selfDeleteAccount).toHaveBeenCalledWith(
        'uuid-123',
        { password: 'StrongPass1!' },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({
        message: 'Account deleted successfully',
      });
    });

    it('should delegate without password for OAuth accounts', async () => {
      usersService.selfDeleteAccount.mockResolvedValue({
        message: 'Account deleted successfully',
      });

      const result = await controller.deleteOwnAccount(mockReq, {});

      expect(usersService.selfDeleteAccount).toHaveBeenCalledWith(
        'uuid-123',
        {},
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({
        message: 'Account deleted successfully',
      });
    });
  });

  // ─── POST /users/me/email ───────────────────────────────────

  describe('requestEmailChange', () => {
    it('should delegate to usersService.requestEmailChange with userId and context', async () => {
      usersService.requestEmailChange.mockResolvedValue({
        message: 'Verification email sent to new address',
      });

      const result = await controller.requestEmailChange(mockReq, {
        newEmail: 'new@example.com',
        password: 'StrongPass1!',
      });

      expect(usersService.requestEmailChange).toHaveBeenCalledWith(
        'uuid-123',
        { newEmail: 'new@example.com', password: 'StrongPass1!' },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({
        message: 'Verification email sent to new address',
      });
    });
  });

  // ─── DELETE /users/me/oauth ─────────────────────────────────

  describe('unlinkOAuth', () => {
    it('should delegate to usersService.unlinkOAuth with userId, dto, and context', async () => {
      usersService.unlinkOAuth.mockResolvedValue({
        message: 'OAuth provider unlinked successfully',
      });

      const result = await controller.unlinkOAuth(mockReq, {
        password: 'StrongPass1!',
      });

      expect(usersService.unlinkOAuth).toHaveBeenCalledWith(
        'uuid-123',
        { password: 'StrongPass1!' },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({
        message: 'OAuth provider unlinked successfully',
      });
    });

    it('should return service result directly', async () => {
      const serviceResult = { message: 'OAuth provider unlinked successfully' };
      usersService.unlinkOAuth.mockResolvedValue(serviceResult);

      const result = await controller.unlinkOAuth(mockReq, {
        password: 'MyPass123!',
      });

      expect(result).toBe(serviceResult);
    });

    it('should extract RequestContext from request object', async () => {
      usersService.unlinkOAuth.mockResolvedValue({
        message: 'OAuth provider unlinked successfully',
      });

      const customReq = {
        user: { id: 'user-456' },
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Mozilla/5.0' },
      };

      await controller.unlinkOAuth(customReq, { password: 'TestPass1!' });

      expect(usersService.unlinkOAuth).toHaveBeenCalledWith(
        'user-456',
        { password: 'TestPass1!' },
        { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' },
      );
    });
  });

  // ─── GET /users/me/security-activity ────────────────────────

  describe('getSecurityActivity', () => {
    it('should delegate to usersService.getSecurityActivity with userId and pagination', async () => {
      const mockResult = {
        data: [
          {
            id: 'log-1',
            action: 'LOGIN_SUCCESS',
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
            metadata: null,
            createdAt: new Date(),
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      usersService.getSecurityActivity.mockResolvedValue(mockResult);

      const result = await controller.getSecurityActivity(mockReq, {
        page: 1,
        limit: 20,
      });

      expect(usersService.getSecurityActivity).toHaveBeenCalledWith(
        'uuid-123',
        1,
        20,
      );
      expect(result).toEqual(mockResult);
    });

    it('should use default pagination when no query params provided', async () => {
      const emptyResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      usersService.getSecurityActivity.mockResolvedValue(emptyResult);

      await controller.getSecurityActivity(mockReq, {});

      expect(usersService.getSecurityActivity).toHaveBeenCalledWith(
        'uuid-123',
        1,
        20,
      );
    });

    it('should pass custom pagination params', async () => {
      usersService.getSecurityActivity.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 3, limit: 50, totalPages: 0 },
      });

      await controller.getSecurityActivity(mockReq, { page: 3, limit: 50 });

      expect(usersService.getSecurityActivity).toHaveBeenCalledWith(
        'uuid-123',
        3,
        50,
      );
    });
  });
});
