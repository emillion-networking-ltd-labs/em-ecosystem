import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus, Prisma, TenantRole } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { ErrorMessages } from '../../common/constants/error-messages';
import { PrismaService } from '../../prisma/prisma.service';
import { InvitationsService } from '../invitations.service';

/**
 * Tests for InvitationsService — SCRUM-491 Phase 0.4.
 */

const TENANT_A = 't-a';
const USER_INVITER = 'u-inviter';
const USER_INVITEE = 'u-invitee';
const INVITEE_EMAIL = 'invitee@example.com';

const META = { ipAddress: '127.0.0.1', userAgent: 'jest' };

function makeInvitation(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'inv-1',
    tenantId: TENANT_A,
    email: INVITEE_EMAIL,
    role: TenantRole.MEMBER,
    tokenHash: 'h',
    invitedBy: USER_INVITER,
    expiresAt: new Date(Date.now() + 7 * 86_400_000),
    acceptedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: {
    tenantInvitation: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    tenantMembership: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      tenantInvitation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      tenantMembership: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: typeof prisma) => unknown) =>
        cb(prisma),
      ),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  describe('createInvitation', () => {
    it('returns existing pending invitation idempotently (token=null)', async () => {
      const existing = makeInvitation();
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce(existing);

      const result = await service.createInvitation(
        TENANT_A,
        USER_INVITER,
        { email: INVITEE_EMAIL, role: TenantRole.MEMBER },
        META,
      );

      expect(result.token).toBeNull();
      expect(result.id).toBe(existing.id);
      expect(prisma.tenantInvitation.create).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('creates fresh invitation with sha256-hashed token + audit log', async () => {
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce(null);
      const created = makeInvitation({ id: 'inv-new' });
      prisma.tenantInvitation.create.mockResolvedValueOnce(created);

      const result = await service.createInvitation(
        TENANT_A,
        USER_INVITER,
        { email: INVITEE_EMAIL.toUpperCase(), role: TenantRole.ADMIN },
        META,
      );

      expect(result.token).toBeTruthy();
      expect(typeof result.token).toBe('string');
      // Verify the stored hash matches sha256(plaintext)
      const writeCall = prisma.tenantInvitation.create.mock.calls[0][0];
      expect(writeCall.data.email).toBe(INVITEE_EMAIL); // lower-cased
      expect(writeCall.data.tokenHash).toBe(
        createHash('sha256')
          .update(result.token as string)
          .digest('hex'),
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TENANT_INVITATION_CREATED,
          userId: USER_INVITER,
        }),
      );
    });

    it('defaults expiresInDays to 7 when omitted', async () => {
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce(null);
      prisma.tenantInvitation.create.mockResolvedValueOnce(makeInvitation());

      const now = Date.now();
      await service.createInvitation(
        TENANT_A,
        USER_INVITER,
        { email: INVITEE_EMAIL, role: TenantRole.MEMBER },
        META,
      );

      const writeCall = prisma.tenantInvitation.create.mock.calls[0][0];
      const expiresAt = (writeCall.data.expiresAt as Date).getTime();
      const expected7d = now + 7 * 86_400_000;
      // ±2s tolerance for execution time
      expect(Math.abs(expiresAt - expected7d)).toBeLessThan(2000);
    });

    it('honors explicit expiresInDays', async () => {
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce(null);
      prisma.tenantInvitation.create.mockResolvedValueOnce(makeInvitation());

      const now = Date.now();
      await service.createInvitation(
        TENANT_A,
        USER_INVITER,
        { email: INVITEE_EMAIL, role: TenantRole.MEMBER, expiresInDays: 14 },
        META,
      );

      const writeCall = prisma.tenantInvitation.create.mock.calls[0][0];
      const expiresAt = (writeCall.data.expiresAt as Date).getTime();
      expect(Math.abs(expiresAt - (now + 14 * 86_400_000))).toBeLessThan(2000);
    });

    it('recovers from concurrent race (P2002) and returns existing', async () => {
      const racedExisting = makeInvitation({ id: 'inv-raced' });
      prisma.tenantInvitation.findFirst
        .mockResolvedValueOnce(null) // pre-create check sees nothing
        .mockResolvedValueOnce(racedExisting); // post-P2002 recovery sees raced row
      prisma.tenantInvitation.create.mockImplementationOnce(() => {
        throw new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        });
      });

      const result = await service.createInvitation(
        TENANT_A,
        USER_INVITER,
        { email: INVITEE_EMAIL, role: TenantRole.MEMBER },
        META,
      );

      expect(result.token).toBeNull();
      expect(result.id).toBe(racedExisting.id);
    });
  });

  describe('acceptInvitation', () => {
    const TOKEN = 'a'.repeat(43);
    const TOKEN_HASH = createHash('sha256').update(TOKEN).digest('hex');

    it('throws NotFoundException when token not found', async () => {
      prisma.tenantInvitation.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.acceptInvitation(
          { token: TOKEN },
          { id: USER_INVITEE, email: INVITEE_EMAIL },
          META,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('happy path: materializes membership + 2 audit events', async () => {
      const invitation = makeInvitation({ tokenHash: TOKEN_HASH });
      prisma.tenantInvitation.findUnique.mockResolvedValueOnce(invitation);
      prisma.tenantInvitation.update.mockResolvedValueOnce(invitation);
      const membership = {
        id: 'm-new',
        tenantId: TENANT_A,
        userId: USER_INVITEE,
        role: TenantRole.MEMBER,
        status: MembershipStatus.active,
      };
      prisma.tenantMembership.upsert.mockResolvedValueOnce(membership);

      const result = await service.acceptInvitation(
        { token: TOKEN },
        { id: USER_INVITEE, email: INVITEE_EMAIL },
        META,
      );

      expect(result.membershipId).toBe('m-new');
      expect(result.tenantId).toBe(TENANT_A);
      expect(audit.log).toHaveBeenCalledTimes(2);
      const actions = audit.log.mock.calls.map((c) => c[0].action);
      expect(actions).toEqual(
        expect.arrayContaining([
          AuditAction.TENANT_INVITATION_ACCEPTED,
          AuditAction.TENANT_MEMBERSHIP_CREATED,
        ]),
      );
    });

    it('expired: throws GoneException + emits EXPIRE_REJECTED audit', async () => {
      const invitation = makeInvitation({
        tokenHash: TOKEN_HASH,
        expiresAt: new Date(Date.now() - 1000),
      });
      prisma.tenantInvitation.findUnique.mockResolvedValueOnce(invitation);

      await expect(
        service.acceptInvitation(
          { token: TOKEN },
          { id: USER_INVITEE, email: INVITEE_EMAIL },
          META,
        ),
      ).rejects.toThrow(GoneException);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TENANT_INVITATION_EXPIRE_REJECTED,
        }),
      );
    });

    it('email mismatch: throws ForbiddenException + emits MISMATCH audit', async () => {
      const invitation = makeInvitation({ tokenHash: TOKEN_HASH });
      prisma.tenantInvitation.findUnique.mockResolvedValueOnce(invitation);

      await expect(
        service.acceptInvitation(
          { token: TOKEN },
          { id: USER_INVITEE, email: 'wrong@example.com' },
          META,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TENANT_INVITATION_EMAIL_MISMATCH_REJECTED,
        }),
      );
    });

    it('already-accepted by same user: idempotent 200', async () => {
      const invitation = makeInvitation({
        tokenHash: TOKEN_HASH,
        acceptedAt: new Date(),
      });
      prisma.tenantInvitation.findUnique.mockResolvedValueOnce(invitation);
      prisma.tenantMembership.findUnique.mockResolvedValueOnce({
        id: 'm-existing',
        role: TenantRole.MEMBER,
        status: MembershipStatus.active,
      });

      const result = await service.acceptInvitation(
        { token: TOKEN },
        { id: USER_INVITEE, email: INVITEE_EMAIL },
        META,
      );

      expect(result.membershipId).toBe('m-existing');
      expect(prisma.tenantMembership.upsert).not.toHaveBeenCalled();
    });

    it('already-accepted by different user: throws ConflictException', async () => {
      const invitation = makeInvitation({
        tokenHash: TOKEN_HASH,
        acceptedAt: new Date(),
      });
      prisma.tenantInvitation.findUnique.mockResolvedValueOnce(invitation);
      prisma.tenantMembership.findUnique.mockResolvedValueOnce(null); // different user has no membership

      await expect(
        service.acceptInvitation(
          { token: TOKEN },
          { id: 'someone-else', email: INVITEE_EMAIL },
          META,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('revokeInvitation', () => {
    it('hard-deletes pending invitation + emits audit', async () => {
      const invitation = makeInvitation();
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce(invitation);
      prisma.tenantInvitation.delete.mockResolvedValueOnce(invitation);

      await service.revokeInvitation(TENANT_A, 'inv-1', USER_INVITER, META);

      expect(prisma.tenantInvitation.delete).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TENANT_INVITATION_REVOKED,
        }),
      );
    });

    it('throws NotFoundException when invitation does not exist', async () => {
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.revokeInvitation(TENANT_A, 'nope', USER_INVITER, META),
      ).rejects.toMatchObject({
        name: 'NotFoundException',
        message: ErrorMessages.invitations.NOT_FOUND,
      });
    });

    it('throws ConflictException when invitation is already accepted', async () => {
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce(
        makeInvitation({ acceptedAt: new Date() }),
      );

      await expect(
        service.revokeInvitation(TENANT_A, 'inv-1', USER_INVITER, META),
      ).rejects.toThrow(ConflictException);
      expect(prisma.tenantInvitation.delete).not.toHaveBeenCalled();
    });
  });
});
