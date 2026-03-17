import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../users/enums/role.enum';
import { CanActivate } from '@nestjs/common';

import { SafeUser } from '../../users/entities/user.entity';

// Mock otplib (ESM) before any imports that transitively load it
jest.mock('otplib', () => ({
  generateSecret: jest.fn(),
  generateURI: jest.fn(),
  verify: jest.fn(),
}));

import { MfaController } from '../mfa.controller';
import { MfaService } from '../mfa.service';
import { TokenService } from '../token.service';
import { TrustedDeviceService } from '../trusted-device.service';
import { MfaSetupGuard } from '../guards/mfa-setup.guard';
import { JwtOrMfaSetupGuard } from '../guards/jwt-or-mfa-setup.guard';

// Mock the new guards
class MockMfaSetupGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

class MockJwtOrMfaSetupGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

describe('MfaController', () => {
  let controller: MfaController;
  let mfaService: {
    setupMfa: jest.Mock;
    verifySetup: jest.Mock;
    verifyLoginCode: jest.Mock;
    disableMfa: jest.Mock;
    regenerateRecoveryCodes: jest.Mock;
    getMfaStatus: jest.Mock;
  };
  let tokenService: {
    generateTokensForMfa: jest.Mock;
  };
  let trustedDeviceService: {
    trustDevice: jest.Mock;
  };

  const mockSafeUser: SafeUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: null,
    role: Role.USER,
    hasPassword: true,
    oauthProviders: [],
    emailVerified: true,
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReq = {
    user: mockSafeUser,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mfaService = {
      setupMfa: jest.fn(),
      verifySetup: jest.fn(),
      verifyLoginCode: jest.fn(),
      disableMfa: jest.fn(),
      regenerateRecoveryCodes: jest.fn(),
      getMfaStatus: jest.fn(),
    };

    tokenService = {
      generateTokensForMfa: jest.fn(),
    };

    trustedDeviceService = {
      trustDevice: jest.fn().mockResolvedValue({ id: 'device-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MfaController],
      providers: [
        { provide: MfaService, useValue: mfaService },
        { provide: TokenService, useValue: tokenService },
        { provide: TrustedDeviceService, useValue: trustedDeviceService },
        { provide: MfaSetupGuard, useClass: MockMfaSetupGuard },
        { provide: JwtOrMfaSetupGuard, useClass: MockJwtOrMfaSetupGuard },
      ],
    }).compile();

    controller = module.get<MfaController>(MfaController);
  });

  // ─── POST /auth/mfa/setup ───────────────────────────────────

  describe('setup', () => {
    it('should delegate to mfaService.setupMfa with user id', async () => {
      const setupResult = {
        qrCodeUrl: 'otpauth://...',
        secret: 'BASE32SECRET',
        recoveryCodes: ['code1', 'code2'],
      };
      mfaService.setupMfa.mockResolvedValue(setupResult);

      const result = await controller.setup(mockReq);

      expect(mfaService.setupMfa).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(setupResult);
    });
  });

  // ─── POST /auth/mfa/verify-setup ────────────────────────────

  describe('verifySetup', () => {
    it('should verify setup and return success message', async () => {
      mfaService.verifySetup.mockResolvedValue(undefined);

      const result = await controller.verifySetup(mockReq, { token: '123456' });

      expect(mfaService.verifySetup).toHaveBeenCalledWith(
        'uuid-123',
        '123456',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({ message: 'MFA enabled successfully' });
    });
  });

  // ─── POST /auth/mfa/verify-login ────────────────────────────

  describe('verifyLogin', () => {
    it('should verify MFA code, generate tokens, and set cookie', async () => {
      mfaService.verifyLoginCode.mockResolvedValue({ user: mockSafeUser });

      const mockAuthResult = {
        accessToken: 'mfa-access-token',
        user: mockSafeUser,
        cookie: {
          name: 'refresh_token',
          value: 'mfa-refresh',
          options: {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            path: '/',
            maxAge: 604800,
          },
        },
      };
      tokenService.generateTokensForMfa.mockResolvedValue(mockAuthResult);

      const mockRes = { cookie: jest.fn() } as any;

      const result = await controller.verifyLogin(
        { mfaToken: 'mfa-jwt', code: '123456' },
        mockReq,
        mockRes,
      );

      expect(mfaService.verifyLoginCode).toHaveBeenCalledWith(
        'mfa-jwt',
        '123456',
        undefined,
      );
      expect(tokenService.generateTokensForMfa).toHaveBeenCalledWith(
        'uuid-123',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'mfa-refresh',
        mockAuthResult.cookie.options,
      );
      expect(result).toEqual({
        accessToken: 'mfa-access-token',
        user: mockSafeUser,
      });
    });

    it('should pass recoveryCode when provided', async () => {
      mfaService.verifyLoginCode.mockResolvedValue({ user: mockSafeUser });
      tokenService.generateTokensForMfa.mockResolvedValue({
        accessToken: 'token',
        user: mockSafeUser,
        cookie: { name: 'refresh_token', value: 'v', options: {} },
      });
      const mockRes = { cookie: jest.fn() } as any;

      await controller.verifyLogin(
        { mfaToken: 'jwt', recoveryCode: 'recovery-123' },
        mockReq,
        mockRes,
      );

      expect(mfaService.verifyLoginCode).toHaveBeenCalledWith(
        'jwt',
        undefined,
        'recovery-123',
      );
    });

    it('should trust device when trustDevice=true and fingerprint header present', async () => {
      mfaService.verifyLoginCode.mockResolvedValue({ user: mockSafeUser });
      tokenService.generateTokensForMfa.mockResolvedValue({
        accessToken: 'token',
        user: mockSafeUser,
        cookie: { name: 'refresh_token', value: 'v', options: {} },
      });
      const mockRes = { cookie: jest.fn() } as any;
      const reqWithFp = {
        ...mockReq,
        headers: { ...mockReq.headers, 'x-device-fingerprint': 'fp-abc123' },
      };

      await controller.verifyLogin(
        { mfaToken: 'jwt', code: '123456', trustDevice: true },
        reqWithFp,
        mockRes,
      );

      expect(trustedDeviceService.trustDevice).toHaveBeenCalledWith(
        'uuid-123',
        'fp-abc123',
        '127.0.0.1',
        'test-agent',
      );
    });

    it('should not trust device when trustDevice is false or omitted', async () => {
      mfaService.verifyLoginCode.mockResolvedValue({ user: mockSafeUser });
      tokenService.generateTokensForMfa.mockResolvedValue({
        accessToken: 'token',
        user: mockSafeUser,
        cookie: { name: 'refresh_token', value: 'v', options: {} },
      });
      const mockRes = { cookie: jest.fn() } as any;

      await controller.verifyLogin(
        { mfaToken: 'jwt', code: '123456' },
        mockReq,
        mockRes,
      );

      expect(trustedDeviceService.trustDevice).not.toHaveBeenCalled();
    });

    it('should not trust device when fingerprint header is missing', async () => {
      mfaService.verifyLoginCode.mockResolvedValue({ user: mockSafeUser });
      tokenService.generateTokensForMfa.mockResolvedValue({
        accessToken: 'token',
        user: mockSafeUser,
        cookie: { name: 'refresh_token', value: 'v', options: {} },
      });
      const mockRes = { cookie: jest.fn() } as any;

      await controller.verifyLogin(
        { mfaToken: 'jwt', code: '123456', trustDevice: true },
        mockReq,
        mockRes,
      );

      expect(trustedDeviceService.trustDevice).not.toHaveBeenCalled();
    });

    it('should not block login when trust device fails', async () => {
      mfaService.verifyLoginCode.mockResolvedValue({ user: mockSafeUser });
      tokenService.generateTokensForMfa.mockResolvedValue({
        accessToken: 'token',
        user: mockSafeUser,
        cookie: { name: 'refresh_token', value: 'v', options: {} },
      });
      trustedDeviceService.trustDevice.mockRejectedValue(new Error('DB error'));
      const mockRes = { cookie: jest.fn() } as any;
      const reqWithFp = {
        ...mockReq,
        headers: { ...mockReq.headers, 'x-device-fingerprint': 'fp-abc123' },
      };

      const result = await controller.verifyLogin(
        { mfaToken: 'jwt', code: '123456', trustDevice: true },
        reqWithFp,
        mockRes,
      );

      expect(result).toEqual({ accessToken: 'token', user: mockSafeUser });
    });

    it('should extract first element when fingerprint header is an array', async () => {
      mfaService.verifyLoginCode.mockResolvedValue({ user: mockSafeUser });
      tokenService.generateTokensForMfa.mockResolvedValue({
        accessToken: 'token',
        user: mockSafeUser,
        cookie: { name: 'refresh_token', value: 'v', options: {} },
      });
      const mockRes = { cookie: jest.fn() } as any;
      const reqWithArrayFp = {
        ...mockReq,
        headers: {
          ...mockReq.headers,
          'x-device-fingerprint': ['fp-first', 'fp-second'],
        },
      };

      await controller.verifyLogin(
        { mfaToken: 'jwt', code: '123456', trustDevice: true },
        reqWithArrayFp,
        mockRes,
      );

      expect(trustedDeviceService.trustDevice).toHaveBeenCalledWith(
        'uuid-123',
        'fp-first',
        '127.0.0.1',
        'test-agent',
      );
    });
  });

  // ─── DELETE /auth/mfa ───────────────────────────────────────

  describe('disable', () => {
    it('should delegate to mfaService.disableMfa and return success', async () => {
      mfaService.disableMfa.mockResolvedValue(undefined);

      const result = await controller.disable(mockReq, {
        password: 'MyPass1!',
      });

      expect(mfaService.disableMfa).toHaveBeenCalledWith(
        'uuid-123',
        'MyPass1!',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({ message: 'MFA disabled successfully' });
    });
  });

  // ─── POST /auth/mfa/recovery-codes ──────────────────────────

  describe('regenerateCodes', () => {
    it('should return new recovery codes', async () => {
      mfaService.regenerateRecoveryCodes.mockResolvedValue([
        'code1',
        'code2',
        'code3',
      ]);

      const result = await controller.regenerateCodes(mockReq, {
        password: 'MyPass1!',
      });

      expect(mfaService.regenerateRecoveryCodes).toHaveBeenCalledWith(
        'uuid-123',
        'MyPass1!',
      );
      expect(result).toEqual({ recoveryCodes: ['code1', 'code2', 'code3'] });
    });
  });

  // ─── GET /auth/mfa/status ───────────────────────────────────

  describe('status', () => {
    it('should return MFA status', async () => {
      const statusResult = {
        mfaEnabled: true,
        remainingRecoveryCodes: 8,
      };
      mfaService.getMfaStatus.mockResolvedValue(statusResult);

      const result = await controller.status(mockReq);

      expect(mfaService.getMfaStatus).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(statusResult);
    });
  });

  // ─── Rate limiting decorators ─────────────────────────────

  describe('Rate limiting decorators', () => {
    const throttledMethods = [
      'setup',
      'verifySetup',
      'verifyLogin',
      'disable',
      'regenerateCodes',
      'status',
    ];

    throttledMethods.forEach((method) => {
      it(`should have @Throttle on ${method}`, () => {
        const limitMeta = Reflect.getMetadata(
          'THROTTLER:LIMITglobal',
          controller[method],
        );
        const ttlMeta = Reflect.getMetadata(
          'THROTTLER:TTLglobal',
          controller[method],
        );
        expect(limitMeta).toBeDefined();
        expect(ttlMeta).toBeDefined();
      });
    });
  });
});
