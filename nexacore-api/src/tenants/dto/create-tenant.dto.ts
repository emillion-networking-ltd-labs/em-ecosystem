import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export { TenantStatus } from '@prisma/client';

/**
 * DTO for creating a new Tenant.
 *
 * SCRUM-487 / AUTH v2 + Tenancy v1 — Phase 0.1.
 * See ai-specs/changes/auth/programs/AUTH-v2.md §2.
 */
export class CreateTenantDto {
  @ApiProperty({
    description:
      'URL-safe identifier for the tenant. Lowercase, starts with letter, ' +
      'alphanumeric + dashes. Used in slug-based routing and link generation.',
    example: 'acme-corp',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9-]*$/, {
    message:
      'slug must start with a lowercase letter and contain only lowercase ' +
      'alphanumeric characters and dashes',
  })
  @MaxLength(50)
  slug!: string;

  @ApiProperty({
    description: 'Human-readable display name for the tenant.',
    example: 'Acme Corporation',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Tenant lifecycle status. Defaults to "active" when omitted.',
    enum: ['active', 'trial', 'suspended', 'deleted'],
    required: false,
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'trial', 'suspended', 'deleted'] as const)
  status?: TenantStatus;

  @ApiProperty({
    description:
      'Subdomain identity for the tenant (SCRUM-495 / Phase 2.1 D-008). ' +
      'Defaults to `slug` if omitted. Used by SubdomainTenantResolverMiddleware ' +
      'to bind TenantContext at the request boundary.',
    required: false,
    example: 'acme-corp',
    minLength: 1,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9-]*$/, {
    message:
      'subdomain must start with a lowercase letter and contain only lowercase ' +
      'alphanumeric characters and dashes',
  })
  @MaxLength(50)
  subdomain?: string;
}
