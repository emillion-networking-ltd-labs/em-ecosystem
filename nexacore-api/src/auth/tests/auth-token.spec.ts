import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  createAuthTestModule,
  AuthTestContext,
  mockUser,
  mockSession,
  requestMeta,
} from './auth-test.helpers';

jest.mock('bcrypt');

describe('AuthService — Token Lifecycle', () => {
  let ctx: AuthTestContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    ctx = await createAuthTestModule();
  });

  // ─── refreshTokens ────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('should return new accessToken and cookie on valid refresh token', async () => {
      ctx.jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      ctx.usersService.findById.mockResolvedValue(mockUser);
      ctx.sessionsService.rotateRefreshToken.mockResolvedValue(mockSession);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);
      ctx.jwtService.sign
        .mockReturnValueOnce('new-access')
        .mockReturnValueOnce('new-refresh');

      const result = await ctx.authService.refreshTokens(
        'valid-refresh-token',
        requestMeta,
      );

      expect(result.accessToken).toBe('new-access');
      expect(result.cookie).toBeDefined();
      expect(result.cookie.name).toBe('refresh_token');
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      ctx.jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(
        ctx.authService.refreshTokens('invalid-token', requestMeta),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      ctx.jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      ctx.usersService.findById.mockResolvedValue(null);

      await expect(
        ctx.authService.refreshTokens('valid-token', requestMeta),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call rotateRefreshToken on SessionsService', async () => {
      ctx.jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      ctx.usersService.findById.mockResolvedValue(mockUser);
      ctx.sessionsService.rotateRefreshToken.mockResolvedValue(mockSession);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);
      ctx.jwtService.sign.mockReturnValue('token');

      await ctx.authService.refreshTokens('valid-token', requestMeta);

      expect(ctx.sessionsService.rotateRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          oldSessionId: 'session-uuid',
          oldRefreshToken: 'valid-token',
        }),
      );
    });
  });

  // ─── generateTokensForMfa ─────────────────────────────────────

  describe('generateTokensForMfa', () => {
    it('should return AuthResult with tokens for existing user', async () => {
      ctx.usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign
        .mockReturnValueOnce('mfa-access-token')
        .mockReturnValueOnce('mfa-refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.generateTokensForMfa(
        'uuid-123',
        requestMeta,
      );

      expect(result.accessToken).toBe('mfa-access-token');
      expect(result.cookie.name).toBe('refresh_token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      ctx.usersService.findById.mockResolvedValue(null);

      await expect(
        ctx.authService.generateTokensForMfa('nonexistent', requestMeta),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── buildRefreshCookie / buildClearCookie ─────────────────────

  describe('buildRefreshCookie', () => {
    it('should return cookie config with refresh_token name', () => {
      const cookie = ctx.authService.buildRefreshCookie('my-token');

      expect(cookie.name).toBe('refresh_token');
      expect(cookie.value).toBe('my-token');
      expect(cookie.options.httpOnly).toBe(true);
      expect(cookie.options.sameSite).toBe('strict');
      expect(cookie.options.path).toBe('/');
    });
  });

  describe('buildClearCookie', () => {
    it('should return cookie config with empty value and maxAge=0', () => {
      const cookie = ctx.authService.buildClearCookie();

      expect(cookie.name).toBe('refresh_token');
      expect(cookie.value).toBe('');
      expect(cookie.options.maxAge).toBe(0);
    });
  });

  // ─── refreshTokens - idle timeout ─────────────────────────────

  describe('refreshTokens - idle timeout', () => {
    beforeEach(() => {
      ctx.jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      ctx.usersService.findById.mockResolvedValue(mockUser);
      ctx.sessionsService.rotateRefreshToken.mockResolvedValue(mockSession);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);
      ctx.jwtService.sign.mockReturnValue('token');
    });

    it('should throw UnauthorizedException when session is idle', async () => {
      ctx.sessionsService.findById.mockResolvedValue(mockSession);
      ctx.sessionsService.isSessionIdle.mockReturnValue(true);

      await expect(
        ctx.authService.refreshTokens('valid-token', requestMeta),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        ctx.authService.refreshTokens('valid-token', requestMeta),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should NOT call rotateRefreshToken when session is idle', async () => {
      ctx.sessionsService.findById.mockResolvedValue(mockSession);
      ctx.sessionsService.isSessionIdle.mockReturnValue(true);

      await ctx.authService
        .refreshTokens('valid-token', requestMeta)
        .catch(() => {});

      expect(ctx.sessionsService.rotateRefreshToken).not.toHaveBeenCalled();
    });

    it('should revoke idle session and log SESSION_IDLE_REVOKED audit', async () => {
      ctx.sessionsService.findById.mockResolvedValue(mockSession);
      ctx.sessionsService.isSessionIdle.mockReturnValue(true);

      await ctx.authService
        .refreshTokens('valid-token', requestMeta)
        .catch(() => {});

      await new Promise((r) => setTimeout(r, 50));

      expect(ctx.sessionsService.revokeSessionDirect).toHaveBeenCalledWith(
        'session-uuid',
      );

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SESSION_IDLE_REVOKED',
          userId: 'uuid-123',
        }),
      );
    });

    it('should proceed normally when session is not idle', async () => {
      ctx.sessionsService.findById.mockResolvedValue(mockSession);
      ctx.sessionsService.isSessionIdle.mockReturnValue(false);

      await ctx.authService.refreshTokens('valid-token', requestMeta);

      expect(ctx.sessionsService.rotateRefreshToken).toHaveBeenCalled();
    });
  });

  // ─── concurrent session limit ─────────────────────────────────

  describe('concurrent session limit', () => {
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

    it('should call enforceSessionLimit before session creation on login', async () => {
      await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(ctx.sessionsService.enforceSessionLimit).toHaveBeenCalledWith(
        'uuid-123',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
    });

    it('should call enforceSessionLimit on OAuth login', async () => {
      ctx.usersService.findOrCreateByOAuth.mockResolvedValue({
        user: mockUser,
        action: 'login',
      });

      await ctx.authService.validateOAuthUser(
        {
          email: 'test@example.com',
          provider: 'GOOGLE' as any,
          providerId: 'google-id',
        },
        requestMeta,
      );

      expect(ctx.sessionsService.enforceSessionLimit).toHaveBeenCalledWith(
        'uuid-123',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
    });

    it('should call enforceSessionLimit on MFA login', async () => {
      ctx.usersService.findById.mockResolvedValue(mockUser);

      await ctx.authService.generateTokensForMfa('uuid-123', requestMeta);

      expect(ctx.sessionsService.enforceSessionLimit).toHaveBeenCalledWith(
        'uuid-123',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
    });

    it('should propagate enforceSessionLimit errors', async () => {
      ctx.sessionsService.enforceSessionLimit.mockRejectedValueOnce(
        new Error('DB connection failed'),
      );

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'StrongPass1!' },
          requestMeta,
        ),
      ).rejects.toThrow('DB connection failed');
    });

    it('should pass ipAddress and userAgent to enforceSessionLimit', async () => {
      const customMeta = {
        ipAddress: '192.168.1.100',
        userAgent: 'Custom-Agent/1.0',
      };

      await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        customMeta,
      );

      expect(ctx.sessionsService.enforceSessionLimit).toHaveBeenCalledWith(
        'uuid-123',
        { ipAddress: '192.168.1.100', userAgent: 'Custom-Agent/1.0' },
      );
    });
  });

  // ─── fire-and-forget resilience (token-related) ────────────────

  describe('fire-and-forget resilience (token-related)', () => {
    const flushPromises = () =>
      new Promise((resolve) => process.nextTick(resolve));

    it('should still throw on idle session when audit rejects during refreshTokens', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      ctx.jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        tokenFamily: 'family-uuid',
      });
      ctx.sessionsService.findById.mockResolvedValue({
        ...mockSession,
        lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      });
      ctx.sessionsService.isSessionIdle.mockReturnValue(true);

      await expect(
        ctx.authService.refreshTokens('valid-refresh-token', requestMeta),
      ).rejects.toThrow(UnauthorizedException);
      await flushPromises();
    });

    it('should still return tokens for generateTokensForMfa when audit rejects', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      ctx.usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign
        .mockReturnValueOnce('mfa-access')
        .mockReturnValueOnce('mfa-refresh');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.generateTokensForMfa(
        'uuid-123',
        requestMeta,
      );

      expect(result.accessToken).toBe('mfa-access');
      await flushPromises();
    });

    it('refreshTokens should succeed even when mail/audit fails', async () => {
      ctx.jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      ctx.usersService.findById.mockResolvedValue(mockUser);
      ctx.sessionsService.rotateRefreshToken.mockResolvedValue(mockSession);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      ctx.jwtService.sign
        .mockReturnValueOnce('new-at')
        .mockReturnValueOnce('new-rt');
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.refreshTokens(
        'old-refresh',
        requestMeta,
      );

      expect(result.accessToken).toBe('new-at');
    });
  });
});
