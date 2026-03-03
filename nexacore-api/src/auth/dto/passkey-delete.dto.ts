import { IsString, IsOptional } from 'class-validator';

export class PasskeyDeleteDto {
  @IsOptional()
  @IsString()
  password?: string;
}
