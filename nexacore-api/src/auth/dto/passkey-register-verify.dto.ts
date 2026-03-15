import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PasskeyRegisterVerifyDto {
  @ApiProperty({ description: 'WebAuthn credential response object' })
  @IsObject()
  credential!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Display name for the passkey',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64, { message: 'Passkey name must not exceed 64 characters' })
  name?: string;
}
