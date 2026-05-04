import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { TrustedDeviceService } from '../trusted-device.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';

describe('TrustedDeviceService', () => {
  let service: TrustedDeviceService;
  let prisma: {
    trustedDevice: {
      count: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      upsert: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
  };
  let auditService: { log: jest.Mock };

  const mockDevice = {
    id: 'device-1',
    userId: 'user-1',
    fingerprintHash: 'hashed-fp',
    deviceName: 'Chrome on Windows',
    ipAddress: '127.0.0.1',
    lastVerifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isRevoked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma = {
      trustedDevice: {
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue(mockDevice),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn().mockResolvedValue(mockDevice),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
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

    service = new TrustedDeviceService(
      prisma as any,
      auditService as any,
      mockConfigService as unknown as ConfigService,
    );
  });

  describe('hashFingerprint', () => {
    it('should return consistent hash for same userId + fingerprint', () => {
      const hash1 = service.hashFingerprint('user-1', 'fingerprint-abc');
      const hash2 = service.hashFingerprint('user-1', 'fingerprint-abc');

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex
    });

    it('should return different hash for same fingerprint + different userId', () => {
      const hash1 = service.hashFingerprint('user-1', 'fingerprint-abc');
      const hash2 = service.hashFingerprint('user-2', 'fingerprint-abc');

      expect(hash1).not.toBe(hash2);
    });

    it('should return different hash for different fingerprint + same userId', () => {
      const hash1 = service.hashFingerprint('user-1', 'fingerprint-abc');
      const hash2 = service.hashFingerprint('user-1', 'fingerprint-xyz');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('trustDevice', () => {
    it('should create trusted device with correct expiry', async () => {
      const device = await service.trustDevice(
        'user-1',
        'fingerprint-abc',
        '127.0.0.1',
        'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
      );

      expect(prisma.trustedDevice.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_fingerprintHash: {
              userId: 'user-1',
              fingerprintHash: expect.any(String),
            },
          },
          create: expect.objectContaining({
            userId: 'user-1',
            fingerprintHash: expect.any(String),
            deviceName: 'Chrome on Windows',
            ipAddress: '127.0.0.1',
          }),
        }),
      );
      expect(device.id).toBe('device-1');
    });

    it('should derive deviceName from User-Agent', async () => {
      await service.trustDevice(
        'user-1',
        'fingerprint-abc',
        '127.0.0.1',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605.1.15',
      );

      expect(prisma.trustedDevice.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            deviceName: 'Safari on macOS',
          }),
        }),
      );
    });

    it('should enforce MAX_TRUSTED_DEVICES_PER_USER limit', async () => {
      prisma.trustedDevice.count.mockResolvedValue(10);
      prisma.trustedDevice.findFirst.mockResolvedValue({
        id: 'oldest-device',
      });

      await service.trustDevice('user-1', 'fingerprint-abc', '127.0.0.1', null);

      expect(prisma.trustedDevice.update).toHaveBeenCalledWith({
        where: { id: 'oldest-device' },
        data: { isRevoked: true },
      });
    });

    it('should not revoke when under limit', async () => {
      prisma.trustedDevice.count.mockResolvedValue(3);

      await service.trustDevice('user-1', 'fingerprint-abc', '127.0.0.1', null);

      // update called only by upsert, not for revoking oldest
      expect(prisma.trustedDevice.findFirst).not.toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should audit log DEVICE_TRUSTED', async () => {
      await service.trustDevice(
        'user-1',
        'fingerprint-abc',
        '127.0.0.1',
        'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
      );

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.DEVICE_TRUSTED,
        userId: 'user-1',
        metadata: { deviceId: 'device-1', deviceName: 'Chrome on Windows' },
      });
    });
  });

  describe('isTrustedDevice', () => {
    it('should return true for valid, non-expired, non-revoked device', async () => {
      prisma.trustedDevice.findFirst.mockResolvedValue(mockDevice);

      const result = await service.isTrustedDevice('user-1', 'fingerprint-abc');

      expect(result).toBe(true);
    });

    it('should update lastVerifiedAt on successful check', async () => {
      prisma.trustedDevice.findFirst.mockResolvedValue(mockDevice);

      await service.isTrustedDevice('user-1', 'fingerprint-abc');

      expect(prisma.trustedDevice.update).toHaveBeenCalledWith({
        where: { id: 'device-1' },
        data: { lastVerifiedAt: expect.any(Date) },
      });
    });

    it('should return false when no matching device found', async () => {
      prisma.trustedDevice.findFirst.mockResolvedValue(null);

      const result = await service.isTrustedDevice('user-1', 'unknown-fp');

      expect(result).toBe(false);
      expect(prisma.trustedDevice.update).not.toHaveBeenCalled();
    });

    it('should query with correct filters', async () => {
      prisma.trustedDevice.findFirst.mockResolvedValue(null);

      await service.isTrustedDevice('user-1', 'fingerprint-abc');

      expect(prisma.trustedDevice.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          fingerprintHash: expect.any(String),
          isRevoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });
  });

  describe('listTrustedDevices', () => {
    it('should return non-revoked, non-expired devices', async () => {
      const devices = [
        {
          id: 'device-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '127.0.0.1',
          lastVerifiedAt: new Date(),
          expiresAt: new Date(),
          createdAt: new Date(),
        },
      ];
      prisma.trustedDevice.findMany.mockResolvedValue(devices);

      const result = await service.listTrustedDevices('user-1');

      expect(result).toEqual(devices);
      expect(prisma.trustedDevice.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRevoked: false,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { lastVerifiedAt: 'desc' },
        select: {
          id: true,
          deviceName: true,
          ipAddress: true,
          lastVerifiedAt: true,
          expiresAt: true,
          createdAt: true,
        },
      });
    });

    it('should return empty array when no devices', async () => {
      const result = await service.listTrustedDevices('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('revokeDevice', () => {
    it('should set isRevoked to true', async () => {
      prisma.trustedDevice.findFirst.mockResolvedValue(mockDevice);

      await service.revokeDevice('user-1', 'device-1');

      expect(prisma.trustedDevice.update).toHaveBeenCalledWith({
        where: { id: 'device-1' },
        data: { isRevoked: true },
      });
    });

    it('should throw NotFoundException for wrong userId (ownership)', async () => {
      prisma.trustedDevice.findFirst.mockResolvedValue(null);

      await expect(
        service.revokeDevice('user-1', 'device-999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should audit log DEVICE_UNTRUSTED', async () => {
      prisma.trustedDevice.findFirst.mockResolvedValue(mockDevice);

      await service.revokeDevice('user-1', 'device-1');

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.DEVICE_UNTRUSTED,
        userId: 'user-1',
        metadata: { deviceId: 'device-1', deviceName: 'Chrome on Windows' },
      });
    });
  });

  describe('revokeAllDevices', () => {
    it('should revoke all non-revoked devices and return count', async () => {
      prisma.trustedDevice.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.revokeAllDevices('user-1');

      expect(count).toBe(3);
      expect(prisma.trustedDevice.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });

    it('should audit log when devices were revoked', async () => {
      prisma.trustedDevice.updateMany.mockResolvedValue({ count: 2 });

      await service.revokeAllDevices('user-1');

      expect(auditService.log).toHaveBeenCalledWith({
        action: AuditAction.DEVICE_UNTRUSTED,
        userId: 'user-1',
        metadata: { scope: 'all', count: 2 },
      });
    });

    it('should not audit log when no devices exist', async () => {
      prisma.trustedDevice.updateMany.mockResolvedValue({ count: 0 });

      const count = await service.revokeAllDevices('user-1');

      expect(count).toBe(0);
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  // ─── Fire-and-forget audit resilience ──────────────────────────

  describe('fire-and-forget audit resilience', () => {
    it('trustDevice should succeed even when audit log rejects', async () => {
      auditService.log.mockRejectedValue(new Error('audit write failed'));
      prisma.trustedDevice.count.mockResolvedValue(0);
      prisma.trustedDevice.upsert.mockResolvedValue(mockDevice);

      const result = await service.trustDevice(
        'user-1',
        'fingerprint',
        '127.0.0.1',
        'Chrome UA',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('device-1');
    });

    it('revokeDevice should succeed even when audit log rejects', async () => {
      auditService.log.mockRejectedValue(new Error('audit write failed'));
      prisma.trustedDevice.findFirst.mockResolvedValue(mockDevice);
      prisma.trustedDevice.update.mockResolvedValue({
        ...mockDevice,
        isRevoked: true,
      });

      await expect(
        service.revokeDevice('user-1', 'device-1'),
      ).resolves.not.toThrow();
    });

    it('revokeAllDevices should succeed even when audit log rejects', async () => {
      auditService.log.mockRejectedValue(new Error('audit write failed'));
      prisma.trustedDevice.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.revokeAllDevices('user-1');

      expect(count).toBe(3);
    });
  });

  describe('parseDeviceName', () => {
    it('should detect Chrome on Windows', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        ),
      ).toBe('Chrome on Windows');
    });

    it('should detect Firefox on Linux', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
        ),
      ).toBe('Firefox on Linux');
    });

    it('should detect Safari on macOS', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        ),
      ).toBe('Safari on macOS');
    });

    it('should detect Edge on Windows', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0',
        ),
      ).toBe('Edge on Windows');
    });

    it('should detect legacy Edge on Windows', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0 Safari/537.36 Edge/18.0',
        ),
      ).toBe('Edge on Windows');
    });

    it('should detect Chrome on Android', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
        ),
      ).toBe('Chrome on Android');
    });

    it('should detect Safari on iOS (iPhone)', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        ),
      ).toBe('Safari on iOS');
    });

    it('should detect Safari on iOS (iPad)', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        ),
      ).toBe('Safari on iOS');
    });

    it('should return Unknown Device for null User-Agent', () => {
      expect(service.parseDeviceName(null)).toBe('Unknown Device');
    });

    it('should return Unknown Browser on Unknown OS for unrecognized agent', () => {
      expect(service.parseDeviceName('CustomBot/1.0')).toBe(
        'Unknown Browser on Unknown OS',
      );
    });

    it('should detect Edge/ (legacy Edge) on Windows', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0 Safari/537.36 Edge/18.0',
        ),
      ).toBe('Edge on Windows');
    });

    it('should detect Safari on iPad (iOS)', () => {
      expect(
        service.parseDeviceName(
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        ),
      ).toBe('Safari on iOS');
    });
  });

  // ─── Fire-and-forget resilience ─────────────────────────────
  describe('fire-and-forget resilience (audit log rejection)', () => {
    const flushPromises = () =>
      new Promise((resolve) => process.nextTick(resolve));

    it('should still trust device when audit log rejects', async () => {
      auditService.log.mockRejectedValue(new Error('Audit DB down'));

      const device = await service.trustDevice(
        'user-1',
        'fingerprint-abc',
        '127.0.0.1',
        'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0',
      );

      expect(device.id).toBe('device-1');
      await flushPromises();
    });

    it('should still revoke device when audit log rejects', async () => {
      auditService.log.mockRejectedValue(new Error('Audit DB down'));
      prisma.trustedDevice.findFirst.mockResolvedValue(mockDevice);

      await service.revokeDevice('user-1', 'device-1');

      expect(prisma.trustedDevice.update).toHaveBeenCalledWith({
        where: { id: 'device-1' },
        data: { isRevoked: true },
      });
      await flushPromises();
    });

    it('should still revoke all devices when audit log rejects', async () => {
      auditService.log.mockRejectedValue(new Error('Audit DB down'));
      prisma.trustedDevice.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.revokeAllDevices('user-1');

      expect(count).toBe(3);
      await flushPromises();
    });
  });

  // ─── SCRUM-327: re-authenticated wrappers ───────────────────────
  describe('re-authenticated wrappers (SCRUM-327)', () => {
    let passwordHash: string;
    const correctPassword = 'correct-password';

    beforeAll(async () => {
      // Real bcrypt hash so the service's bcrypt.compare can verify it.
      passwordHash = await bcrypt.hash(correctPassword, 4);
    });

    const userWithPassword = () => ({
      id: 'user-1',
      passwordHash,
    });

    describe('trustDeviceWithReauth', () => {
      it('should call trustDevice when password is correct', async () => {
        prisma.user.findUnique.mockResolvedValue(userWithPassword());

        const result = await service.trustDeviceWithReauth(
          'user-1',
          'fingerprint-abc',
          '127.0.0.1',
          'Chrome UA',
          correctPassword,
        );

        expect(result.id).toBe('device-1');
        expect(prisma.trustedDevice.upsert).toHaveBeenCalled();
      });

      it('should throw UnauthorizedException when password is wrong', async () => {
        prisma.user.findUnique.mockResolvedValue(userWithPassword());

        await expect(
          service.trustDeviceWithReauth(
            'user-1',
            'fingerprint-abc',
            '127.0.0.1',
            'Chrome UA',
            'wrong-pw',
          ),
        ).rejects.toThrow(UnauthorizedException);
        expect(prisma.trustedDevice.upsert).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException for OAuth-only user', async () => {
        prisma.user.findUnique.mockResolvedValue({
          id: 'user-1',
          passwordHash: null,
        });

        await expect(
          service.trustDeviceWithReauth(
            'user-1',
            'fingerprint-abc',
            '127.0.0.1',
            'Chrome UA',
            'any',
          ),
        ).rejects.toThrow(BadRequestException);
        expect(prisma.trustedDevice.upsert).not.toHaveBeenCalled();
      });

      it('should throw UnauthorizedException when user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        await expect(
          service.trustDeviceWithReauth(
            'ghost-user',
            'fingerprint-abc',
            '127.0.0.1',
            'Chrome UA',
            'any',
          ),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('revokeDeviceWithReauth', () => {
      it('should call revokeDevice when password is correct', async () => {
        prisma.user.findUnique.mockResolvedValue(userWithPassword());
        prisma.trustedDevice.findFirst.mockResolvedValue(mockDevice);

        await service.revokeDeviceWithReauth(
          'user-1',
          'device-1',
          correctPassword,
        );

        expect(prisma.trustedDevice.update).toHaveBeenCalledWith({
          where: { id: 'device-1' },
          data: { isRevoked: true },
        });
      });

      it('should throw UnauthorizedException without revoking when password is wrong', async () => {
        prisma.user.findUnique.mockResolvedValue(userWithPassword());

        await expect(
          service.revokeDeviceWithReauth('user-1', 'device-1', 'wrong-pw'),
        ).rejects.toThrow(UnauthorizedException);
        expect(prisma.trustedDevice.update).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException for OAuth-only user', async () => {
        prisma.user.findUnique.mockResolvedValue({
          id: 'user-1',
          passwordHash: null,
        });

        await expect(
          service.revokeDeviceWithReauth('user-1', 'device-1', 'any'),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('revokeAllDevicesWithReauth', () => {
      it('should call revokeAllDevices when password is correct', async () => {
        prisma.user.findUnique.mockResolvedValue(userWithPassword());
        prisma.trustedDevice.updateMany.mockResolvedValue({ count: 4 });

        const count = await service.revokeAllDevicesWithReauth(
          'user-1',
          correctPassword,
        );

        expect(count).toBe(4);
      });

      it('should throw UnauthorizedException without revoking when password is wrong', async () => {
        prisma.user.findUnique.mockResolvedValue(userWithPassword());

        await expect(
          service.revokeAllDevicesWithReauth('user-1', 'wrong-pw'),
        ).rejects.toThrow(UnauthorizedException);
        expect(prisma.trustedDevice.updateMany).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException for OAuth-only user', async () => {
        prisma.user.findUnique.mockResolvedValue({
          id: 'user-1',
          passwordHash: null,
        });

        await expect(
          service.revokeAllDevicesWithReauth('user-1', 'any'),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
