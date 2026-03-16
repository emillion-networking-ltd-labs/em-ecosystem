import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { TurnstileService } from '../../security/turnstile.service';
import { AuditService } from '../../audit/audit.service';
import { Role } from '../../users/enums/role.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockCookie = {
    name: 'refresh_token',
    value: 'signed-refresh-jwt',
    options: {
      httpOnly: true,
      secure: false,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 604800,
    },
  };

  const mockClearCookie = {
    name: 'refresh_token',
    value: '',
    options: {
      httpOnly: true,
      secure: false,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0,
    },
  };

  const mockAuthResult = {
    accessToken: 'access-token-123',
    user: {
      id: 'uuid-123',
      email: 'test@example.com',
      firstName: null,
      lastName: null,
      avatarUrl: null,
      role: Role.USER,
      hasPassword: true,
      oauthProviders: [],
      emailVerified: false,
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      lockoutCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    cookie: mockCookie,
  };

  const mockRes = {
    cookie: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            logoutAll: jest.fn(),
            buildClearCookie: jest.fn().mockReturnValue(mockClearCookie),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            getPermissionKeysForRole: jest
              .fn()
              .mockResolvedValue(['dashboard:read']),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: TurnstileService,
          useValue: {
            verify: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  const mockReq = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
    cookies: {},
  };

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'StrongPass1!',
    };

    it('should return only message without user or cookie', async () => {
      const mockRegisterResult = {
        message: 'Please check your email to continue',
      };
      authService.register.mockResolvedValue(mockRegisterResult);

      const result = await controller.register(registerDto, mockReq);

      expect(result.message).toBe('Please check your email to continue');
      expect(result).not.toHaveProperty('user');
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });

    it('should return same response for existing and new emails', async () => {
      authService.register.mockResolvedValue({
        message: 'Please check your email to continue',
      });

      const result = await controller.register(registerDto, mockReq);

      expect(Object.keys(result)).toEqual(['message']);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'StrongPass1!',
    };

    it('should set cookie and return accessToken + user on valid credentials', async () => {
      authService.login.mockResolvedValue(mockAuthResult);

      const result = await controller.login(loginDto, mockReq, mockRes as any);

      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockCookie.value,
        mockCookie.options,
      );
    });

    it('should propagate UnauthorizedException on invalid credentials', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(
        controller.login(loginDto, mockReq, mockRes as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should propagate ForbiddenException when account is locked', async () => {
      authService.login.mockRejectedValue(
        new ForbiddenException('Account locked'),
      );

      await expect(
        controller.login(loginDto, mockReq, mockRes as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('login — fingerprint header as array', () => {
    it('should extract first element when x-device-fingerprint is an array', async () => {
      authService.login.mockResolvedValue(mockAuthResult);
      const reqWithArrayFp = {
        ...mockReq,
        headers: {
          ...mockReq.headers,
          'x-device-fingerprint': ['fp-first', 'fp-second'],
        },
      };

      await controller.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        reqWithArrayFp,
        mockRes as any,
      );

      expect(authService.login).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'fp-first',
      );
    });
  });

  describe('login - MFA challenge branch', () => {
    it('should return MFA challenge without setting cookie', async () => {
      const mfaResult = { mfaRequired: true as const, mfaToken: 'mfa-jwt' };
      authService.login.mockResolvedValue(mfaResult);

      const result = await controller.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        mockReq,
        mockRes as any,
      );

      expect(result).toEqual(mfaResult);
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });
  });

  describe('login - MFA setup required branch', () => {
    it('should return mfaSetupRequired without setting cookie', async () => {
      const mfaSetupResult = {
        mfaSetupRequired: true as const,
        message: 'MFA setup is required. Please enable MFA to continue.',
      };
      authService.login.mockResolvedValue(mfaSetupResult);

      const result = await controller.login(
        { email: 'admin@example.com', password: 'StrongPass1!' },
        mockReq,
        mockRes as any,
      );

      expect(result).toEqual(mfaSetupResult);
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should read refresh token from cookie and return new accessToken', async () => {
      const reqWithCookie = {
        ...mockReq,
        cookies: { refresh_token: 'old-refresh-token' },
      };
      authService.refreshTokens.mockResolvedValue({
        accessToken: 'new-access',
        cookie: mockCookie,
      });

      const result = await controller.refresh(reqWithCookie, mockRes as any);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'old-refresh-token',
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
      expect(result.accessToken).toBe('new-access');
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no cookie present', async () => {
      await expect(controller.refresh(mockReq, mockRes as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear cookie and return success message when cookie present', async () => {
      const reqWithCookie = {
        ...mockReq,
        cookies: { refresh_token: 'valid-token' },
      };
      authService.logout.mockResolvedValue(mockClearCookie);

      const result = await controller.logout(reqWithCookie, mockRes as any);

      expect(authService.logout).toHaveBeenCalledWith(
        'valid-token',
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
      expect(result.message).toBe('Logged out successfully');
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it('should clear cookie even when no refresh token cookie', async () => {
      const result = await controller.logout(mockReq, mockRes as any);

      expect(result.message).toBe('Logged out successfully');
      expect(mockRes.cookie).toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should revoke all sessions and return success message', async () => {
      const reqWithUser = { ...mockReq, user: { id: 'uuid-123' } };
      authService.logoutAll.mockResolvedValue(mockClearCookie);

      const result = await controller.logoutAll(reqWithUser, mockRes as any);

      expect(authService.logoutAll).toHaveBeenCalledWith(
        'uuid-123',
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
      expect(result.message).toBe('All sessions revoked');
    });
  });

  describe('getMe', () => {
    it('should return the user with permissions from the request', async () => {
      const req = { user: mockAuthResult.user };

      const result = await controller.getMe(req);

      expect(result).toEqual({
        ...mockAuthResult.user,
        permissions: ['dashboard:read'],
      });
    });
  });

  describe('getAdminDashboard', () => {
    it('should return admin access granted message', () => {
      const result = controller.getAdminDashboard();

      expect(result).toEqual({ message: 'Admin access granted' });
    });
  });

  describe('getCsrfToken', () => {
    it('should set CSRF cookie and return token', () => {
      jest.spyOn(CsrfGuard, 'generateToken').mockReturnValue('csrf-token-123');

      const result = controller.getCsrfToken(mockRes as any);

      expect(result).toEqual({ csrfToken: 'csrf-token-123' });
      expect(mockRes.cookie).toHaveBeenCalled();
    });
  });
});
