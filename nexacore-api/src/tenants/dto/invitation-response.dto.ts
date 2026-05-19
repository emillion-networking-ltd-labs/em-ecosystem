import { ApiProperty } from '@nestjs/swagger';
import { TenantRole } from '@prisma/client';

/**
 * Response shape for invitation endpoints.
 *
 * SCRUM-491 / AUTH v2 + Tenancy v1 — Phase 0.4.
 *
 * `token` carries the plaintext value ONCE on a fresh createInvitation. On
 * idempotent duplicate (same `(tenantId, email)` pending invitation already
 * exists), `token` is `null` — the original plaintext is irrecoverable and
 * the caller must coordinate out-of-band with whoever created the original.
 */
export class InvitationResponseDto {
  @ApiProperty({ description: 'Invitation id (UUID).' })
  id!: string;

  @ApiProperty({ description: 'Tenant id this invitation belongs to.' })
  tenantId!: string;

  @ApiProperty({ description: 'Email of the invitee (lower-cased).' })
  email!: string;

  @ApiProperty({
    description: 'Role to be assigned on acceptance.',
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER', 'CUSTOM'],
  })
  role!: TenantRole;

  @ApiProperty({
    description:
      'Plain-text token. NON-NULL only on a fresh create; null on idempotent duplicate.',
    nullable: true,
  })
  token!: string | null;

  @ApiProperty({ description: 'Expiration timestamp (ISO 8601).' })
  expiresAt!: Date;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601).' })
  createdAt!: Date;
}
