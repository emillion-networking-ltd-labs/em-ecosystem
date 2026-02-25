import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Role } from '../enums/role.enum';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
