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
});
