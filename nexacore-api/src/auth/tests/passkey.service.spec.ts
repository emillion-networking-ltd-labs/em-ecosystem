import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import {
  MAX_PASSKEYS_PER_USER,
  DEFAULT_PASSKEY_NAME,
} from '../constants/passkey.constants';
import {
  createPasskeyTestSetup,
  PasskeyTestContext,
  mockPasskeyUser,
  mockPasskeyMeta,
} from './auth-test.helpers';

// Mock @simplewebauthn/server
const mockGenerateRegistrationOptions = jest.fn();
const mockVerifyRegistrationResponse = jest.fn();

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: (...args: unknown[]) =>
    mockGenerateRegistrationOptions(...args),
  verifyRegistrationResponse: (...args: unknown[]) =>
    mockVerifyRegistrationResponse(...args),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

describe('PasskeyService — Registration', () => {
  let ctx: PasskeyTestContext;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createPasskeyTestSetup();
  });

  // ─── generateRegOptions ─────────────────────────────────────

  describe('generateRegOptions', () => {
    const mockOptions = {
      challenge: 'random-challenge-base64url',
      rp: { name: 'EM NexaCore', id: 'localhost' },
      user: {
        id: 'user-1',
        name: 'test@example.com',
        displayName: 'test@example.com',
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    };

    it('should return registration options and store in Redis', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser(),
      );
      ctx.prisma.webAuthnCredential.count.mockResolvedValue(0);
      ctx.prisma.webAuthnCredential.findMany.mockResolvedValue([]);
      mockGenerateRegistrationOptions.mockResolvedValue(mockOptions);

      const result = await ctx.service.generateRegOptions('user-1');

      expect(result).toEqual(mockOptions);
      expect(ctx.redis.set).toHaveBeenCalledWith(
        'webauthn:reg:user-1',
        JSON.stringify(mockOptions),
        'EX',
        300,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(ctx.service.generateRegOptions('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if max passkeys reached', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser(),
      );
      ctx.prisma.webAuthnCredential.count.mockResolvedValue(
        MAX_PASSKEYS_PER_USER,
      );

      await expect(ctx.service.generateRegOptions('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include excludeCredentials from existing passkeys', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser(),
      );
      ctx.prisma.webAuthnCredential.count.mockResolvedValue(2);
      ctx.prisma.webAuthnCredential.findMany.mockResolvedValue([
        { credentialId: 'cred-1', transports: ['usb'] },
        { credentialId: 'cred-2', transports: ['internal'] },
      ]);
      mockGenerateRegistrationOptions.mockResolvedValue(mockOptions);

      await ctx.service.generateRegOptions('user-1');

      expect(mockGenerateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: [
            { id: 'cred-1', transports: ['usb'] },
            { id: 'cred-2', transports: ['internal'] },
          ],
        }),
      );
    });

    it('should use correct RP parameters', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser(),
      );
      ctx.prisma.webAuthnCredential.count.mockResolvedValue(0);
      ctx.prisma.webAuthnCredential.findMany.mockResolvedValue([]);
      mockGenerateRegistrationOptions.mockResolvedValue(mockOptions);

      await ctx.service.generateRegOptions('user-1');

      expect(mockGenerateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpName: 'EM NexaCore',
          rpID: 'localhost',
          userName: 'test@example.com',
          attestationType: 'none',
        }),
      );
    });
  });

  // ─── verifyRegistration ─────────────────────────────────────

  describe('verifyRegistration', () => {
    const mockCredential = {
      id: 'cred-id',
      response: {},
      type: 'public-key',
    };
    const storedOptions = JSON.stringify({ challenge: 'challenge-123' });
    const mockVerificationResult = {
      verified: true,
      registrationInfo: {
        credential: {
          id: 'cred-id-base64url',
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
          transports: ['internal'],
        },
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
      },
    };

    it('should store credential on successful verification', async () => {
      ctx.redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      ctx.prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: 'My Key',
      });

      const result = await ctx.service.verifyRegistration(
        'user-1',
        mockCredential,
        'My Key',
        mockPasskeyMeta,
      );

      expect(result).toEqual({ id: 'record-1', name: 'My Key' });
      expect(ctx.prisma.webAuthnCredential.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          credentialId: 'cred-id-base64url',
          publicKey: expect.any(Buffer),
          signCount: 0,
          transports: ['internal'],
          backedUp: true,
          deviceType: 'multiDevice',
          name: 'My Key',
        }),
      });
    });

    it('should use default name when none provided', async () => {
      ctx.redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      ctx.prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: DEFAULT_PASSKEY_NAME,
      });

      const result = await ctx.service.verifyRegistration(
        'user-1',
        mockCredential,
        undefined,
        mockPasskeyMeta,
      );

      expect(result.name).toBe(DEFAULT_PASSKEY_NAME);
      expect(ctx.prisma.webAuthnCredential.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: DEFAULT_PASSKEY_NAME }),
      });
    });

    it('should throw BadRequestException if challenge not found', async () => {
      ctx.redis.get.mockResolvedValue(null);

      await expect(
        ctx.service.verifyRegistration(
          'user-1',
          mockCredential,
          undefined,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if verification fails (throws)', async () => {
      ctx.redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockRejectedValue(new Error('bad'));

      await expect(
        ctx.service.verifyRegistration(
          'user-1',
          mockCredential,
          undefined,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if verification returns not verified', async () => {
      ctx.redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: false,
        registrationInfo: null,
      });

      await expect(
        ctx.service.verifyRegistration(
          'user-1',
          mockCredential,
          undefined,
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should audit PASSKEY_REGISTERED on success', async () => {
      ctx.redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      ctx.prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: 'My Key',
      });

      await ctx.service.verifyRegistration(
        'user-1',
        mockCredential,
        'My Key',
        mockPasskeyMeta,
      );

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_REGISTERED,
          userId: 'user-1',
          ipAddress: '127.0.0.1',
          metadata: { passkeyId: 'record-1', name: 'My Key' },
        }),
      );
    });

    it('should not throw if audit logging fails', async () => {
      ctx.redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      ctx.prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: 'My Key',
      });
      ctx.auditService.log.mockRejectedValue(new Error('audit fail'));

      const result = await ctx.service.verifyRegistration(
        'user-1',
        mockCredential,
        'My Key',
        mockPasskeyMeta,
      );

      expect(result).toEqual({ id: 'record-1', name: 'My Key' });
    });

    it('should use null for audit fields when ctx is undefined', async () => {
      ctx.redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      ctx.prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: DEFAULT_PASSKEY_NAME,
      });

      await ctx.service.verifyRegistration('user-1', mockCredential);

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        }),
      );
    });

    it('should handle credential with no transports', async () => {
      ctx.redis.get.mockResolvedValue(storedOptions);
      const noTransportResult = {
        ...mockVerificationResult,
        registrationInfo: {
          ...mockVerificationResult.registrationInfo,
          credential: {
            ...mockVerificationResult.registrationInfo.credential,
            transports: undefined,
          },
        },
      };
      mockVerifyRegistrationResponse.mockResolvedValue(noTransportResult);
      ctx.prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: DEFAULT_PASSKEY_NAME,
      });

      await ctx.service.verifyRegistration(
        'user-1',
        mockCredential,
        undefined,
        mockPasskeyMeta,
      );

      expect(ctx.prisma.webAuthnCredential.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ transports: [] }),
      });
    });
  });
});
