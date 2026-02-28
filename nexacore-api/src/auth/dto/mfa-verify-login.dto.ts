import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MfaVerifyLoginDto {
  @ApiProperty({
    description: 'Temporary MFA challenge token from login response',
  })
  @IsString()
  mfaToken: string;

  @ApiPropertyOptional({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'TOTP code must contain only digits' })
  code?: string;

  @ApiPropertyOptional({
    description: 'Single-use recovery code (if TOTP unavailable)',
    example: 'a1b2c3d4e5',
  })
  @IsOptional()
  @IsString()
  recoveryCode?: string;
}
