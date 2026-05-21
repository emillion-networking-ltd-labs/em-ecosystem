// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * OrganizationsController — Organization HTTP surface.
 *
 * SCRUM-495 / AUTH v2 + Tenancy v1 — Phase 2.1 (D-007).
 *
 * Phase 2.1 ships read paths + create + addMember. Remove-member and full
 * CRUD surface ship in Phase 2.3 (dashboard wiring) per /plan Open Decision #2.
 *
 * Authorization (mirrors TenantsController from SCRUM-491):
 *  - JwtAuthGuard at class level — all endpoints require an authenticated user.
 *  - Service-layer authorization via MembershipsService.requireTenantRole
 *    (404, not 403, on insufficient role — hides tenant existence).
 *  - Platform admins (`req.user.isPlatformAdmin === true`) bypass tenant
 *    role checks.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantRole } from '@prisma/client';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ErrorMessages } from '../common/constants/error-messages';
import { AddOrganizationMemberDto } from './dto/add-organization-member.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { MembershipsService } from './memberships.service';
import { OrganizationsService } from './organizations.service';
import { TenantsService } from './tenants.service';

type AuthRequest = Request & {
  user: { id: string; sub?: string; isPlatformAdmin?: boolean };
};

function toResponse(org: {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}): OrganizationResponseDto {
  return {
    id: org.id,
    tenantId: org.tenantId,
    name: org.name,
    slug: org.slug,
    description: org.description,
    isDefault: org.isDefault,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  };
}

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class OrganizationsController {
  constructor(
    private readonly organizations: OrganizationsService,
    private readonly memberships: MembershipsService,
    private readonly tenants: TenantsService,
  ) {}

  @Get('tenants/:tenantId/organizations')
  @ApiOperation({ summary: 'List organizations within a tenant' })
  @ApiResponse({ status: 200, type: [OrganizationResponseDto] })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found or no membership',
  })
  async listForTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Req() req: AuthRequest,
  ): Promise<OrganizationResponseDto[]> {
    const userId = req.user.id ?? req.user.sub!;
    const isPlatformAdmin = req.user.isPlatformAdmin ?? false;
    // 404 if user is not a member (hides tenant existence).
    await this.memberships.requireMembership(tenantId, userId, isPlatformAdmin);
    // Confirm tenant exists (defensive — requireMembership returns null for
    // platform admins without checking tenant existence).
    if (isPlatformAdmin) {
      const tenant = await this.tenants.findById(tenantId);
      if (!tenant) {
        throw new NotFoundException(ErrorMessages.tenants.NOT_FOUND);
      }
    }
    const orgs = await this.organizations.listForTenant(tenantId);
    return orgs.map(toResponse);
  }

  @Get('tenants/:tenantId/organizations/:orgId')
  @ApiOperation({ summary: 'Get organization by id (tenant-scoped)' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findById(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthRequest,
  ): Promise<OrganizationResponseDto> {
    const userId = req.user.id ?? req.user.sub!;
    const isPlatformAdmin = req.user.isPlatformAdmin ?? false;
    await this.memberships.requireMembership(tenantId, userId, isPlatformAdmin);
    const org = await this.organizations.findById(orgId, tenantId);
    if (!org) {
      throw new NotFoundException(ErrorMessages.organizations.NOT_FOUND);
    }
    return toResponse(org);
  }

  @Post('tenants/:tenantId/organizations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new organization within a tenant (OWNER or ADMIN only)',
  })
  @ApiResponse({ status: 201, type: OrganizationResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found or insufficient role',
  })
  @ApiResponse({ status: 409, description: 'Organization slug already in use' })
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateOrganizationDto,
    @Req() req: AuthRequest,
  ): Promise<OrganizationResponseDto> {
    const userId = req.user.id ?? req.user.sub!;
    const isPlatformAdmin = req.user.isPlatformAdmin ?? false;
    // 404 if user is not a tenant OWNER/ADMIN (hides existence).
    await this.memberships.requireTenantRole(
      tenantId,
      userId,
      [TenantRole.OWNER, TenantRole.ADMIN],
      isPlatformAdmin,
    );
    const created = await this.organizations.create(tenantId, dto, userId);
    return toResponse(created);
  }

  @Post('organizations/:orgId/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Add a user to an organization (org OWNER/ADMIN or platform admin)',
  })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({
    status: 404,
    description: 'Organization not found or insufficient role',
  })
  @ApiResponse({ status: 409, description: 'User already a member' })
  async addMember(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: AddOrganizationMemberDto,
    @Req() req: AuthRequest,
  ): Promise<{
    id: string;
    organizationId: string;
    userId: string;
    role: string;
  }> {
    const actorId = req.user.id ?? req.user.sub!;
    const isPlatformAdmin = req.user.isPlatformAdmin ?? false;
    // Caller must already be a member of the org with OWNER/ADMIN role
    // (or be platform admin).
    if (!isPlatformAdmin) {
      const callerMembership = await this.organizations.requireMembership(
        orgId,
        actorId,
        false,
      );
      if (
        !callerMembership ||
        (callerMembership.role !== 'OWNER' && callerMembership.role !== 'ADMIN')
      ) {
        throw new NotFoundException(ErrorMessages.organizations.NOT_FOUND);
      }
    }
    const membership = await this.organizations.addMember(
      orgId,
      dto.userId,
      dto.role,
      actorId,
    );
    return {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
    };
  }
}
