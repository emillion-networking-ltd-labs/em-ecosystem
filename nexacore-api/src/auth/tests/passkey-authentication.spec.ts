import { UnauthorizedException } from '@nestjs/common';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import {
  createPasskeyTestSetup,
  PasskeyTestContext,
  mockPasskeyUser,
  mockPasskeyMeta,
} from './auth-test.helpers';

// Mock @simplewebauthn/server
const mockGenerateAuthenticationOptions = jest.fn();
const mockVerifyAuthenticationResponse = jest.fn();

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: (...args: unknown[]) =>
    mockGenerateAuthenticationOptions(...args),
  verifyAuthenticationResponse: (...args: unknown[]) =>
    mockVerifyAuthenticationResponse(...args),
}));

describe('PasskeyService — Authentication', () => {
  let ctx: PasskeyTestContext;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createPasskeyTestSetup();
  });

  // ─── generateAuthOptions ────────────────────────────────────

  describe('generateAuthOptions', () => {
    const mockAuthOptions = {
      challenge: 'auth-challenge-base64url',
      rpId: 'localhost',
    };

    it('should return challengeId and options', async () => {
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      const result = await ctx.service.generateAuthOptions();

      expect(result.challengeId).toBeDefined();
      expect(result.options).toEqual(mockAuthOptions);
      expect(ctx.redis.set).toHaveBeenCalled();
    });

    it('should include allowCredentials when email has passkeys', async () => {
      (ctx.usersService.findByEmail as jest.Mock).mockResolvedValue(
        mockPasskeyUser(),
      );
      ctx.prisma.webAuthnCredential.findMany.mockResolvedValue([
        { credentialId: 'cred-1', transports: ['usb'] },
      ]);
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      await ctx.service.generateAuthOptions('test@example.com');

      expect(mockGenerateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: [{ id: 'cred-1', transports: ['usb'] }],
        }),
      );
    });

    it('should return discoverable options when no email provided', async () => {
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      await ctx.service.generateAuthOptions();

      expect(mockGenerateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: undefined,
        }),
      );
      expect(ctx.usersService.findByEmail).not.toHaveBeenCalled();
    });

    it('should not reveal if email has no passkeys (anti-enumeration)', async () => {
      (ctx.usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      const result = await ctx.service.generateAuthOptions(
        'unknown@example.com',
      );

      expect(result.challengeId).toBeDefined();
      expect(result.options).toEqual(mockAuthOptions);
    });

    it('should return discoverable options when user exists but has no passkeys', async () => {
      (ctx.usersService.findByEmail as jest.Mock).mockResolvedValue(
        mockPasskeyUser(),
      );
      ctx.prisma.webAuthnCredential.findMany.mockResolvedValue([]);
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      const result = await ctx.service.generateAuthOptions('test@example.com');

      expect(result.challengeId).toBeDefined();
      expect(mockGenerateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: undefined,
        }),
      );
    });
  });

  // ─── verifyAuthentication ───────────────────────────────────

  describe('verifyAuthentication', () => {
    const mockAuthCredential = {
      id: 'cred-id',
      response: {},
      type: 'public-key',
    };
    const storedAuthOptions = JSON.stringify({
      challenge: 'auth-challenge-123',
    });
    const storedDbCredential = {
      id: 'db-cred-1',
      userId: 'user-1',
      credentialId: 'cred-id',
      publicKey: Buffer.from([1, 2, 3]),
      signCount: 5,
      transports: ['internal'],
      user: mockPasskeyUser(),
    };

    it('should return userId on successful authentication', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      });
      ctx.prisma.webAuthnCredential.update.mockResolvedValue({});

      const userId = await ctx.service.verifyAuthentication(
        'challenge-id',
        mockAuthCredential,
        mockPasskeyMeta,
      );

      expect(userId).toBe('user-1');
      expect(ctx.prisma.webAuthnCredential.update).toHaveBeenCalledWith({
        where: { id: 'db-cred-1' },
        data: { signCount: 6, lastUsedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException if challenge expired', async () => {
      ctx.redis.get.mockResolvedValue(null);

      await expect(
        ctx.service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if credential not found', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(null);

      await expect(
        ctx.service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should audit PASSKEY_AUTH_FAILURE when credential not found', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(null);

      await expect(
        ctx.service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow();

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          metadata: { reason: 'credential_not_found' },
        }),
      );
    });

    it('should throw UnauthorizedException if account deactivated', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        user: mockPasskeyUser({ isActive: false }),
      });

      await expect(
        ctx.service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should audit PASSKEY_AUTH_FAILURE when account deactivated', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        user: mockPasskeyUser({ isActive: false }),
      });

      await expect(
        ctx.service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow();

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          metadata: { reason: 'account_deactivated' },
        }),
      );
    });

    it('should throw UnauthorizedException if verification throws', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockRejectedValue(new Error('fail'));

      await expect(
        ctx.service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if verified is false', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: false,
        authenticationInfo: { newCounter: 6 },
      });

      await expect(
        ctx.service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle deactivated account without ctx', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        user: mockPasskeyUser({ isActive: false }),
      });

      await expect(
        ctx.service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle verification failure without ctx', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockRejectedValue(new Error('fail'));

      await expect(
        ctx.service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle verified=false without ctx', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: false,
        authenticationInfo: { newCounter: 6 },
      });

      await expect(
        ctx.service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle sign count replay without ctx', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        signCount: 10,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 5 },
      });

      await expect(
        ctx.service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject sign count replay (cloned credential)', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        signCount: 10,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 5 },
      });

      await expect(
        ctx.service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow zero counters (authenticators that do not track)', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        signCount: 0,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 0 },
      });
      ctx.prisma.webAuthnCredential.update.mockResolvedValue({});

      const userId = await ctx.service.verifyAuthentication(
        'challenge-id',
        mockAuthCredential,
        mockPasskeyMeta,
      );

      expect(userId).toBe('user-1');
    });

    it('should audit PASSKEY_AUTH_SUCCESS on success', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      });
      ctx.prisma.webAuthnCredential.update.mockResolvedValue({});

      await ctx.service.verifyAuthentication(
        'challenge-id',
        mockAuthCredential,
        mockPasskeyMeta,
      );

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_AUTH_SUCCESS,
          userId: 'user-1',
          metadata: { passkeyId: 'db-cred-1' },
        }),
      );
    });

    it('should audit sign count replay failure', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        signCount: 10,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 5 },
      });

      await expect(
        ctx.service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow();

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          metadata: expect.objectContaining({ reason: 'sign_count_replay' }),
        }),
      );
    });

    it('should use null for audit fields when ctx is undefined', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      });
      ctx.prisma.webAuthnCredential.update.mockResolvedValue({});

      await ctx.service.verifyAuthentication(
        'challenge-id',
        mockAuthCredential,
      );

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        }),
      );
    });

    it('should audit credential not found with null ctx fields', async () => {
      ctx.redis.get.mockResolvedValue(storedAuthOptions);
      ctx.prisma.webAuthnCredential.findUnique.mockResolvedValue(null);

      await expect(
        ctx.service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow();

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        }),
      );
    });
  });
});
