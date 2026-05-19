import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

/**
 * DTO for POST /tenants/invitations/accept.
 *
 * SCRUM-491 / AUTH v2 + Tenancy v1 — Phase 0.4.
 *
 * The token is a 43-char base64url string (32 bytes of CSPRNG); the [40, 64]
 * Length window allows the canonical 43-char value plus minor format
 * variations for forward compatibility without churning the DTO.
 */
export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Plain-text invitation token (43-char base64url).',
    minLength: 40,
    maxLength: 64,
  })
  @IsString()
  @Length(40, 64)
  token!: string;
}
