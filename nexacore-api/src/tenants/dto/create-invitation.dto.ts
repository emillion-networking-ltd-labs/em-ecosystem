import { ApiProperty } from '@nestjs/swagger';
import { TenantRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export { TenantRole } from '@prisma/client';

/**
 * DTO for POST /tenants/:tenantId/invitations.
 *
 * SCRUM-491 / AUTH v2 + Tenancy v1 — Phase 0.4.
 * See ai-specs/changes/tenants/plans/Sprint 15/SCRUM-491_backend.md §5.7.
 */
export class CreateInvitationDto {
  @ApiProperty({
    description:
      'Email of the invitee. Stored lower-cased for idempotent lookup.',
    example: 'alice@acme.com',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    description: 'Tenant role assigned on acceptance.',
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER', 'CUSTOM'],
    example: 'MEMBER',
  })
  @IsEnum(TenantRole)
  role!: TenantRole;

  @ApiProperty({
    description:
      'Invitation TTL in days. Defaults to 7 when omitted; bounded [1, 30].',
    required: false,
    minimum: 1,
    maximum: 30,
    example: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
