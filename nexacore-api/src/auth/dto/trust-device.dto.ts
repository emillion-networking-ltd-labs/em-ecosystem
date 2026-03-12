import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class TrustDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(16)
  @MaxLength(512)
  fingerprint!: string;
}
