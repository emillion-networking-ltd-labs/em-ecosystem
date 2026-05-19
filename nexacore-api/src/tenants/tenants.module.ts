import { Global, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InvitationsService } from './invitations.service';
import { MembershipsService } from './memberships.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

/**
 * TenantsModule — multi-tenant primitives.
 *
 * SCRUM-487 (Phase 0.1) — module created with TenantsService.
 * SCRUM-491 (Phase 0.4) — adds TenantsController, InvitationsService,
 *   MembershipsService, and AuditModule import.
 *
 * See ai-specs/changes/auth/programs/AUTH-v2.md §2.
 *
 * @Global because TenantsService + MembershipsService are consumed by
 * downstream phases (AUTH v2 Phase 1 JWT v2, permissions tenant-scoping,
 * business entities gaining tenancy). PrismaModule is already global, so we
 * only declare AuditModule here (it is not @Global).
 */
@Global()
@Module({
  imports: [AuditModule],
  controllers: [TenantsController],
  providers: [TenantsService, InvitationsService, MembershipsService],
  exports: [TenantsService, MembershipsService],
})
export class TenantsModule {}
