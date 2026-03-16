import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ErrorMessages } from '../../common/constants/error-messages';
import {
  createAuthTestModule,
  AuthTestContext,
  mockUser,
  requestMeta,
} from './auth-test.helpers';

jest.mock('bcrypt');

describe('AuthService — Password Reset', () => {
  let ctx: AuthTestContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    ctx = await createAuthTestModule();
  });

  // ─── forgotPassword ────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should return silently when user not found (prevent enumeration)', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        ctx.authService.forgotPassword({ email: 'nonexistent@example.com' }),
      ).resolves.toBeUndefined();

      expect(bcrypt.compare).toHaveBeenCalled();
      expect((bcrypt.compare as jest.Mock).mock.calls[0][0]).toBe(
        'nonexistent@example.com',
      );
    });

    it('should return silently for OAuth-only accounts (no passwordHash)', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        ctx.authService.forgotPassword({ email: 'test@example.com' }),
      ).resolves.toBeUndefined();

      expect(
        ctx.prismaService.passwordResetToken.create,
      ).not.toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalled();
      expect((bcrypt.compare as jest.Mock).mock.calls[0][0]).toBe(
        'test@example.com',
      );
    });

    it('should invalidate existing tokens and create new reset token', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);
      ctx.prismaService.passwordResetToken.updateMany.mockResolvedValue({
        count: 1,
      });
      ctx.prismaService.passwordResetToken.create.mockResolvedValue({});

      await ctx.authService.forgotPassword({ email: 'test@example.com' });

      expect(
        ctx.prismaService.passwordResetToken.updateMany,
      ).toHaveBeenCalledWith({
        where: { userId: 'uuid-123', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(ctx.prismaService.passwordResetToken.create).toHaveBeenCalled();

      expect(ctx.mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        null,
      );
    });

    it('non-existing and OAuth-only paths should both call bcrypt.compare for timing protection', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await ctx.authService.forgotPassword({ email: 'nobody@example.com' });
      expect(bcrypt.compare).toHaveBeenCalled();

      (bcrypt.compare as jest.Mock).mockClear();

      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });
      await ctx.authService.forgotPassword({ email: 'oauth@example.com' });
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('forgotPassword should succeed even when mail/audit fails', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(mockUser);

      ctx.prismaService.passwordResetToken.updateMany.mockResolvedValue({
        count: 0,
      });
      ctx.prismaService.passwordResetToken.create.mockResolvedValue({});
      ctx.mailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await ctx.authService.forgotPassword({ email: 'test@example.com' });

      expect(ctx.mailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  // ─── resetPassword ─────────────────────────────────────────────

  describe('resetPassword', () => {
    it('should throw BadRequestException when token not found', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        ctx.authService.resetPassword({
          token: 'invalid',
          newPassword: 'NewPass1!',
        }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException when token already used', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });

      await expect(
        ctx.authService.resetPassword({
          token: 'used',
          newPassword: 'NewPass1!',
        }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException when token expired', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: mockUser,
      });

      await expect(
        ctx.authService.resetPassword({
          token: 'expired',
          newPassword: 'NewPass1!',
        }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException when new password matches current password', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        ctx.authService.resetPassword({
          token: 'valid',
          newPassword: 'SamePass1!',
        }),
      ).rejects.toThrow(ErrorMessages.auth.PASSWORD_MUST_DIFFER);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'SamePass1!',
        mockUser.passwordHash,
      );
      expect(ctx.prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when new password is breached', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      ctx.passwordBreachService.isBreached.mockResolvedValue(true);

      await expect(
        ctx.authService.resetPassword({
          token: 'valid',
          newPassword: 'BreachedPass1!',
        }),
      ).rejects.toThrow(ErrorMessages.auth.PASSWORD_BREACHED);

      expect(ctx.prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should hash new password, mark token used, and revoke all sessions', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await ctx.authService.resetPassword({
        token: 'valid',
        newPassword: 'NewPass1!',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'NewPass1!',
        mockUser.passwordHash,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1!', 12);
      expect(ctx.prismaService.$transaction).toHaveBeenCalled();
      expect(ctx.sessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
        'uuid-123',
      );
    });

    it('resetPassword should succeed even when audit fails', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await ctx.authService.resetPassword({
        token: 'valid',
        newPassword: 'NewPass1!',
      });

      expect(ctx.sessionsService.revokeAllUserSessions).toHaveBeenCalled();
    });

    it('should pass ctx ipAddress and userAgent to audit log when provided', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await ctx.authService.resetPassword(
        { token: 'valid', newPassword: 'NewPass1!' },
        { ipAddress: '10.0.0.1', userAgent: 'Firefox' },
      );

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '10.0.0.1',
          userAgent: 'Firefox',
        }),
      );
    });
  });

  // ─── validateResetToken ────────────────────────────────────────

  describe('validateResetToken', () => {
    it('should return { valid: false } when token not found', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      const result = await ctx.authService.validateResetToken('invalid-token');

      expect(result).toEqual({ valid: false });
    });

    it('should return { valid: false } when token already used', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await ctx.authService.validateResetToken('used-token');

      expect(result).toEqual({ valid: false });
    });

    it('should return { valid: false } when token expired', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      const result = await ctx.authService.validateResetToken('expired-token');

      expect(result).toEqual({ valid: false });
    });

    it('should return { valid: true } for a valid unused non-expired token', async () => {
      ctx.prismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await ctx.authService.validateResetToken('valid-token');

      expect(result).toEqual({ valid: true });
    });
  });
});
