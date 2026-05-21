import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InvitationsService } from './invitations.service';
import { MembershipsService } from './memberships.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { SubdomainTenantResolverMiddleware } from './middleware/subdomain-tenant-resolver.middleware';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

/**
 * TenantsModule — multi-tenant primitives.
 *
 * SCRUM-487 (Phase 0.1) — module created with TenantsService.
 * SCRUM-491 (Phase 0.4) — adds TenantsController, InvitationsService,
 *   MembershipsService, and AuditModule import.
 * SCRUM-495 (Phase 2.1) — adds OrganizationsService + OrganizationsController
 *   (D-007) and SubdomainTenantResolverMiddleware (D-008). Middleware is
 *   registered globally via NestModule.configure → applies to every request
 *   pipeline; skip-paths for localhost/health/metrics live inside the
 *   middleware body.
 *
 * See ai-specs/changes/auth/programs/AUTH-v2.md §2 + §5 D-007/D-008.
 *
 * @Global because TenantsService + MembershipsService + OrganizationsService
 * are consumed by downstream phases (AUTH v2 Phase 2 AuthIntent, permissions
 * tenant-scoping, business entities gaining tenancy). PrismaModule is already
 * global, so we only declare AuditModule here (it is not @Global).
 */
@Global()
@Module({
  imports: [AuditModule],
  controllers: [TenantsController, OrganizationsController],
  providers: [
    TenantsService,
    InvitationsService,
    MembershipsService,
    OrganizationsService,
    SubdomainTenantResolverMiddleware,
  ],
  exports: [TenantsService, MembershipsService, OrganizationsService],
})
export class TenantsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // SCRUM-495 / Phase 2.1 (D-008): bind TenantContext at the request
    // boundary from the Host's subdomain. Skip-paths handled inside the
    // middleware body (localhost, /health, /metrics, platform-admin canonical).
    consumer.apply(SubdomainTenantResolverMiddleware).forRoutes('*');
  }
}
