import { IsString, MaxLength, MinLength } from 'class-validator';

export class PasskeyRenameDto {
  @IsString()
  @MinLength(1, { message: 'Name must not be empty' })
  @MaxLength(64, { message: 'Name must not exceed 64 characters' })
  name!: string;
}
