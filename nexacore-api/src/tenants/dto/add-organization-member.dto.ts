import { ApiProperty } from '@nestjs/swagger';
import { OrganizationRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * DTO for adding a user to an Organization.
 *
 * SCRUM-495 / AUTH v2 + Tenancy v1 — Phase 2.1 (D-007).
 */
export class AddOrganizationMemberDto {
  @ApiProperty({
    description: 'User id (UUID) to add as a member of the organization.',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Role to assign within the organization.',
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
    example: 'MEMBER',
  })
  @IsEnum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const)
  role!: OrganizationRole;
}
