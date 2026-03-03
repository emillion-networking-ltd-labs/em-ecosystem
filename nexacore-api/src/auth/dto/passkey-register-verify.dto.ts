import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class PasskeyRegisterVerifyDto {
  @IsObject()
  credential: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(64, { message: 'Passkey name must not exceed 64 characters' })
  name?: string;
}
