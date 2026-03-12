import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasskeyService } from '../passkey.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { Role } from '../../users/enums/role.enum';

import { User } from '../../users/entities/user.entity';
import {
  MAX_PASSKEYS_PER_USER,
  DEFAULT_PASSKEY_NAME,
} from '../constants/passkey.constants';

// Mock @simplewebauthn/server
const mockGenerateRegistrationOptions = jest.fn();
const mockVerifyRegistrationResponse = jest.fn();
const mockGenerateAuthenticationOptions = jest.fn();
const mockVerifyAuthenticationResponse = jest.fn();

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: (...args: unknown[]) =>
    mockGenerateRegistrationOptions(...args),
  verifyRegistrationResponse: (...args: unknown[]) =>
    mockVerifyRegistrationResponse(...args),
  generateAuthenticationOptions: (...args: unknown[]) =>
    mockGenerateAuthenticationOptions(...args),
  verifyAuthenticationResponse: (...args: unknown[]) =>
    mockVerifyAuthenticationResponse(...args),
}));

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  firstName: null,
  lastName: null,
  avatarUrl: null,
  role: Role.USER,
  emailVerified: true,
  pendingEmail: null,
  isActive: true,
  failedAttempts: 0,
  lockedUntil: null,
  lockoutCount: 0,
  mfaEnabled: false,
  mfaSecret: null,
  mfaRecoveryCodes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockMeta = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

