import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaRegenerateCodesDto {
  @ApiProperty({
    description: 'Current account password for confirmation',
    example: 'SecureP@ss1',
  })
  @IsString()
  password: string;
}
