/**
 * TenantsController — HTTP surface for Phase 0.4.
 *
 * SCRUM-491 / AUTH v2 + Tenancy v1 — Phase 0.4.
 * See ai-specs/changes/tenants/plans/Sprint 15/SCRUM-491_backend.md §5.1.
 *
 * Routes:
 *   POST   /tenants/:tenantId/invitations             createInvitation
 *   POST   /tenants/invitations/accept                acceptInvitation
 *   DELETE /tenants/:tenantId/invitations/:id         revokeInvitation
 *   GET    /tenants/:tenantId/members                 listMembers
 *
 * Authorization model:
 *   - All routes require a valid JWT (JwtAuthGuard).
 *   - Tenant-role checks are SERVICE-LAYER (MembershipsService.requireTenantRole)
 *     because NestJS guards do not have clean access to URL params; service
 *     helpers consume the resolved :tenantId path param.
 *   - Cross-tenant access returns 404 (not 403) to hide tenant existence.
 *   - Platform admins (`req.user.isPlatformAdmin === true`) bypass tenant-role
 *     checks at the controller layer. SCRUM-488 middleware still gates Prisma
 *     queries unless an explicit bypass scope is used.
 *
 * Tenant context propagation:
 *   - Each handler wraps the service call in TenantContext.run(:tenantId, ...)
 *     so the SCRUM-488 extension sees the active tenant for scoped queries.
 *   - acceptInvitation is the exception — it manages its own bypass-then-run
 *     sequence internally because the user does not know the tenant before
 *     redeeming the token.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../users/enums/role.enum';
import { TenantRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { THROTTLE_CONFIGS } from '../auth/constants/auth.constants';
import { TenantContext } from '../common/context/tenant-context';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { MemberListResponseDto } from './dto/member-response.dto';
import {
  AcceptResultDto,
  InvitationsService,
  RequestMeta,
} from './invitations.service';
import { MembershipsService } from './memberships.service';

type AuthenticatedReq = {
  user: {
    id: string;
    email: string;
    role: Role;
    isPlatformAdmin: boolean;
  };
  ip?: string;
  headers?: Record<string, string>;
};

function extractMeta(req: AuthenticatedReq): RequestMeta {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.headers?.['user-agent'] ?? null,
  };
}

const TENANT_ADMIN_ROLES = [TenantRole.OWNER, TenantRole.ADMIN];

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(
    private readonly invitations: InvitationsService,
    private readonly memberships: MembershipsService,
  ) {}

  @Post(':tenantId/invitations')
  @HttpCode(HttpStatus.CREATED)
  @Throttle(THROTTLE_CONFIGS.sensitiveAction)
  async createInvitation(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateInvitationDto,
    @Request() req: AuthenticatedReq,
  ): Promise<InvitationResponseDto> {
    await this.memberships.requireTenantRole(
      tenantId,
      req.user.id,
      TENANT_ADMIN_ROLES,
      req.user.isPlatformAdmin,
    );

    return await TenantContext.run(tenantId, () =>
      this.invitations.createInvitation(
        tenantId,
        req.user.id,
        dto,
        extractMeta(req),
      ),
    );
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @Throttle(THROTTLE_CONFIGS.sensitiveAction)
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
    @Request() req: AuthenticatedReq,
  ): Promise<AcceptResultDto> {
    return this.invitations.acceptInvitation(
      dto,
      { id: req.user.id, email: req.user.email },
      extractMeta(req),
    );
  }

  @Delete(':tenantId/invitations/:invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeInvitation(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Request() req: AuthenticatedReq,
  ): Promise<void> {
    await this.memberships.requireTenantRole(
      tenantId,
      req.user.id,
      TENANT_ADMIN_ROLES,
      req.user.isPlatformAdmin,
    );

    await TenantContext.run(tenantId, () =>
      this.invitations.revokeInvitation(
        tenantId,
        invitationId,
        req.user.id,
        extractMeta(req),
      ),
    );
  }

  @Get(':tenantId/members')
  async listMembers(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Request() req: AuthenticatedReq,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ): Promise<MemberListResponseDto> {
    await this.memberships.requireMembership(
      tenantId,
      req.user.id,
      req.user.isPlatformAdmin,
    );

    return await TenantContext.run(tenantId, () =>
      this.memberships.listMembers(tenantId, page, pageSize),
    );
  }
}
