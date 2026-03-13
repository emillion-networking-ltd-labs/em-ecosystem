import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailChangeDto {
  @ApiProperty({
    description: 'Email change verification token from the email link',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
