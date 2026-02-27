import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaVerifySetupDto {
  @ApiProperty({
    description: '6-digit TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  token: string;
}
