import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './create-tenant.dto';

/**
 * DTO for partial Tenant updates. All fields optional.
 *
 * SCRUM-487 / AUTH v2 + Tenancy v1 — Phase 0.1.
 */
export class UpdateTenantDto extends PartialType(CreateTenantDto) {}
