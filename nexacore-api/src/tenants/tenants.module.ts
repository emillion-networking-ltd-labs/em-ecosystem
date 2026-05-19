import { Global, Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';

/**
 * TenantsModule — multi-tenant primitives.
 *
 * SCRUM-487 / AUTH v2 + Tenancy v1 program — Phase 0.1.
 * See ai-specs/changes/auth/programs/AUTH-v2.md §2.
 *
 * @Global because TenantsService will be consumed cross-module by AUTH v2
 * (Phase 1), permissions tenant-scoping (Phase 1), and every business entity
 * gaining tenancy (future sprints). PrismaModule is already global, so this
 * module declares no explicit imports.
 */
@Global()
@Module({
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
