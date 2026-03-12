import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import { User } from '../../users/entities/user.entity';
import { OAuthProfile } from '../../common/interfaces/oauth-profile.interface';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import {
  createAuthTestModule,
  AuthTestContext,
  mockUser,
  mockSession,
  requestMeta,
} from './auth-test.helpers';

jest.mock('bcrypt');

describe('AuthService — OAuth', () => {
  let ctx: AuthTestContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    ctx = await createAuthTestModule();
  });

  // ─── validateOAuthUser ─────────────────────────────────────────

  describe('validateOAuthUser', () => {
    const oauthProfile: OAuthProfile = {
      email: 'oauth@example.com',
      provider: Provider.GOOGLE,
      providerId: 'google-id-123',
    };

    const mockOAuthUser: User = {
      id: 'uuid-oauth',
      email: 'oauth@example.com',
      passwordHash: null,
      firstName: null,
      lastName: null,
      avatarUrl: null,
      role: Role.USER,
      emailVerified: true,
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      lockoutCount: 0,
      mfaEnabled: false,
      mfaSecret: null,
      mfaRecoveryCodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should find or create user and return accessToken, cookie, and SafeUser', async () => {
      ctx.usersService.findOrCreateByOAuth.mockResolvedValue({
        user: mockOAuthUser,
        action: 'login',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign
        .mockReturnValueOnce('oauth-access-token')
        .mockReturnValueOnce('oauth-refresh-token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.validateOAuthUser(
        oauthProfile,
        requestMeta,
      );

      expect(ctx.usersService.findOrCreateByOAuth).toHaveBeenCalledWith(
        oauthProfile,
      );
      expect(result.accessToken).toBe('oauth-access-token');
      expect(result.cookie).toBeDefined();
      expect(result.cookie.name).toBe('refresh_token');
      expect(result.user.email).toBe('oauth@example.com');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should create a session via SessionsService', async () => {
      ctx.usersService.findOrCreateByOAuth.mockResolvedValue({
        user: mockOAuthUser,
        action: 'login',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign.mockReturnValue('token');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      await ctx.authService.validateOAuthUser(oauthProfile, requestMeta);

      expect(ctx.sessionsService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid-oauth',
          ipAddress: '127.0.0.1',
        }),
      );
    });
  });

  // ─── validateOAuthUser (additional) ────────────────────────────

  describe('validateOAuthUser (additional)', () => {
    it('should return AuthResult for an OAuth user', async () => {
      const oauthProfile: OAuthProfile = {
        provider: Provider.GOOGLE,
        providerId: 'google-123',
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const oauthUser = {
        ...mockUser,
        id: 'oauth-uuid',
        email: 'oauth@example.com',
      };

      ctx.usersService.findOrCreateByOAuth.mockResolvedValue({
        user: oauthUser,
        action: 'login',
      });
      ctx.jwtService.sign
        .mockReturnValueOnce('oauth-at')
        .mockReturnValueOnce('oauth-rt');
      ctx.sessionsService.createSession.mockResolvedValue({
        ...mockSession,
        userId: 'oauth-uuid',
      });
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await ctx.authService.validateOAuthUser(
        oauthProfile,
        requestMeta,
      );

      expect(result.accessToken).toBe('oauth-at');
      expect(result.user.email).toBe('oauth@example.com');
      expect(result.cookie.name).toBe('refresh_token');
    });

    it.each([
      { actionValue: 'login', expected: AuditAction.OAUTH_LOGIN },
      { actionValue: 'linked', expected: AuditAction.OAUTH_LINKED },
      { actionValue: 'created', expected: AuditAction.OAUTH_REGISTER },
    ])(
      'should log $expected when action is $actionValue',
      async ({ actionValue, expected }) => {
        const oauthUser = { ...mockUser, id: 'oauth-uuid' };
        ctx.usersService.findOrCreateByOAuth.mockResolvedValue({
          user: oauthUser,
          action: actionValue,
        });
        ctx.jwtService.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');
        ctx.sessionsService.createSession.mockResolvedValue(mockSession);
        ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        ctx.auditService.log.mockResolvedValue(undefined);

        await ctx.authService.validateOAuthUser(
          {
            email: 'o@e.com',
            provider: Provider.GOOGLE,
            providerId: 'g1',
          },
          requestMeta,
          requestMeta,
        );
        await new Promise((resolve) => process.nextTick(resolve));

        expect(ctx.auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({ action: expected }),
        );
      },
    );
  });

  // ─── generateOAuthCode ─────────────────────────────────────────

  describe('generateOAuthCode', () => {
    it('should delegate to OAuthCodeStore.store and return the ephemeral code', async () => {
      const mockCookie = {
        name: 'refresh_token',
        value: 'signed-jwt',
        options: {
          httpOnly: true,
          secure: false,
          sameSite: 'strict' as const,
          path: '/',
          maxAge: 604800,
        },
      };
      const payload = {
        accessToken: 'at',
        user: {
          id: 'uuid-123',
          email: 'test@example.com',
          firstName: null,
          lastName: null,
          avatarUrl: null,
          role: Role.USER,
          emailVerified: true,
          isActive: true,
          failedAttempts: 0,
          lockedUntil: null,
          lockoutCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        cookie: mockCookie,
      };
      ctx.oauthCodeStore.store.mockResolvedValue('ephemeral-uuid');

      const code = await ctx.authService.generateOAuthCode(payload);

      expect(ctx.oauthCodeStore.store).toHaveBeenCalledWith(payload);
      expect(code).toBe('ephemeral-uuid');
    });
  });

  // ─── exchangeOAuthCode ─────────────────────────────────────────

  describe('exchangeOAuthCode', () => {
    const mockCookie = {
      name: 'refresh_token',
      value: 'signed-jwt',
      options: {
        httpOnly: true,
        secure: false,
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 604800,
      },
    };

    const mockPayload = {
      accessToken: 'at',
      user: {
        id: 'uuid-123',
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        avatarUrl: null,
        role: Role.USER,
        emailVerified: true,
        isActive: true,
        failedAttempts: 0,
        lockedUntil: null,
        lockoutCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      cookie: mockCookie,
    };

    it('should return accessToken, user, and cookie for a valid code', async () => {
      ctx.oauthCodeStore.exchange.mockResolvedValue(mockPayload);

      const result = await ctx.authService.exchangeOAuthCode('valid-code');

      expect(ctx.oauthCodeStore.exchange).toHaveBeenCalledWith('valid-code');
      expect(result.accessToken).toBe('at');
      expect(result.cookie).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid or expired code', async () => {
      ctx.oauthCodeStore.exchange.mockResolvedValue(null);

      await expect(
        ctx.authService.exchangeOAuthCode('invalid-code'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── fire-and-forget resilience (OAuth) ────────────────────────

  describe('fire-and-forget resilience (OAuth)', () => {
    const flushPromises = () =>
      new Promise((resolve) => process.nextTick(resolve));

    it('should still return tokens for OAuth login when audit rejects', async () => {
      ctx.auditService.log.mockRejectedValue(new Error('Audit DB down'));
      const oauthUser = {
        ...mockUser,
        id: 'uuid-oauth',
      };
      ctx.usersService.findOrCreateByOAuth.mockResolvedValue({
        user: oauthUser,
        action: 'login',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      ctx.jwtService.sign
        .mockReturnValueOnce('oauth-access')
        .mockReturnValueOnce('oauth-refresh');
      ctx.sessionsService.createSession.mockResolvedValue(mockSession);
      ctx.sessionsService.updateSessionHash.mockResolvedValue(undefined);

      const result = await ctx.authService.validateOAuthUser(
        {
          email: 'oauth@example.com',
          provider: Provider.GOOGLE,
          providerId: 'gid',
        },
        requestMeta,
      );

      expect(result.accessToken).toBe('oauth-access');
      await flushPromises();
    });
  });
});
