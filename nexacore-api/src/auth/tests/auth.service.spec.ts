jest.mock('../constants/auth.constants', () => ({
  ...jest.requireActual('../constants/auth.constants'),
  MIN_LOGIN_DURATION_MS: 0,
}));

import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  createAuthTestModule,
  AuthTestContext,
  mockUser,
  mockSession,
  requestMeta,
} from './auth-test.helpers';
import { parseDurationMs } from '../utils/parse-duration';

jest.mock('bcrypt');

describe('parseDurationMs', () => {
  it('should parse seconds (30s)', () => {
    expect(parseDurationMs('30s')).toBe(30000);
  });

  it('should parse minutes (15m)', () => {
    expect(parseDurationMs('15m')).toBe(900000);
  });

  it('should parse hours (2h)', () => {
    expect(parseDurationMs('2h')).toBe(7200000);
  });

  it('should parse days (7d)', () => {
    expect(parseDurationMs('7d')).toBe(604800000);
  });

  it('should fallback to 7 days for invalid format', () => {
    expect(parseDurationMs('invalid')).toBe(604800000);
  });
});

describe('AuthService', () => {
  let ctx: AuthTestContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    ctx = await createAuthTestModule();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'StrongPass1!',
    };

    describe('successful registration (new email)', () => {
      beforeEach(() => {
        ctx.usersService.findByEmail.mockResolvedValue(null);
        ctx.usersService.create.mockResolvedValue(mockUser);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
      });

      it('should return generic message without user object', async () => {
        const result = await ctx.authService.register(registerDto, requestMeta);

        expect(result.message).toBe('Please check your email to continue');
        expect(result).not.toHaveProperty('user');
        expect(result).not.toHaveProperty('accessToken');
        expect(result).not.toHaveProperty('cookie');
      });

      it('should hash the password with bcrypt using 12 rounds', async () => {
        await ctx.authService.register(registerDto, requestMeta);

        expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass1!', 12);
      });

      it('should NOT create a session on register', async () => {
        await ctx.authService.register(registerDto, requestMeta);

        expect(ctx.sessionsService.createSession).not.toHaveBeenCalled();
      });

      it('should NOT call generateTokens on register', async () => {
        await ctx.authService.register(registerDto, requestMeta);

        expect(ctx.jwtService.sign).not.toHaveBeenCalled();
      });
    });

    describe('existing email — anti-enumeration', () => {
      beforeEach(() => {
        ctx.usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      });

      it('should return same response shape as new email registration', async () => {
        const result = await ctx.authService.register(registerDto, requestMeta);

        expect(result.message).toBe('Please check your email to continue');
        expect(result).not.toHaveProperty('user');
        expect(Object.keys(result)).toEqual(['message']);
      });

      it('should call bcrypt.compare for timing protection when email exists', async () => {
        await ctx.authService.register(registerDto, requestMeta);

        expect(bcrypt.compare).toHaveBeenCalledTimes(1);
        expect((bcrypt.compare as jest.Mock).mock.calls[0][0]).toBe(
          registerDto.password,
        );
      });

      it('should NOT create a new user', async () => {
        await ctx.authService.register(registerDto, requestMeta);

        expect(ctx.usersService.create).not.toHaveBeenCalled();
      });

      it('should send registration attempt notification to existing user', async () => {
        await ctx.authService.register(registerDto, requestMeta);

        expect(
          ctx.mailService.sendRegistrationAttemptNotification,
        ).toHaveBeenCalledWith(mockUser.email, mockUser.firstName);
      });
    });

    describe('error cases', () => {
      it('should throw BadRequestException when password is breached', async () => {
        ctx.usersService.findByEmail.mockResolvedValue(null);
        ctx.passwordBreachService.isBreached.mockResolvedValue(true);

        await expect(
          ctx.authService.register(registerDto, requestMeta),
        ).rejects.toThrow(BadRequestException);

        expect(ctx.usersService.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'StrongPass1!' };

    describe('successful login', () => {
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

      it('should return accessToken, cookie, and SafeUser on valid credentials', async () => {
        const result = await ctx.authService.login(loginDto, requestMeta);

        expect(result.accessToken).toBe('access-token');
        expect(result.cookie).toBeDefined();
        expect(result.cookie.name).toBe('refresh_token');
        expect(result.user.email).toBe('test@example.com');
        expect(result.user).not.toHaveProperty('passwordHash');
      });

      it('should reset failed attempts on successful login when count > 0', async () => {
        ctx.usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          failedAttempts: 3,
        });

        await ctx.authService.login(loginDto, requestMeta);

        expect(ctx.usersService.resetLockoutEscalation).toHaveBeenCalledWith(
          'uuid-123',
        );
      });

      it('should not reset failed attempts when count is 0', async () => {
        await ctx.authService.login(loginDto, requestMeta);

        expect(ctx.usersService.resetLockoutEscalation).not.toHaveBeenCalled();
      });
    });

    describe('error cases', () => {
      it('should throw UnauthorizedException when user not found (with timing protection)', async () => {
        ctx.usersService.findByEmail.mockResolvedValue(null);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(
          ctx.authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
        expect(bcrypt.compare).toHaveBeenCalled();
      });

      it('should throw UnauthorizedException when account is locked (anti-enumeration)', async () => {
        ctx.usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          lockedUntil: new Date(Date.now() + 60000),
        });

        await expect(
          ctx.authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when user with password has unverified email (anti-enumeration)', async () => {
        ctx.usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          emailVerified: false,
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await expect(
          ctx.authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should reset lockout when lock has expired', async () => {
        ctx.usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          lockedUntil: new Date(Date.now() - 1000),
        });
        ctx.usersService.resetFailedAttempts.mockResolvedValue(undefined);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        ctx.jwtService.sign.mockReturnValue('token');
        ctx.sessionsService.createSession.mockResolvedValue(mockSession);
        ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

        await ctx.authService.login(loginDto, requestMeta);

        expect(ctx.usersService.resetFailedAttempts).toHaveBeenCalledWith(
          'uuid-123',
        );
      });

      it('should throw UnauthorizedException when user has no passwordHash (OAuth-only) without incrementing failedAttempts', async () => {
        ctx.usersService.findByEmail.mockResolvedValue({
          ...mockUser,
          passwordHash: null,
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(
          ctx.authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
        expect(bcrypt.compare).toHaveBeenCalled();
        expect(ctx.usersService.incrementFailedAttempts).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException on wrong password', async () => {
        ctx.usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        ctx.usersService.incrementFailedAttempts.mockResolvedValue({
          ...mockUser,
          failedAttempts: 1,
        });

        await expect(
          ctx.authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should increment failed attempts on wrong password', async () => {
        ctx.usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        ctx.usersService.incrementFailedAttempts.mockResolvedValue({
          ...mockUser,
          failedAttempts: 1,
        });

        await expect(
          ctx.authService.login(loginDto, requestMeta),
        ).rejects.toThrow();

        expect(ctx.usersService.incrementFailedAttempts).toHaveBeenCalledWith(
          'uuid-123',
        );
      });

      it('should lock account after 6 failed attempts and throw UnauthorizedException (anti-enumeration)', async () => {
        ctx.usersService.findByEmail.mockResolvedValue(mockUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        ctx.usersService.incrementFailedAttempts.mockResolvedValue({
          ...mockUser,
          failedAttempts: 6,
        });
        ctx.usersService.lockAccount.mockResolvedValue(undefined);

        await expect(
          ctx.authService.login(loginDto, requestMeta),
        ).rejects.toThrow(UnauthorizedException);
        expect(ctx.usersService.lockAccount).toHaveBeenCalledWith(
          'uuid-123',
          0,
        );
      });
    });
  });

  describe('logout', () => {
    it('should revoke session and return clear cookie', async () => {
      ctx.jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'session-uuid',
        family: 'family-uuid',
      });
      ctx.sessionsService.revokeSession.mockResolvedValue(undefined);

      const result = await ctx.authService.logout('valid-refresh-token');

      expect(result.name).toBe('refresh_token');
      expect(result.value).toBe('');
      expect(result.options.maxAge).toBe(0);
    });

    it('should return clear cookie even when token is invalid', async () => {
      ctx.jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      const result = await ctx.authService.logout('invalid-token');

      expect(result.name).toBe('refresh_token');
      expect(result.value).toBe('');
      expect(result.options.maxAge).toBe(0);
    });
  });

  describe('logoutAll', () => {
    it('should revoke all sessions and return clear cookie', async () => {
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      const result = await ctx.authService.logoutAll('uuid-123');

      expect(ctx.sessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
        'uuid-123',
      );
      expect(result.name).toBe('refresh_token');
      expect(result.value).toBe('');
      expect(result.options.maxAge).toBe(0);
    });
  });

  // ─── fire-and-forget resilience (core flows) ──────────────────

  describe('fire-and-forget resilience', () => {
    beforeEach(() => {
      ctx.auditService.log.mockRejectedValue(new Error('audit write failed'));
    });

    it('register should succeed even when audit fails', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.usersService.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await ctx.authService.register(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result.message).toBe('Please check your email to continue');
      expect(result).not.toHaveProperty('user');
    });

    it('login success should succeed even when audit fails', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      ctx.jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result).toHaveProperty('accessToken');
    });

    it('login user-not-found should throw even when audit fails', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        ctx.authService.login(
          { email: 'x@x.com', password: 'pass' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('login invalid-password should throw even when audit fails', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      ctx.usersService.incrementFailedAttempts.mockResolvedValue({
        ...mockUser,
        failedAttempts: 1,
      });

      await expect(
        ctx.authService.login(
          { email: 'test@example.com', password: 'wrong' },
          requestMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('login MFA challenge should return even when audit fails', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      ctx.jwtService.sign.mockReturnValue('mfa-token');

      const result = await ctx.authService.login(
        { email: 'test@example.com', password: 'StrongPass1!' },
        requestMeta,
      );

      expect(result).toHaveProperty('status', 'mfa_required');
    });

    it('logout should return clear cookie even when audit fails', async () => {
      ctx.jwtService.verify.mockReturnValue({
        sub: 'uuid-123',
        sessionId: 'sess-1',
        family: 'fam-1',
      });
      ctx.sessionsService.revokeSession.mockResolvedValue(undefined);

      const result = await ctx.authService.logout('valid-refresh');

      expect(result.value).toBe('');
      expect(result.options.maxAge).toBe(0);
    });

    it('logoutAll should return clear cookie even when audit fails', async () => {
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      const result = await ctx.authService.logoutAll('uuid-123');

      expect(result.value).toBe('');
    });
  });
});
