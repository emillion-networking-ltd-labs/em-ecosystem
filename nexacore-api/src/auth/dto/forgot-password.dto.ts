import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the account to reset',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile CAPTCHA token' })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
