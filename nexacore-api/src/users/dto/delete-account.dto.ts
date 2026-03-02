import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password?: string;
}
