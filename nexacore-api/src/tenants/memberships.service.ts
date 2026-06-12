/**
 * MembershipsService — TenantMembership read + authorization helpers.
 *
 * SCRUM-491 / AUTH v2 + Tenancy v1 — Phase 0.4.
 * See the SCRUM-491 plan §5.6.
 *
 * Responsibilities:
 *   - requireMembership: throws 404 (hides tenant existence) when caller is not an active member.
 *   - requireTenantRole: requireMembership + role-set check; returns the membership when allowed.
 *   - listMembers: paginated listing of memberships for a tenant.
 *
 * Platform-admin (`isPlatformAdmin === true`) callers bypass the membership check.
 * Cross-tenant access by platform admins remains gated by the SCRUM-488 Prisma extension
 * unless an explicit bypass scope wraps the underlying call.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipStatus, TenantMembership, TenantRole } from '@prisma/client';
import { ErrorMessages } from '../common/constants/error-messages';
import { TenantContext } from '../common/context/tenant-context';
import { PrismaService } from '../prisma/prisma.service';
import {
  MemberListResponseDto,
  MemberResponseDto,
} from './dto/member-response.dto';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify the caller has an active TenantMembership in :tenantId.
   *
   * Returns the membership row when verified. Throws NotFoundException (404)
   * when not — deliberately 404, not 403, to hide tenant existence from
   * non-members (GitHub/Linear convention; see plan §1 decision Q1).
   *
   * Platform admins (`isPlatformAdmin`) bypass the membership requirement. The
   * helper does NOT synthesize a membership row for platform admins; callers
   * that need the role for further checks must short-circuit via the
   * `isPlatformAdmin` parameter on `requireTenantRole`.
   */
  async requireMembership(
    tenantId: string,
    userId: string,
    isPlatformAdmin: boolean,
  ): Promise<TenantMembership | null> {
    if (isPlatformAdmin) {
      return null;
    }
    const membership = await TenantContext.runWithBypass(
      'membership-check',
      () =>
        this.prisma.tenantMembership.findUnique({
          where: { tenantId_userId: { tenantId, userId } },
        }),
    );

    if (!membership || membership.status !== MembershipStatus.active) {
      throw new NotFoundException(ErrorMessages.tenants.NOT_FOUND);
    }
    return membership;
  }

  /**
   * Verify the caller has an active membership AND that membership's role is in
   * `allowedRoles`. Throws NotFoundException (404) on either failure.
   *
   * 404 (not 403) for the wrong-role case is deliberate: keeps the response
   * indistinguishable from cross-tenant access, denying information about role
   * structure to non-authorized callers.
   */
  async requireTenantRole(
    tenantId: string,
    userId: string,
    allowedRoles: TenantRole[],
    isPlatformAdmin: boolean,
  ): Promise<TenantMembership | null> {
    if (isPlatformAdmin) {
      return null;
    }
    const membership = await this.requireMembership(
      tenantId,
      userId,
      isPlatformAdmin,
    );
    // membership is non-null here because requireMembership only returns null for platform admins.
    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new NotFoundException(ErrorMessages.tenants.NOT_FOUND);
    }
    return membership;
  }

  /**
   * List members of a tenant, paginated.
   *
   * Tenant scoping is enforced by the SCRUM-488 Prisma extension when wrapped
   * in `TenantContext.run(tenantId, ...)` by the controller. This method itself
   * relies on the active context being set.
   */
  async listMembers(
    tenantId: string,
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE,
  ): Promise<MemberListResponseDto> {
    const effectivePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const effectivePage = Math.max(1, page);

    const [rows, total] = await Promise.all([
      this.prisma.tenantMembership.findMany({
        where: { tenantId },
        include: { user: { select: { email: true } } },
        orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
        skip: (effectivePage - 1) * effectivePageSize,
        take: effectivePageSize,
      }),
      this.prisma.tenantMembership.count({ where: { tenantId } }),
    ]);

    const data: MemberResponseDto[] = rows.map((row) => ({
      userId: row.userId,
      email: row.user.email,
      role: row.role,
      status: row.status,
      joinedAt: row.joinedAt,
      lastActiveAt: row.lastActiveAt,
    }));

    return {
      data,
      page: effectivePage,
      pageSize: effectivePageSize,
      total,
    };
  }
}