describe('PasskeyService', () => {
  let service: PasskeyService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let auditService: { log: jest.Mock };
  let redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };
  let prisma: {
    webAuthnCredential: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    usersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
    };

    prisma = {
      webAuthnCredential: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'auth.jwtSecret': 'test-secret-that-is-at-least-32-characters-long',
          'auth.jwtAccessExpiration': '15m',
          'auth.jwtRefreshExpiration': '12h',
          'auth.sessionIdleTimeoutHours': 0.5,
          'auth.maxConcurrentSessions': 5,
          'auth.trustedDeviceTtlDays': 30,
          'auth.mfaAppName': 'EM NexaCore',
          'auth.webauthnRpId': 'localhost',
          'auth.webauthnRpName': 'EM NexaCore',
          'auth.webauthnOrigin': 'http://localhost:3001',
          'oauth.googleClientId': 'test-google-id',
          'oauth.googleClientSecret': 'test-google-secret',
          'oauth.googleCallbackUrl':
            'http://localhost:3000/auth/google/callback',
          'oauth.githubClientId': 'test-github-id',
          'oauth.githubClientSecret': 'test-github-secret',
          'oauth.githubCallbackUrl':
            'http://localhost:3000/auth/github/callback',
          'app.nodeEnv': 'test',
          'app.frontendUrl': 'http://localhost:3001',
          'app.oauthAllowedRedirectUrls': '',
          'app.isProduction': false,
        };
        return config[key];
      }),
    };

    service = new PasskeyService(
      prisma as any,
      usersService as unknown as UsersService,
      auditService as any,
      redis as any,
      mockConfigService as unknown as ConfigService,
    );
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
      usersService.findById!.mockResolvedValue(mockUser());
      prisma.webAuthnCredential.count.mockResolvedValue(0);
      prisma.webAuthnCredential.findMany.mockResolvedValue([]);
      mockGenerateRegistrationOptions.mockResolvedValue(mockOptions);

      const result = await service.generateRegOptions('user-1');

      expect(result).toEqual(mockOptions);
      expect(redis.set).toHaveBeenCalledWith(
        'webauthn:reg:user-1',
        JSON.stringify(mockOptions),
        'EX',
        300,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findById!.mockResolvedValue(null);

      await expect(service.generateRegOptions('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if max passkeys reached', async () => {
      usersService.findById!.mockResolvedValue(mockUser());
      prisma.webAuthnCredential.count.mockResolvedValue(MAX_PASSKEYS_PER_USER);

      await expect(service.generateRegOptions('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include excludeCredentials from existing passkeys', async () => {
      usersService.findById!.mockResolvedValue(mockUser());
      prisma.webAuthnCredential.count.mockResolvedValue(2);
      prisma.webAuthnCredential.findMany.mockResolvedValue([
        { credentialId: 'cred-1', transports: ['usb'] },
        { credentialId: 'cred-2', transports: ['internal'] },
      ]);
      mockGenerateRegistrationOptions.mockResolvedValue(mockOptions);

      await service.generateRegOptions('user-1');

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
      usersService.findById!.mockResolvedValue(mockUser());
      prisma.webAuthnCredential.count.mockResolvedValue(0);
      prisma.webAuthnCredential.findMany.mockResolvedValue([]);
      mockGenerateRegistrationOptions.mockResolvedValue(mockOptions);

      await service.generateRegOptions('user-1');

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
    const mockCredential = { id: 'cred-id', response: {}, type: 'public-key' };
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
      redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: 'My Key',
      });

      const result = await service.verifyRegistration(
        'user-1',
        mockCredential,
        'My Key',
        mockMeta,
      );

      expect(result).toEqual({ id: 'record-1', name: 'My Key' });
      expect(prisma.webAuthnCredential.create).toHaveBeenCalledWith({
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
      redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: DEFAULT_PASSKEY_NAME,
      });

      const result = await service.verifyRegistration(
        'user-1',
        mockCredential,
        undefined,
        mockMeta,
      );

      expect(result.name).toBe(DEFAULT_PASSKEY_NAME);
      expect(prisma.webAuthnCredential.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: DEFAULT_PASSKEY_NAME }),
      });
    });

    it('should throw BadRequestException if challenge not found', async () => {
      redis.get.mockResolvedValue(null);

      await expect(
        service.verifyRegistration(
          'user-1',
          mockCredential,
          undefined,
          mockMeta,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if verification fails (throws)', async () => {
      redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockRejectedValue(new Error('bad'));

      await expect(
        service.verifyRegistration(
          'user-1',
          mockCredential,
          undefined,
          mockMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if verification returns not verified', async () => {
      redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: false,
        registrationInfo: null,
      });

      await expect(
        service.verifyRegistration(
          'user-1',
          mockCredential,
          undefined,
          mockMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should audit PASSKEY_REGISTERED on success', async () => {
      redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: 'My Key',
      });

      await service.verifyRegistration(
        'user-1',
        mockCredential,
        'My Key',
        mockMeta,
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_REGISTERED,
          userId: 'user-1',
          ipAddress: '127.0.0.1',
          metadata: { passkeyId: 'record-1', name: 'My Key' },
        }),
      );
    });

    it('should not throw if audit logging fails', async () => {
      redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: 'My Key',
      });
      auditService.log.mockRejectedValue(new Error('audit fail'));

      const result = await service.verifyRegistration(
        'user-1',
        mockCredential,
        'My Key',
        mockMeta,
      );

      expect(result).toEqual({ id: 'record-1', name: 'My Key' });
    });

    it('should use null for audit fields when ctx is undefined', async () => {
      redis.get.mockResolvedValue(storedOptions);
      mockVerifyRegistrationResponse.mockResolvedValue(mockVerificationResult);
      prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: DEFAULT_PASSKEY_NAME,
      });

      await service.verifyRegistration('user-1', mockCredential);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        }),
      );
    });

    it('should handle credential with no transports', async () => {
      redis.get.mockResolvedValue(storedOptions);
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
      prisma.webAuthnCredential.create.mockResolvedValue({
        id: 'record-1',
        name: DEFAULT_PASSKEY_NAME,
      });

      await service.verifyRegistration(
        'user-1',
        mockCredential,
        undefined,
        mockMeta,
      );

      expect(prisma.webAuthnCredential.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ transports: [] }),
      });
    });
  });

  // ─── generateAuthOptions ────────────────────────────────────

  describe('generateAuthOptions', () => {
    const mockAuthOptions = {
      challenge: 'auth-challenge-base64url',
      rpId: 'localhost',
    };

    it('should return challengeId and options', async () => {
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      const result = await service.generateAuthOptions();

      expect(result.challengeId).toBeDefined();
      expect(result.options).toEqual(mockAuthOptions);
      expect(redis.set).toHaveBeenCalled();
    });

    it('should include allowCredentials when email has passkeys', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser());
      prisma.webAuthnCredential.findMany.mockResolvedValue([
        { credentialId: 'cred-1', transports: ['usb'] },
      ]);
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      await service.generateAuthOptions('test@example.com');

      expect(mockGenerateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: [{ id: 'cred-1', transports: ['usb'] }],
        }),
      );
    });

    it('should return discoverable options when no email provided', async () => {
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      await service.generateAuthOptions();

      expect(mockGenerateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: undefined,
        }),
      );
      expect(usersService.findByEmail).not.toHaveBeenCalled();
    });

    it('should not reveal if email has no passkeys (anti-enumeration)', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      const result = await service.generateAuthOptions('unknown@example.com');

      expect(result.challengeId).toBeDefined();
      expect(result.options).toEqual(mockAuthOptions);
    });

    it('should return discoverable options when user exists but has no passkeys', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser());
      prisma.webAuthnCredential.findMany.mockResolvedValue([]);
      mockGenerateAuthenticationOptions.mockResolvedValue(mockAuthOptions);

      const result = await service.generateAuthOptions('test@example.com');

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
      user: mockUser(),
    };

    it('should return userId on successful authentication', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      });
      prisma.webAuthnCredential.update.mockResolvedValue({});

      const userId = await service.verifyAuthentication(
        'challenge-id',
        mockAuthCredential,
        mockMeta,
      );

      expect(userId).toBe('user-1');
      expect(prisma.webAuthnCredential.update).toHaveBeenCalledWith({
        where: { id: 'db-cred-1' },
        data: { signCount: 6, lastUsedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException if challenge expired', async () => {
      redis.get.mockResolvedValue(null);

      await expect(
        service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if credential not found', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should audit PASSKEY_AUTH_FAILURE when credential not found', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockMeta,
        ),
      ).rejects.toThrow();

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          metadata: { reason: 'credential_not_found' },
        }),
      );
    });

    it('should throw UnauthorizedException if account deactivated', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        user: mockUser({ isActive: false }),
      });

      await expect(
        service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should audit PASSKEY_AUTH_FAILURE when account deactivated', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        user: mockUser({ isActive: false }),
      });

      await expect(
        service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockMeta,
        ),
      ).rejects.toThrow();

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          metadata: { reason: 'account_deactivated' },
        }),
      );
    });

    it('should throw UnauthorizedException if verification throws', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockRejectedValue(new Error('fail'));

      await expect(
        service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if verified is false', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: false,
        authenticationInfo: { newCounter: 6 },
      });

      await expect(
        service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle deactivated account without ctx', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        user: mockUser({ isActive: false }),
      });

      await expect(
        service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle verification failure without ctx', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockRejectedValue(new Error('fail'));

      await expect(
        service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle verified=false without ctx', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: false,
        authenticationInfo: { newCounter: 6 },
      });

      await expect(
        service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle sign count replay without ctx', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        signCount: 10,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 5 },
      });

      await expect(
        service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject sign count replay (cloned credential)', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        signCount: 10,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 5 },
      });

      await expect(
        service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow zero counters (authenticators that do not track)', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        signCount: 0,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 0 },
      });
      prisma.webAuthnCredential.update.mockResolvedValue({});

      const userId = await service.verifyAuthentication(
        'challenge-id',
        mockAuthCredential,
        mockMeta,
      );

      expect(userId).toBe('user-1');
    });

    it('should audit PASSKEY_AUTH_SUCCESS on success', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      });
      prisma.webAuthnCredential.update.mockResolvedValue({});

      await service.verifyAuthentication(
        'challenge-id',
        mockAuthCredential,
        mockMeta,
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_AUTH_SUCCESS,
          userId: 'user-1',
          metadata: { passkeyId: 'db-cred-1' },
        }),
      );
    });

    it('should audit sign count replay failure', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...storedDbCredential,
        signCount: 10,
      });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 5 },
      });

      await expect(
        service.verifyAuthentication(
          'challenge-id',
          mockAuthCredential,
          mockMeta,
        ),
      ).rejects.toThrow();

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          metadata: expect.objectContaining({ reason: 'sign_count_replay' }),
        }),
      );
    });

    it('should use null for audit fields when ctx is undefined', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(
        storedDbCredential,
      );
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      });
      prisma.webAuthnCredential.update.mockResolvedValue({});

      await service.verifyAuthentication('challenge-id', mockAuthCredential);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        }),
      );
    });

    it('should audit credential not found with null ctx fields', async () => {
      redis.get.mockResolvedValue(storedAuthOptions);
      prisma.webAuthnCredential.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyAuthentication('challenge-id', mockAuthCredential),
      ).rejects.toThrow();

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        }),
      );
    });
  });

  // ─── listPasskeys ───────────────────────────────────────────

  describe('listPasskeys', () => {
    it('should return user passkeys', async () => {
      const mockPasskeys = [
        {
          id: 'pk-1',
          name: 'My Key',
          deviceType: 'multiDevice',
          backedUp: true,
          transports: ['internal'],
          lastUsedAt: new Date(),
          createdAt: new Date(),
        },
      ];
      prisma.webAuthnCredential.findMany.mockResolvedValue(mockPasskeys);

      const result = await service.listPasskeys('user-1');

      expect(result).toEqual(mockPasskeys);
      expect(prisma.webAuthnCredential.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: {
          id: true,
          name: true,
          deviceType: true,
          backedUp: true,
          transports: true,
          lastUsedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when user has no passkeys', async () => {
      prisma.webAuthnCredential.findMany.mockResolvedValue([]);

      const result = await service.listPasskeys('user-1');

      expect(result).toEqual([]);
    });
  });

  // ─── renamePasskey ──────────────────────────────────────────

  describe('renamePasskey', () => {
    it('should update passkey name', async () => {
      prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'Old Name',
      });
      prisma.webAuthnCredential.update.mockResolvedValue({});

      const result = await service.renamePasskey('user-1', 'pk-1', 'New Name');

      expect(result).toEqual({ id: 'pk-1', name: 'New Name' });
      expect(prisma.webAuthnCredential.update).toHaveBeenCalledWith({
        where: { id: 'pk-1' },
        data: { name: 'New Name' },
      });
    });

    it('should throw NotFoundException if passkey not found', async () => {
      prisma.webAuthnCredential.findFirst.mockResolvedValue(null);

      await expect(
        service.renamePasskey('user-1', 'pk-999', 'New Name'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject rename of another user passkey', async () => {
      prisma.webAuthnCredential.findFirst.mockResolvedValue(null);

      await expect(
        service.renamePasskey('user-2', 'pk-1', 'New Name'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.webAuthnCredential.findFirst).toHaveBeenCalledWith({
        where: { id: 'pk-1', userId: 'user-2' },
      });
    });
  });

  // ─── deletePasskey ──────────────────────────────────────────

  describe('deletePasskey', () => {
    it('should delete passkey with valid password', async () => {
      const hashedPw = await bcrypt.hash('correct-pw', 10);
      usersService.findById!.mockResolvedValue(
        mockUser({ passwordHash: hashedPw }),
      );
      prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'My Key',
      });
      prisma.webAuthnCredential.delete.mockResolvedValue({});

      await service.deletePasskey('user-1', 'pk-1', 'correct-pw', mockMeta);

      expect(prisma.webAuthnCredential.delete).toHaveBeenCalledWith({
        where: { id: 'pk-1' },
      });
    });

    it('should delete passkey without password for OAuth user', async () => {
      usersService.findById!.mockResolvedValue(
        mockUser({ passwordHash: null }),
      );
      prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'My Key',
      });
      prisma.webAuthnCredential.delete.mockResolvedValue({});

      await service.deletePasskey('user-1', 'pk-1', undefined, mockMeta);

      expect(prisma.webAuthnCredential.delete).toHaveBeenCalled();
    });

    it('should require password when user has passwordHash', async () => {
      usersService.findById!.mockResolvedValue(mockUser());

      await expect(
        service.deletePasskey('user-1', 'pk-1', undefined, mockMeta),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      usersService.findById!.mockResolvedValue(mockUser());

      await expect(
        service.deletePasskey('user-1', 'pk-1', 'wrong-pw', mockMeta),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if passkey not found', async () => {
      const hashedPw = await bcrypt.hash('correct-pw', 10);
      usersService.findById!.mockResolvedValue(
        mockUser({ passwordHash: hashedPw }),
      );
      prisma.webAuthnCredential.findFirst.mockResolvedValue(null);

      await expect(
        service.deletePasskey('user-1', 'pk-1', 'correct-pw', mockMeta),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findById!.mockResolvedValue(null);

      await expect(
        service.deletePasskey('user-1', 'pk-1', 'pw', mockMeta),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should audit PASSKEY_DELETED on success', async () => {
      usersService.findById!.mockResolvedValue(
        mockUser({ passwordHash: null }),
      );
      prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'My Key',
      });
      prisma.webAuthnCredential.delete.mockResolvedValue({});

      await service.deletePasskey('user-1', 'pk-1', undefined, mockMeta);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_DELETED,
          userId: 'user-1',
          metadata: { passkeyId: 'pk-1', name: 'My Key' },
        }),
      );
    });

    it('should use null for audit fields when ctx is undefined', async () => {
      usersService.findById!.mockResolvedValue(
        mockUser({ passwordHash: null }),
      );
      prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'My Key',
      });
      prisma.webAuthnCredential.delete.mockResolvedValue({});

      await service.deletePasskey('user-1', 'pk-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        }),
      );
    });
  });
});
