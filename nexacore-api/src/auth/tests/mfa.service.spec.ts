import {
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MfaService } from '../mfa.service';
import { CryptoService } from '../../common/services/crypto.service';
import { UsersService } from '../../users/users.service';
import { Role } from '../../users/enums/role.enum';
import { Provider } from '../../users/enums/provider.enum';
import { User } from '../../users/entities/user.entity';

const mockVerify = jest.fn();
jest.mock('otplib', () => ({
  generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
  generateURI: jest.fn().mockReturnValue('otpauth://totp/test?secret=JBSWY3DPEHPK3PXP'),
  verify: (...args: unknown[]) => mockVerify(...args),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  firstName: null,
  lastName: null,
  avatarUrl: null,
  role: Role.USER,
  provider: Provider.LOCAL,
  providerId: null,
  emailVerified: false,
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

describe('MfaService', () => {
  let service: MfaService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let cryptoService: jest.Mocked<Partial<CryptoService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  beforeEach(() => {
    jest.clearAllMocks();

    usersService = {
      findById: jest.fn(),
      updateMfaSetupData: jest.fn().mockResolvedValue(undefined),
      enableMfa: jest.fn().mockResolvedValue(undefined),
      disableMfa: jest.fn().mockResolvedValue(undefined),
      updateRecoveryCodes: jest.fn().mockResolvedValue(undefined),
    };

    cryptoService = {
      encrypt: jest.fn().mockReturnValue('encrypted-secret'),
      decrypt: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mfa-token-jwt'),
      verify: jest.fn().mockReturnValue({ sub: 'user-1', type: 'mfa-challenge' }),
    };

    const auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    service = new MfaService(
      usersService as unknown as UsersService,
      cryptoService as unknown as CryptoService,
      jwtService as unknown as JwtService,
      auditService as any,
    );
  });

  describe('setupMfa', () => {
    it('should generate secret, QR code, and recovery codes', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser());

      const result = await service.setupMfa('user-1');

      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrCodeDataUrl).toBe('data:image/png;base64,mock');
      expect(result.recoveryCodes).toHaveLength(10);
      result.recoveryCodes.forEach((code: string) => {
        expect(code).toHaveLength(10);
      });
      expect(usersService.updateMfaSetupData).toHaveBeenCalledWith(
        'user-1',
        'encrypted-secret',
        expect.any(Array),
      );
    });

    it('should throw ConflictException if MFA already enabled', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: true }),
      );

      await expect(service.setupMfa('user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.setupMfa('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifySetup', () => {
    it('should enable MFA with valid TOTP code', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaSecret: 'encrypted-secret' }),
      );
      mockVerify.mockResolvedValue({ valid: true });

      await service.verifySetup('user-1', '123456');

      expect(usersService.enableMfa).toHaveBeenCalledWith('user-1');
    });

    it('should throw BadRequestException with invalid TOTP code', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaSecret: 'encrypted-secret' }),
      );
      mockVerify.mockResolvedValue({ valid: false });

      await expect(service.verifySetup('user-1', '000000')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if MFA already enabled', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: true }),
      );

      await expect(service.verifySetup('user-1', '123456')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if setup not initiated', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaSecret: null }),
      );

      await expect(service.verifySetup('user-1', '123456')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyLoginCode', () => {
    const mfaUser = () =>
      mockUser({
        mfaEnabled: true,
        mfaSecret: 'encrypted-secret',
        mfaRecoveryCodes: ['$2b$10$hashed-code-1'],
      });

    it('should verify TOTP code successfully', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mfaUser());
      mockVerify.mockResolvedValue({ valid: true });

      const result = await service.verifyLoginCode('mfa-token', '123456');

      expect(result.user.id).toBe('user-1');
    });

    it('should throw on invalid TOTP code', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mfaUser());
      mockVerify.mockResolvedValue({ valid: false });

      await expect(
        service.verifyLoginCode('mfa-token', '000000'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should verify valid recovery code and consume it', async () => {
      const hashedCode = await bcrypt.hash('abc123def0', 10);
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({
          mfaEnabled: true,
          mfaSecret: 'encrypted-secret',
          mfaRecoveryCodes: [hashedCode],
        }),
      );

      const result = await service.verifyLoginCode(
        'mfa-token',
        undefined,
        'abc123def0',
      );

      expect(result.user.id).toBe('user-1');
      expect(usersService.updateRecoveryCodes).toHaveBeenCalledWith(
        'user-1',
        [],
      );
    });

    it('should throw on invalid recovery code', async () => {
      const hashedCode = await bcrypt.hash('abc123def0', 10);
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({
          mfaEnabled: true,
          mfaSecret: 'encrypted-secret',
          mfaRecoveryCodes: [hashedCode],
        }),
      );

      await expect(
        service.verifyLoginCode('mfa-token', undefined, 'wrong-code'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if neither code nor recoveryCode provided', async () => {
      await expect(
        service.verifyLoginCode('mfa-token', undefined, undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw on expired/invalid MFA token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(
        service.verifyLoginCode('expired-token', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw on wrong token type', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 'user-1',
        type: 'access',
      });

      await expect(
        service.verifyLoginCode('wrong-type-token', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if user not found', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.verifyLoginCode('mfa-token', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if MFA not enabled on user', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: false }),
      );

      await expect(
        service.verifyLoginCode('mfa-token', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA with valid password', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: true, passwordHash: hash }),
      );

      await service.disableMfa('user-1', 'correct-password');

      expect(usersService.disableMfa).toHaveBeenCalledWith('user-1');
    });

    it('should throw on invalid password', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: true, passwordHash: hash }),
      );

      await expect(
        service.disableMfa('user-1', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if MFA not enabled', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: false }),
      );

      await expect(
        service.disableMfa('user-1', 'password'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if no password set (OAuth account)', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: true, passwordHash: null }),
      );

      await expect(
        service.disableMfa('user-1', 'password'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('regenerateRecoveryCodes', () => {
    it('should generate new codes with valid password', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: true, passwordHash: hash }),
      );

      const codes = await service.regenerateRecoveryCodes(
        'user-1',
        'correct-password',
      );

      expect(codes).toHaveLength(10);
      expect(usersService.updateRecoveryCodes).toHaveBeenCalledWith(
        'user-1',
        expect.any(Array),
      );
    });

    it('should throw on invalid password', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: true, passwordHash: hash }),
      );

      await expect(
        service.regenerateRecoveryCodes('user-1', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if MFA not enabled', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({ mfaEnabled: false }),
      );

      await expect(
        service.regenerateRecoveryCodes('user-1', 'password'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMfaStatus', () => {
    it('should return enabled status and recovery code count', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(
        mockUser({
          mfaEnabled: true,
          mfaRecoveryCodes: ['h1', 'h2', 'h3'],
        }),
      );

      const status = await service.getMfaStatus('user-1');

      expect(status).toEqual({
        mfaEnabled: true,
        recoveryCodesRemaining: 3,
      });
    });

    it('should return disabled status', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser());

      const status = await service.getMfaStatus('user-1');

      expect(status).toEqual({
        mfaEnabled: false,
        recoveryCodesRemaining: 0,
      });
    });

    it('should throw if user not found', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getMfaStatus('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('generateMfaToken', () => {
    it('should sign a JWT with mfa-challenge type', () => {
      const user = mockUser();
      const token = service.generateMfaToken(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', type: 'mfa-challenge' },
        { expiresIn: '5m' },
      );
      expect(token).toBe('mfa-token-jwt');
    });
  });
});
