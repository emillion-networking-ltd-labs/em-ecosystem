import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { SessionsService } from '../../sessions/sessions.service';
import { AuditService } from '../../audit/audit.service';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let sessionsService: jest.Mocked<SessionsService>;

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
      provider: Provider.LOCAL,
      providerId: null,
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
            generateOAuthCode: jest
              .fn()
              .mockReturnValue('ephemeral-code-uuid'),
            exchangeOAuthCode: jest.fn(),
            buildClearCookie: jest.fn().mockReturnValue(mockClearCookie),
          },
        },
        {
          provide: SessionsService,
          useValue: {
            getActiveSessions: jest.fn(),
            revokeSession: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
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

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    sessionsService = module.get(SessionsService);
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

    it('should set cookie and return accessToken + user', async () => {
      authService.register.mockResolvedValue(mockAuthResult);

      const result = await controller.register(
        registerDto,
        mockReq,
        mockRes as any,
      );

      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockCookie.value,
        mockCookie.options,
      );
    });

    it('should propagate ConflictException from service', async () => {
      authService.register.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(
        controller.register(registerDto, mockReq, mockRes as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'StrongPass1!',
    };

    it('should set cookie and return accessToken + user on valid credentials', async () => {
      authService.login.mockResolvedValue(mockAuthResult);

      const result = await controller.login(
        loginDto,
        mockReq,
        mockRes as any,
      );

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
      await expect(
        controller.refresh(mockReq, mockRes as any),
      ).rejects.toThrow(UnauthorizedException);
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

  describe('getSessions', () => {
    it('should return active sessions for the current user', async () => {
      const mockSessions = [
        {
          id: 'sess-1',
          deviceInfo: null,
          ipAddress: '127.0.0.1',
          userAgent: 'test',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
          isCurrent: false,
        },
      ];
      const reqWithUser = { ...mockReq, user: { id: 'uuid-123' } };
      sessionsService.getActiveSessions.mockResolvedValue(mockSessions as any);

      const result = await controller.getSessions(reqWithUser);

      expect(sessionsService.getActiveSessions).toHaveBeenCalledWith(
        'uuid-123',
        undefined,
      );
      expect(result).toEqual(mockSessions);
    });
  });

  describe('revokeSession', () => {
    it('should revoke the specified session', async () => {
      const reqWithUser = { ...mockReq, user: { id: 'uuid-123' } };
      sessionsService.revokeSession.mockResolvedValue(undefined);

      const result = await controller.revokeSession(
        'session-id',
        reqWithUser,
      );

      expect(sessionsService.revokeSession).toHaveBeenCalledWith(
        'session-id',
        'uuid-123',
      );
      expect(result.message).toBe('Session revoked');
    });
  });

  describe('getMe', () => {
    it('should return the user from the request', () => {
      const req = { user: mockAuthResult.user };

      const result = controller.getMe(req);

      expect(result).toBe(mockAuthResult.user);
    });
  });

  describe('getAdminDashboard', () => {
    it('should return admin access granted message', () => {
      const result = controller.getAdminDashboard();

      expect(result).toEqual({ message: 'Admin access granted' });
    });
  });

  describe('googleAuthCallback', () => {
    it('should return redirect URL with ephemeral code', () => {
      const req = {
        user: {
          accessToken: 'google-access',
          user: mockAuthResult.user,
          cookie: mockCookie,
        },
      };

      const result = controller.googleAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?code=ephemeral-code-uuid',
      );
      expect(result.url).not.toContain('accessToken');
      expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    });
  });

  describe('githubAuthCallback', () => {
    it('should return redirect URL with ephemeral code', () => {
      const req = {
        user: {
          accessToken: 'github-access',
          user: mockAuthResult.user,
          cookie: mockCookie,
        },
      };

      const result = controller.githubAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?code=ephemeral-code-uuid',
      );
      expect(result.url).not.toContain('accessToken');
      expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    });
  });

  describe('exchangeOAuthCode', () => {
    it('should set cookie and return accessToken + user for a valid code', () => {
      authService.exchangeOAuthCode.mockReturnValue(mockAuthResult as any);

      const result = controller.exchangeOAuthCode(
        { code: 'valid-code' },
        mockRes as any,
      );

      expect(authService.exchangeOAuthCode).toHaveBeenCalledWith('valid-code');
      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it('should propagate UnauthorizedException for invalid code', () => {
      authService.exchangeOAuthCode.mockImplementation(() => {
        throw new UnauthorizedException(
          'Invalid or expired authorization code',
        );
      });

      expect(() =>
        controller.exchangeOAuthCode(
          { code: 'invalid-code' },
          mockRes as any,
        ),
      ).toThrow(UnauthorizedException);
    });
  });
});
