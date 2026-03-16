import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import {
  createAuthTestModule,
  AuthTestContext,
  mockUser,
  requestMeta,
} from './auth-test.helpers';

jest.mock('bcrypt');

describe('AuthService — Email Verification', () => {
  let ctx: AuthTestContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    ctx = await createAuthTestModule();
  });

  // ─── verifyEmail ───────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('should return invalid when token not found', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue(
        null,
      );

      const result = await ctx.authService.verifyEmail('invalid-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return success when token already used but user is verified', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, emailVerified: true },
      });

      const result = await ctx.authService.verifyEmail('used-token');

      expect(result).toEqual({ status: 'success' });
    });

    it('should return invalid when token already used and user not verified', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, emailVerified: false },
      });

      const result = await ctx.authService.verifyEmail('used-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when token is expired', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: mockUser,
      });

      const result = await ctx.authService.verifyEmail('expired-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should mark token as used and verify user on valid token', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });
      ctx.prismaService.$transaction.mockResolvedValue(undefined);

      const result = await ctx.authService.verifyEmail('valid-token');

      expect(result).toEqual({ status: 'success' });
      expect(ctx.prismaService.$transaction).toHaveBeenCalled();
    });

    it('should return invalid when token type is EMAIL_CHANGE', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });

      const result = await ctx.authService.verifyEmail('email-change-token');

      expect(result).toEqual({ status: 'invalid' });
      expect(ctx.prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  // ─── verifyEmailChange ─────────────────────────────────────────

  describe('verifyEmailChange', () => {
    it('should return invalid when token not found', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue(
        null,
      );

      const result = await ctx.authService.verifyEmailChange('invalid-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when token type is REGISTRATION', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'REGISTRATION',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });

      const result =
        await ctx.authService.verifyEmailChange('registration-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when token already used', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, pendingEmail: 'new@example.com' },
      });

      const result = await ctx.authService.verifyEmailChange('used-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when token expired', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: { ...mockUser, pendingEmail: 'new@example.com' },
      });

      const result = await ctx.authService.verifyEmailChange('expired-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when user has no pendingEmail', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, pendingEmail: null },
      });

      const result = await ctx.authService.verifyEmailChange('valid-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should return invalid when pending email is already taken', async () => {
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { ...mockUser, pendingEmail: 'new@example.com' },
      });
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        id: 'other-user-id',
        email: 'new@example.com',
      } as User);

      const result = await ctx.authService.verifyEmailChange('valid-token');

      expect(result).toEqual({ status: 'invalid' });
    });

    it('should atomically swap email and mark token used on success', async () => {
      const userWithPending = { ...mockUser, pendingEmail: 'new@example.com' };
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      const result = await ctx.authService.verifyEmailChange('valid-token');

      expect(result).toEqual({ status: 'success' });
      expect(ctx.prismaService.$transaction).toHaveBeenCalled();
    });

    it('should include oAuthAccount.deleteMany in transaction when user has OAuth accounts', async () => {
      const oauthUserWithPending = {
        ...mockUser,
        pendingEmail: 'new@example.com',
      };
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: oauthUserWithPending,
      });
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.prismaService.oAuthAccount.count.mockResolvedValue(1);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      const result = await ctx.authService.verifyEmailChange('valid-token');

      expect(result).toEqual({ status: 'success' });
      expect(ctx.prismaService.oAuthAccount.count).toHaveBeenCalledWith({
        where: { userId: 'uuid-123' },
      });
      const transactionArg = ctx.prismaService.$transaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(3);
      expect(ctx.prismaService.oAuthAccount.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'uuid-123' },
      });
    });

    it('should NOT include oAuthAccount.deleteMany when user has no OAuth accounts', async () => {
      const userWithPending = { ...mockUser, pendingEmail: 'new@example.com' };
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.prismaService.oAuthAccount.count.mockResolvedValue(0);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await ctx.authService.verifyEmailChange('valid-token');

      expect(ctx.prismaService.oAuthAccount.count).toHaveBeenCalledWith({
        where: { userId: 'uuid-123' },
      });
      expect(ctx.prismaService.oAuthAccount.deleteMany).not.toHaveBeenCalled();
    });

    it('should revoke all sessions on successful email change', async () => {
      const userWithPending = { ...mockUser, pendingEmail: 'new@example.com' };
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await ctx.authService.verifyEmailChange('valid-token');

      expect(ctx.sessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
        'uuid-123',
      );
    });

    it('should send confirmation to old email on success', async () => {
      const userWithPending = { ...mockUser, pendingEmail: 'new@example.com' };
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await ctx.authService.verifyEmailChange('valid-token');

      expect(ctx.mailService.sendEmailChangedConfirmation).toHaveBeenCalledWith(
        mockUser.email,
        'new@example.com',
        mockUser.firstName,
      );
    });

    it('should fire EMAIL_CHANGED audit log on success', async () => {
      const userWithPending = { ...mockUser, pendingEmail: 'new@example.com' };
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await ctx.authService.verifyEmailChange('valid-token');

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EMAIL_CHANGED',
          userId: 'uuid-123',
        }),
      );
    });

    it('should pass ctx ipAddress and userAgent to audit log when provided', async () => {
      const userWithPending = {
        ...mockUser,
        pendingEmail: 'new@example.com',
      };
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      await ctx.authService.verifyEmailChange('valid-token', {
        ipAddress: '10.0.0.1',
        userAgent: 'Firefox',
      });

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '10.0.0.1',
          userAgent: 'Firefox',
        }),
      );
    });
  });

  // ─── resendVerificationEmail ───────────────────────────────────

  describe('resendVerificationEmail', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      ctx.usersService.findById.mockResolvedValue(null);

      await expect(
        ctx.authService.resendVerificationEmail('nonexistent'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when email already verified', async () => {
      ctx.usersService.findById.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      await expect(
        ctx.authService.resendVerificationEmail('uuid-123'),
      ).rejects.toThrow('Email already verified');
    });

    it('should throw BadRequestException when cooldown not expired', async () => {
      ctx.usersService.findById.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      ctx.prismaService.emailVerificationToken.findFirst.mockResolvedValue({
        createdAt: new Date(),
      });

      await expect(
        ctx.authService.resendVerificationEmail('uuid-123'),
      ).rejects.toThrow('Please wait before requesting another email');
    });

    it('should send verification email when cooldown expired', async () => {
      ctx.usersService.findById.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      ctx.prismaService.emailVerificationToken.findFirst.mockResolvedValue({
        createdAt: new Date(Date.now() - 120000),
      });
      ctx.prismaService.emailVerificationToken.create.mockResolvedValue({});

      await ctx.authService.resendVerificationEmail('uuid-123');

      expect(ctx.mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should send verification email when no previous token exists', async () => {
      ctx.usersService.findById.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      ctx.prismaService.emailVerificationToken.findFirst.mockResolvedValue(
        null,
      );
      ctx.prismaService.emailVerificationToken.create.mockResolvedValue({});

      await ctx.authService.resendVerificationEmail('uuid-123');

      expect(ctx.mailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  // ─── resendVerificationByEmail ─────────────────────────────────

  describe('resendVerificationByEmail', () => {
    it('should return silently when user not found (anti-enumeration)', async () => {
      ctx.usersService.findByEmail.mockResolvedValue(null);

      await expect(
        ctx.authService.resendVerificationByEmail('nonexistent@example.com'),
      ).resolves.toBeUndefined();

      expect(
        ctx.prismaService.emailVerificationToken.create,
      ).not.toHaveBeenCalled();
    });

    it('should return silently when email already verified', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      await expect(
        ctx.authService.resendVerificationByEmail('test@example.com'),
      ).resolves.toBeUndefined();

      expect(
        ctx.prismaService.emailVerificationToken.create,
      ).not.toHaveBeenCalled();
    });

    it('should return silently when cooldown not expired', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      ctx.prismaService.emailVerificationToken.findFirst.mockResolvedValue({
        createdAt: new Date(),
      });

      await expect(
        ctx.authService.resendVerificationByEmail('test@example.com'),
      ).resolves.toBeUndefined();

      expect(
        ctx.prismaService.emailVerificationToken.create,
      ).not.toHaveBeenCalled();
    });

    it('should send verification email when cooldown expired', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      ctx.prismaService.emailVerificationToken.findFirst.mockResolvedValue({
        createdAt: new Date(Date.now() - 120000),
      });
      ctx.prismaService.emailVerificationToken.create.mockResolvedValue({});

      await ctx.authService.resendVerificationByEmail('test@example.com');

      expect(ctx.mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should send verification email when no previous token exists', async () => {
      ctx.usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      ctx.prismaService.emailVerificationToken.findFirst.mockResolvedValue(
        null,
      );
      ctx.prismaService.emailVerificationToken.create.mockResolvedValue({});

      await ctx.authService.resendVerificationByEmail('test@example.com');

      expect(ctx.mailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  // ─── fire-and-forget resilience (email) ────────────────────────

  describe('fire-and-forget resilience (email)', () => {
    const flushPromises = () =>
      new Promise((resolve) => process.nextTick(resolve));

    it('should still succeed verifyEmailChange when mail and audit reject', async () => {
      ctx.mailService.sendEmailChangedConfirmation.mockRejectedValue(
        new Error('SMTP down'),
      );
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      const userWithPending = {
        ...mockUser,
        pendingEmail: 'new@example.com',
      };
      ctx.prismaService.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'vt-1',
        tokenHash: 'hash',
        userId: 'uuid-123',
        type: 'EMAIL_CHANGE',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: userWithPending,
      });
      ctx.usersService.findByEmail.mockResolvedValue(null);
      ctx.prismaService.$transaction.mockResolvedValue(undefined);
      ctx.sessionsService.revokeAllUserSessions.mockResolvedValue(undefined);

      const result = await ctx.authService.verifyEmailChange('valid-token');

      expect(result).toEqual({ status: 'success' });
      await flushPromises();
    });
  });
});
