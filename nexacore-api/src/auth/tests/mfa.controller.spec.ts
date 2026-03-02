import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import { SafeUser } from '../../users/entities/user.entity';

// Mock otplib (ESM) before any imports that transitively load it
jest.mock('otplib', () => ({
  generateSecret: jest.fn(),
  generateURI: jest.fn(),
  verify: jest.fn(),
}));

import { MfaController } from '../mfa.controller';
import { MfaService } from '../mfa.service';
import { AuthService } from '../auth.service';

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
  let authService: {
    generateTokensForMfa: jest.Mock;
  };

  const mockSafeUser: SafeUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: null,
    role: Role.USER,
    provider: Provider.LOCAL,
    providerId: null,
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

    authService = {
      generateTokensForMfa: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MfaController],
      providers: [
        { provide: MfaService, useValue: mfaService },
        { provide: AuthService, useValue: authService },
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
          options: { httpOnly: true, secure: false, sameSite: 'strict', path: '/', maxAge: 604800 },
        },
      };
      authService.generateTokensForMfa.mockResolvedValue(mockAuthResult);

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
      expect(authService.generateTokensForMfa).toHaveBeenCalledWith(
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
      authService.generateTokensForMfa.mockResolvedValue({
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
  });

  // ─── DELETE /auth/mfa ───────────────────────────────────────

  describe('disable', () => {
    it('should delegate to mfaService.disableMfa and return success', async () => {
      mfaService.disableMfa.mockResolvedValue(undefined);

      const result = await controller.disable(mockReq, { password: 'MyPass1!' });

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
      mfaService.regenerateRecoveryCodes.mockResolvedValue(['code1', 'code2', 'code3']);

      const result = await controller.regenerateCodes(mockReq, { password: 'MyPass1!' });

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

    it('should NOT have @Throttle on status (inherits global)', () => {
      const limitMeta = Reflect.getMetadata(
        'THROTTLER:LIMITglobal',
        controller['status'],
      );
      expect(limitMeta).toBeUndefined();
    });
  });
});
