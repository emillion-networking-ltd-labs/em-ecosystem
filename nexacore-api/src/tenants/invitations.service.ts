/**
 * InvitationsService — lifecycle for TenantInvitation rows.
 *
 * SCRUM-491 / AUTH v2 + Tenancy v1 — Phase 0.4.
 * See ai-specs/changes/tenants/plans/Sprint 15/SCRUM-491_backend.md §5.2-5.4.
 *
 * Responsibilities:
 *   - createInvitation (idempotent under concurrency via partial unique index)
 *   - acceptInvitation (token lookup in bypass scope; expire + email-mismatch
 *     rejections audited; membership materialized in $transaction)
 *   - revokeInvitation (hard-delete; audit row carries evidence)
 */

import { randomBytes, createHash } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipStatus,
  Prisma,
  TenantInvitation,
  TenantRole,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { ErrorMessages } from '../common/constants/error-messages';
import { TenantContext } from '../common/context/tenant-context';
import { PrismaService } from '../prisma/prisma.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AcceptResultDto {
  membershipId: string;
  tenantId: string;
  role: TenantRole;
  status: MembershipStatus;
}

const DEFAULT_EXPIRES_IN_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function hashToken(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}

function generateToken(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(32).toString('base64url');
  return { plaintext, hash: hashToken(plaintext) };
}

