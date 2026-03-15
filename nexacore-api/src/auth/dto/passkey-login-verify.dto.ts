import { IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasskeyLoginVerifyDto {
  @ApiProperty({ description: 'WebAuthn credential response object' })
  @IsObject()
  credential!: Record<string, unknown>;

  @ApiProperty({ description: 'Challenge ID from login options' })
  @IsString()
  challengeId!: string;
}
