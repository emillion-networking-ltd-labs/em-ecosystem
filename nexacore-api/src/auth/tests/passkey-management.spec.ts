import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import {
  createPasskeyTestSetup,
  PasskeyTestContext,
  mockPasskeyUser,
  mockPasskeyMeta,
} from './auth-test.helpers';

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

describe('PasskeyService — Management', () => {
  let ctx: PasskeyTestContext;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createPasskeyTestSetup();
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
      ctx.prisma.webAuthnCredential.findMany.mockResolvedValue(mockPasskeys);

      const result = await ctx.service.listPasskeys('user-1');

      expect(result).toEqual(mockPasskeys);
      expect(ctx.prisma.webAuthnCredential.findMany).toHaveBeenCalledWith({
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
      ctx.prisma.webAuthnCredential.findMany.mockResolvedValue([]);

      const result = await ctx.service.listPasskeys('user-1');

      expect(result).toEqual([]);
    });
  });

  // ─── renamePasskey ──────────────────────────────────────────

  describe('renamePasskey', () => {
    it('should update passkey name', async () => {
      ctx.prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'Old Name',
      });
      ctx.prisma.webAuthnCredential.update.mockResolvedValue({});

      const result = await ctx.service.renamePasskey(
        'user-1',
        'pk-1',
        'New Name',
      );

      expect(result).toEqual({ id: 'pk-1', name: 'New Name' });
      expect(ctx.prisma.webAuthnCredential.update).toHaveBeenCalledWith({
        where: { id: 'pk-1' },
        data: { name: 'New Name' },
      });
    });

    it('should throw NotFoundException if passkey not found', async () => {
      ctx.prisma.webAuthnCredential.findFirst.mockResolvedValue(null);

      await expect(
        ctx.service.renamePasskey('user-1', 'pk-999', 'New Name'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject rename of another user passkey', async () => {
      ctx.prisma.webAuthnCredential.findFirst.mockResolvedValue(null);

      await expect(
        ctx.service.renamePasskey('user-2', 'pk-1', 'New Name'),
      ).rejects.toThrow(NotFoundException);

      expect(ctx.prisma.webAuthnCredential.findFirst).toHaveBeenCalledWith({
        where: { id: 'pk-1', userId: 'user-2' },
      });
    });
  });

  // ─── deletePasskey ──────────────────────────────────────────

  describe('deletePasskey', () => {
    it('should delete passkey with valid password', async () => {
      const hashedPw = await bcrypt.hash('correct-pw', 10);
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser({ passwordHash: hashedPw }),
      );
      ctx.prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'My Key',
      });
      ctx.prisma.webAuthnCredential.delete.mockResolvedValue({});

      await ctx.service.deletePasskey(
        'user-1',
        'pk-1',
        'correct-pw',
        mockPasskeyMeta,
      );

      expect(ctx.prisma.webAuthnCredential.delete).toHaveBeenCalledWith({
        where: { id: 'pk-1' },
      });
    });

    it('should delete passkey without password for OAuth user', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser({ passwordHash: null }),
      );
      ctx.prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'My Key',
      });
      ctx.prisma.webAuthnCredential.delete.mockResolvedValue({});

      await ctx.service.deletePasskey(
        'user-1',
        'pk-1',
        undefined,
        mockPasskeyMeta,
      );

      expect(ctx.prisma.webAuthnCredential.delete).toHaveBeenCalled();
    });

    it('should require password when user has passwordHash', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser(),
      );

      await expect(
        ctx.service.deletePasskey('user-1', 'pk-1', undefined, mockPasskeyMeta),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser(),
      );

      await expect(
        ctx.service.deletePasskey(
          'user-1',
          'pk-1',
          'wrong-pw',
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if passkey not found', async () => {
      const hashedPw = await bcrypt.hash('correct-pw', 10);
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser({ passwordHash: hashedPw }),
      );
      ctx.prisma.webAuthnCredential.findFirst.mockResolvedValue(null);

      await expect(
        ctx.service.deletePasskey(
          'user-1',
          'pk-1',
          'correct-pw',
          mockPasskeyMeta,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        ctx.service.deletePasskey('user-1', 'pk-1', 'pw', mockPasskeyMeta),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should audit PASSKEY_DELETED on success', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser({ passwordHash: null }),
      );
      ctx.prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'My Key',
      });
      ctx.prisma.webAuthnCredential.delete.mockResolvedValue({});

      await ctx.service.deletePasskey(
        'user-1',
        'pk-1',
        undefined,
        mockPasskeyMeta,
      );

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.PASSKEY_DELETED,
          userId: 'user-1',
          metadata: { passkeyId: 'pk-1', name: 'My Key' },
        }),
      );
    });

    it('should use null for audit fields when ctx is undefined', async () => {
      (ctx.usersService.findById as jest.Mock).mockResolvedValue(
        mockPasskeyUser({ passwordHash: null }),
      );
      ctx.prisma.webAuthnCredential.findFirst.mockResolvedValue({
        id: 'pk-1',
        userId: 'user-1',
        name: 'My Key',
      });
      ctx.prisma.webAuthnCredential.delete.mockResolvedValue({});

      await ctx.service.deletePasskey('user-1', 'pk-1');

      expect(ctx.auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: null,
          userAgent: null,
        }),
      );
    });
  });
});
