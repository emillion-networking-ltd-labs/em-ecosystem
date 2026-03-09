import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../users/enums/role.enum';

import { SafeUser } from '../../users/entities/user.entity';

// Mock @simplewebauthn/server (ESM) before any imports that transitively load it
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

import { PasskeyController } from '../passkey.controller';
import { PasskeyService } from '../passkey.service';
import { AuthService } from '../auth.service';

describe('PasskeyController', () => {
  let controller: PasskeyController;
  let passkeyService: {
    generateRegOptions: jest.Mock;
    verifyRegistration: jest.Mock;
    generateAuthOptions: jest.Mock;
    verifyAuthentication: jest.Mock;
    listPasskeys: jest.Mock;
    renamePasskey: jest.Mock;
    deletePasskey: jest.Mock;
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
    hasPassword: true,
    oauthProviders: [],
    emailVerified: true,
    isActive: true,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReq = {
    user: mockSafeUser,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  };

  const mockRes = {
    cookie: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    passkeyService = {
      generateRegOptions: jest.fn(),
      verifyRegistration: jest.fn(),
      generateAuthOptions: jest.fn(),
      verifyAuthentication: jest.fn(),
      listPasskeys: jest.fn(),
      renamePasskey: jest.fn(),
      deletePasskey: jest.fn(),
    };

    authService = {
      generateTokensForMfa: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PasskeyController],
      providers: [
        { provide: PasskeyService, useValue: passkeyService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get<PasskeyController>(PasskeyController);
  });

  // ─── POST /auth/passkeys/register/options ───────────────────

  describe('registerOptions', () => {
    it('should delegate to passkeyService.generateRegOptions with userId', async () => {
      const regOptions = { challenge: 'abc', rp: { name: 'test' } };
      passkeyService.generateRegOptions.mockResolvedValue(regOptions);

      const result = await controller.registerOptions(mockReq);

      expect(passkeyService.generateRegOptions).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(regOptions);
    });
  });

  // ─── POST /auth/passkeys/register/verify ────────────────────

  describe('registerVerify', () => {
    it('should return 201 with id and name', async () => {
      passkeyService.verifyRegistration.mockResolvedValue({
        id: 'pk-1',
        name: 'My Key',
      });

      const result = await controller.registerVerify(mockReq, {
        credential: { id: 'cred', response: {} },
        name: 'My Key',
      });

      expect(result).toEqual({ id: 'pk-1', name: 'My Key' });
      expect(passkeyService.verifyRegistration).toHaveBeenCalledWith(
        'uuid-123',
        { id: 'cred', response: {} },
        'My Key',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
    });

    it('should work without name', async () => {
      passkeyService.verifyRegistration.mockResolvedValue({
        id: 'pk-1',
        name: 'Passkey',
      });

      const result = await controller.registerVerify(mockReq, {
        credential: { id: 'cred', response: {} },
      });

      expect(result).toEqual({ id: 'pk-1', name: 'Passkey' });
      expect(passkeyService.verifyRegistration).toHaveBeenCalledWith(
        'uuid-123',
        { id: 'cred', response: {} },
        undefined,
        expect.any(Object),
      );
    });
  });

  // ─── POST /auth/passkeys/login/options ──────────────────────

  describe('loginOptions', () => {
    it('should delegate with email', async () => {
      const authOptions = {
        options: { challenge: 'xyz' },
        challengeId: 'ch-1',
      };
      passkeyService.generateAuthOptions.mockResolvedValue(authOptions);

      const result = await controller.loginOptions({
        email: 'test@example.com',
      });

      expect(passkeyService.generateAuthOptions).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toEqual(authOptions);
    });

    it('should work without email', async () => {
      const authOptions = {
        options: { challenge: 'xyz' },
        challengeId: 'ch-1',
      };
      passkeyService.generateAuthOptions.mockResolvedValue(authOptions);

      const result = await controller.loginOptions({});

      expect(passkeyService.generateAuthOptions).toHaveBeenCalledWith(
        undefined,
      );
      expect(result).toEqual(authOptions);
    });
  });

  // ─── POST /auth/passkeys/login/verify ───────────────────────

  describe('loginVerify', () => {
    it('should verify credential, generate tokens, and set cookie', async () => {
      passkeyService.verifyAuthentication.mockResolvedValue('user-id-1');
      authService.generateTokensForMfa.mockResolvedValue({
        accessToken: 'jwt-token',
        user: mockSafeUser,
        cookie: {
          name: 'refresh_token',
          value: 'rt-123',
          options: { httpOnly: true },
        },
      });

      const result = await controller.loginVerify(
        { challengeId: 'ch-1', credential: { id: 'cred', response: {} } },
        mockReq,
        mockRes as any,
      );

      expect(passkeyService.verifyAuthentication).toHaveBeenCalledWith(
        'ch-1',
        { id: 'cred', response: {} },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(authService.generateTokensForMfa).toHaveBeenCalledWith(
        'user-id-1',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'rt-123',
        { httpOnly: true },
      );
      expect(result).toEqual({
        accessToken: 'jwt-token',
        user: mockSafeUser,
      });
    });

    it('should pass correct request meta', async () => {
      passkeyService.verifyAuthentication.mockResolvedValue('user-id-1');
      authService.generateTokensForMfa.mockResolvedValue({
        accessToken: 'jwt',
        user: mockSafeUser,
        cookie: { name: 'rt', value: 'v', options: {} },
      });

      const customReq = {
        ...mockReq,
        ip: '192.168.1.1',
        headers: { 'user-agent': 'Chrome/120' },
      };

      await controller.loginVerify(
        { challengeId: 'ch-1', credential: {} },
        customReq,
        mockRes as any,
      );

      expect(passkeyService.verifyAuthentication).toHaveBeenCalledWith(
        'ch-1',
        {},
        { ipAddress: '192.168.1.1', userAgent: 'Chrome/120' },
      );
    });
  });

  // ─── GET /auth/passkeys ─────────────────────────────────────

  describe('list', () => {
    it('should delegate to passkeyService.listPasskeys with userId', async () => {
      const passkeys = [{ id: 'pk-1', name: 'Key 1' }];
      passkeyService.listPasskeys.mockResolvedValue(passkeys);

      const result = await controller.list(mockReq);

      expect(passkeyService.listPasskeys).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(passkeys);
    });
  });

  // ─── PATCH /auth/passkeys/:id ───────────────────────────────

  describe('rename', () => {
    it('should delegate with userId, id, and name', async () => {
      passkeyService.renamePasskey.mockResolvedValue({
        id: 'pk-1',
        name: 'New Name',
      });

      const result = await controller.rename(mockReq, 'pk-1', {
        name: 'New Name',
      });

      expect(passkeyService.renamePasskey).toHaveBeenCalledWith(
        'uuid-123',
        'pk-1',
        'New Name',
      );
      expect(result).toEqual({ id: 'pk-1', name: 'New Name' });
    });
  });

  // ─── DELETE /auth/passkeys/:id ──────────────────────────────

  describe('remove', () => {
    it('should delegate with password', async () => {
      passkeyService.deletePasskey.mockResolvedValue(undefined);

      const result = await controller.remove(mockReq, 'pk-1', {
        password: 'my-password',
      });

      expect(passkeyService.deletePasskey).toHaveBeenCalledWith(
        'uuid-123',
        'pk-1',
        'my-password',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
      );
      expect(result).toEqual({ message: 'Passkey deleted successfully' });
    });

    it('should work without password', async () => {
      passkeyService.deletePasskey.mockResolvedValue(undefined);

      const result = await controller.remove(mockReq, 'pk-1', {});

      expect(passkeyService.deletePasskey).toHaveBeenCalledWith(
        'uuid-123',
        'pk-1',
        undefined,
        expect.any(Object),
      );
      expect(result).toEqual({ message: 'Passkey deleted successfully' });
    });
  });
});
