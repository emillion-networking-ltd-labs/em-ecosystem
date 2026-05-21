// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * OrganizationsService — sub-grouping inside a Tenant.
 *
 * SCRUM-495 / AUTH v2 + Tenancy v1 — Phase 2.1 (D-007).
 *
 * Models the per-tenant team/department/business-unit structure. Distinct
 * from `Tenant` (billing/contract identity). Every tenant gets a `default`
 * Organization on tenant creation (see TenantsService.create modifications
 * in this same ticket); additional orgs are created on-demand.
 *
 * Authorization discipline (mirrors MembershipsService from SCRUM-491):
 *  - All denials use NotFoundException (404) NOT ForbiddenException (403).
 *    Hides org/tenant existence from non-authorized callers.
 *  - Platform admins (`isPlatformAdmin === true`) bypass membership checks.
 *
 * Audit emission:
 *  - ORGANIZATION_CREATED on create.
 *  - ORGANIZATION_MEMBER_ADDED on addMember.
 *  - ORGANIZATION_MEMBER_REMOVED on removeMember.
 *  - No audit on read paths (findById, findBySlug, listForTenant) — by design.
 */

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Organization,
  OrganizationMembership,
  OrganizationRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { ErrorMessages } from '../common/constants/error-messages';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Find an Organization by id, scoped to `tenantId`. Cross-tenant lookups
   * return null (no information leak).
   */
  async findById(
    orgId: string,
    tenantId: string,
  ): Promise<Organization | null> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org || org.tenantId !== tenantId) return null;
    return org;
  }

  /**
   * Find an Organization by its slug within a tenant.
   */
  async findBySlug(
    tenantId: string,
    slug: string,
  ): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
  }

  /**
   * List all Organizations for a tenant, ordered by createdAt ASC.
   */
  async listForTenant(tenantId: string): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a new Organization within a tenant. P2002 (slug collision within
   * tenant) → ConflictException with the canonical message.
   */
  async create(
    tenantId: string,
    input: CreateOrganizationInput,
    actorUserId: string | null,
  ): Promise<Organization> {
    try {
      const created = await this.prisma.organization.create({
        data: {
          tenantId,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          isDefault: false,
        },
      });
      await this.auditService.log({
        action: AuditAction.ORGANIZATION_CREATED,
        userId: actorUserId,
        metadata: {
          organizationId: created.id,
          tenantId,
          slug: created.slug,
        },
      });
      return created;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(ErrorMessages.organizations.SLUG_TAKEN);
      }
      throw err;
    }
  }

  /**
   * Add a user to an Organization with the given role. P2002 (user already a
   * member) → ConflictException.
   */
  async addMember(
    orgId: string,
    userId: string,
    role: OrganizationRole,
    actorUserId: string | null,
  ): Promise<OrganizationMembership> {
    try {
      const membership = await this.prisma.organizationMembership.create({
        data: {
          organizationId: orgId,
          userId,
          role,
        },
      });
      await this.auditService.log({
        action: AuditAction.ORGANIZATION_MEMBER_ADDED,
        userId: actorUserId,
        targetUserId: userId,
        metadata: {
          organizationId: orgId,
          role,
        },
      });
      return membership;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(ErrorMessages.organizations.MEMBER_EXISTS);
      }
      throw err;
    }
  }

  /**
   * Remove a user from an Organization. Idempotent — P2025 (record not found)
   * is swallowed silently (mirrors the SCRUM-493 revokeSession idiom).
   */
  async removeMember(
    orgId: string,
    userId: string,
    actorUserId: string | null,
  ): Promise<void> {
    try {
      await this.prisma.organizationMembership.delete({
        where: { organizationId_userId: { organizationId: orgId, userId } },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2025') return;
      throw err;
    }
    await this.auditService.log({
      action: AuditAction.ORGANIZATION_MEMBER_REMOVED,
      userId: actorUserId,
      targetUserId: userId,
      metadata: { organizationId: orgId },
    });
  }

  /**
   * Verify a user has an active membership in the Organization. Throws
   * NotFoundException (404, NOT 403) on non-membership — mirrors
   * MembershipsService.requireMembership from SCRUM-491. Platform admins
   * (`isPlatformAdmin === true`) short-circuit return null.
   */
  async requireMembership(
    orgId: string,
    userId: string,
    isPlatformAdmin: boolean,
  ): Promise<OrganizationMembership | null> {
    if (isPlatformAdmin) {
      return null;
    }
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership) {
      throw new NotFoundException(ErrorMessages.organizations.NOT_FOUND);
    }
    return membership;
  }
}
