import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import {
  createAuthTestModule,
  AuthTestContext,
  mockUser,
  mockSession,
  requestMeta,
} from './auth-test.helpers';

jest.mock('bcrypt');

describe('AuthService — Login Edge Cases', () => {
  let ctx: AuthTestContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    ctx = await createAuthTestModule();
  });

  // ─── login with MFA challenge ─────────────────────────────────

  describe('login - MFA challenge', () => {
    it('should return mfaRequired when user has MFA enabled', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      ctx.jwtService.sign.mockReturnValue('mfa-challenge-jwt');

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect((result as any).mfaRequired).toBe(true);
      expect((result as any).mfaToken).toBe('mfa-challenge-jwt');
    });

    it('should NOT create a session when MFA is required', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      ctx.jwtService.sign.mockReturnValue('mfa-jwt');

      await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(ctx.sessionsService.createSession).not.toHaveBeenCalled();
    });

    it('should skip MFA challenge when trusted device fingerprint matches', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.trustedDeviceService.isTrustedDevice.mockResolvedValue(true);
      ctx.jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
        undefined,
        'trusted-fingerprint',
      );

      expect(result.accessToken).toBe('access-token');
      expect((result as any).mfaRequired).toBeUndefined();
    });

    it('should NOT skip MFA when fingerprint does not match any trusted device', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      ctx.trustedDeviceService.isTrustedDevice.mockResolvedValue(false);
      ctx.jwtService.sign.mockReturnValue('mfa-jwt');

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
        undefined,
        'untrusted-fingerprint',
      );

      expect((result as any).mfaRequired).toBe(true);
    });
  });

  // ─── register - verification email failure ─────────────────────

  describe('register - verification email failure', () => {
    it('should complete registration even when verification email fails', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.usersService.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      ctx.prismaService.emailVerificationToken.create.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await ctx.authService.register(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result.message).toBe('Please check your email to continue');
      expect(result).not.toHaveProperty('user');
    });
  });

  // ─── login - account locked ────────────────────────────────────

  describe('login - account locked', () => {
    it('should throw UnauthorizedException when account is locked (anti-enumeration)', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 300000),
        lockoutCount: 1,
      });

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'pass' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reset failed attempts when lock has expired', async () => {
      const expiredLockUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() - 1000),
        lockoutCount: 1,
        failedAttempts: 5,
      };
      ctx.usersService.findByEmail.mockResolvedValue(expiredLockUser);
      ctx.usersService.resetFailedAttempts.mockResolvedValue(undefined);
      ctx.usersService.resetLockoutEscalation.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      ctx.jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(ctx.usersService.resetFailedAttempts).toHaveBeenCalledWith(
        'uuid-123',
      );
      expect(ctx.usersService.resetLockoutEscalation).toHaveBeenCalledWith(
        'uuid-123',
      );
      expect(result).toHaveProperty('accessToken');
    });
  });

  // ─── login - no password (OAuth account) ───────────────────────

  describe('login - no password (OAuth account)', () => {
    it('should throw UnauthorizedException for OAuth-only account (no passwordHash)', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'pass' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── login - email not verified ────────────────────────────────

  describe('login - email not verified', () => {
    it('should throw UnauthorizedException for unverified account with password (anti-enumeration)', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'StrongPass1!' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── login - max failed attempts triggers lockout ──────────────

  describe('login - max failed attempts triggers lockout', () => {
    it('should lock account after max failed attempts and throw UnauthorizedException (anti-enumeration)', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      ctx.usersService.incrementFailedAttempts.mockResolvedValue({
        ...mockUser,
        failedAttempts: 6,
      });
      ctx.usersService.lockAccount.mockResolvedValue(undefined);

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'wrong' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(ctx.usersService.lockAccount).toHaveBeenCalledWith('uuid-123', 0);
    });
  });

  // ─── login - lockout anti-enumeration ──────────────────────────

  describe('login - lockout anti-enumeration', () => {
    it('locked account and non-existing account should throw same exception type', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        ctx.authService.login(
          { email: 'nobody@example.com', password: 'pass' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);

      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 300000),
        lockoutCount: 1,
      });

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'pass' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── login - successful login resets failed attempts ───────────

  describe('login - successful login resets failed attempts', () => {
    it('should reset failed attempts on successful login', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        failedAttempts: 3,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      ctx.usersService.resetLockoutEscalation.mockResolvedValue(undefined);
      ctx.jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(ctx.usersService.resetLockoutEscalation).toHaveBeenCalledWith(
        'uuid-123',
      );
    });
  });

  // ─── notifyIfNewDevice (via login) ─────────────────────────────

  describe('notifyIfNewDevice (via login)', () => {
    beforeEach(() => {
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);
    });

    it('should send login notification when IP is new', async () => {
      ctx.prismaService.session.findMany.mockResolvedValue([
        { ipAddress: '10.0.0.99', userAgent: 'test-agent' },
      ]);

      await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      await new Promise((r) => setTimeout(r, 50));

      expect(ctx.mailService.sendLoginNotificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'test-agent',
        null,
      );
    });

    it('should send login notification when userAgent is new', async () => {
      ctx.prismaService.session.findMany.mockResolvedValue([
        { ipAddress: '127.0.0.1', userAgent: 'different-agent' },
      ]);

      await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      await new Promise((r) => setTimeout(r, 50));

      expect(ctx.mailService.sendLoginNotificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1',
        'test-agent',
        null,
      );
    });

    it('should NOT send notification on first-ever login (no previous sessions)', async () => {
      ctx.prismaService.session.findMany.mockResolvedValue([]);

      await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      await new Promise((r) => setTimeout(r, 50));

      expect(ctx.mailService.sendLoginNotificationEmail).not.toHaveBeenCalled();
    });

    it('should NOT send notification when IP and UA are both known', async () => {
      ctx.prismaService.session.findMany.mockResolvedValue([
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      ]);

      await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      await new Promise((r) => setTimeout(r, 50));

      expect(ctx.mailService.sendLoginNotificationEmail).not.toHaveBeenCalled();
    });

    it('should not fail login when notification email fails', async () => {
      ctx.prismaService.session.findMany.mockResolvedValue([
        { ipAddress: '10.0.0.99', userAgent: 'other-agent' },
      ]);
      ctx.mailService.sendLoginNotificationEmail.mockRejectedValueOnce(
        new Error('SMTP error'),
      );

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  // ─── impossible travel integration ─────────────────────────────

  describe('impossible travel integration', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    beforeEach(() => {
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);
    });

    it('should allow login when impossible travel returns null', async () => {
      ctx.impossibleTravelService.detectImpossibleTravel.mockResolvedValue(
        null,
      );

      const result = await ctx.authService.login(loginDto, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });

    it('should allow login when travel is not anomalous', async () => {
      ctx.impossibleTravelService.detectImpossibleTravel.mockResolvedValue({
        isAnomalous: false,
        previousLocation: null,
        currentLocation: {
          city: 'Madrid',
          country: 'Spain',
          countryCode: 'ES',
          latitude: 40.4168,
          longitude: -3.7038,
        },
        distanceKm: 5762,
        elapsedHours: 10,
        requiredSpeedKmh: 576,
        strategy: 'alert_only',
        actionTaken: 'allowed',
      });

      const result = await ctx.authService.login(loginDto, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });

    it('should throw ForbiddenException when travel action is blocked', async () => {
      ctx.impossibleTravelService.detectImpossibleTravel.mockResolvedValue({
        isAnomalous: true,
        previousLocation: {
          city: 'Madrid',
          country: 'Spain',
          countryCode: 'ES',
          latitude: 40.4168,
          longitude: -3.7038,
        },
        currentLocation: {
          city: 'New York',
          country: 'United States',
          countryCode: 'US',
          latitude: 40.7128,
          longitude: -74.006,
        },
        distanceKm: 5762,
        elapsedHours: 0.5,
        requiredSpeedKmh: 11524,
        strategy: 'block',
        actionTaken: 'blocked',
      });

      await expect(
        ctx.authService.login(loginDto, requestMeta),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should log audit with travel metadata when blocking', async () => {
      ctx.impossibleTravelService.detectImpossibleTravel.mockResolvedValue({
        isAnomalous: true,
        previousLocation: {
          city: 'Madrid',
          country: 'Spain',
          countryCode: 'ES',
          latitude: 40.4168,
          longitude: -3.7038,
        },
        currentLocation: {
          city: 'New York',
          country: 'United States',
          countryCode: 'US',
          latitude: 40.7128,
          longitude: -74.006,
        },
        distanceKm: 5762,
        elapsedHours: 0.5,
        requiredSpeedKmh: 11524,
        strategy: 'block',
        actionTaken: 'blocked',
      });

      await expect(
        ctx.authService.login(loginDto, requestMeta),
      ).rejects.toThrow(ForbiddenException);

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_BLOCKED_TRAVEL',
          userId: 'uuid-123',
          metadata: expect.objectContaining({
            distanceKm: 5762,
            elapsedHours: 0.5,
            requiredSpeedKmh: 11524,
          }),
        }),
      );
    });

    it('should allow login gracefully when impossible travel check throws (fail-open)', async () => {
      ctx.impossibleTravelService.detectImpossibleTravel.mockRejectedValue(
        new Error('Geolocation service unavailable'),
      );

      const result = await ctx.authService.login(loginDto, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });
  });

  // ─── suspicious login detection integration ────────────────────

  describe('suspicious login detection integration', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    beforeEach(() => {
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      ctx.jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue({
        id: 'session-uuid',
        userId: 'uuid-123',
        tokenFamily: 'family-uuid',
        refreshTokenHash: 'hashed',
        deviceInfo: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    it('should call analyzeLoginFailure after failed password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      ctx.usersService.incrementFailedAttempts.mockResolvedValue({
        failedAttempts: 1,
        lockedUntil: null,
      });

      await expect(
        ctx.authService.login(loginDto, requestMeta),
      ).rejects.toThrow(UnauthorizedException);

      expect(
        ctx.suspiciousLoginService.analyzeLoginFailure,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid-123',
          ipAddress: '127.0.0.1',
        }),
      );
    });

    it('should call analyzeLoginSuccess after successful login', async () => {
      await ctx.authService.login(loginDto, requestMeta);

      expect(
        ctx.suspiciousLoginService.analyzeLoginSuccess,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid-123',
          ipAddress: '127.0.0.1',
        }),
      );
    });

    it('should not block login when analyzeLoginFailure throws (fail-open)', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      ctx.usersService.incrementFailedAttempts.mockResolvedValue({
        failedAttempts: 1,
        lockedUntil: null,
      });
      ctx.suspiciousLoginService.analyzeLoginFailure.mockRejectedValue(
        new Error('Detection service down'),
      );

      await expect(
        ctx.authService.login(loginDto, requestMeta),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not block login when analyzeLoginSuccess throws (fail-open)', async () => {
      ctx.suspiciousLoginService.analyzeLoginSuccess.mockRejectedValue(
        new Error('Detection service down'),
      );

      const result = await ctx.authService.login(loginDto, requestMeta);

      expect(result.accessToken).toBe('access-token');
    });

    it('should pass full payload to analyzeLoginSuccess', async () => {
      await ctx.authService.login(loginDto, requestMeta);

      expect(
        ctx.suspiciousLoginService.analyzeLoginSuccess,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid-123',
          email: 'test@example.com',
          firstName: null,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          loginTime: expect.any(Date),
        }),
      );
    });

    it('should not call analyzeLoginFailure when user is not found', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        ctx.authService.login(
          { email: 'nonexistent@example.com', password: 'pass' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(
        ctx.suspiciousLoginService.analyzeLoginFailure,
      ).not.toHaveBeenCalled();
    });
  });

  // ─── MFA enforcement for admin roles ───────────────────────────

  describe('MFA enforcement for admin roles (OWASP ASVS V2.7.2)', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);
    });

    it('should return mfaSetupRequired for ADMIN without MFA', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, mfaEnabled: false };
      ctx.usersService.findByEmail.mockResolvedValue(adminUser);

      const result = await ctx.authService.login(loginDto, requestMeta);

      expect((result as any).mfaSetupRequired).toBe(true);
      expect((result as any).message).toContain('MFA setup is required');
      expect((result as any).accessToken).toBeUndefined();
    });

    it('should return mfaSetupRequired for SUPERADMIN without MFA', async () => {
      const superadminUser = {
        ...mockUser,
        role: Role.SUPERADMIN,
        mfaEnabled: false,
      };
      ctx.usersService.findByEmail.mockResolvedValue(superadminUser);

      const result = await ctx.authService.login(loginDto, requestMeta);

      expect((result as any).mfaSetupRequired).toBe(true);
      expect((result as any).accessToken).toBeUndefined();
    });

    it('should return MFA challenge for ADMIN with MFA enabled', async () => {
      const adminWithMfa = {
        ...mockUser,
        role: Role.ADMIN,
        mfaEnabled: true,
      };
      ctx.usersService.findByEmail.mockResolvedValue(adminWithMfa);
      ctx.jwtService.sign.mockReset();
      ctx.jwtService.sign.mockReturnValue('mfa-challenge-jwt');

      const result = await ctx.authService.login(loginDto, requestMeta);

      expect((result as any).mfaRequired).toBe(true);
      expect((result as any).mfaToken).toBeDefined();
      expect((result as any).mfaSetupRequired).toBeUndefined();
    });

    it('should return tokens normally for USER without MFA', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await ctx.authService.login(loginDto, requestMeta);

      expect((result as any).accessToken).toBe('access-token');
      expect((result as any).mfaSetupRequired).toBeUndefined();
    });

    it('should log audit event with mfaSetupRequired metadata', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN, mfaEnabled: false };
      ctx.usersService.findByEmail.mockResolvedValue(adminUser);

      await ctx.authService.login(loginDto, requestMeta, requestMeta);

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            mfaSetupRequired: true,
            role: 'ADMIN',
          }),
        }),
      );
    });

    it('should still return mfaSetupRequired when audit log rejects (fire-and-forget)', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      const adminUser = { ...mockUser, role: Role.ADMIN, mfaEnabled: false };
      ctx.usersService.findByEmail.mockResolvedValue(adminUser);

      const result = await ctx.authService.login(loginDto, requestMeta);

      expect((result as any).mfaSetupRequired).toBe(true);
    });
  });

  // ─── fire-and-forget resilience ────────────────────────────────

  describe('fire-and-forget resilience (audit log rejection)', () => {
    const flushPromises = () =>
      new Promise((resolve) => process.nextTick(resolve));

    it('should still throw UnauthorizedException when audit rejects on locked account', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 600_000),
        lockoutCount: 1,
      };
      ctx.usersService.findByEmail.mockResolvedValue(lockedUser);

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'StrongPass1!' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
      await flushPromises();
    });

    it('should still throw UnauthorizedException when audit rejects on OAuth-only account', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      const oauthOnlyUser = { ...mockUser, passwordHash: null };
      ctx.usersService.findByEmail.mockResolvedValue(oauthOnlyUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'StrongPass1!' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
      await flushPromises();
    });

    it('should still throw UnauthorizedException when audit rejects on account lockout', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      ctx.usersService.incrementFailedAttempts.mockResolvedValue({
        failedAttempts: 5,
        lockedUntil: null,
      });
      ctx.usersService.lockAccount.mockResolvedValue(undefined);

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'StrongPass1!' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
      await flushPromises();
    });

    it('should still throw UnauthorizedException when audit rejects on email not verified (anti-enumeration)', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      const unverifiedUser = { ...mockUser, emailVerified: false };
      ctx.usersService.findByEmail.mockResolvedValue(unverifiedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'StrongPass1!' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
      await flushPromises();
    });

    it('should still return mfaSetupRequired when audit rejects for admin without MFA', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      const adminUser = { ...mockUser, role: Role.ADMIN, mfaEnabled: false };
      ctx.usersService.findByEmail.mockResolvedValue(adminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect((result as any).mfaSetupRequired).toBe(true);
      await flushPromises();
    });

    it('should still return tokens when audit rejects on successful login', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result.accessToken).toBe('access-token');
      await flushPromises();
    });

    it('should still return tokens for trusted device MFA skip when audit rejects', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      const mfaUser = { ...mockUser, mfaEnabled: true };
      ctx.usersService.findByEmail.mockResolvedValue(mfaUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.trustedDeviceService.isTrustedDevice.mockResolvedValue(true);
      ctx.jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
        undefined,
        'fp-123',
      );

      expect(result.accessToken).toBe('access-token');
      await flushPromises();
    });

    it('should still throw when audit rejects on impossible travel block', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);
      ctx.impossibleTravelService.detectImpossibleTravel.mockResolvedValue({
        isAnomalous: true,
        previousLocation: {
          city: 'Madrid',
          country: 'Spain',
          countryCode: 'ES',
          latitude: 40.4,
          longitude: -3.7,
        },
        currentLocation: {
          city: 'Tokyo',
          country: 'Japan',
          countryCode: 'JP',
          latitude: 35.6,
          longitude: 139.6,
        },
        distanceKm: 10500,
        elapsedHours: 0.5,
        requiredSpeedKmh: 21000,
        strategy: 'block',
        actionTaken: 'blocked',
      });

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'StrongPass1!' },
          requestMeta,
        ),
      ).rejects.toThrow(ForbiddenException);
      await flushPromises();
    });
  });
});
