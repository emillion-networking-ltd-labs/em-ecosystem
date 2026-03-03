import { IsEmail, IsOptional } from 'class-validator';

export class PasskeyLoginOptionsDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}
