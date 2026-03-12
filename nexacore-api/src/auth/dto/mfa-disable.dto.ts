import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaDisableDto {
  @ApiProperty({
    description: 'Current account password for confirmation',
    example: 'SecureP@ss1',
  })
  @IsString()
  password!: string;
}
