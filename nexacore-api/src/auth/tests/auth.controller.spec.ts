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
import { PermissionsService } from '../../permissions/permissions.service';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let jwtSvc: jest.Mocked<JwtService>;

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
            verifyEmail: jest.fn(),
            resendVerificationEmail: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
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
        {
          provide: PermissionsService,
          useValue: {
            getPermissionKeysForRole: jest
              .fn()
              .mockResolvedValue(['dashboard:read']),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    sessionsService = module.get(SessionsService);
    jwtSvc = module.get(JwtService);
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

  // ─── LOGIN MFA BRANCH ──────────────────────────────────────

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

  // ─── GET /auth/csrf-token ──────────────────────────────────

  describe('getCsrfToken', () => {
    it('should set CSRF cookie and return token', () => {
      jest.spyOn(CsrfGuard, 'generateToken').mockReturnValue('csrf-token-123');

      const result = controller.getCsrfToken(mockRes as any);

      expect(result).toEqual({ csrfToken: 'csrf-token-123' });
      expect(mockRes.cookie).toHaveBeenCalled();
    });
  });

  // ─── GET /auth/verify-email ────────────────────────────────

  describe('verifyEmail', () => {
    it('should redirect with success status on valid token', async () => {
      authService.verifyEmail.mockResolvedValue({ status: 'success' });
      const res = { redirect: jest.fn() };

      await controller.verifyEmail('valid-token', res as any);

      expect(authService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=success'),
      );
    });

    it('should redirect with invalid status on missing token', async () => {
      const res = { redirect: jest.fn() };

      await controller.verifyEmail('', res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=invalid'),
      );
    });

    it('should redirect with invalid status on bad token', async () => {
      authService.verifyEmail.mockResolvedValue({ status: 'invalid' });
      const res = { redirect: jest.fn() };

      await controller.verifyEmail('bad-token', res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=invalid'),
      );
    });
  });

  // ─── POST /auth/resend-verification ────────────────────────

  describe('resendVerification', () => {
    it('should delegate to authService and return success message', async () => {
      authService.resendVerificationEmail.mockResolvedValue(undefined);
      const reqWithUser = { ...mockReq, user: { id: 'uuid-123' } };

      const result = await controller.resendVerification(reqWithUser);

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(
        'uuid-123',
      );
      expect(result).toEqual({ message: 'Verification email sent' });
    });
  });

  // ─── POST /auth/forgot-password ───────────────────────────

  describe('forgotPassword', () => {
    it('should delegate to authService and return success message', async () => {
      authService.forgotPassword.mockResolvedValue(undefined);
      const dto = { email: 'test@example.com' };

      const result = await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        message: 'If an account exists, a reset email has been sent',
      });
    });
  });

  // ─── POST /auth/reset-password ─────────────────────────────

  describe('resetPassword', () => {
    it('should delegate to authService and return success message', async () => {
      authService.resetPassword.mockResolvedValue(undefined);
      const dto = { token: 'reset-token', newPassword: 'NewPass1!' };

      const result = await controller.resetPassword(dto, mockReq);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        dto,
        expect.objectContaining({ ipAddress: '127.0.0.1' }),
      );
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  // ─── googleAuth / githubAuth (empty body handlers) ─────────

  describe('googleAuth', () => {
    it('should be defined (guard handles redirect)', () => {
      expect(controller.googleAuth()).toBeUndefined();
    });
  });

  describe('githubAuth', () => {
    it('should be defined (guard handles redirect)', () => {
      expect(controller.githubAuth()).toBeUndefined();
    });
  });

  // ─── getSessions with current session ID ───────────────────

  describe('getSessions - with refresh token cookie', () => {
    it('should extract current session ID from cookie', async () => {
      jwtSvc.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'current-sess',
        family: 'fam-1',
      });
      sessionsService.getActiveSessions.mockResolvedValue([]);
      const reqWithCookieAndUser = {
        ...mockReq,
        cookies: { refresh_token: 'some-jwt' },
        user: { id: 'uuid-123' },
      };

      await controller.getSessions(reqWithCookieAndUser);

      expect(sessionsService.getActiveSessions).toHaveBeenCalledWith(
        'uuid-123',
        'current-sess',
      );
    });
  });
});
