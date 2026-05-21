import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating an Organization inside a tenant.
 *
 * SCRUM-495 / AUTH v2 + Tenancy v1 — Phase 2.1 (D-007).
 */
export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Human-readable display name for the organization.',
    example: 'Engineering',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description:
      'URL-safe identifier for the organization. Unique within the tenant ' +
      '(not globally). Lowercase, starts with letter, alphanumeric + dashes.',
    example: 'engineering',
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
    description: 'Optional organization description.',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
