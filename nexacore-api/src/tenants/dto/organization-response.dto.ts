import { ApiProperty } from '@nestjs/swagger';

/**
 * Response shape for Organization endpoints.
 *
 * SCRUM-495 / AUTH v2 + Tenancy v1 — Phase 2.1.
 */
export class OrganizationResponseDto {
  @ApiProperty({ description: 'Organization id (UUID).' })
  id!: string;

  @ApiProperty({ description: 'Tenant id this organization belongs to.' })
  tenantId!: string;

  @ApiProperty({ description: 'Human-readable display name.' })
  name!: string;

  @ApiProperty({ description: 'URL-safe slug, unique within tenant.' })
  slug!: string;

  @ApiProperty({ description: 'Optional description.', nullable: true })
  description!: string | null;

  @ApiProperty({
    description: 'True for the auto-created default organization per tenant.',
  })
  isDefault!: boolean;

  @ApiProperty({ description: 'Creation timestamp.' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last-updated timestamp.' })
  updatedAt!: Date;
}
