import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrustDeviceDto {
  @ApiProperty({
    description: 'Device fingerprint hash',
    minLength: 16,
    maxLength: 512,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(16)
  @MaxLength(512)
  fingerprint!: string;

  @ApiProperty({
    description: 'Current account password for re-authentication',
    example: 'SecureP@ss1',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
