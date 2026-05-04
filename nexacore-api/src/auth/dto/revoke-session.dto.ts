import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeSessionDto {
  @ApiProperty({
    description: 'Current account password for re-authentication',
    example: 'SecureP@ss1',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