function toResponseDto(
  invitation: TenantInvitation,
  opts: { token: string | null },
): InvitationResponseDto {
  return {
    id: invitation.id,
    tenantId: invitation.tenantId,
    email: invitation.email,
    role: invitation.role,
    token: opts.token,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
  };
}

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create or return-existing a pending invitation for `(tenantId, email)`.
   *
   * Idempotency layers:
   *   1. Service-level findFirst for happy-path (no race).
   *   2. DB partial unique index (`uniq_tenant_invitation_pending`) for race
   *      window between findFirst and create — caught via P2002 and recovered.
   */
  async createInvitation(
    tenantId: string,
    invitedBy: string,
    dto: CreateInvitationDto,
    meta: RequestMeta,
  ): Promise<InvitationResponseDto> {
    const normalizedEmail = dto.email.toLowerCase();

    const existing = await this.prisma.tenantInvitation.findFirst({
      where: {
        tenantId,
        email: normalizedEmail,
        acceptedAt: null,
      },
    });
    if (existing) {
      return toResponseDto(existing, { token: null });
    }

    const { plaintext, hash } = generateToken();
    const expiresAt = new Date(
      Date.now() + (dto.expiresInDays ?? DEFAULT_EXPIRES_IN_DAYS) * MS_PER_DAY,
    );

    try {
      const invitation = await this.prisma.tenantInvitation.create({
        data: {
          tenantId,
          email: normalizedEmail,
          role: dto.role,
          tokenHash: hash,
          invitedBy,
          expiresAt,
        },
      });
      await this.audit.log({
        action: AuditAction.TENANT_INVITATION_CREATED,
        userId: invitedBy,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: {
          invitationId: invitation.id,
          tenantId,
          targetEmail: normalizedEmail,
          role: dto.role,
          expiresAt: expiresAt.toISOString(),
        },
      });
      return toResponseDto(invitation, { token: plaintext });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const racedExisting = await this.prisma.tenantInvitation.findFirst({
          where: {
            tenantId,
            email: normalizedEmail,
            acceptedAt: null,
          },
        });
        if (racedExisting) {
          return toResponseDto(racedExisting, { token: null });
        }
      }
      throw err;
    }
  }

  /**
   * Accept an invitation by its plaintext token.
   *
   * Flow:
   *   1. Hash token, look up invitation in bypass scope (no tenant context yet).
   *   2. If acceptedAt is set: idempotent return if same user, ConflictException otherwise.
   *   3. If expired: emit expire-reject audit + GoneException.
   *   4. If email mismatch: emit mismatch-reject audit + ForbiddenException.
   *   5. Materialize/refresh membership in TenantContext.run + $transaction +
   *      emit accepted + membership-created audits.
   */
  async acceptInvitation(
    dto: AcceptInvitationDto,
    user: { id: string; email: string },
    meta: RequestMeta,
  ): Promise<AcceptResultDto> {
    const hash = hashToken(dto.token);

    const invitation = await TenantContext.runWithBypass(
      'invitation-token-lookup',
      () =>
        this.prisma.tenantInvitation.findUnique({ where: { tokenHash: hash } }),
    );

    if (!invitation) {
      throw new NotFoundException(ErrorMessages.invitations.NOT_FOUND);
    }

    if (invitation.acceptedAt) {
      const existing = (await TenantContext.runWithBypass(
        'invitation-token-lookup',
        () =>
          this.prisma.tenantMembership.findUnique({
            where: {
              tenantId_userId: {
                tenantId: invitation.tenantId,
                userId: user.id,
              },
            },
          }),
      )) as { id: string; role: TenantRole; status: MembershipStatus } | null;

      if (existing && existing.status === MembershipStatus.active) {
        return {
          membershipId: existing.id,
          tenantId: invitation.tenantId,
          role: existing.role,
          status: existing.status,
        };
      }
      throw new ConflictException(ErrorMessages.invitations.ALREADY_ACCEPTED);
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.audit.log({
        action: AuditAction.TENANT_INVITATION_EXPIRE_REJECTED,
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: {
          invitationId: invitation.id,
          tenantId: invitation.tenantId,
          expiresAt: invitation.expiresAt.toISOString(),
        },
      });
      throw new GoneException(ErrorMessages.invitations.EXPIRED);
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      await this.audit.log({
        action: AuditAction.TENANT_INVITATION_EMAIL_MISMATCH_REJECTED,
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: {
          invitationId: invitation.id,
          tenantId: invitation.tenantId,
          expectedEmail: invitation.email,
          actualEmail: user.email,
        },
      });
      throw new ForbiddenException(ErrorMessages.invitations.EMAIL_MISMATCH);
    }

    return await TenantContext.run(invitation.tenantId, async () => {
      const acceptedAt = new Date();
      const membership = await this.prisma.$transaction(async (tx) => {
        await tx.tenantInvitation.update({
          where: { id: invitation.id },
          data: { acceptedAt },
        });
        return tx.tenantMembership.upsert({
          where: {
            tenantId_userId: {
              tenantId: invitation.tenantId,
              userId: user.id,
            },
          },
          create: {
            tenantId: invitation.tenantId,
            userId: user.id,
            role: invitation.role,
            status: MembershipStatus.active,
            invitedBy: invitation.invitedBy,
            joinedAt: acceptedAt,
            lastActiveAt: acceptedAt,
          },
          update: {
            role: invitation.role,
            status: MembershipStatus.active,
            lastActiveAt: acceptedAt,
          },
        });
      });

      await this.audit.log({
        action: AuditAction.TENANT_INVITATION_ACCEPTED,
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: {
          invitationId: invitation.id,
          tenantId: invitation.tenantId,
          membershipId: membership.id,
          role: membership.role,
        },
      });
      await this.audit.log({
        action: AuditAction.TENANT_MEMBERSHIP_CREATED,
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: {
          membershipId: membership.id,
          tenantId: invitation.tenantId,
          role: membership.role,
          invitationId: invitation.id,
        },
      });

      return {
        membershipId: membership.id,
        tenantId: invitation.tenantId,
        role: membership.role,
        status: membership.status,
      };
    });
  }

  /**
   * Hard-delete a pending invitation. Already-accepted invitations cannot be revoked
   * (use member removal in Phase 2+ instead). Returns void; audit log is the evidence.
   */
  async revokeInvitation(
    tenantId: string,
    invitationId: string,
    revokerId: string,
    meta: RequestMeta,
  ): Promise<void> {
    const invitation = await this.prisma.tenantInvitation.findFirst({
      where: { id: invitationId, tenantId },
    });
    if (!invitation) {
      throw new NotFoundException(ErrorMessages.invitations.NOT_FOUND);
    }
    if (invitation.acceptedAt) {
      throw new ConflictException(ErrorMessages.invitations.ALREADY_ACCEPTED);
    }

    await this.prisma.tenantInvitation.delete({ where: { id: invitationId } });

    await this.audit.log({
      action: AuditAction.TENANT_INVITATION_REVOKED,
      userId: revokerId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        invitationId,
        tenantId,
        targetEmail: invitation.email,
      },
    });
  }
}
