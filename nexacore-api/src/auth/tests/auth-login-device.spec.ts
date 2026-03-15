import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  createAuthTestModule,
  AuthTestContext,
  mockUser,
  mockSession,
  requestMeta,
} from './auth-test.helpers';

jest.mock('bcrypt');

describe('AuthService — Login Device & Travel', () => {
  let ctx: AuthTestContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    ctx = await createAuthTestModule();
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
});
