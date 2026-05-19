import { ApiProperty } from '@nestjs/swagger';
import { MembershipStatus, TenantRole } from '@prisma/client';

/**
 * Response shape for GET /tenants/:tenantId/members.
 *
 * SCRUM-491 / AUTH v2 + Tenancy v1 — Phase 0.4.
 */
export class MemberResponseDto {
  @ApiProperty({ description: 'User id (UUID).' })
  userId!: string;

  @ApiProperty({ description: 'User email at the time of the query.' })
  email!: string;

  @ApiProperty({
    description: 'Member role within this tenant.',
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER', 'CUSTOM'],
  })
  role!: TenantRole;

  @ApiProperty({
    description: 'Membership lifecycle status.',
    enum: ['active', 'invited', 'suspended'],
  })
  status!: MembershipStatus;

  @ApiProperty({ description: 'Timestamp the user joined this tenant.' })
  joinedAt!: Date;

  @ApiProperty({ description: 'Last time the user was active in this tenant.' })
  lastActiveAt!: Date;
}

export class MemberListResponseDto {
  @ApiProperty({ type: [MemberResponseDto] })
  data!: MemberResponseDto[];

  @ApiProperty({ description: 'Current 1-based page number.' })
  page!: number;

  @ApiProperty({ description: 'Page size used for this request.' })
  pageSize!: number;

  @ApiProperty({
    description: 'Total membership rows for this tenant (across pages).',
  })
  total!: number;
}
