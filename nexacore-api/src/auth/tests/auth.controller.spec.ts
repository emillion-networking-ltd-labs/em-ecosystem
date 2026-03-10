import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { TrustedDeviceService } from '../trusted-device.service';
import { SessionsService } from '../../sessions/sessions.service';
import { AuditService } from '../../audit/audit.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { TurnstileService } from '../../security/turnstile.service';
import { Role } from '../../users/enums/role.enum';


describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let jwtSvc: jest.Mocked<JwtService>;
  let trustedDeviceService: jest.Mocked<TrustedDeviceService>;

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
            generateOAuthCode: jest
              .fn()
              .mockResolvedValue('ephemeral-code-uuid'),
            exchangeOAuthCode: jest.fn(),
            buildClearCookie: jest.fn().mockReturnValue(mockClearCookie),
            verifyEmail: jest.fn(),
            resendVerificationEmail: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            validateResetToken: jest.fn(),
            resendVerificationByEmail: jest.fn(),
            verifyEmailChange: jest.fn(),
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
        {
          provide: TrustedDeviceService,
          useValue: {
            trustDevice: jest.fn(),
            listTrustedDevices: jest.fn(),
            revokeDevice: jest.fn(),
            revokeAllDevices: jest.fn(),
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
    sessionsService = module.get(SessionsService);
    jwtSvc = module.get(JwtService);
    trustedDeviceService = module.get(TrustedDeviceService);
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
    it('should return redirect URL with ephemeral code', async () => {
      const req = {
        user: {
          accessToken: 'google-access',
          user: mockAuthResult.user,
          cookie: mockCookie,
        },
      };

      const result = await controller.googleAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?code=ephemeral-code-uuid',
      );
      expect(result.url).not.toContain('accessToken');
      expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    });
  });

  describe('githubAuthCallback', () => {
    it('should return redirect URL with ephemeral code', async () => {
      const req = {
        user: {
          accessToken: 'github-access',
          user: mockAuthResult.user,
          cookie: mockCookie,
        },
      };

      const result = await controller.githubAuthCallback(req);

      expect(result.url).toBe(
        'http://localhost:3001/auth/callback?code=ephemeral-code-uuid',
      );
      expect(result.url).not.toContain('accessToken');
      expect(authService.generateOAuthCode).toHaveBeenCalledWith(req.user);
    });
  });

  describe('exchangeOAuthCode', () => {
    it('should have @Throttle decorator', () => {
      const limitMeta = Reflect.getMetadata(
        'THROTTLER:LIMITglobal',
        controller.exchangeOAuthCode,
      );
      const ttlMeta = Reflect.getMetadata(
        'THROTTLER:TTLglobal',
        controller.exchangeOAuthCode,
      );
      expect(limitMeta).toBeDefined();
      expect(ttlMeta).toBeDefined();
    });

    it('should set cookie and return accessToken + user for a valid code', async () => {
      authService.exchangeOAuthCode.mockResolvedValue(mockAuthResult as any);

      const result = await controller.exchangeOAuthCode(
        { code: 'valid-code' },
        mockRes as any,
      );

      expect(authService.exchangeOAuthCode).toHaveBeenCalledWith('valid-code');
      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
      expect(mockRes.cookie).toHaveBeenCalled();
    });

    it('should propagate UnauthorizedException for invalid code', async () => {
      authService.exchangeOAuthCode.mockRejectedValue(
        new UnauthorizedException(
          'Invalid or expired authorization code',
        ),
      );

      await expect(
        controller.exchangeOAuthCode(
          { code: 'invalid-code' },
          mockRes as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
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

  // ─── SCRUM-119: MFA setup required branch ───────────────────

  describe('login - MFA setup required branch', () => {
    it('should return mfaSetupRequired without setting cookie', async () => {
      const mfaSetupResult = {
        mfaSetupRequired: true as const,
        message: 'MFA setup is required for administrator accounts. Please enable MFA to continue.',
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

  // ─── POST /auth/validate-reset-token ──────────────────────────

  describe('validateResetToken', () => {
    it('should delegate to authService and return validity', async () => {
      authService.validateResetToken.mockResolvedValue({ valid: true });

      const result = await controller.validateResetToken({ token: 'some-token' });

      expect(authService.validateResetToken).toHaveBeenCalledWith('some-token');
      expect(result).toEqual({ valid: true });
    });
  });

  // ─── POST /auth/resend-verification-public ─────────────────

  describe('resendVerificationPublic', () => {
    it('should delegate to authService and return generic message', async () => {
      authService.resendVerificationByEmail.mockResolvedValue(undefined);
      const dto = { email: 'test@example.com' };

      const result = await controller.resendVerificationPublic(dto);

      expect(authService.resendVerificationByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({
        message: 'If an account exists and needs verification, we have sent an email',
      });
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

  // ─── GET /auth/verify-email-change ──────────────────────────

  describe('verifyEmailChange', () => {
    it('should redirect to frontend with status=invalid when no token provided', async () => {
      const res = { redirect: jest.fn() };

      await controller.verifyEmailChange('', res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=invalid'),
      );
    });

    it('should redirect to frontend with verification result status on success', async () => {
      authService.verifyEmailChange.mockResolvedValue({ status: 'success' });
      const res = { redirect: jest.fn() };

      await controller.verifyEmailChange('valid-token', res as any);

      expect(authService.verifyEmailChange).toHaveBeenCalledWith('valid-token');
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('status=success'),
      );
    });
  });

  // ─── Trusted Device Endpoints ─────────────────────────────────

  describe('trustDevice', () => {
    const mockAuthReq = {
      ...mockReq,
      user: { id: 'uuid-123' },
    };

    it('should trust device and return id, deviceName, expiresAt', async () => {
      const mockDevice = {
        id: 'device-1',
        deviceName: 'Chrome on Windows',
        expiresAt: new Date('2026-04-02'),
      };
      trustedDeviceService.trustDevice.mockResolvedValue(mockDevice as any);

      const result = await controller.trustDevice(
        { fingerprint: 'abcdef1234567890' },
        mockAuthReq,
      );

      expect(result).toEqual({
        id: 'device-1',
        deviceName: 'Chrome on Windows',
        expiresAt: mockDevice.expiresAt,
      });
      expect(trustedDeviceService.trustDevice).toHaveBeenCalledWith(
        'uuid-123',
        'abcdef1234567890',
        '127.0.0.1',
        'test-agent',
      );
    });
  });

  describe('listTrustedDevices', () => {
    const mockAuthReq = {
      ...mockReq,
      user: { id: 'uuid-123' },
    };

    it('should return list of trusted devices', async () => {
      const devices = [
        { id: 'device-1', deviceName: 'Chrome on Windows' },
      ];
      trustedDeviceService.listTrustedDevices.mockResolvedValue(devices as any);

      const result = await controller.listTrustedDevices(mockAuthReq);

      expect(result).toEqual(devices);
      expect(trustedDeviceService.listTrustedDevices).toHaveBeenCalledWith(
        'uuid-123',
      );
    });
  });

  describe('revokeAllTrustedDevices', () => {
    const mockAuthReq = {
      ...mockReq,
      user: { id: 'uuid-123' },
    };

    it('should revoke all devices and return count', async () => {
      trustedDeviceService.revokeAllDevices.mockResolvedValue(3);

      const result = await controller.revokeAllTrustedDevices(mockAuthReq);

      expect(result).toEqual({
        message: 'All trusted devices revoked',
        count: 3,
      });
    });
  });

  describe('revokeTrustedDevice', () => {
    const mockAuthReq = {
      ...mockReq,
      user: { id: 'uuid-123' },
    };

    it('should revoke a specific device', async () => {
      trustedDeviceService.revokeDevice.mockResolvedValue(undefined);

      const result = await controller.revokeTrustedDevice(
        'device-uuid',
        mockAuthReq,
      );

      expect(result).toEqual({ message: 'Device trust revoked' });
      expect(trustedDeviceService.revokeDevice).toHaveBeenCalledWith(
        'uuid-123',
        'device-uuid',
      );
    });

    it('should propagate NotFoundException when device not found', async () => {
      trustedDeviceService.revokeDevice.mockRejectedValue(
        new NotFoundException('Trusted device not found'),
      );

      await expect(
        controller.revokeTrustedDevice('unknown-id', mockAuthReq),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
