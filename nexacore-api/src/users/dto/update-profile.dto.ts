import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsUrl(
    { require_protocol: true },
    { message: 'avatarUrl must be a valid URL' },
  )
  @MaxLength(500)
  avatarUrl?: string;
}
